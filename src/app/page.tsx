import Link from "next/link";

export default function Home() {
  return (
    <main>
      <nav className="nav">
        <div className="brand">Adaptive DSA</div>
        <div className="row">
          <Link href="/login" className="btn secondary">Login</Link>
          <Link href="/signup" className="btn">Get Started</Link>
        </div>
      </nav>

      <section className="container">
        <h1 style={{fontSize:48, maxWidth:800}}>
          Your DSA practice should adapt to you.
        </h1>
        <p className="muted" style={{fontSize:20, maxWidth:760}}>
          Track LeetCode progress, estimate topic-level skill, generate adaptive
          assessments, execute code in sandboxes, analyze mistakes with AI and
          build a personalized roadmap.
        </p>

        <div className="grid" style={{marginTop:32}}>
          <Feature title="LeetCode tracking" text="Import solved problems and build a student skill profile." />
          <Feature title="Adaptive tests" text="Difficulty changes based on your performance." />
          <Feature title="Code execution" text="Run submissions inside isolated Docker workers." />
          <Feature title="AI coach" text="Turn failed submissions into concrete learning actions." />
        </div>
      </section>
    </main>
  );
}

function Feature({title, text}: {title:string; text:string}) {
  return <div className="card"><h3>{title}</h3><p className="muted">{text}</p></div>;
}