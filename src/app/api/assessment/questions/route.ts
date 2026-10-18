import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // ==========================================
    // 1. GET LOGGED-IN USER
    // ==========================================

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ==========================================
    // 2. GET USER'S SKILLS
    // ==========================================

    const { data: skills, error: skillsError } = await supabase
      .from("adaptive_skills")
      .select(
        "topic, skill_score, solved_count, easy_count, medium_count, hard_count"
      )
      .eq("user_id", user.id)
      .order("skill_score", { ascending: true });

    if (skillsError) {
      console.error("Skills error:", skillsError);

      return NextResponse.json(
        { error: skillsError.message },
        { status: 500 }
      );
    }

    if (!skills || skills.length === 0) {
      return NextResponse.json(
        {
          error:
            "No adaptive skill data found. Please analyze your LeetCode skills first.",
        },
        { status: 404 }
      );
    }

    // ==========================================
    // 3. FIND WEAK + MODERATE TOPICS
    // ==========================================

    const weakTopics = skills
      .filter((skill) => skill.skill_score < 50)
      .map((skill) => skill.topic);

    const moderateTopics = skills
      .filter(
        (skill) =>
          skill.skill_score >= 50 &&
          skill.skill_score < 75
      )
      .map((skill) => skill.topic);

    // Prioritize weak topics first
    const selectedTopics = [
      ...weakTopics,
      ...moderateTopics,
    ].slice(0, 5);

    // ==========================================
    // 4. FALLBACK IF NO WEAK/MODERATE TOPICS
    // ==========================================

    if (selectedTopics.length === 0) {
      selectedTopics.push(
        ...skills
          .slice(0, 5)
          .map((skill) => skill.topic)
      );
    }

    console.log(
      "Assessment topics:",
      selectedTopics
    );

    // ==========================================
    // 5. GET QUESTIONS FROM QUESTION BANK
    // ==========================================

    const { data: questions, error: questionsError } =
      await supabase
        .from("question_bank")
        .select(
          "id, question, option_a, option_b, option_c, option_d, topic, difficulty, explanation"
        )
        .in("topic", selectedTopics);

    if (questionsError) {
      console.error(
        "Question bank error:",
        questionsError
      );

      return NextResponse.json(
        { error: questionsError.message },
        { status: 500 }
      );
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        {
          error:
            "No questions found for the student's weak or moderate topics.",
          topics: selectedTopics,
        },
        { status: 404 }
      );
    }

    // ==========================================
    // 6. RANDOMIZE QUESTIONS
    // ==========================================

    const shuffledQuestions = [...questions].sort(
      () => Math.random() - 0.5
    );

    // Select maximum 10 questions
    const selectedQuestions =
      shuffledQuestions.slice(0, 10);

    // ==========================================
    // 7. DO NOT SEND CORRECT ANSWERS
    // ==========================================

    const safeQuestions = selectedQuestions.map(
      (question) => ({
        id: question.id,
        question: question.question,

        options: [
          question.option_a,
          question.option_b,
          question.option_c,
          question.option_d,
        ],

        topic: question.topic,
        difficulty: question.difficulty,

        explanation: question.explanation,
      })
    );

    // ==========================================
    // 8. RETURN ASSESSMENT
    // ==========================================

    return NextResponse.json({
      success: true,

      totalQuestions:
        safeQuestions.length,

      topics: selectedTopics,

      questions: safeQuestions,
    });
  } catch (error) {
    console.error(
      "Assessment questions error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}