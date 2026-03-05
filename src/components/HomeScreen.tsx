"use client";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { useWorkspaceStore, type ProjectInfo } from "@/stores/workspace-store";
import {
  Folder,
  Plus,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  Code2,
  Globe,
  Server,
  FileCode,
  Search,
  Link,
  Check,
  Loader2,
} from "lucide-react";

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const TEMPLATE_ICONS: Record<string, typeof Code2> = {
  blank: FileCode,
  react: Code2,
  node: Server,
  vite: Globe,
};

function getTemplateIcon(templateId: string) {
  return TEMPLATE_ICONS[templateId] || FileCode;
}

function ProjectCard({
  project,
  onOpen,
  onRename,
  onDelete,
  onShare,
}: {
  project: ProjectInfo;
  onOpen: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onShare: () => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(project.name);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shareCopiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = getTemplateIcon(project.templateId || "blank");

  useEffect(() => {
    return () => { if (shareCopiedTimer.current) clearTimeout(shareCopiedTimer.current); };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  function handleRenameSubmit() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== project.name) {
      onRename(trimmed);
    }
    setRenaming(false);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="group relative flex flex-col gap-3 p-4 rounded-lg bg-bg1 border border-transparent hover:border-border hover:bg-hover/50 transition-all cursor-pointer focus:outline-none focus:border-accent"
      onClick={() => { if (!renaming && !menuOpen) onOpen(); }}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !renaming && !menuOpen) { e.preventDefault(); onOpen(); } }}
    >
      {/* Top row: icon + menu */}
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-md bg-bg2 flex items-center justify-center">
          <Icon size={18} className="text-accent" />
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1 rounded hover:bg-bg3 text-t5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-50 w-[150px] rounded-md bg-bg3 border border-border shadow-lg py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  setRenameValue(project.name);
                  setRenaming(true);
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] text-t2 hover:bg-hover transition-colors text-left"
              >
                <Pencil size={12} className="text-t4" />
                Rename
              </button>
              <button
                disabled={shareLoading}
                onClick={async (e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  setShareLoading(true);
                  try {
                    await onShare();
                    setShareCopied(true);
                    if (shareCopiedTimer.current) clearTimeout(shareCopiedTimer.current);
                    shareCopiedTimer.current = setTimeout(() => setShareCopied(false), 2000);
                  } finally {
                    setShareLoading(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-1.5 text-[11px] text-t2 hover:bg-hover transition-colors text-left",
                  shareLoading && "opacity-50 cursor-wait"
                )}
              >
                {shareLoading ? <Loader2 size={12} className="text-t4 animate-spin" /> : shareCopied ? <Check size={12} className="text-added" /> : <Link size={12} className="text-t4" />}
                {shareLoading ? "Sharing..." : shareCopied ? "Copied!" : "Copy link"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete();
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] text-deleted hover:bg-hover transition-colors text-left"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      {renaming ? (
        <input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameSubmit();
            if (e.key === "Escape") setRenaming(false);
          }}
          onClick={(e) => e.stopPropagation()}
          className="text-[13px] font-medium text-t1 bg-bg3 border border-accent rounded px-1.5 py-0.5 outline-none -mx-1"
        />
      ) : (
        <div className="text-[13px] font-medium text-t1 truncate">{project.name}</div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 text-[10px] text-t5 mt-auto">
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {timeAgo(project.lastOpened)}
        </span>
        <span className="capitalize">{project.templateId || "blank"}</span>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: { id: string; name: string; description: string };
  onSelect: () => void;
}) {
  const Icon = getTemplateIcon(template.id);

  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-bg1 border border-transparent hover:border-accent/30 hover:bg-hover/50 transition-all text-left group"
    >
      <div className="w-8 h-8 rounded-md bg-bg2 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-t4 group-hover:text-accent transition-colors" />
      </div>
      <div className="min-w-0">
        <div className="text-[12px] text-t2 group-hover:text-t1 font-medium truncate">
          {template.name}
        </div>
        <div className="text-[10px] text-t5 truncate">{template.description}</div>
      </div>
    </button>
  );
}

export function HomeScreen() {
  const projects = useWorkspaceStore((s) => s.projects);
  const templates = useWorkspaceStore((s) => s.templates);
  const openProject = useWorkspaceStore((s) => s.openProject);
  const openTemplate = useWorkspaceStore((s) => s.openTemplate);
  const deleteProject = useWorkspaceStore((s) => s.deleteProject);
  const renameProject = useWorkspaceStore((s) => s.renameProject);

  const [search, setSearch] = useState("");

  async function handleShareProject(project: ProjectInfo) {
    try {
      const { loadProjectSnapshot } = await import("@/lib/snapshot-db");
      const { createShareUrl } = await import("@/lib/share");
      const snapshot = await loadProjectSnapshot(project.id);
      if (!snapshot) {
        alert("No saved snapshot for this project. Open and save it first.");
        return;
      }
      await new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 0)));
      const result = await createShareUrl(project.name, project.templateId || "blank", snapshot);
      if ("error" in result) {
        alert(result.error);
        return;
      }
      await navigator.clipboard.writeText(result.url);
    } catch (e) {
      console.error("Failed to share project:", e);
      alert("Failed to create share link");
    }
  }

  const sorted = [...projects]
    .sort((a, b) => b.lastOpened - a.lastOpened)
    .filter((p) =>
      search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
    );

  const hasProjects = projects.length > 0;

  return (
    <div className="flex-1 flex flex-col bg-bg0 select-none overflow-y-auto">
      <div className="w-full max-w-[760px] mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-t1 text-[22px] font-semibold mb-1">Welcome back</h1>
          <p className="text-t4 text-[13px]">
            {hasProjects
              ? "Pick up where you left off, or start something new."
              : "Create your first project to get started."}
          </p>
        </div>

        {/* New Project */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] text-t4 uppercase tracking-wider font-medium">
              New Project
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => openTemplate(template.id)}
              />
            ))}
          </div>
        </section>

        {/* Recent Projects */}
        {hasProjects && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] text-t4 uppercase tracking-wider font-medium">
                Recent Projects ({projects.length})
              </h2>
              {projects.length > 4 && (
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-t5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter..."
                    className="text-[11px] bg-bg1 border border-border rounded pl-6 pr-2 py-1 text-t2 placeholder:text-t5 outline-none focus:border-accent w-[160px]"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sorted.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={() => openProject(project.id)}
                  onRename={(name) => renameProject(project.id, name)}
                  onDelete={() => deleteProject(project.id)}
                  onShare={() => handleShareProject(project)}
                />
              ))}
              {sorted.length === 0 && search && (
                <div className="col-span-full text-center text-t5 text-[12px] py-8">
                  No projects match &ldquo;{search}&rdquo;
                </div>
              )}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!hasProjects && (
          <div className="text-center py-16">
            <Folder size={32} className="text-t5 mx-auto mb-3" />
            <p className="text-t4 text-[13px] mb-1">No projects yet</p>
            <p className="text-t5 text-[11px]">
              Choose a template above to create your first project.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
