import { useParams } from "react-router-dom";

function DocumentDetailPage() {
  const { documentId } = useParams();

  return (
    <div>
      <h1>Document Detail</h1>

      <p>Document ID: {documentId}</p>

      <div>
        Chat | Summary | Quiz | Flashcards
      </div>
    </div>
  );
}

export default DocumentDetailPage;