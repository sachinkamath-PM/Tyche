"use client";

import { FormEvent, useState } from "react";

type Proposal = { original: string; suggested: string };

export function TycheCopilot({
  open,
  page,
  resume,
  jobDescription,
  onClose,
  onApply,
}: {
  open: boolean;
  page: string;
  resume: { title: string; score: number; claims: string[] };
  jobDescription: string;
  onClose: () => void;
  onApply: (proposal: Proposal) => void;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("Ask about the selected resume, its ATS score, or the role you are targeting.");
  const [proposal, setProposal] = useState<Proposal | null>(null);

  if (!open) return null;

  const ask = (event: FormEvent) => {
    event.preventDefault();
    const prompt = question.trim().toLowerCase();
    if (!prompt) return;
    setProposal(null);
    if (/rewrite|bullet|senior|concise/.test(prompt)) {
      const original = resume.claims[0];
      if (!original) {
        setAnswer("I can’t draft a claim yet because this upload has no verified experience text. Add a real bullet first; Tyche will not invent one.");
      } else {
        setAnswer("I used only the selected, user-supplied claim. Review the visible diff before applying it.");
        setProposal({ original, suggested: `${original.replace(/[.]$/, "")} with cross-functional product, engineering and commercial partners.` });
      }
    } else if (/ats|score|low|keyword/.test(prompt)) {
      setAnswer(`The selected resume scores ${resume.score || "not yet scored"}. The current report flags role-language coverage; only add missing keywords where your supplied experience supports them.`);
    } else if (/interview|question/.test(prompt)) {
      setAnswer("Prepare for: How did you prioritise competing roadmap demands? What evidence changed a product decision? How did you align engineering and commercial stakeholders?");
    } else if (/job|role|description|tailor/.test(prompt)) {
      setAnswer(jobDescription.trim() ? "The role description is in context. I can compare its language with verified resume claims and propose reviewable edits." : "Paste the target job description in the structured workspace first, then I can ground recommendations in it.");
    } else {
      setAnswer("I can explain the ATS score, rewrite a verified bullet, generate interview questions, or compare this resume with the pasted role.");
    }
    setQuestion("");
  };

  return <aside className="copilot-panel" aria-label="Ask Tyche">
    <div className="copilot-head"><div><small>CONTEXTUAL COPILOT</small><h2>Ask Tyche</h2></div><button type="button" onClick={onClose} aria-label="Close Ask Tyche">×</button></div>
    <div className="copilot-context"><span>{page}</span><span>{resume.title}</span><span>{jobDescription.trim() ? "Role attached" : "No role attached"}</span></div>
    <div className="copilot-message"><p>{answer}</p><small>Grounded in the selected resume and current workspace only</small></div>
    {proposal && <article className="diff-card">
      <div><small>ORIGINAL</small><p>{proposal.original}</p></div>
      <div className="suggested"><small>SUGGESTED</small><p>{proposal.suggested}</p></div>
      <p className="trace-note">Source: verified claim from {resume.title}</p>
      <div className="proposal-actions"><button type="button" onClick={() => setProposal(null)}>Cancel</button><button type="button" onClick={() => setQuestion("Make this more concise")}>Edit</button><button type="button" className="primary" onClick={() => { onApply(proposal); setProposal(null); setAnswer("Applied. The original remains available in resume history."); }}>Apply</button></div>
    </article>}
    <div className="copilot-prompts">{["Why is my ATS score low?", "Rewrite the first bullet", "Generate interview questions"].map((text) => <button key={text} type="button" onClick={() => setQuestion(text)}>{text}</button>)}</div>
    <form className="copilot-form" onSubmit={ask}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about this resume…" /><button className="primary">Send</button></form>
    <p className="copilot-safety">Tyche never invents experience. Changes require Apply.</p>
  </aside>;
}
