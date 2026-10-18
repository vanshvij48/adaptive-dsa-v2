"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type LeetCodeProfile = {
  id: string;
  username: string;
  total_solved: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  last_synced_at: string | null;
};

export default function LeetCodePage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState<LeetCodeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [calculatingSkills, setCalculatingSkills] =
  useState(false);
  const [skillMessage, setSkillMessage] =
  useState("");
  const [skillAnalysis, setSkillAnalysis] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("leetcode_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setMessage(error.message);
    }

    if (data) {
      setProfile(data);
      setUsername(data.username);
    }

    setLoading(false);
  }

async function saveUsername(e: FormEvent) {
  e.preventDefault();

  if (!username.trim()) {
    setMessage("Please enter your LeetCode username.");
    return;
  }

  setSaving(true);
  setMessage("Connecting to LeetCode...");

  try {
    // ==========================================
    // 1. SYNC WITH LEETCODE
    // ==========================================

    const response = await fetch("/api/leetcode/sync", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username: username.trim(),
      }),
    });

    const result = await response.json();

    console.log("LeetCode result:", result);

    if (!response.ok) {
      setMessage(
        result.error || "Failed to sync LeetCode."
      );

      setSaving(false);
      return;
    }

    // ==========================================
    // 2. GET CURRENT USER
    // ==========================================

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    console.log("Current user:", user.id);

    // ==========================================
    // 3. SAVE LEETCODE PROFILE
    // ==========================================

    const { error: profileError } = await supabase
      .from("leetcode_profiles")
      .upsert({
        id: user.id,

        username:
          result.profile.username,

        total_solved:
          result.profile.totalSolved,

        easy_solved:
          result.profile.easySolved,

        medium_solved:
          result.profile.mediumSolved,

        hard_solved:
          result.profile.hardSolved,

        last_synced_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      });

    if (profileError) {
      console.error(
        "Profile save error:",
        profileError
      );

      setMessage(
        "LeetCode synced, but profile could not be saved."
      );

      setSaving(false);
      return;
    }

    console.log(
      "LeetCode profile saved successfully"
    );

    // ==========================================
    // 4. PREPARE SOLVED PROBLEMS
    // ==========================================

    const problems =
      result.problems || [];

    console.log(
      "Problems received:",
      problems.length
    );

    if (problems.length === 0) {
      setMessage(
        "LeetCode profile synced, but no problems were returned."
      );

      setSaving(false);
      return;
    }

    const problemRows = problems.map(
      (problem: any) => ({
        user_id: user.id,

        problem_id:
          problem.questionId ??
          problem.slug,

        title:
          problem.title,

        slug:
          problem.slug,

        difficulty:
          problem.difficulty,

        topics:
          problem.topics || [],

        solved_at:
          problem.solved_at,

        updated_at:
          new Date().toISOString(),
      })
    );

    console.log(
      "Rows prepared for Supabase:",
      problemRows
    );

    // ==========================================
    // 5. SAVE SOLVED PROBLEMS
    // ==========================================

    const {
      data: savedProblems,
      error: problemsError,
    } = await supabase
      .from("leetcode_solved_problems")
      .upsert(
        problemRows,
        {
          onConflict: "user_id,slug",
        }
      )
      .select();

    if (problemsError) {
      console.error(
        "Problem save error:",
        problemsError
      );

      setMessage(
        `LeetCode synced, but saving problems failed: ${problemsError.message}`
      );

      setSaving(false);
      return;
    }

    console.log(
      "Saved problems:",
      savedProblems
    );

    // ==========================================
    // 6. SUCCESS
    // ==========================================

    setMessage(
      `Successfully synced ${problems.length} problems!`
    );

    await loadProfile();

    setSaving(false);

  } catch (error) {

    console.error(
      "Sync error:",
      error
    );

    setMessage(
      error instanceof Error
        ? error.message
        : "Something went wrong while syncing."
    );

    setSaving(false);
  }
}
async function calculateSkills() {
  try {
    setCalculatingSkills(true);
    setSkillMessage("");

    // ==========================================
    // 1. GET CURRENT LOGGED-IN USER
    // ==========================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    console.log("Calculating skills for user:", user.id);

    // ==========================================
    // 2. CALCULATE / UPDATE ADAPTIVE SKILLS
    // ==========================================

    const skillsResponse = await fetch("/api/adaptive/skills", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
      }),
    });

    const skillsData = await skillsResponse.json();

    console.log("Skills API response:", skillsData);

    if (!skillsResponse.ok) {
      throw new Error(
        skillsData.error || "Failed to calculate skills"
      );
    }

    // ==========================================
    // 3. ANALYZE THE CALCULATED SKILLS
    // ==========================================

    const analysisResponse = await fetch(
      "/api/adaptive/analysis",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      }
    );

    const analysisData = await analysisResponse.json();

    console.log("Analysis API response:", analysisData);

    if (!analysisResponse.ok) {
      throw new Error(
        analysisData.error || "Failed to analyze skills"
      );
    }

    // ==========================================
    // 4. DISPLAY ANALYSIS
    // ==========================================

    setSkillAnalysis(analysisData);

    setSkillMessage(
      `Analyzed ${skillsData.problemsAnalyzed} problems across ${skillsData.topicsAnalyzed} topics.`
    );

  } catch (error) {
    console.error("Skill calculation error:", error);

    setSkillMessage(
      error instanceof Error
        ? error.message
        : "Something went wrong."
    );

  } finally {
    setCalculatingSkills(false);
  }
}

  if (loading) {
    return (
      <main className="container">
        <p>Loading...</p>
      </main>
    );
  }

return (
  <main className="container">
    <h1>LeetCode Tracking</h1>

    <p className="muted">
      Connect your LeetCode account and build your personalized
      DSA skill profile.
    </p>

    {/* Connect LeetCode */}
    <div
      className="card"
      style={{
        marginTop: 30,
        maxWidth: 600,
      }}
    >
      <h2>Connect LeetCode</h2>

      <form onSubmit={saveUsername}>
        <label>LeetCode Username</label>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. neetcode"
          style={{
            width: "100%",
            marginTop: 8,
            padding: 12,
          }}
        />

        <button
          type="submit"
          className="btn"
          disabled={saving}
          style={{ marginTop: 15 }}
        >
          {saving ? "Syncing..." : "Sync Leetcode"}
        </button>
      </form>

      {/* Analyze Skills */}
      <div style={{ marginTop: 20 }}>
        <button
          type="button"
          onClick={calculateSkills}
          disabled={calculatingSkills}
          className="btn"
        >
          {calculatingSkills
            ? "Analyzing Skills..."
            : "Analyze My DSA Skills"}
        </button>

        {skillMessage && (
          <p style={{ marginTop: 10 }}>
            {skillMessage}
          </p>
        )}
      </div>
    </div>

    {/* Skill Analysis */}
    {skillAnalysis && (
      <div
        className="card"
        style={{ marginTop: 30 }}
      >
        <h2>🧠 Your DSA Skill Analysis</h2>

        <p>
          Total Topics: {skillAnalysis.totalTopics ?? 0}
        </p>

        {/* Strong Topics */}
        <h3 style={{ marginTop: 20 }}>
          🟢 Strong Topics
        </h3>

        {(skillAnalysis?.strongTopics ?? []).length === 0 ? (
          <p>No strong topics yet.</p>
        ) : (
          (skillAnalysis?.strongTopics ?? []).map(
            (skill: any) => (
              <div key={skill.topic}>
                <strong>{skill.topic}</strong>
                {" - "}
                {skill.skill_score}/100
              </div>
            )
          )
        )}

        {/* Moderate Topics */}
        <h3 style={{ marginTop: 20 }}>
          🟡 Moderate Topics
        </h3>

        {(skillAnalysis?.moderateTopics ?? []).length === 0 ? (
          <p>No moderate topics.</p>
        ) : (
          (skillAnalysis?.moderateTopics ?? []).map(
            (skill: any) => (
              <div key={skill.topic}>
                <strong>{skill.topic}</strong>
                {" - "}
                {skill.skill_score}/100
              </div>
            )
          )
        )}

        {/* Weak Topics */}
        <h3 style={{ marginTop: 20 }}>
          🔴 Weak Topics
        </h3>

        {(skillAnalysis?.weakTopics ?? []).length === 0 ? (
          <p>No weak topics.</p>
        ) : (
          (skillAnalysis?.weakTopics ?? []).map(
            (skill: any) => (
              <div key={skill.topic}>
                <strong>{skill.topic}</strong>
                {" - "}
                {skill.skill_score}/100
              </div>
            )
          )
        )}
      </div>
    )}
    <div
  className="card"
  style={{
    marginTop: 30,
    textAlign: "center",
  }}
>
  <h2>🎯 Test Your DSA Skills</h2>

  <p className="muted">
    Take an adaptive assessment based on your
    current DSA skill profile.
  </p>

  <button
    className="btn"
    onClick={() => {
      window.location.href = "/assessment";
    }}
    style={{ marginTop: 15 }}
  >
    Start Adaptive Assessment →
  </button>
</div>

    {/* LeetCode Profile */}
    {profile && (
      <div
        className="grid"
        style={{
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          marginTop: 30,
        }}
      >
        <div className="card">
          <p className="muted">Username</p>
          <h2>{profile.username}</h2>
        </div>

        <div className="card">
          <p className="muted">Total Solved</p>
          <h2>{profile.total_solved}</h2>
        </div>

        <div className="card">
          <p className="muted">Easy</p>
          <h2>{profile.easy_solved}</h2>
        </div>

        <div className="card">
          <p className="muted">Medium</p>
          <h2>{profile.medium_solved}</h2>
        </div>

        <div className="card">
          <p className="muted">Hard</p>
          <h2>{profile.hard_solved}</h2>
        </div>
      </div>
    )}
  </main>
);
}