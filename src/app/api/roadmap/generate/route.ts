import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get user's calculated DSA skills
    const { data: skills, error } = await supabase
      .from("adaptive_skills")
      .select("*")
      .eq("user_id", userId)
      .order("skill_score", {
        ascending: true,
      });

    if (error) {
      console.error("Roadmap skills error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!skills || skills.length === 0) {
      return NextResponse.json(
        {
          error:
            "No skill data found. Please calculate your DSA skills first.",
        },
        { status: 404 }
      );
    }

    /*
      Lower skill score = higher priority.
    */

    const weakTopics = skills.filter(
      (skill) => skill.skill_score < 40
    );

    const moderateTopics = skills.filter(
      (skill) =>
        skill.skill_score >= 40 &&
        skill.skill_score < 70
    );

    const strongTopics = skills.filter(
      (skill) => skill.skill_score >= 70
    );

    // Build roadmap
let roadmap: any[] = [];
    // Priority 1: Weak topics
    weakTopics.slice(0, 5).forEach((skill, index) => {
      roadmap.push({
        step: roadmap.length + 1,
        priority: "HIGH",
        topic: skill.topic,
        score: skill.skill_score,
        title: `${skill.topic} Fundamentals`,
        description:
          `Strengthen your ${skill.topic} fundamentals and solve beginner-level problems.`,
      });
    });

    // Priority 2: Moderate topics
    moderateTopics.slice(0, 3).forEach((skill) => {
      roadmap.push({
        step: roadmap.length + 1,
        priority: "MEDIUM",
        topic: skill.topic,
        score: skill.skill_score,
        title: `${skill.topic} Intermediate Practice`,
        description:
          `Improve your ${skill.topic} problem-solving ability with medium-level problems.`,
      });
    });

    // Priority 3: Strong topics
    strongTopics.slice(0, 2).forEach((skill) => {
      roadmap.push({
        step: roadmap.length + 1,
        priority: "LOW",
        topic: skill.topic,
        score: skill.skill_score,
        title: `${skill.topic} Advanced Practice`,
        description:
          `Maintain your ${skill.topic} skills with challenging problems.`,
      });
    });

    return NextResponse.json({
      roadmap,
      weakTopics,
      moderateTopics,
      strongTopics,
    });
  } catch (error) {
    console.error("Roadmap generation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate roadmap",
      },
      { status: 500 }
    );
  }
}