
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  let createdAssessmentId: string | null = null;

  try {
    supabase = await createClient();

    // 1. Authenticate the user
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

    // 2. Read the existing assessment ID, if /start already created one
    let body: { assessmentId?: string } = {};

    try {
      body = await request.json();
    } catch {
      // An empty request body is allowed.
    }

    let assessmentId = body.assessmentId;

    // 3. Get the user's adaptive skills
    const { data: skills, error: skillsError } = await supabase
      .from("adaptive_skills")
      .select("topic, skill_score")
      .eq("user_id", user.id)
      .order("skill_score", { ascending: true });

    if (skillsError) {
      console.error("Adaptive skills error:", skillsError);

      return NextResponse.json(
        { error: skillsError.message },
        { status: 500 }
      );
    }

    // 4. Fetch the question bank
    const { data: bank, error: bankError } = await supabase
      .from("question_bank")
      .select(
        "id, question, option_a, option_b, option_c, option_d, topic, difficulty"
      );

    if (bankError) {
      console.error("Question bank error:", bankError);

      return NextResponse.json(
        { error: bankError.message },
        { status: 500 }
      );
    }

    if (!bank?.length) {
      return NextResponse.json(
        { error: "Your question bank is empty. Add questions first." },
        { status: 404 }
      );
    }

    // 5. Prefer weak topics, matching topic names case-insensitively
    const normalizedTopics = new Set(
      (skills ?? [])
        .slice(0, 5)
        .map((skill) => String(skill.topic ?? "").trim().toLowerCase())
        .filter(Boolean)
    );

    const weakTopicQuestions = bank.filter((question) =>
      normalizedTopics.has(String(question.topic ?? "").trim().toLowerCase())
    );

    // Fall back to all available questions if weak topics have no matches
    const pool = weakTopicQuestions.length > 0
      ? weakTopicQuestions
      : bank;

    // 6. Randomly select up to 10 distinct questions
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, 10);

    // 7. Reuse the assessment created by /start, if its ID was provided
    if (assessmentId) {
      const { data: existing, error: existingError } = await supabase
        .from("assessments")
        .select("id, status")
        .eq("id", assessmentId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingError) {
        return NextResponse.json(
          { error: existingError.message },
          { status: 500 }
        );
      }

      if (!existing || existing.status !== "in_progress") {
        return NextResponse.json(
          { error: "Assessment not found or is no longer active." },
          { status: 404 }
        );
      }

      // Remove old question links if this assessment is being regenerated
      const { error: deleteLinksError } = await supabase
        .from("assessment_questions")
        .delete()
        .eq("assessment_id", assessmentId);

      if (deleteLinksError) {
        return NextResponse.json(
          { error: deleteLinksError.message },
          { status: 500 }
        );
      }
    } else {
      // Create an assessment only if /start did not provide one
      const { data: assessment, error: createError } = await supabase
        .from("assessments")
        .insert({
          user_id: user.id,
          total_questions: selectedQuestions.length,
          score: 0,
          percentage: 0,
          status: "in_progress",
        })
        .select("id")
        .single();

      if (createError || !assessment) {
        console.error("Assessment creation error:", createError);

        return NextResponse.json(
          { error: createError?.message ?? "Could not create assessment." },
          { status: 500 }
        );
      }

      assessmentId = assessment.id;
      createdAssessmentId = assessment.id;
    }

    // 8. Link selected questions to the assessment
    const links = selectedQuestions.map((question, index) => ({
      assessment_id: assessmentId,
      question_id: question.id,
      problem_id: question.id,
      sequence_no: index + 1,
      difficulty_at_selection: question.difficulty,
      topic: question.topic,
    }));

    const { error: linkError } = await supabase
      .from("assessment_questions")
      .insert(links);

    if (linkError) {
      console.error("Question linking error:", linkError);

      // Clean up a newly created assessment if linking failed
      if (createdAssessmentId) {
        await supabase
          .from("assessments")
          .delete()
          .eq("id", createdAssessmentId)
          .eq("user_id", user.id);
      }

      return NextResponse.json(
        { error: linkError.message, code: linkError.code },
        { status: 500 }
      );
    }

    // 9. Return safe questions only; never expose correct_answer
    const questions = selectedQuestions.map((question, index) => ({
      id: question.id,
      sequence_no: index + 1,
      question: question.question,
      options: [
        question.option_a,
        question.option_b,
        question.option_c,
        question.option_d,
      ],
      topic: question.topic,
      difficulty: question.difficulty,
    }));

    return NextResponse.json({
      success: true,
      assessmentId,
      totalQuestions: questions.length,
      topics: [...new Set(selectedQuestions.map((q) => q.topic))],
      questions,
    });
  } catch (error) {
    console.error("Generate assessment error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Internal server error",
      },
      { status: 500 }
    );
  }
}
