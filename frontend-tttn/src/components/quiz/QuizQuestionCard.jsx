import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import "./QuizQuestionCard.scss";

const OPTION_KEYS = ["A", "B", "C", "D"];

function QuizQuestionCard({ index, question }) {
  const [selected, setSelected] = useState(null);

  const options = {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
  };

  const answered = selected !== null;

  return (
    <div className="quiz-question">
      <p className="quiz-question__prompt">
        <span className="quiz-question__index">Câu {index + 1}.</span> {question.question}
      </p>

      <div className="quiz-question__options">
        {OPTION_KEYS.map((key) => {
          const isCorrect = key === question.correctAnswer;
          const isSelected = key === selected;

          let state = "";
          if (answered && isCorrect) state = "correct";
          else if (answered && isSelected && !isCorrect) state = "wrong";

          return (
            <button
              key={key}
              className={`quiz-question__option${state ? ` quiz-question__option--${state}` : ""}`}
              disabled={answered}
              onClick={() => setSelected(key)}
            >
              <span className="quiz-question__option-key">{key}</span>
              <span className="quiz-question__option-text">{options[key]}</span>
              {state === "correct" && <CheckCircle2 size={16} />}
              {state === "wrong" && <XCircle size={16} />}
            </button>
          );
        })}
      </div>

      {answered && question.explanation && (
        <div className="quiz-question__explanation">
          <ReactMarkdown>{question.explanation}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default QuizQuestionCard;
