"use client";

import { useState } from "react";

type Question = {
  id: string;
  sequence_no: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  topic: string;
  difficulty: string;
};

type Assessment = {
  id: string;
  total_questions: number;
  status: string;
  started_at: string;
};

export default function AssessmentPage() {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [answers, setAnswers] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startAssessment() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/assessment/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      console.log("Assessment response:", data);

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Assessment request failed with status ${response.status}`
        );
      }

      if (!data.assessment) {
        throw new Error("Assessment data was not returned.");
      }

      if (!Array.isArray(data.questions)) {
        throw new Error("Questions were not returned correctly.");
      }

      setAssessment(data.assessment);
      setQuestions(data.questions);
      setCurrentQuestion(0);
      setAnswers({});
    } catch (err) {
      console.error("Start assessment error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to start assessment"
      );
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(answer: number) {
    const question = questions[currentQuestion];

    if (!question) return;

    setAnswers((previous) => ({
      ...previous,
      [question.id]: answer,
    }));
  }

  function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((previous) => previous + 1);
    }
  }

  function previousQuestion() {
    if (currentQuestion > 0) {
      setCurrentQuestion((previous) => previous - 1);
    }
  }

  function restartAssessment() {
    setAssessment(null);
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswers({});
    setError("");
  }

  // --------------------------------------------------
  // LANDING SCREEN
  // --------------------------------------------------

  if (!assessment) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#050505",
          color: "#ffffff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "30px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "700px",
            background: "#151515",
            borderRadius: "14px",
            padding: "35px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
          }}
        >
          <h1
            style={{
              fontSize: "30px",
              marginBottom: "12px",
            }}
          >
            Adaptive DSA Assessment
          </h1>

          <p
            style={{
              color: "#aaaaaa",
              lineHeight: 1.6,
              marginBottom: "25px",
            }}
          >
            This assessment is generated using your adaptive DSA
            profile. Questions are selected based on your current
            performance and topic strengths/weaknesses.
          </p>

          <div
            style={{
              background: "#202020",
              borderRadius: "10px",
              padding: "20px",
              marginBottom: "25px",
            }}
          >
            <p>📝 10 Questions</p>
            <p>🎯 Adaptive topic selection</p>
            <p>📊 Difficulty-based assessment</p>
            <p>⚡ Personalized question selection</p>
          </div>

          {error && (
            <div
              style={{
                background: "#3a1515",
                border: "1px solid #ff4444",
                color: "#ff7777",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={startAssessment}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "8px",
              background: loading ? "#555555" : "#2563eb",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Generating Assessment..."
              : "Start Assessment"}
          </button>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // SAFETY CHECK
  // --------------------------------------------------

  if (questions.length === 0) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#050505",
          color: "#ffffff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div>
          <h2>No questions available.</h2>

          <button
            onClick={restartAssessment}
            style={{
              marginTop: "20px",
              padding: "12px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Start Again
          </button>
        </div>
      </main>
    );
  }

  const question = questions[currentQuestion];

  const selectedAnswer = answers[question.id];

  const options = [
    {
      index: 0,
      label: "A",
      text: question.option_a,
    },
    {
      index: 1,
      label: "B",
      text: question.option_b,
    },
    {
      index: 2,
      label: "C",
      text: question.option_c,
    },
    {
      index: 3,
      label: "D",
      text: question.option_d,
    },
  ];

  const answeredCount = Object.keys(answers).length;

  // --------------------------------------------------
  // QUESTION SCREEN
  // --------------------------------------------------

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#ffffff",
        padding: "30px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "26px",
              }}
            >
              Adaptive DSA Assessment
            </h1>

            <p
              style={{
                color: "#999999",
                marginTop: "8px",
              }}
            >
              Assessment ID: {assessment.id.slice(0, 8)}...
            </p>
          </div>

          <div
            style={{
              background: "#202020",
              padding: "10px 15px",
              borderRadius: "8px",
            }}
          >
            {answeredCount}/{questions.length} Answered
          </div>
        </div>

        {/* PROGRESS */}

        <div
          style={{
            width: "100%",
            height: "8px",
            background: "#252525",
            borderRadius: "20px",
            overflow: "hidden",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              width: `${
                ((currentQuestion + 1) / questions.length) * 100
              }%`,
              height: "100%",
              background: "#2563eb",
              transition: "width 0.3s",
            }}
          />
        </div>

        {/* QUESTION CARD */}

        <div
          style={{
            background: "#151515",
            borderRadius: "14px",
            padding: "30px",
          }}
        >
          {/* QUESTION NUMBER */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                color: "#60a5fa",
                fontWeight: 600,
              }}
            >
              Question {currentQuestion + 1} of{" "}
              {questions.length}
            </span>

            <span
              style={{
                background:
                  question.difficulty.toLowerCase() === "easy"
                    ? "#14532d"
                    : question.difficulty.toLowerCase() ===
                      "medium"
                    ? "#713f12"
                    : "#7f1d1d",
                padding: "5px 10px",
                borderRadius: "6px",
                fontSize: "13px",
              }}
            >
              {question.difficulty}
            </span>
          </div>

          {/* TOPIC */}

          <p
            style={{
              color: "#999999",
              marginBottom: "15px",
            }}
          >
            Topic: {question.topic}
          </p>

          {/* QUESTION */}

          <h2
            style={{
              fontSize: "22px",
              lineHeight: 1.5,
              marginBottom: "30px",
            }}
          >
            {question.question}
          </h2>

          {/* OPTIONS */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {options.map((option) => {
              const isSelected =
                selectedAnswer === option.index;

              return (
                <button
                  key={option.index}
                  onClick={() =>
                    selectAnswer(option.index)
                  }
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "16px",
                    borderRadius: "10px",
                    border: isSelected
                      ? "2px solid #2563eb"
                      : "1px solid #333333",
                    background: isSelected
                      ? "#172554"
                      : "#202020",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  <strong
                    style={{
                      marginRight: "12px",
                    }}
                  >
                    {option.label}.
                  </strong>

                  {option.text}
                </button>
              );
            })}
          </div>

          {/* NAVIGATION */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "30px",
            }}
          >
            <button
              onClick={previousQuestion}
              disabled={currentQuestion === 0}
              style={{
                padding: "12px 22px",
                borderRadius: "8px",
                border: "1px solid #444444",
                background:
                  currentQuestion === 0
                    ? "#151515"
                    : "#252525",
                color:
                  currentQuestion === 0
                    ? "#555555"
                    : "#ffffff",
                cursor:
                  currentQuestion === 0
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              ← Previous
            </button>

            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={nextQuestion}
                style={{
                  padding: "12px 25px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#2563eb",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Next →
              </button>
            ) : (
              <button
                disabled
                style={{
                  padding: "12px 25px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#555555",
                  color: "#ffffff",
                  cursor: "not-allowed",
                  fontWeight: 600,
                }}
              >
                Submit Assessment
              </button>
            )}
          </div>
        </div>

        {/* QUESTION NAVIGATOR */}

        <div
          style={{
            marginTop: "25px",
            background: "#151515",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "15px",
            }}
          >
            Questions
          </h3>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            {questions.map((q, index) => {
              const answered =
                answers[q.id] !== undefined;

              const active =
                index === currentQuestion;

              return (
                <button
                  key={q.id}
                  onClick={() =>
                    setCurrentQuestion(index)
                  }
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "8px",
                    border: active
                      ? "2px solid #60a5fa"
                      : "1px solid #333333",
                    background: answered
                      ? "#14532d"
                      : "#252525",
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
