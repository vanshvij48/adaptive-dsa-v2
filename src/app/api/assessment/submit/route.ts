
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate the user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in before submitting an assessment." },
        { status: 401 }
      );
    }

    // 2. Read submitted answers
    const body = await request.json();
    const assessmentId = body.assessmentId;
    const answers = body.answers;

    if (
      typeof assessmentId !== "string" ||
      !Array.isArray(answers) ||
      answers.length === 0
    ) {
      return NextResponse.json(
        { error: "A valid assessment ID and answers are required." },
        { status: 400 }
      );
    }

    // 3. Verify that the assessment belongs to this user
    const { data: assessment, error: assessmentError } =
      await supabase
        .from("assessments")
        .select("id, user_id, status, total_questions")
        .eq("id", assessmentId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (assessmentError) {
      console.error("Assessment lookup error:", assessmentError);
      return NextResponse.json(
        { error: "Unable to load assessment." },
        { status: 500 }
      );
    }

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found." },
        { status: 404 }
      );
    }

    if (assessment.status !== "in_progress") {
      return NextResponse.json(
        { error: "This assessment has already been submitted." },
        { status: 409 }
      );
    }

    // 4. Load the questions assigned to this assessment
    const { data: assessmentQuestions, error: questionsError } =
      await supabase
        .from("assessment_questions")
        .select(
          "id, assessment_id, question_id, problem_id, sequence_no, topic"
        )
        .eq("assessment_id", assessmentId);

    if (questionsError) {
      console.error("Assessment questions error:", questionsError);
      return NextResponse.json(
        { error: "Unable to load assessment questions." },
        { status: 500 }
      );
    }

    if (!assessmentQuestions || assessmentQuestions.length === 0) {
      return NextResponse.json(
        { error: "No questions are assigned to this assessment." },
        { status: 400 }
      );
    }

    // 5. Resolve each assessment question to question_bank.id
    const questionBankIds = assessmentQuestions.map(
      (item) => item.question_id ?? item.problem_id
    );

    if (questionBankIds.some((id) => !id)) {
      return NextResponse.json(
        { error: "An assessment question has no linked question-bank record." },
        { status: 500 }
      );
    }

    const { data: bankQuestions, error: bankError } =
      await supabase
        .from("question_bank")
        .select(
          "id, question, option_a, option_b, option_c, option_d, correct_answer, topic, difficulty, explanation"
        )
        .in("id", questionBankIds);

    if (bankError) {
      console.error("Question bank lookup error:", bankError);
      return NextResponse.json(
        { error: "Unable to load correct answers." },
        { status: 500 }
      );
    }

    // 6. Validate the submitted answers
    const answerMap = new Map<string, number>();

    for (const answer of answers) {
      if (
        !answer ||
        typeof answer.questionId !== "string" ||
        !Number.isInteger(answer.selectedAnswer) ||
        answer.selectedAnswer < 0 ||
        answer.selectedAnswer > 3
      ) {
        return NextResponse.json(
          {
            error:
              "Each answer must include a questionId and a selectedAnswer from 0 to 3.",
          },
          { status: 400 }
        );
      }

      if (answerMap.has(answer.questionId)) {
        return NextResponse.json(
          { error: "Duplicate answers were submitted." },
          { status: 400 }
        );
      }

      answerMap.set(answer.questionId, answer.selectedAnswer);
    }

    // 7. Grade answers on the server and save each response
    const bankMap = new Map(
      (bankQuestions ?? []).map((question) => [
        question.id,
        question,
      ])
    );

    let correctCount = 0;
    const results = [];

    for (const item of assessmentQuestions) {
      const bankId = item.question_id ?? item.problem_id;
      const question = bankMap.get(bankId!);

      if (!question) {
        return NextResponse.json(
          { error: "An assigned question could not be found." },
          { status: 500 }
        );
      }

      if (
        !Number.isInteger(question.correct_answer) ||
        question.correct_answer < 0 ||
        question.correct_answer > 3
      ) {
        return NextResponse.json(
          { error: "A question has an invalid correct-answer configuration." },
          { status: 500 }
        );
      }

      const selectedAnswer = answerMap.get(bankId!);
      const answeredCorrectly =
        selectedAnswer !== undefined &&
        selectedAnswer === question.correct_answer;

      if (answeredCorrectly) correctCount++;

      const submitted = answers.find(
        (answer: { questionId: string }) =>
          answer.questionId === bankId!
      );

      const rawTime = submitted?.timeSeconds;
      const timeSeconds =
        Number.isInteger(rawTime) && rawTime >= 0
          ? rawTime
          : null;

      const { error: saveAnswerError } = await supabase
        .from("assessment_questions")
        .update({
          selected_answer: selectedAnswer ?? null,
          answered_correctly:
            selectedAnswer === undefined ? null : answeredCorrectly,
          time_seconds: timeSeconds,
          topic: question.topic,
          answered_at: new Date().toISOString(),
        })
        .eq("id", item.id)
        .eq("assessment_id", assessmentId);

      if (saveAnswerError) {
        console.error("Saving answer error:", saveAnswerError);
        return NextResponse.json(
          { error: "Unable to save assessment answers." },
          { status: 500 }
        );
      }

      results.push({
        questionId: bankId,
        question: question.question,
        options: [
          question.option_a,
          question.option_b,
          question.option_c,
          question.option_d,
        ],
        topic: question.topic ?? item.topic,
        difficulty: question.difficulty,
        selectedAnswer: selectedAnswer ?? null,
        correctAnswer: question.correct_answer,
        isCorrect:
          selectedAnswer === undefined ? false : answeredCorrectly,
        explanation: question.explanation,
      });
    }

    // 8. Calculate final score and percentage
    const totalQuestions = assessmentQuestions.length;
    const percentage = Math.round(
      (correctCount / totalQuestions) * 10000
    ) / 100;

    // 9. Mark assessment as completed
    const { data: completedAssessment, error: updateError } =
      await supabase
        .from("assessments")
        .update({
          score: correctCount,
          percentage,
          total_questions: totalQuestions,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", assessmentId)
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .select(
          "id, score, percentage, total_questions, status, started_at, completed_at"
        )
        .maybeSingle();

    if (updateError) {
      console.error("Assessment completion error:", updateError);
      return NextResponse.json(
        { error: "Unable to save the final assessment result." },
        { status: 500 }
      );
    }

    if (!completedAssessment) {
      return NextResponse.json(
        { error: "The assessment could not be marked as completed." },
        { status: 409 }
      );
    }

    // 10. Return the result for the results page
    return NextResponse.json({
      success: true,
      assessment: completedAssessment,
      correctCount,
      incorrectCount: totalQuestions - correctCount,
      unansweredCount: results.filter(
        (result) => result.selectedAnswer === null
      ).length,
      results,
    });
  } catch (error) {
    console.error("Assessment submission error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      { status: 500 }
    );
  }
}
