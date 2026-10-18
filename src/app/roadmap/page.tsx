"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
type Skill = {
  topic: string;
  skill_score: number;
  solved_count?: number;
  easy_count?: number;
  medium_count?: number;
  hard_count?: number;
};

type RoadmapStep = {
  step: number;
  topic: string;
  score: number;
  level: string;
  description: string;
  problems: string[];
};

export default function RoadmapPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const progressPercentage =
  roadmap.length > 0
    ? Math.round((completedSteps.length / roadmap.length) * 100)
    : 0;


  useEffect(() => {
async function loadProgress() {
  try {
    const response = await fetch("/api/roadmap/progress");

    if (!response.ok) {
      throw new Error("Unable to load progress");
    }

    const data = await response.json();

    console.log("Loaded roadmap progress:", data);

    const completed = (data.progress || [])
      .map((item: any) => {
        const roadmapStep = roadmap.find(
          (step: any) =>
            step.problem_name === item.problem_name
        );

        return roadmapStep?.step;
      })
      .filter(
        (step: any): step is number =>
          typeof step === "number"
      );

    setCompletedSteps(completed);

  } catch (err) {
    console.error("Progress loading error:", err);
  }
}

  loadProgress();
}, []);
  useEffect(() => {
    loadRoadmap();
  }, []);

  async function loadRoadmap() {
    try {
      setLoading(true);
      setError("");

      // --------------------------------
      // 1. Get logged-in user
      // --------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError("Please login first.");
        setLoading(false);
        return;
      }

      // --------------------------------
      // 2. Get adaptive skills
      // --------------------------------

      const { data, error: skillsError } = await supabase
        .from("adaptive_skills")
        .select("*")
        .eq("user_id", user.id)
        .order("skill_score", {
          ascending: true,
        });

      if (skillsError) {
        throw skillsError;
      }

      if (!data || data.length === 0) {
        setError(
          "No skill data found. Please sync LeetCode and analyze your skills first."
        );

        setLoading(false);
        return;
      }

      setSkills(data);

      // --------------------------------
      // 3. Generate personalized roadmap
      // --------------------------------

      const generatedRoadmap = generateRoadmap(data);

      setRoadmap(generatedRoadmap);

    } catch (err) {
      console.error("Roadmap error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load roadmap."
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // ROADMAP GENERATOR
  // ========================================

  function generateRoadmap(skillData: Skill[]): RoadmapStep[] {
    // Sort weakest first
    const sortedSkills = [...skillData].sort(
      (a, b) => a.skill_score - b.skill_score
    );

    // Take maximum 5 topics
    const selectedSkills = sortedSkills.slice(0, 5);

    return selectedSkills.map((skill, index) => {
      let level = "";
      let description = "";
      let problems: string[] = [];

      if (skill.skill_score < 30) {
        level = "Weak";

        description =
          "Start with fundamentals and solve easy problems before moving to medium difficulty.";

        problems = getBeginnerProblems(skill.topic);
      } else if (skill.skill_score < 60) {
        level = "Moderate";

        description =
          "Strengthen this topic by solving easy and medium problems and practicing common patterns.";

        problems = getIntermediateProblems(skill.topic);
      } else {
        level = "Strong";

        description =
          "Maintain this skill with medium and hard problems while focusing on advanced patterns.";

        problems = getAdvancedProblems(skill.topic);
      }

      return {
        step: index + 1,
        topic: skill.topic,
        score: skill.skill_score,
        level,
        description,
        problems,
      };
    });
  }

  // ========================================
  // PROBLEM RECOMMENDATIONS
  // ========================================

  function getBeginnerProblems(topic: string): string[] {
    const t = topic.toLowerCase();

    if (t.includes("array")) {
      return [
        "Two Sum",
        "Best Time to Buy and Sell Stock",
        "Contains Duplicate",
      ];
    }

    if (t.includes("string")) {
      return [
        "Valid Anagram",
        "Valid Palindrome",
        "Longest Common Prefix",
      ];
    }

    if (t.includes("binary search")) {
      return [
        "Binary Search",
        "Search Insert Position",
        "First Bad Version",
      ];
    }

    if (t.includes("tree")) {
      return [
        "Maximum Depth of Binary Tree",
        "Invert Binary Tree",
        "Same Tree",
      ];
    }

    if (t.includes("graph")) {
      return [
        "Find if Path Exists in Graph",
        "Number of Islands",
        "Flood Fill",
      ];
    }

    if (t.includes("dynamic") || t === "dp") {
      return [
        "Climbing Stairs",
        "House Robber",
        "Min Cost Climbing Stairs",
      ];
    }

    if (t.includes("linked")) {
      return [
        "Reverse Linked List",
        "Merge Two Sorted Lists",
        "Linked List Cycle",
      ];
    }

    if (t.includes("stack")) {
      return [
        "Valid Parentheses",
        "Min Stack",
        "Daily Temperatures",
      ];
    }

    return [
      `Practice basic ${topic} problems`,
      `Solve 3 Easy ${topic} problems`,
      `Review ${topic} fundamentals`,
    ];
  }

  function getIntermediateProblems(topic: string): string[] {
    const t = topic.toLowerCase();

    if (t.includes("dynamic") || t === "dp") {
      return [
        "House Robber II",
        "Coin Change",
        "Longest Increasing Subsequence",
      ];
    }

    if (t.includes("tree")) {
      return [
        "Binary Tree Level Order Traversal",
        "Validate Binary Search Tree",
        "Lowest Common Ancestor",
      ];
    }

    if (t.includes("graph")) {
      return [
        "Clone Graph",
        "Course Schedule",
        "Rotting Oranges",
      ];
    }

    if (t.includes("binary search")) {
      return [
        "Search in Rotated Sorted Array",
        "Find Minimum in Rotated Sorted Array",
        "Koko Eating Bananas",
      ];
    }

    if (t.includes("string")) {
      return [
        "Longest Substring Without Repeating Characters",
        "Group Anagrams",
        "Longest Palindromic Substring",
      ];
    }

    return [
      `Solve 3 Medium ${topic} problems`,
      `Practice common ${topic} patterns`,
      `Attempt one timed ${topic} problem`,
    ];
  }

  function getAdvancedProblems(topic: string): string[] {
    const t = topic.toLowerCase();

    if (t.includes("dynamic") || t === "dp") {
      return [
        "Edit Distance",
        "Longest Common Subsequence",
        "Distinct Subsequences",
      ];
    }

    if (t.includes("tree")) {
      return [
        "Binary Tree Maximum Path Sum",
        "Serialize and Deserialize Binary Tree",
        "Recover Binary Search Tree",
      ];
    }

    if (t.includes("graph")) {
      return [
        "Word Ladder",
        "Network Delay Time",
        "Critical Connections in a Network",
      ];
    }

    return [
      `Solve 2 Hard ${topic} problems`,
      `Practice advanced ${topic} patterns`,
      `Take a timed ${topic} assessment`,
    ];
  }

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <main className="container">
        <p>Generating your personalized roadmap...</p>
      </main>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (error) {
    return (
      <main className="container">
        <h1>Personalized Roadmap</h1>
        <div
  style={{
    marginTop: 20,
    marginBottom: 25,
    padding: 20,
    borderRadius: 12,
    background: "#111827",
    border: "1px solid #263244",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 10,
    }}
  >
    <strong>Roadmap Progress</strong>

    <span>{progressPercentage}%</span>
  </div>

  <div
    style={{
      width: "100%",
      height: 12,
      background: "#1f2937",
      borderRadius: 10,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: `${progressPercentage}%`,
        height: "100%",
        background: "#6366f1",
        borderRadius: 10,
        transition: "width 0.4s ease",
      }}
    />
  </div>

  <p
    style={{
      marginTop: 10,
      fontSize: 14,
      color: "#9ca3af",
    }}
  >
    {completedSteps.length} of {roadmap.length} steps completed
  </p>
</div>

        <div
          className="card"
          style={{
            marginTop: 30,
          }}
        >
          <p>{error}</p>

          <Link
            href="/leetcode"
            className="btn"
            style={{
              display: "inline-block",
              marginTop: 15,
            }}
          >
            Go to LeetCode Tracking
          </Link>
        </div>
      </main>
    );
  }

  // ========================================
  // MAIN UI
  // ========================================

  return (
    <main className="container">

      <div style={{ marginBottom: 20 }}>
        <Link href="/leetcode">
          ← Back to LeetCode
        </Link>
      </div>

      <h1>Personalized Roadmap</h1>

      <p className="muted">
        Your roadmap is generated automatically from your DSA skill profile.
      </p>

      {/* ================================= */}
      {/* SUMMARY */}
      {/* ================================= */}

      <div
        className="card"
        style={{
          marginTop: 25,
          marginBottom: 25,
        }}
      >
        <h2>🎯 Your Learning Strategy</h2>

        <p>
          The roadmap starts with your weakest topics and
          gradually moves toward stronger topics.
        </p>

        <p>
          Total topics analyzed: <strong>{skills.length}</strong>
        </p>

        <p>
          Recommended topics: <strong>{roadmap.length}</strong>
        </p>
      </div>

      {/* ================================= */}
      {/* ROADMAP */}
      {/* ================================= */}

      {roadmap.map((step) => {
  const isCompleted = completedSteps.includes(step.step);
async function markStepComplete(step: number) {
  try {
    console.log("Marking step complete:", step);

    const response = await fetch(
      "/api/roadmap/progress",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          step: step,
          completed: true,
        }),
      }
    );

    const data = await response.json();

    console.log(
      "Roadmap progress response:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data?.error ||
          "Unable to save roadmap progress"
      );
    }

    setCompletedSteps((prev) => {
      if (prev.includes(step)) {
        return prev;
      }

      return [...prev, step];
    });

  } catch (error) {
    console.error(
      "Progress save error:",
      error
    );

    setError(
      error instanceof Error
        ? error.message
        : "Unable to save roadmap progress"
    );
  }
}
  return (
    <div
      key={step.step}
      style={{
        border: "1px solid #263244",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "12px",
        background: "#111827",
      }}
    >
      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
        Step {step.step}
      </div>

      <h2 style={{ marginTop: "8px" }}>
        {step.topic}
      </h2>

      <p>
        Score: {step.score}/100
      </p>

      <p>
        Level: {step.level}
      </p>

      <p style={{ color: "#94a3b8" }}>
        {step.description}
      </p>

      {step.problems && step.problems.length > 0 && (
        <div style={{ marginTop: "15px" }}>
          <strong>Recommended Problems</strong>

          <ul>
            {step.problems.map((problem, index) => (
              <li key={index}>
                {problem}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: "15px" }}>
        {isCompleted ? (
          <span style={{ color: "#22c55e" }}>
            ✓ Completed
          </span>
        ) : (
          <button
            onClick={() => markStepComplete(step.step)}
          >
            Mark Step Complete
          </button>
        )}
      </div>
    </div>
  );
})}

      {/* ================================= */}
      {/* WEEKLY ASSESSMENT */}
      {/* ================================= */}

      <div
        className="card"
        style={{
          marginTop: 30,
          marginBottom: 40,
        }}
      >
        <h2>📝 Weekly Adaptive Assessment</h2>

        <p>
          After practicing your weak topics, take another
          adaptive assessment to measure your improvement.
        </p>

        <Link
          href="/assessment"
          className="btn"
          style={{
            display: "inline-block",
            marginTop: 15,
          }}
        >
          Take Assessment →
        </Link>
      </div>

    </main>
  );
}

// ========================================
// SEARCH QUERY
// ========================================

function problemSearchQuery(topic: string): string {
  return topic;
}