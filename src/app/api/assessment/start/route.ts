import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get logged-in user
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

    // Create assessment
    const { data: assessment, error: assessmentError } =
      await supabase
        .from("assessments")
        .insert({
          user_id: user.id,
          total_questions: 10,
          score: 0,
        })
        .select()
        .single();

    if (assessmentError) {
      console.error("Assessment creation error:", assessmentError);

      return NextResponse.json(
        {
          error: assessmentError.message,
          code: assessmentError.code,
          details: assessmentError.details,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assessment,
    });

  } catch (error) {
    console.error("Start assessment error:", error);

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