"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  id: string;
  name: string | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // User is not logged in
      if (!user) {
        router.replace("/login");
        return;
      }

      // Get profile
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Profile error:", error);
      }

      setProfile(data);
      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="container">
        <p>Loading your dashboard...</p>
      </main>
    );
  }

  return (
    <>
      <header
        style={{
          borderBottom: "1px solid #263244",
          padding: "18px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong style={{ fontSize: 20 }}>Adaptive DSA</strong>

        <button
          onClick={handleLogout}
          className="btn secondary"
        >
          Logout
        </button>
      </header>

      <main className="container">
        <h1>
          Welcome, {profile?.name || "Developer"} 👋
        </h1>

        <p className="muted">
          Your personalized DSA learning dashboard.
        </p>

        {/* Statistics */}
        <section
          className="grid"
          style={{
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            marginTop: 30,
          }}
        >
          <div className="card">
            <p className="muted">Problems Solved</p>
            <h2>0</h2>
            <p className="muted">
              Start solving problems
            </p>
          </div>

          <div className="card">
            <p className="muted">Skill Score</p>
            <h2>0%</h2>
            <p className="muted">
              Skill profile developing
            </p>
          </div>

          <div className="card">
            <p className="muted">Current Streak</p>
            <h2>0 days</h2>
            <p className="muted">
              Start your streak
            </p>
          </div>

          <div className="card">
            <p className="muted">Assessments</p>
            <h2>0</h2>
            <p className="muted">
              No assessments yet
            </p>
          </div>
        </section>

        {/* Topic Skills */}
        <section className="card" style={{ marginTop: 24 }}>
          <h2>Topic Skills</h2>

          <p className="muted">
            Your topic-level skill scores will appear here
            after we import your LeetCode history.
          </p>

          <div style={{ marginTop: 20 }}>
            {[
              "Arrays",
              "Strings",
              "Linked List",
              "Trees",
              "Graphs",
              "Dynamic Programming",
            ].map((topic) => (
              <div
                key={topic}
                style={{
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span>{topic}</span>
                  <span className="muted">Not evaluated</span>
                </div>

                <div
                  style={{
                    height: 8,
                    background: "#263244",
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      width: "0%",
                      height: "100%",
                      borderRadius: 10,
                      background: "#6366f1",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Main actions */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20,
            marginTop: 24,
          }}
        >
          <div className="card">
            <h2>🔗 Connect LeetCode</h2>

            <p className="muted">
              Import your solved problems and build your
              personal DSA skill profile.
            </p>

            <Link
              href="/leetcode"
              className="btn"
              style={{
                display: "inline-block",
                marginTop: 15,
              }}
            >
              Connect LeetCode
            </Link>
          </div>

          <div className="card">
            <h2>🧠 Adaptive Assessment</h2>

            <p className="muted">
              Take an assessment generated according to
              your current skill level.
            </p>

            <Link
              href="/assessment"
              className="btn"
              style={{
                display: "inline-block",
                marginTop: 15,
              }}
            >
              Start Assessment
            </Link>
          </div>

          <div className="card">
            <h2>🤖 AI Coach</h2>

            <p className="muted">
              Analyze mistakes and receive personalized
              learning recommendations.
            </p>

            <button
              className="btn secondary"
              style={{ marginTop: 15 }}
              disabled
            >
              Coming Soon
            </button>
          </div>
        </section>
      </main>
    </>
  );
}