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

    // Get adaptive skills for this user
    const { data: skills, error: skillsError } = await supabase
      .from("adaptive_skills")
      .select("*")
      .eq("user_id", userId)
      .order("skill_score", { ascending: true });
      console.log("Analysis userId:", userId);
console.log("Skills found:", skills?.length);
console.log("Skills error:", skillsError);

    if (skillsError) {
      console.error("Adaptive skills error:", skillsError);

      return NextResponse.json(
        { error: skillsError.message },
        { status: 500 }
      );
    }

    if (!skills || skills.length === 0) {
      return NextResponse.json(
        { error: "No adaptive skills found." },
        { status: 404 }
      );
    }

    // Find weakest and strongest topics
  const sortedSkills = [...skills].sort(
  (a, b) => a.skill_score - b.skill_score
);

const weakestSkills = sortedSkills.slice(0, 5);

const strongestSkills = [...skills]
  .sort((a, b) => b.skill_score - a.skill_score)
  .slice(0, 5);

// Everything between the weakest and strongest topics
const weakIds = new Set(
  weakestSkills.map((skill) => skill.id)
);

const strongIds = new Set(
  strongestSkills.map((skill) => skill.id)
);

const moderateSkills = skills.filter(
  (skill) =>
    !weakIds.has(skill.id) &&
    !strongIds.has(skill.id)
);
    // Calculate average skill score
    const totalScore = skills.reduce(
      (sum, skill) => sum + Number(skill.skill_score || 0),
      0
    );

    const averageScore =
      skills.length > 0
        ? Math.round(totalScore / skills.length)
        : 0;

  return NextResponse.json({
  success: true,

  problemsAnalyzed: skills.reduce(
    (sum, skill) =>
      sum + Number(skill.solved_count || 0),
    0
  ),

  topicsAnalyzed: skills.length,

  averageSkillScore: averageScore,

  weakTopics: weakestSkills,

  moderateTopics: moderateSkills,

  strongTopics: strongestSkills,

  skills: skills,
});
  } catch (error) {
    console.error("Adaptive analysis error:", error);

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