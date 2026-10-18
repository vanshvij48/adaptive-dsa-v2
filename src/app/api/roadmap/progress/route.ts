import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// =====================================================
// GET ROADMAP PROGRESS
// =====================================================

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("roadmap_progress")
      .select("id, user_id, step, completed, created_at, updated_at")
      .eq("user_id", user.id)
      .order("step", { ascending: true });

    if (error) {
      console.error("GET progress error:", error);

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      progress: data ?? [],
    });
  } catch (error) {
    console.error("GET progress API error:", error);

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


// =====================================================
// POST ROADMAP PROGRESS
// =====================================================

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const body = await request.json();

    const step = Number(body.step);
    const completed =
      body.completed === undefined
        ? true
        : Boolean(body.completed);

    console.log("Saving roadmap progress:", {
      step,
      completed,
    });

    // -------------------------------------------------
    // Validate step
    // -------------------------------------------------

    if (!Number.isInteger(step) || step < 1) {
      return NextResponse.json(
        {
          error: "Invalid step",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // Get logged-in user
    // -------------------------------------------------

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    console.log("User:", user.id);

    // -------------------------------------------------
    // UPSERT PROGRESS
    // -------------------------------------------------
    // If user + step exists -> UPDATE
    // Otherwise -> INSERT
    // -------------------------------------------------

    const { data, error } = await supabase
      .from("roadmap_progress")
      .upsert(
        {
          user_id: user.id,
          step: step,
          completed: completed,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,step",
        }
      )
      .select(
        "id, user_id, step, completed, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error("POST progress database error:", error);

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    console.log(
      "Progress saved successfully:",
      data
    );

    return NextResponse.json({
      success: true,
      progress: data,
    });
  } catch (error) {
    console.error(
      "POST progress API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save progress",
      },
      { status: 500 }
    );
  }
}