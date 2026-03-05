"use client";
import { useState, useRef, useEffect } from "react";
import { X, Bug, ExternalLink, Copy, Check } from "lucide-react";
import type { ErrorReportData } from "@/lib/ai-sdk";

const GITHUB_REPO = "ScelarOrg/Nodepod";

interface ErrorReportModalProps {
  data: ErrorReportData;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function ErrorReportModal({ data, onConfirm, onDismiss }: ErrorReportModalProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (copiedTimer.current) clearTimeout(copiedTimer.current); };
  }, []);

  const buildMarkdown = () =>
    `## ${data.title}\n\n` +
    `### Description\n${data.description}\n\n` +
    `### Error Message\n\`\`\`\n${data.error_message}\n\`\`\`\n\n` +
    (data.code_snippet ? `### Code\n\`\`\`javascript\n${data.code_snippet}\n\`\`\`\n\n` : "") +
    (data.affected_module ? `### Affected Module\n\`${data.affected_module}\`\n\n` : "") +
    `---\n*Reported via wZed AI Assistant*`;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(buildMarkdown());
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleReport = () => {
    const title = encodeURIComponent(`[Bug] ${data.title}`);
    const body = encodeURIComponent(buildMarkdown().slice(0, 6000));
    window.open(
      `https://github.com/${GITHUB_REPO}/issues/new?title=${title}&body=${body}`,
      "_blank"
    );
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onDismiss} />
      <div className="relative bg-bg0 border border-border rounded-lg shadow-2xl shadow-black/60 w-[520px] max-w-[90vw] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between h-[38px] px-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Bug size={14} className="text-warning" />
            <span className="text-[13px] text-t1 font-medium">Report Runtime Bug</span>
          </div>
          <button onClick={onDismiss} className="p-1 rounded text-t4 hover:text-t3 hover:bg-hover">
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
          <p className="text-[12px] text-t3">
            The AI assistant believes this error is caused by a bug in the Nodepod runtime, not your code.
            Would you like to report it as a GitHub issue?
          </p>

          <div>
            <div className="text-[11px] text-t4 uppercase tracking-wider font-semibold mb-1">Title</div>
            <div className="text-[12px] text-t1 bg-bg3 border border-border rounded px-2.5 py-1.5 font-mono">
              {data.title}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-t4 uppercase tracking-wider font-semibold mb-1">Description</div>
            <div className="text-[12px] text-t3 bg-bg3 border border-border rounded px-2.5 py-1.5 whitespace-pre-wrap">
              {data.description}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-t4 uppercase tracking-wider font-semibold mb-1">Error</div>
            <pre className="text-[11px] text-red-400 bg-bg3 border border-border rounded px-2.5 py-1.5 font-mono overflow-x-auto whitespace-pre-wrap">
              {data.error_message}
            </pre>
          </div>

          {data.code_snippet && (
            <div>
              <div className="text-[11px] text-t4 uppercase tracking-wider font-semibold mb-1">Code</div>
              <pre className="text-[11px] text-t2 bg-bg3 border border-border rounded px-2.5 py-1.5 font-mono overflow-x-auto whitespace-pre-wrap">
                {data.code_snippet}
              </pre>
            </div>
          )}

          {data.affected_module && (
            <div>
              <div className="text-[11px] text-t4 uppercase tracking-wider font-semibold mb-1">Affected Module</div>
              <span className="inline-block text-[11px] text-accent bg-accent/10 rounded px-2 py-0.5 font-mono">
                {data.affected_module}
              </span>
            </div>
          )}
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
              onClick={onDismiss}
              className="px-3 py-1.5 rounded text-[12px] text-t3 hover:text-t1 hover:bg-hover border border-border"
            >
              No, skip
            </button>
            <button
              onClick={handleReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] text-white bg-accent hover:bg-accent/90"
            >
              <ExternalLink size={12} />
              Yes, report on GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
