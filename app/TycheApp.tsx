"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
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
  source: "demo" | "local";
  claims: string[];
};

function relativeDemoDate(daysAgo: number) {
  if (daysAgo === 0) return "Demo · Today";
  if (daysAgo <= 7) return "Demo · This week";
  return `Demo · ${daysAgo} days ago`;
}

const demoResumes: Resume[] = [
  { id: 1, title: "Senior Product Manager", type: "B2B SaaS", updated: relativeDemoDate(0), score: 92, tag: "B2B SaaS", tone: "coral", source: "demo", claims: ["Managed the product roadmap."] },
  { id: 2, title: "Product Lead", type: "AI & Data", updated: relativeDemoDate(3), score: 88, tag: "AI / ML", tone: "blue", source: "demo", claims: ["Led discovery for an AI-assisted workflow."] },
  { id: 3, title: "Product Manager", type: "Consumer", updated: relativeDemoDate(9), score: 84, tag: "B2C", tone: "yellow", source: "demo", claims: ["Improved the onboarding journey."] },
  { id: 4, title: "Associate PM", type: "Early career", updated: relativeDemoDate(15), score: 78, tag: "Intern / APM", tone: "lavender", source: "demo", claims: ["Supported weekly product reporting."] },
];

const RESUME_STORAGE_KEY = "tyche_demo_resumes_v1";
const MAX_RESUME_SIZE = 10 * 1024 * 1024;
type CoverLetter = { id: number; title: string; resumeTitle: string; created: string; body: string };
const demoCoverLetters = [
  { id: 1, title: "Senior PM · Northstar Labs", resumeTitle: "Senior Product Manager", created: "Demo example", body: "Dear Northstar Labs hiring team,\n\nI’m excited to apply for the Senior Product Manager role. My product work has focused on turning complex customer and business problems into clear priorities, aligned roadmaps, and measurable outcomes.\n\nI would welcome the opportunity to discuss how that experience could support Northstar Labs.\n\nRegards,\nArjun Sharma" },
  { id: 2, title: "Product Lead · Kinetic AI", resumeTitle: "Product Lead", created: "Demo example", body: "Dear Kinetic AI hiring team,\n\nI’m writing to express my interest in the Product Lead opportunity. I have led discovery for AI-assisted workflows and enjoy connecting customer evidence, technical possibility, and responsible delivery.\n\nI would be glad to explore how I could contribute to Kinetic AI’s next stage of product growth.\n\nRegards,\nArjun Sharma" },
] satisfies CoverLetter[];

function isResume(value: unknown): value is Resume {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "number" && typeof item.title === "string" && typeof item.type === "string"
    && typeof item.updated === "string" && typeof item.score === "number" && typeof item.tag === "string" && typeof item.tone === "string"
    && (item.claims === undefined || (Array.isArray(item.claims) && item.claims.every((claim) => typeof claim === "string")))
    && (item.source === undefined || item.source === "demo" || item.source === "local");
}

async function validateResumeFile(file: File) {
  if (!file.size || file.size > MAX_RESUME_SIZE) throw new Error("Choose a PDF, DOC, or DOCX up to 10 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["pdf", "doc", "docx"].includes(extension)) throw new Error("Choose a PDF, DOC, or DOCX file.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const startsWith = (signature: number[]) => signature.every((value, index) => bytes[index] === value);
  if (extension === "pdf" && !startsWith([0x25, 0x50, 0x44, 0x46, 0x2d])) throw new Error("This file does not appear to be a valid PDF.");
  if (extension === "doc" && !startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) throw new Error("This file does not appear to be a valid Word document.");
  if (extension === "docx") {
    const isZip = startsWith([0x50, 0x4b, 0x03, 0x04]) || startsWith([0x50, 0x4b, 0x05, 0x06]) || startsWith([0x50, 0x4b, 0x07, 0x08]);
    const archiveText = new TextDecoder("latin1").decode(bytes);
    if (!isZip || !archiveText.includes("[Content_Types].xml") || !archiveText.includes("word/")) throw new Error("This file does not appear to be a valid DOCX document.");
  }
}

const navigation = [
  { icon: "⌂", label: "Overview", href: "/" },
  { icon: "▤", label: "My resumes", href: "/resumes" },
  { icon: "◫", label: "ATS evaluator", href: "/ats-evaluator" },
  { icon: "✦", label: "Tailor resume", href: "/tailor" },
  { icon: "✎", label: "Cover letters", href: "/cover-letters" },
];

const pageCopy: Record<string, { eyebrow: string; title: string }> = {
  "/": { eyebrow: "CAREER WORKSPACE", title: "Good afternoon, Arjun." },
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
          <span className="resume-title"><i className={`doc-icon ${resume.tone}`}>▤</i><span><strong>{resume.title}</strong><small>{resume.source === "demo" ? `Demo example · ${resume.type}` : resume.type}</small></span></span>
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
  const [resumes, setResumes] = useState(demoResumes);
  const [selectedId, setSelectedId] = useState(1);
  const [toast, setToast] = useState("");
  const [job, setJob] = useState("");
  const [filter, setFilter] = useState("All");
  const [letters, setLetters] = useState<CoverLetter[]>(demoCoverLetters);
  const [openLetter, setOpenLetter] = useState<CoverLetter | null>(null);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const selected = resumes.find((resume) => resume.id === selectedId) ?? resumes[0];
  const average = useMemo(() => Math.round(resumes.reduce((sum, resume) => sum + resume.score, 0) / resumes.length), [resumes]);
  const filteredResumes = filter === "All" ? resumes : resumes.filter((resume) => resume.tag === filter);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(window.localStorage.getItem(RESUME_STORAGE_KEY) || "null");
        if (Array.isArray(stored) && stored.length && stored.every(isResume)) {
          const migrated = stored.map((item) => ({
            ...item,
            source: item.source ?? (item.type === "Local upload" ? "local" : "demo"),
            claims: item.claims ?? [],
          })) as Resume[];
          const restored = [...migrated.filter((item) => item.source === "local"), ...demoResumes];
          setResumes(restored);
          setSelectedId(restored[0].id);
        }
      } catch {
        window.localStorage.removeItem(RESUME_STORAGE_KEY);
      }
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const saveResumes = (nextResumes: Resume[]) => {
    setResumes(nextResumes);
    try {
      window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(nextResumes));
    } catch {
      flash("Tyche could not save changes in this browser.");
    }
  };

  const uploadResume = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await validateResumeFile(file);
      const title = file.name.replace(/\.(pdf|docx?)$/i, "").replace(/[-_]/g, " ").trim().slice(0, 120) || "Untitled resume";
      const resume: Resume = { id: Date.now(), title, type: "Local upload", updated: "Saved locally", score: 0, tag: "Unsorted", tone: "mint", source: "local", claims: [] };
      saveResumes([resume, ...resumes]);
      setSelectedId(resume.id);
      flash("Resume added to this browser. Ready for an ATS check.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Tyche could not read that file.");
    } finally {
      event.target.value = "";
    }
  };

  const evaluate = () => {
    saveResumes(resumes.map((item) => item.id === selectedId ? { ...item, score: item.score || 81, updated: "Just now" } : item));
    flash("ATS analysis complete — 6 improvements found.");
  };

  const createTailoredVersion = () => {
    if (!job.trim()) return flash("Add a job description first.");
    const tailored: Resume = { ...selected, id: Date.now(), title: `${selected.title} · Tailored`, updated: "Just now", score: Math.max(selected.score, 94), tag: "Job matched", tone: "mint", source: "local" };
    saveResumes([tailored, ...resumes]);
    setSelectedId(tailored.id);
    setJob("");
    flash("Tailored version saved to My resumes.");
  };

  const createCoverLetter = () => {
    if (!job.trim()) return flash("Add a job description first.");
    const body = `Dear hiring team,\n\nI’m excited to apply for this opportunity. My experience as a ${selected.title} has centred on understanding customer needs, setting clear product direction, and working across functions to deliver useful outcomes.\n\nTyche prepared this demo draft from the selected resume and target role. Before sending it, replace this paragraph with one or two verified achievements that directly match the job description.\n\nI would welcome the opportunity to discuss how my experience could contribute to your team.\n\nRegards,\nArjun Sharma`;
    const letter: CoverLetter = { id: Date.now(), title: `${selected.title} · New role`, resumeTitle: selected.title, created: "Created this session", body };
    setLetters((items) => [letter, ...items]);
    setOpenLetter(letter);
    setJob("");
    flash("Cover letter created and opened for review.");
  };

  const copyLetter = async () => {
    if (!openLetter) return;
    try { await navigator.clipboard.writeText(openLetter.body); flash("Cover letter copied."); }
    catch { flash("Copy failed. Select the letter text and copy it manually."); }
  };

  const applyCopilotChange = ({ resumeId, claimIndex, original, suggested }: { resumeId: number; claimIndex: number; original: string; suggested: string }) => {
    const target = resumes.find((item) => item.id === resumeId);
    if (!target || target.claims[claimIndex] !== original) {
      flash("This proposal is stale. Ask Tyche to review the current resume again.");
      return false;
    }
    const nextResumes = resumes.map((item) => item.id === resumeId
      ? { ...item, claims: item.claims.map((claim, index) => index === claimIndex ? suggested : claim), updated: "Just now" }
      : item);
    saveResumes(nextResumes);
    flash(`Accepted change applied to ${target.title}.`);
    return true;
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
          <a className="early-access-link" href="mailto:sachinkamath05@gmail.com?subject=Tyche%20Job%20Autopilot%20early%20access">Email for early access</a>
        </div>
        <button type="button" className="profile" onClick={() => flash("Profile settings are coming soon.")}><span className="avatar">AS</span><span><strong>Arjun Sharma</strong><small>Demo profile · Product Manager</small></span><span>•••</span></button>
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
          <article className="tool-card"><div className="library-head"><div><div className="eyebrow">DEMO LETTERS</div><h2>{letters.length} cover letters</h2></div><span className="letter-count">{letters.length}</span></div>{letters.map((letter) => <div className="letter-item" key={letter.id}><span className="letter-icon">✎</span><div><strong>{letter.title}</strong><p>{letter.created} · {letter.resumeTitle}</p></div><button type="button" onClick={() => setOpenLetter(letter)}>Open</button></div>)}</article>
        </section>}

        <footer><span>Your original files stay on this device; Tyche saves demo resume details only in this browser.</span><span><button type="button" onClick={() => flash("Help center is coming soon.")}>Help center</button><a href="https://buildquick.co.in/terms">Terms</a><a href="https://buildquick.co.in/privacy">Privacy</a></span></footer>
      </section>

      {openLetter && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpenLetter(null); }}><section className="modal letter-modal" role="dialog" aria-modal="true" aria-labelledby="letter-title"><button className="modal-close" type="button" aria-label="Close cover letter" onClick={() => setOpenLetter(null)}>×</button><div className="modal-icon" aria-hidden="true">✎</div><p className="eyebrow">COVER LETTER DRAFT</p><h2 id="letter-title">{openLetter.title}</h2><p className="letter-meta">Based on {openLetter.resumeTitle} · Review every claim before sending</p><div className="letter-body">{openLetter.body}</div><div className="modal-actions"><button className="secondary" type="button" onClick={() => setOpenLetter(null)}>Close</button><button className="primary" type="button" onClick={copyLetter}>Copy letter</button></div></section></div>}
      {toast && <div className="toast" role="status" aria-live="polite"><span>✓</span>{toast}</div>}
      <TycheCopilot open={copilotOpen} page={pageCopy[currentPath].title} resume={selected} jobDescription={job} onClose={() => setCopilotOpen(false)} onApply={applyCopilotChange} />
    </main>
  );
}
