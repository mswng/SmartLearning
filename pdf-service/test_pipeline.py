import asyncio
import io
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
import fitz
from fastapi import UploadFile, HTTPException
from pydantic import ValidationError
from pipeline import chunk_pages, terminology, expand, units, words
import main


class FakeTokenizer:
    def encode(self, text, **kwargs):
        return words(text) + ['START', 'END']


class FakeModel:
    tokenizer = FakeTokenizer()
    max_seq_length = 64
    def get_sentence_embedding_dimension(self):
        return 5
    def encode(self, texts, **kwargs):
        vectors = []
        for text in texts:
            tokens = words(text)
            v = np.array([tokens.count('qft'), tokens.count('quantum'),
                          tokens.count('orchard'), tokens.count('banana'), 0.01], dtype='float32')
            vectors.append(v / np.linalg.norm(v))
        return np.asarray(vectors)


class StructureTests(unittest.TestCase):
    def test_no_missing_words_and_no_overlap_in_source(self):
        text = ' '.join('word%03d' % i for i in range(100))
        chunks = chunk_pages([(1, text)], limit=85, overlap=20)
        self.assertEqual(' '.join(c['source_text'] for c in chunks).split(), text.split())
        self.assertTrue(all(c['text'].split()[0].startswith('word') for c in chunks))
        self.assertTrue(all(len(c['text']) <= 85 for c in chunks))

    def test_section_continues_across_pages(self):
        chunks = chunk_pages([(1, 'CHAPTER 1\nFirst definition.'), (2, 'More details.'),
                              (3, 'CHAPTER 2\nSecond topic.')])
        self.assertEqual(chunks[0]['section_id'], chunks[1]['section_id'])
        self.assertNotEqual(chunks[1]['section_id'], chunks[2]['section_id'])
        self.assertEqual([c['page'] for c in chunks], [1, 2, 3])

    def test_token_budget_is_respected(self):
        chunks = chunk_pages([(1, ' '.join(['token'] * 80))], fits=lambda s: len(s.split()) <= 12)
        self.assertTrue(all(len(c['text'].split()) <= 12 for c in chunks))
        self.assertEqual(sum(len(c['source_text'].split()) for c in chunks), 80)

    def test_alias_patterns_and_both_directions(self):
        for text in ['Quantum Field Theory (QFT)', 'QFT (Quantum Field Theory)',
                     'QFT: Quantum Field Theory', 'Học máy (HM)', 'HM: Học máy']:
            with self.subTest(text=text):
                aliases = terminology([dict(text=text, page=3)])
                self.assertEqual(len(aliases), 1)
                alias = aliases[0]
                self.assertEqual(len(expand(alias['short'], aliases)[0]), 2)
                self.assertEqual(len(expand(alias['full'], aliases)[0]), 2)
                self.assertEqual(alias['page'], 3)

    def test_no_guessing_no_substring_no_cross_document(self):
        self.assertEqual(terminology([dict(text='ABC: unrelated definition', page=1)]), [])
        aliases = terminology([dict(text='Quantum Field Theory (QFT)', page=1)])
        self.assertEqual(expand('XQFTY', aliases)[0], ['XQFTY'])
        self.assertEqual(expand('QFT', [])[0], ['QFT'])
        self.assertEqual(expand('Quantum Field Theory', aliases, 1)[0], ['Quantum Field Theory'])

    def test_explicit_synonym(self):
        aliases = terminology([dict(text='"car" also known as "automobile"', page=1)])
        self.assertEqual(expand('car', aliases)[0], ['car', 'automobile'])

    def test_soft_wrap_definition(self):
        chunks = chunk_pages([(1, 'Quantum Field\nTheory (QFT). A definition\ncontinues on this line.')])
        self.assertIn('Quantum Field Theory', chunks[0]['text'])
        self.assertEqual(len(terminology(chunks)), 1)

    def test_unicode_is_preserved(self):
        text = 'Định nghĩa đầu tiên. Khái niệm tiếp theo.'
        self.assertEqual(' '.join(units(text, 25)), text)


class RetrievalTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        for name, value in [('FAISS_DIR', Path(self.temp.name)),
                            ('UPLOAD_DIR', Path(self.temp.name)), ('_model', FakeModel())]:
            patcher = patch.object(main, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)

    def build(self):
        chunks = chunk_pages([(1, 'Quantum Field Theory (QFT).'),
                              (2, 'QFT predicts particle interactions. Extra context for the answer.'),
                              (3, 'An orchard contains banana trees.'),
                              (4, 'QFT predicts particle interactions.')])
        main.build_index('test', chunks, 5)
        return chunks

    def test_ranking_dedup_passage_and_context(self):
        self.build()
        result = main.search('test', main.SearchRequest(query='Quantum Field Theory', top_k=3))
        self.assertEqual(result.hits[0].page, 2)
        self.assertLessEqual(len(result.hits[0].text), main.PASSAGE_CHARS)
        self.assertEqual([h.score for h in result.hits], sorted([h.score for h in result.hits], reverse=True))
        self.assertEqual(sum('predicts' in h.text for h in result.hits), 1)
        context = main.search('test', main.SearchRequest(query='Quantum Field Theory', top_k=1, context=True))
        self.assertIn('Extra context', context.hits[0].text)
        self.assertTrue(any(h.page == 1 and 'Quantum Field Theory' in h.text for h in context.hits))
        inverse = main.search('test', main.SearchRequest(query='QFT', top_k=3))
        self.assertTrue(any('Quantum Field Theory' in h.text for h in inverse.hits))

    def test_fulltext_and_legacy(self):
        chunks = self.build()
        result = main.fulltext('test')
        self.assertEqual(result.page_count, 5)  # Includes a blank trailing page.
        self.assertEqual(result.chunks[1].text, chunks[1]['source_text'])
        _, meta_path = main.index_paths('test')
        meta_path.write_text(json.dumps(chunks), encoding='utf-8')
        self.assertEqual(len(main.fulltext('test').chunks), len(chunks))

    def test_changed_model_rejected(self):
        self.build()
        with patch.object(main, 'EMBEDDING_MODEL_NAME', 'different-model'):
            with self.assertRaises(HTTPException) as raised:
                main.fulltext('test')
            self.assertEqual(raised.exception.status_code, 409)

    def test_process_real_pdf_and_delete(self):
        with fitz.open() as doc:
            doc.new_page().insert_text((72, 72), 'CHAPTER 1\nQuantum Field Theory (QFT).')
            doc.new_page().insert_text((72, 72), 'QFT predicts particle interactions.')
            doc.new_page()
            pdf = doc.tobytes()
        upload = UploadFile(file=io.BytesIO(pdf), filename='sample.pdf')
        result = asyncio.run(main.process_pdf(upload, 'sample'))
        self.assertEqual(result.page_count, 3)
        content = main.fulltext('sample')
        self.assertEqual(content.chunks[0].section_id, content.chunks[1].section_id)
        main.delete_index('sample')
        self.assertFalse(main.index_paths('sample')[0].exists())

    def test_validation_and_missing_document(self):
        for args in [dict(query=' '), dict(query='x', top_k=0), dict(query='x', top_k=51)]:
            with self.assertRaises(ValidationError):
                main.SearchRequest(**args)
        with self.assertRaises(HTTPException) as raised:
            main.search('missing', main.SearchRequest(query='question'))
        self.assertEqual(raised.exception.status_code, 404)


if __name__ == '__main__':
    unittest.main()
