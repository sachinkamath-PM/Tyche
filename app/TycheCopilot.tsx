"use client";

import { cleanClaim } from "./claim-text.mjs";
import { FormEvent, useState } from "react";

type Proposal = { resumeId: number; claimIndex: number; original: string; suggested: string };

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
  resume: { id: number; title: string; score: number; claims: string[] };
  jobDescription: string;
  onClose: () => void;
  onApply: (proposal: Proposal) => boolean;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("This demo can tidy spacing in a supplied bullet or offer general interview prompts. It cannot evaluate ATS readiness or tailor documents.");
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
        setAnswer("I can’t draft a claim yet because this upload has no verified experience text. Document text extraction is not available in this demo.");
      } else {
        setAnswer("This is a formatting-only suggestion from the selected stored text, which may be a demo example. No experience has been independently verified.");
        if (cleanClaim(original) === original) { setAnswer("This bullet needs no spacing cleanup. Add your own verified facts when revising its substance; this demo cannot infer them."); }
        else setProposal({ resumeId: resume.id, claimIndex: 0, original, suggested: cleanClaim(original) });
      }
    } else if (/ats|score|low|keyword/.test(prompt)) {
      setAnswer("ATS evaluation is not available. Scores on demo examples are illustrative; no screening result has been calculated.");
    } else if (/interview|question/.test(prompt)) {
      setAnswer("Prepare for: How did you prioritise competing roadmap demands? What evidence changed a product decision? How did you align engineering and commercial stakeholders?");
    } else if (/job|role|description|tailor/.test(prompt)) {
      setAnswer(jobDescription.trim() ? "A role description has been entered, but automated comparison and tailoring are not available. Compare requirements manually with evidence from your own experience." : "No role description is attached. Automated comparison and tailoring are not available in this demo.");
    } else {
      setAnswer("I can tidy spacing in a stored bullet and offer general interview prompts. ATS evaluation and automated tailoring are unavailable.");
    }
    setQuestion("");
  };

  return <aside className="copilot-panel" aria-label="Ask Tyche">
    <div className="copilot-head"><div><small>CONTEXTUAL COPILOT</small><h2>Ask Tyche</h2></div><button type="button" onClick={onClose} aria-label="Close Ask Tyche">×</button></div>
    <div className="copilot-context"><span>{page}</span><span>{resume.title}</span><span>{jobDescription.trim() ? "Role attached" : "No role attached"}</span></div>
    <div className="copilot-message"><p>{answer}</p><small>Demo guidance; stored text may be a sample</small></div>
    {proposal && <article className="diff-card">
      <div><small>ORIGINAL</small><p>{proposal.original}</p></div>
      <div className="suggested"><small>SUGGESTED</small><p>{proposal.suggested}</p></div>
      <p className="trace-note">Source: stored text from {resume.title}</p>
      <div className="proposal-actions"><button type="button" onClick={() => setProposal(null)}>Cancel</button><button type="button" onClick={() => setQuestion("Make this more concise")}>Edit</button><button type="button" className="primary" onClick={() => { if (onApply(proposal)) { setProposal(null); setAnswer("Applied to the resume used for this proposal."); } }}>Apply</button></div>
    </article>}
    <div className="copilot-prompts">{["Why is my ATS score low?", "Rewrite the first bullet", "Generate interview questions"].map((text) => <button key={text} type="button" onClick={() => setQuestion(text)}>{text}</button>)}</div>
    <form className="copilot-form" onSubmit={ask}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about this resume…" /><button className="primary">Send</button></form>
    <p className="copilot-safety">Formatting suggestions preserve the supplied words. Changes require Apply.</p>
  </aside>;
}
