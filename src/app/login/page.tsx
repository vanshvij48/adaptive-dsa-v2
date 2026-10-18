"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="container" style={{maxWidth:520}}>
      <h1>Login</h1>
      <p className="muted">Use your Supabase account.</p>

      <form onSubmit={submit} className="card" style={{marginTop:24}}>
        <label>Email</label>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          required
          style={inputStyle}
        />

        <label>Password</label>
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          type="password"
          required
          style={inputStyle}
        />

        <button className="btn" type="submit">Login</button>
        {message && <p className="error">{message}</p>}
      </form>
    </main>
  );
}

const inputStyle = {
  display:"block",
  width:"100%",
  margin:"8px 0 18px",
  padding:"11px",
  borderRadius:8,
  border:"1px solid #334155",
  background:"#0f172a",
  color:"white"
};