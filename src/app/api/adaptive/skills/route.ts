import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

    // Get solved problems for this user
    const { data: problems, error: problemsError } = await supabase
      .from("leetcode_solved_problems")
      .select("*")
      .eq("user_id", userId);

    if (problemsError) {
      console.error("Problems error:", problemsError);

      return NextResponse.json(
        { error: problemsError.message },
        { status: 500 }
      );
    }

    if (!problems || problems.length === 0) {
      return NextResponse.json(
        { error: "No solved LeetCode problems found." },
        { status: 404 }
      );
    }

    const topicStats: Record<
      string,
      {
        solved: number;
        easy: number;
        medium: number;
        hard: number;
      }
    > = {};

    for (const problem of problems) {
      let topics: string[] = [];

      /*
       * LeetCode topics may be stored as:
       * - array
       * - JSON string
       * - comma-separated string
       */

      if (Array.isArray(problem.topics)) {
        topics = problem.topics;
      } else if (typeof problem.topics === "string") {
        try {
          const parsed = JSON.parse(problem.topics);

          if (Array.isArray(parsed)) {
            topics = parsed;
          } else {
            topics = problem.topics
              .split(",")
              .map((topic: string) => topic.trim())
              .filter(Boolean);
          }
        } catch {
          topics = problem.topics
            .split(",")
            .map((topic: string) => topic.trim())
            .filter(Boolean);
        }
      }

      const difficulty = String(
        problem.difficulty || ""
      ).toLowerCase();

      for (const topic of topics) {
        if (!topicStats[topic]) {
          topicStats[topic] = {
            solved: 0,
            easy: 0,
            medium: 0,
            hard: 0,
          };
        }

        topicStats[topic].solved++;

        if (difficulty === "easy") {
          topicStats[topic].easy++;
        }

        if (difficulty === "medium") {
          topicStats[topic].medium++;
        }

        if (difficulty === "hard") {
          topicStats[topic].hard++;
        }
      }
    }

    // Create adaptive skill records
    const skills = Object.entries(topicStats).map(
      ([topic, stats]) => {
        /*
         * Skill calculation:
         *
         * Easy   = 1 point
         * Medium = 2 points
         * Hard   = 3 points
         *
         * Then convert to a 0-100 scale.
         */

        const rawScore =
          stats.easy * 1 +
          stats.medium * 2 +
          stats.hard * 3;

        const skillScore = Math.min(
          100,
          Math.round(rawScore * 5)
        );

        return {
          user_id: userId,
          topic: topic,
          solved_count: stats.solved,
          easy_count: stats.easy,
          medium_count: stats.medium,
          hard_count: stats.hard,
          skill_score: skillScore,
          last_updated_at: new Date().toISOString(),
        };
      }
    );

    // Save calculated skills
    if (skills.length > 0) {
      const { error: upsertError } = await supabase
        .from("adaptive_skills")
        .upsert(skills, {
          onConflict: "user_id,topic",
        });

      if (upsertError) {
        console.error(
          "Adaptive skills save error:",
          upsertError
        );

        return NextResponse.json(
          { error: upsertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      problemsAnalyzed: problems.length,
      topicsAnalyzed: skills.length,
      skills: skills,
    });
  } catch (error) {
    console.error("Skill calculation error:", error);

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