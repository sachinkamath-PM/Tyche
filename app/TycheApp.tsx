"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TycheCopilot } from "./TycheCopilot";

type Resume = {
  id: number;
  title: string;
  type: string;
  updated: string;
  score: number;
  tag: string;
  tone: string;
  claims: string[];
};

const initialResumes: Resume[] = [
  { id: 1, title: "Senior Product Manager", type: "B2B SaaS", updated: "Today, 10:42 AM", score: 92, tag: "B2B SaaS", tone: "coral", claims: ["Managed the product roadmap."] },
  { id: 2, title: "Product Lead", type: "AI & Data", updated: "Jul 30, 2026", score: 88, tag: "AI / ML", tone: "blue", claims: ["Led discovery for an AI-assisted workflow."] },
  { id: 3, title: "Product Manager", type: "Consumer", updated: "Jul 24, 2026", score: 84, tag: "B2C", tone: "yellow", claims: ["Improved the onboarding journey."] },
  { id: 4, title: "Associate PM", type: "Early career", updated: "Jul 18, 2026", score: 78, tag: "Intern / APM", tone: "lavender", claims: ["Supported weekly product reporting."] },
];

const navigation = [
  { icon: "⌂", label: "Overview", href: "/" },
  { icon: "▤", label: "My resumes", href: "/resumes" },
  { icon: "◫", label: "ATS evaluator", href: "/ats-evaluator" },
  { icon: "✦", label: "Tailor resume", href: "/tailor" },
  { icon: "✎", label: "Cover letters", href: "/cover-letters" },
];

const pageCopy: Record<string, { eyebrow: string; title: string }> = {
  "/": { eyebrow: "Sunday, 2 August", title: "Good afternoon, Arjun." },
  "/resumes": { eyebrow: "YOUR CAREER LIBRARY", title: "My resumes" },
  "/ats-evaluator": { eyebrow: "SCREENING READINESS", title: "ATS evaluator" },
  "/tailor": { eyebrow: "JOB-SPECIFIC VERSION", title: "Tailor a resume" },
  "/cover-letters": { eyebrow: "MAKE THE INTRODUCTION COUNT", title: "Cover letters" },
};

function ScoreRing({ score, small = false }: { score: number; small?: boolean }) {
  return (
    <div className={small ? "score-ring small" : "score-ring"} style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}>
      <div><strong>{score}</strong>{!small && <span>/100</span>}</div>
    </div>
  );
}

function ResumeTable({ resumes, selectedId, onSelect, limit }: { resumes: Resume[]; selectedId: number; onSelect: (id: number) => void; limit?: number }) {
  return (
    <div className="resume-table">
      <div className="table-head"><span>RESUME</span><span>ROLE / FOCUS</span><span>LAST UPDATED</span><span>ATS SCORE</span><span /></div>
      {resumes.slice(0, limit ?? resumes.length).map((resume) => (
        <button className={selectedId === resume.id ? "resume-row selected" : "resume-row"} key={resume.id} onClick={() => onSelect(resume.id)}>
          <span className="resume-title"><i className={`doc-icon ${resume.tone}`}>▤</i><span><strong>{resume.title}</strong><small>{resume.type}</small></span></span>
          <span><em className={`tag ${resume.tone}`}>{resume.tag}</em></span>
          <span className="muted">{resume.updated}</span>
          <span><ScoreRing score={resume.score} small /></span>
          <span className="more">•••</span>
        </button>
      ))}
    </div>
  );
}

export default function TycheApp() {
  const pathname = usePathname();
  const currentPath = pageCopy[pathname] ? pathname : "/";
  const [resumes, setResumes] = useState(initialResumes);
  const [selectedId, setSelectedId] = useState(1);
  const [toast, setToast] = useState("");
  const [panel, setPanel] = useState<"tailor" | "cover" | null>(null);
  const [job, setJob] = useState("");
  const [filter, setFilter] = useState("All");
  const [letters, setLetters] = useState(2);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const selected = resumes.find((resume) => resume.id === selectedId) ?? resumes[0];
  const average = useMemo(() => Math.round(resumes.reduce((sum, resume) => sum + resume.score, 0) / resumes.length), [resumes]);
  const filteredResumes = filter === "All" ? resumes : resumes.filter((resume) => resume.tag === filter);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const uploadResume = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const title = file.name.replace(/\.(pdf|docx?)$/i, "").replace(/[-_]/g, " ");
    const resume: Resume = { id: Date.now(), title, type: "New upload", updated: "Just now", score: 0, tag: "Unsorted", tone: "mint", claims: [] };
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

  const createTailoredVersion = () => {
    if (!job.trim()) return flash("Add a job description first.");
    const tailored: Resume = { ...selected, id: Date.now(), title: `${selected.title} · Tailored`, updated: "Just now", score: Math.max(selected.score, 94), tag: "Job matched", tone: "mint" };
    setResumes((items) => [tailored, ...items]);
    setSelectedId(tailored.id);
    setJob("");
    setPanel(null);
    flash("Tailored version saved to My resumes.");
  };

  const createCoverLetter = () => {
    if (!job.trim()) return flash("Add a job description first.");
    setLetters((count) => count + 1);
    setJob("");
    setPanel(null);
    flash("Cover letter created and saved.");
  };

  const applyCopilotChange = ({ original, suggested }: { original: string; suggested: string }) => {
    setResumes((items) => items.map((item) => item.id === selectedId ? { ...item, claims: item.claims.map((claim) => claim === original ? suggested : claim), updated: "Just now" } : item));
    flash("Accepted change applied to the selected resume.");
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/"><span className="brand-mark">T</span><span>tyche</span></Link>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className={currentPath === item.href ? "nav-item active" : "nav-item"}>
              <span className="nav-icon">{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="coming-card">
          <span className="soon-pill">COMING SOON</span><div className="coming-icon">↗</div>
          <strong>Job Autopilot</strong><p>Let Tyche find and apply to relevant roles for you.</p>
          <button type="button" onClick={() => flash("You’re on the early access list!")}>Join early access</button>
        </div>
        <button type="button" className="profile" onClick={() => flash("Profile settings are coming soon.")}><span className="avatar">AS</span><span><strong>Arjun Sharma</strong><small>Product Manager</small></span><span>•••</span></button>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><p>{pageCopy[currentPath].eyebrow}</p><h1>{pageCopy[currentPath].title}</h1></div>
          <div className="top-actions">
            <button type="button" className="ask-button" onClick={() => setCopilotOpen(true)}>✦ Ask Tyche</button>
            <button type="button" className="icon-button" aria-label="Notifications" onClick={() => flash("No new notifications.")}>♢<span className="notification-dot" /></button>
            <button className="upload-button" onClick={() => uploadRef.current?.click()}><span>＋</span> Upload resume</button>
            <input ref={uploadRef} onChange={uploadResume} type="file" accept=".pdf,.doc,.docx" hidden />
          </div>
        </header>

        {currentPath === "/" && <>
          <section className="hero-grid">
            <article className="performance-card">
              <div className="eyebrow">RESUME PERFORMANCE</div>
              <div className="performance-main"><ScoreRing score={selected.score || average} /><div className="performance-copy"><span className="status-pill">↑ Strong match</span><h2>Your resume is in great shape.</h2><p>It’s optimized for product roles and ranks above 86% of resumes we’ve reviewed.</p></div></div>
              <div className="metric-row"><div><span>Keywords matched</span><strong>24 / 27</strong><i className="bar"><b style={{ width: "89%" }} /></i></div><div><span>Impact & clarity</span><strong>Excellent</strong><i className="bar"><b style={{ width: "92%" }} /></i></div><div><span>ATS readability</span><strong>100%</strong><i className="bar"><b style={{ width: "100%" }} /></i></div></div>
            </article>
            <article className="next-card"><div className="eyebrow">YOUR NEXT MOVE</div><div className="spark">✦</div><h2>Tailor it to a job</h2><p>Bring the right experience forward for a specific role in minutes.</p><Link className="next-action" href="/tailor">Tailor this resume <span>→</span></Link><small>Usually takes less than 2 min</small></article>
          </section>
          <section className="quick-section">
            <div className="section-heading"><div><h2>Start something</h2><p>Pick a workflow and Tyche will guide you through it.</p></div></div>
            <div className="quick-grid">
              <button className="quick-card" onClick={() => uploadRef.current?.click()}><span className="quick-icon coral">↥</span><span><strong>Upload a resume</strong><small>PDF or DOCX, up to 10 MB</small></span><i>→</i></button>
              <Link className="quick-card" href="/ats-evaluator"><span className="quick-icon blue">◎</span><span><strong>Check ATS score</strong><small>Find gaps before recruiters do</small></span><i>→</i></Link>
              <Link className="quick-card" href="/cover-letters"><span className="quick-icon yellow">✎</span><span><strong>Write a cover letter</strong><small>Personalized to any role</small></span><i>→</i></Link>
            </div>
          </section>
          <section className="resumes-section"><div className="section-heading"><div><h2>Your resumes <span>{resumes.length}</span></h2><p>One profile, thoughtfully adapted for every opportunity.</p></div><Link href="/resumes">View all <span>→</span></Link></div><ResumeTable resumes={resumes} selectedId={selectedId} onSelect={setSelectedId} limit={4} /></section>
        </>}

        {currentPath === "/resumes" && <section className="workspace-page">
          <div className="workspace-intro"><div><p>Organize versions by role, product context and level of responsibility.</p></div><button className="primary" onClick={() => uploadRef.current?.click()}>＋ Add resume</button></div>
          <div className="filter-row">{["All", "B2B SaaS", "AI / ML", "B2C", "Intern / APM", "Job matched", "Unsorted"].map((item) => <button key={item} className={filter === item ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(item)}>{item}</button>)}</div>
          <ResumeTable resumes={filteredResumes} selectedId={selectedId} onSelect={setSelectedId} />
          {!filteredResumes.length && <div className="empty-state">No resumes in this collection yet.</div>}
        </section>}

        {currentPath === "/ats-evaluator" && <section className="workspace-page tool-layout">
          <article className="tool-card evaluator-card"><div className="eyebrow">SELECT A RESUME</div><h2>See what the screening software sees.</h2><p>Review structure, keyword coverage, measurable impact and readability before applying.</p><label className="field-label">Resume<select value={selectedId} onChange={(event) => setSelectedId(Number(event.target.value))}>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.title} — {resume.tag}</option>)}</select></label><button className="primary wide-button" onClick={evaluate}>Run ATS evaluation <span>→</span></button></article>
          <article className="tool-card score-report"><div className="score-head"><ScoreRing score={selected.score || 81} /><div><span className="status-pill">READY TO APPLY</span><h2>{selected.title}</h2><p>{selected.tag} · updated {selected.updated.toLowerCase()}</p></div></div><div className="finding"><span className="finding-status good">✓</span><div><strong>ATS-readable structure</strong><p>Section hierarchy and chronology are easy to parse.</p></div></div><div className="finding"><span className="finding-status warn">!</span><div><strong>6 keywords to strengthen</strong><p>Add discovery, roadmap ownership, experimentation and stakeholder alignment where accurate.</p></div></div><div className="finding"><span className="finding-status good">✓</span><div><strong>Strong impact language</strong><p>Most accomplishments use clear actions and measurable outcomes.</p></div></div></article>
        </section>}

        {currentPath === "/tailor" && <section className="workspace-page tool-layout">
          <article className="tool-card"><div className="eyebrow">BASE RESUME</div><h2>Choose the version closest to the role.</h2><label className="field-label">Resume<select value={selectedId} onChange={(event) => setSelectedId(Number(event.target.value))}>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.title} — {resume.tag}</option>)}</select></label><div className="selected-summary"><i className={`doc-icon ${selected.tone}`}>▤</i><div><strong>{selected.title}</strong><p>{selected.type} · ATS {selected.score || "Not scored"}</p></div></div><p className="privacy-note">Tyche preserves your experience and only brings forward skills already supported by your resume.</p></article>
          <article className="tool-card"><div className="eyebrow">TARGET ROLE</div><h2>Paste the job description.</h2><p>Tyche will map the role’s language to your existing achievements and save a new version.</p><textarea className="workspace-textarea" value={job} onChange={(event) => setJob(event.target.value)} placeholder="Paste the full job description here…" /><button className="primary wide-button" onClick={createTailoredVersion}>Create tailored version <span>→</span></button></article>
        </section>}

        {currentPath === "/cover-letters" && <section className="workspace-page tool-layout">
          <article className="tool-card"><div className="eyebrow">NEW COVER LETTER</div><h2>Connect your experience to this opportunity.</h2><label className="field-label">Resume<select value={selectedId} onChange={(event) => setSelectedId(Number(event.target.value))}>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.title} — {resume.tag}</option>)}</select></label><textarea className="workspace-textarea compact" value={job} onChange={(event) => setJob(event.target.value)} placeholder="Paste the job description here…" /><button className="primary wide-button" onClick={createCoverLetter}>Create cover letter <span>→</span></button></article>
          <article className="tool-card"><div className="library-head"><div><div className="eyebrow">SAVED LETTERS</div><h2>{letters} cover letters</h2></div><span className="letter-count">{letters}</span></div><div className="letter-item"><span className="letter-icon">✎</span><div><strong>Senior PM · Northstar Labs</strong><p>Using Senior Product Manager · Jul 31</p></div><button type="button" onClick={() => flash("Cover letter opened.")}>Open</button></div><div className="letter-item"><span className="letter-icon">✎</span><div><strong>Product Lead · Kinetic AI</strong><p>Using Product Lead · Jul 28</p></div><button type="button" onClick={() => flash("Cover letter opened.")}>Open</button></div></article>
        </section>}

        <footer><span>Tyche keeps your documents private and secure.</span><span><button type="button" onClick={() => flash("Help center is coming soon.")}>Help center</button><button type="button" onClick={() => flash("Privacy details are coming soon.")}>Privacy</button></span></footer>
      </section>

      {panel && <div className="modal-backdrop" onMouseDown={() => setPanel(null)}><section className="modal" onMouseDown={(event) => event.stopPropagation()} aria-modal="true" role="dialog"><button type="button" className="modal-close" onClick={() => setPanel(null)}>×</button><div className="modal-icon">{panel === "tailor" ? "✦" : "✎"}</div><p className="eyebrow">{panel === "tailor" ? "TAILOR RESUME" : "COVER LETTER"}</p><h2>{panel === "tailor" ? "Match the role, keep your voice." : "Make your introduction count."}</h2><p>Using <strong>{selected.title}</strong>. Paste the job description below and Tyche will surface the most relevant experience and skills.</p><textarea value={job} onChange={(event) => setJob(event.target.value)} placeholder="Paste the full job description here…" /><div className="modal-actions"><button type="button" className="secondary" onClick={() => setPanel(null)}>Cancel</button><button type="button" className="primary" onClick={panel === "tailor" ? createTailoredVersion : createCoverLetter}>{panel === "tailor" ? "Create tailored version" : "Create cover letter"} <span>→</span></button></div></section></div>}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
      <TycheCopilot open={copilotOpen} page={pageCopy[currentPath].title} resume={selected} jobDescription={job} onClose={() => setCopilotOpen(false)} onApply={applyCopilotChange} />
    </main>
  );
}
