"""Document-local structure and terminology; no model or network required."""
import re
import unicodedata
from difflib import SequenceMatcher


def clean(text):
    return unicodedata.normalize("NFC", text).replace("\x00", "")


def words(text):
    return re.findall(r"\w+", clean(text).casefold())


def contains(text, phrase):
    return bool(re.search(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", text, re.I))


def heading(text):
    if len(text) > 140 or not text.strip():
        return False
    return bool(re.match(r"^(?:chapter|section|part|chương|phần|mục)\s+[\wIVX]+", text, re.I)
                or re.match(r"^\d+(?:\.\d+)*[.)]?\s+\S", text)
                or (text.isupper() and 2 <= len(text.split()) <= 15))


def units(text, limit=900, fits=lambda s: True):
    """Prefer sentences; oversized sentences split only at whitespace, never mid-word."""
    result = []
    for sentence in re.split(r"(?<=[.!?;])\s+|\n+", clean(text).strip()):
        if not sentence:
            continue
        current = []
        for word in sentence.split():
            candidate = " ".join(current + [word])
            if current and (len(candidate) > limit or not fits(candidate)):
                result.append(" ".join(current))
                current = []
            current.append(word)
        if current:
            result.append(" ".join(current))
    return result


def blocks(text):
    """Join PDF soft line wraps; retain blank paragraphs and explicit headings."""
    current = []
    for raw in clean(text).splitlines():
        line = re.sub(r"[^\S\n]+", " ", raw).strip()
        if not line or heading(line):
            if current:
                yield " ".join(current)
                current = []
            if line:
                yield line
        else:
            current.append(line)
    if current:
        yield " ".join(current)


def chunk_pages(pages, limit=900, overlap=150, fits=lambda s: True):
    chunks, title, section = [], "", 0
    for page, text in pages:
        pending, previous = [], ""

        def flush():
            nonlocal pending, previous
            if not pending:
                return
            source = "\n".join(pending)
            combined = (previous + "\n" + source).strip()
            if len(combined) > limit or not fits(combined):
                combined = source
            chunks.append(dict(page=page, text=combined, source_text=source,
                               heading=title, section_id=str(section)))
            previous = pending[-1] if len(pending[-1]) <= overlap else ""
            pending = []

        for line in blocks(text):
            if heading(line):
                flush()
                previous = ""
                section += 1
                title = line
            for part in units(line, limit, fits):
                if pending and (len("\n".join(pending + [part])) > limit
                                or not fits("\n".join(pending + [part]))):
                    flush()
                pending.append(part)
        flush()
    return chunks


def terminology(chunks):
    """Only explicit initial-aligned definitions; retain provenance and ambiguity."""
    aliases = []
    seen = set()

    def add(short, phrase, chunk, suffix=False):
        short = short.strip()
        if not short.isupper() or not re.fullmatch(r"[A-ZÀ-Ỹ][A-ZÀ-Ỹ0-9]{1,11}", short):
            return
        tokens = re.findall(r"[^\W\d_]+", phrase, re.UNICODE)
        if suffix:
            tokens = tokens[-len(short):]
        elif len(tokens) >= len(short):
            tokens = tokens[:len(short)]
        full = " ".join(tokens)
        if len(tokens) < 2 or "".join(t[0] for t in tokens).casefold() != short.casefold():
            return
        key = (short.casefold(), full.casefold(), chunk['page'])
        if key not in seen:
            seen.add(key)
            aliases.append(dict(short=short, full=full, page=chunk['page'], evidence=chunk['text']))

    for chunk in chunks:
        text = chunk.get('source_text', chunk['text'])
        for match in re.finditer(r'["“]([^"”\n]{2,80})["”]\s+(?:also known as|còn gọi là|hay còn gọi là)\s+["“]([^"”\n]{2,80})["”]', text, re.I):
            aliases.append(dict(short=match[1], full=match[2], page=chunk['page'], evidence=chunk['text']))
        for line in text.splitlines():
            for match in re.finditer(r"([^();:.!?\n]{2,180})\(([^()\n]{2,100})\)", line):
                left, right = (s.strip() for s in match.groups())
                add(right, left, chunk, suffix=True)
                add(left, right, chunk)
            for match in re.finditer(r"\b([A-ZÀ-Ỹ][A-ZÀ-Ỹ0-9]{1,11})\s*[:=–-]\s*([^.;\n]+)", line):
                add(*match.groups(), chunk)
    return aliases


def expand(query, aliases, maximum=4):
    variants, evidence = [query], []
    for alias in aliases:
        short, full = alias['short'], alias['full']
        match = full if contains(query, full) else short if contains(query, short) else None
        if not match:
            continue
        replacement = short if match == full else full
        variant = re.sub(r"(?<!\w)" + re.escape(match) + r"(?!\w)",
                         lambda _: replacement, query, flags=re.I)
        if variant not in variants and len(variants) < maximum:
            variants.append(variant)
        if variant in variants and alias not in evidence:
            evidence.append(alias)
    return variants, evidence


def duplicate(text, selected, threshold=0.88):
    normalized = " ".join(words(text))
    return any(SequenceMatcher(None, normalized, " ".join(words(other)), autojunk=False).ratio()
               >= threshold for other in selected)
