"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Signup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    
    setMessage(
      "Account created successfully. Check your email if email confirmation is enabled."
    );

    setLoading(false);

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  return (
    <main className="container" style={{ maxWidth: 520 }}>
      <h1>Create Account</h1>

      <p className="muted">
        Start building your personalized DSA profile.
      </p>

      <form
        onSubmit={handleSignup}
        className="card"
        style={{ marginTop: 24 }}
      >
        <label>Name</label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
          placeholder="Your name"
        />

        <label>Email</label>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          style={inputStyle}
          placeholder="you@example.com"
        />

        <label>Password</label>

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          minLength={6}
          style={inputStyle}
          placeholder="Minimum 6 characters"
        />

        <button
          className="btn"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        {message && (
          <p className="success">
            {message}
          </p>
        )}

        <p className="muted" style={{ marginTop: 20 }}>
          Already have an account?{" "}
          <Link href="/login">
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  margin: "8px 0 18px",
  padding: "11px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "white",
};