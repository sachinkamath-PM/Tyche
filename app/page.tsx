"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";

type Resume = {
  id: number;
  title: string;
  type: string;
  updated: string;
  score: number;
  tag: string;
  tone: string;
};

const initialResumes: Resume[] = [
  { id: 1, title: "Senior Product Manager", type: "B2B SaaS", updated: "Today, 10:42 AM", score: 92, tag: "B2B SaaS", tone: "coral" },
  { id: 2, title: "Product Lead", type: "AI & Data", updated: "Jul 30, 2026", score: 88, tag: "AI / ML", tone: "blue" },
  { id: 3, title: "Product Manager", type: "Consumer", updated: "Jul 24, 2026", score: 84, tag: "B2C", tone: "yellow" },
  { id: 4, title: "Associate PM", type: "Early career", updated: "Jul 18, 2026", score: 78, tag: "Intern / APM", tone: "lavender" },
];

const nav = [
  ["⌂", "Overview"],
  ["▤", "My resumes"],
  ["◫", "ATS evaluator"],
  ["✦", "Tailor resume"],
  ["✎", "Cover letters"],
];

function ScoreRing({ score, small = false }: { score: number; small?: boolean }) {
  return (
    <div className={small ? "score-ring small" : "score-ring"} style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}>
      <div><strong>{score}</strong>{!small && <span>/100</span>}</div>
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [resumes, setResumes] = useState(initialResumes);
  const [selectedId, setSelectedId] = useState(1);
  const [toast, setToast] = useState("");
  const [panel, setPanel] = useState<"tailor" | "cover" | null>(null);
  const [job, setJob] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const selected = resumes.find((resume) => resume.id === selectedId) ?? resumes[0];
  const average = useMemo(() => Math.round(resumes.reduce((sum, r) => sum + r.score, 0) / resumes.length), [resumes]);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const uploadResume = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const title = file.name.replace(/\.(pdf|docx?)$/i, "").replace(/[-_]/g, " ");
    const resume: Resume = { id: Date.now(), title, type: "New upload", updated: "Just now", score: 0, tag: "Unsorted", tone: "mint" };
    setResumes((items) => [resume, ...items]);
    setSelectedId(resume.id);
    flash("Resume uploaded. Ready for an ATS check.");
    const form = new FormData();
    form.append("file", file);
    form.append("title", title);
    fetch("/api/resumes", { method: "POST", body: form }).catch(() => undefined);
    event.target.value = "";
  };

  const evaluate = () => {
    setResumes((items) => items.map((item) => item.id === selectedId ? { ...item, score: item.score || 81, updated: "Just now" } : item));
    flash("ATS analysis complete — 6 improvements found.");
  };

  const generate = () => {
    if (!job.trim()) {
      flash("Add a job description first.");
      return;
    }
    if (panel === "tailor") {
      const tailored: Resume = { ...selected, id: Date.now(), title: `${selected.title} · Tailored`, updated: "Just now", score: Math.max(selected.score, 94), tag: "Job matched", tone: "mint" };
      setResumes((items) => [tailored, ...items]);
      setSelectedId(tailored.id);
      flash("Tailored version saved to My resumes.");
    } else {
      flash("Cover letter created and saved.");
    }
    setPanel(null);
    setJob("");
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">T</span><span>tyche</span></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map(([icon, label]) => (
            <button key={label} className={active === label ? "nav-item active" : "nav-item"} onClick={() => setActive(label)}>
              <span className="nav-icon">{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="coming-card">
          <span className="soon-pill">COMING SOON</span>
          <div className="coming-icon">↗</div>
          <strong>Job Autopilot</strong>
          <p>Let Tyche find and apply to relevant roles for you.</p>
          <button onClick={() => flash("You’re on the early access list!")}>Join early access</button>
        </div>
        <button className="profile">
          <span className="avatar">AS</span><span><strong>Arjun Sharma</strong><small>Product Manager</small></span><span>•••</span>
        </button>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><p>Sunday, 2 August</p><h1>Good afternoon, Arjun.</h1></div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notifications">♢<span className="notification-dot" /></button>
            <button className="upload-button" onClick={() => uploadRef.current?.click()}><span>＋</span> Upload resume</button>
            <input ref={uploadRef} onChange={uploadResume} type="file" accept=".pdf,.doc,.docx" hidden />
          </div>
        </header>

        <section className="hero-grid">
          <article className="performance-card">
            <div className="eyebrow">RESUME PERFORMANCE</div>
            <div className="performance-main">
              <ScoreRing score={selected.score || average} />
              <div className="performance-copy"><span className="status-pill">↑ Strong match</span><h2>Your resume is in great shape.</h2><p>It’s optimized for product roles and ranks above 86% of resumes we’ve reviewed.</p></div>
            </div>
            <div className="metric-row">
              <div><span>Keywords matched</span><strong>24 / 27</strong><i className="bar"><b style={{ width: "89%" }} /></i></div>
              <div><span>Impact & clarity</span><strong>Excellent</strong><i className="bar"><b style={{ width: "92%" }} /></i></div>
              <div><span>ATS readability</span><strong>100%</strong><i className="bar"><b style={{ width: "100%" }} /></i></div>
            </div>
          </article>

          <article className="next-card">
            <div className="eyebrow">YOUR NEXT MOVE</div>
            <div className="spark">✦</div>
            <h2>Tailor it to a job</h2>
            <p>Bring the right experience forward for a specific role in minutes.</p>
            <button onClick={() => setPanel("tailor")}>Tailor this resume <span>→</span></button>
            <small>Usually takes less than 2 min</small>
          </article>
        </section>

        <section className="quick-section">
          <div className="section-heading"><div><h2>Start something</h2><p>Pick a workflow and Tyche will guide you through it.</p></div></div>
          <div className="quick-grid">
            <button className="quick-card" onClick={() => uploadRef.current?.click()}><span className="quick-icon coral">↥</span><span><strong>Upload a resume</strong><small>PDF or DOCX, up to 10 MB</small></span><i>→</i></button>
            <button className="quick-card" onClick={evaluate}><span className="quick-icon blue">◎</span><span><strong>Check ATS score</strong><small>Find gaps before recruiters do</small></span><i>→</i></button>
            <button className="quick-card" onClick={() => setPanel("cover")}><span className="quick-icon yellow">✎</span><span><strong>Write a cover letter</strong><small>Personalized to any role</small></span><i>→</i></button>
          </div>
        </section>

        <section className="resumes-section">
          <div className="section-heading"><div><h2>Your resumes <span>{resumes.length}</span></h2><p>One profile, thoughtfully adapted for every opportunity.</p></div><button onClick={() => setActive("My resumes")}>View all <span>→</span></button></div>
          <div className="resume-table">
            <div className="table-head"><span>RESUME</span><span>ROLE / FOCUS</span><span>LAST UPDATED</span><span>ATS SCORE</span><span /></div>
            {resumes.slice(0, 4).map((resume) => (
              <button className={selectedId === resume.id ? "resume-row selected" : "resume-row"} key={resume.id} onClick={() => setSelectedId(resume.id)}>
                <span className="resume-title"><i className={`doc-icon ${resume.tone}`}>▤</i><span><strong>{resume.title}</strong><small>{resume.type}</small></span></span>
                <span><em className={`tag ${resume.tone}`}>{resume.tag}</em></span>
                <span className="muted">{resume.updated}</span>
                <span><ScoreRing score={resume.score} small /></span>
                <span className="more">•••</span>
              </button>
            ))}
          </div>
        </section>
        <footer><span>Tyche keeps your documents private and secure.</span><span><button>Help center</button><button>Privacy</button></span></footer>
      </section>

      {panel && <div className="modal-backdrop" onMouseDown={() => setPanel(null)}><section className="modal" onMouseDown={(e) => e.stopPropagation()} aria-modal="true" role="dialog">
        <button className="modal-close" onClick={() => setPanel(null)}>×</button>
        <div className="modal-icon">{panel === "tailor" ? "✦" : "✎"}</div>
        <p className="eyebrow">{panel === "tailor" ? "TAILOR RESUME" : "COVER LETTER"}</p>
        <h2>{panel === "tailor" ? "Match the role, keep your voice." : "Make your introduction count."}</h2>
        <p>Using <strong>{selected.title}</strong>. Paste the job description below and Tyche will surface the most relevant experience and skills.</p>
        <textarea value={job} onChange={(e) => setJob(e.target.value)} placeholder="Paste the full job description here…" />
        <div className="modal-actions"><button className="secondary" onClick={() => setPanel(null)}>Cancel</button><button className="primary" onClick={generate}>{panel === "tailor" ? "Create tailored version" : "Create cover letter"} <span>→</span></button></div>
      </section></div>}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}
