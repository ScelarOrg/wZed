"use client";
import { useState, useRef, useEffect } from "react";
import { X, Bug, ExternalLink, Copy, Check } from "lucide-react";

const GITHUB_REPO = "ScelarOrg/Nodepod";

interface BugReportModalProps {
  onClose: () => void;
}

export function BugReportModal({ onClose }: BugReportModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (copiedTimer.current) clearTimeout(copiedTimer.current); };
  }, []);

  const buildMarkdown = () =>
    `## ${title || "Bug Report"}\n\n` +
    `### Description\n${description || "No description provided."}\n\n` +
    (errorMessage ? `### Error Message\n\`\`\`\n${errorMessage}\n\`\`\`\n\n` : "") +
    (codeSnippet ? `### Code\n\`\`\`javascript\n${codeSnippet}\n\`\`\`\n\n` : "") +
    `---\n*Reported via wZed*`;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(buildMarkdown());
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleReport = () => {
    const issueTitle = encodeURIComponent(`[Bug] ${title || "Bug Report"}`);
    const body = encodeURIComponent(buildMarkdown().slice(0, 6000));
    window.open(
      `https://github.com/${GITHUB_REPO}/issues/new?title=${issueTitle}&body=${body}`,
      "_blank"
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-bg0 border border-border rounded-lg shadow-2xl shadow-black/60 w-[520px] max-w-[90vw] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between h-[38px] px-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Bug size={14} className="text-warning" />
            <span className="text-[13px] text-t1 font-medium">Report a Bug</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-t4 hover:text-t3 hover:bg-hover">
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
          <p className="text-[12px] text-t3">
            Found a bug? Fill in the details below and report it as a GitHub issue.
          </p>

          <div>
            <div className="text-[11px] text-t4 uppercase tracking-wider font-semibold mb-1">Title *</div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the bug..."
              className="w-full bg-bg3 border border-border rounded px-2.5 py-1.5 text-[12px] text-t1 placeholder-t4 outline-none focus:border-focus font-mono"
            />
          </div>

          <div>
            <div className="text-[11px] text-t4 uppercase tracking-wider font-semibold mb-1">Description</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened? What did you expect to happen?"
              rows={3}
              className="w-full bg-bg3 border border-border rounded px-2.5 py-1.5 text-[12px] text-t3 placeholder-t4 outline-none focus:border-focus resize-none"
            />
          </div>

          <div>
            <div className="text-[11px] text-t4 uppercase tracking-wider font-semibold mb-1">Error Message</div>
            <textarea
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="Paste any error messages here..."
              rows={2}
              className="w-full bg-bg3 border border-border rounded px-2.5 py-1.5 text-[11px] text-red-400 placeholder-t4/60 outline-none focus:border-focus font-mono resize-none"
            />
          </div>

          <div>
            <div className="text-[11px] text-t4 uppercase tracking-wider font-semibold mb-1">Code Snippet</div>
            <textarea
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="Paste relevant code here..."
              rows={3}
              className="w-full bg-bg3 border border-border rounded px-2.5 py-1.5 text-[11px] text-t2 placeholder-t4/60 outline-none focus:border-focus font-mono resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border shrink-0">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] text-t4 hover:text-t3 hover:bg-hover"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy as Markdown"}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded text-[12px] text-t3 hover:text-t1 hover:bg-hover border border-border"
            >
              Cancel
            </button>
            <button
              onClick={handleReport}
              disabled={!title.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] text-white bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ExternalLink size={12} />
              Report on GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
