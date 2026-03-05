"use client";
import { useWorkspaceStore, type PanelKind } from "@/stores/workspace-store";
import { ProjectPanel } from "./ProjectPanel";
import { GitPanel } from "./GitPanel";
import { SearchPanel } from "./SearchPanel";
import { TerminalPanel } from "./TerminalPanel";
import { BrowserPanel } from "./BrowserPanel";
import { AIPanel } from "./AIPanel";
import { cn } from "@/lib/cn";
import { ErrorBoundary } from "./ui/ErrorBoundary";

function PanelContent({ panel }: { panel: PanelKind }) {
  let content;
  switch (panel) {
    case "project":
      content = <ProjectPanel />;
      break;
    case "git":
      content = <GitPanel />;
      break;
    case "search":
      content = <SearchPanel />;
      break;
    case "terminal":
      content = <TerminalPanel />;
      break;
    case "browser":
      content = <BrowserPanel />;
      break;
    case "ai":
      content = <AIPanel />;
      break;
    default:
      return null;
  }
  return <ErrorBoundary>{content}</ErrorBoundary>;
}

interface DockPanelProps {
  position: "left" | "right" | "bottom";
  panels: PanelKind[];
}

export function DockPanel({ position, panels }: DockPanelProps) {
  const dock = useWorkspaceStore((s) =>
    position === "left" ? s.leftDock : position === "right" ? s.rightDock : s.bottomDock
  );

  const hasBrowser = panels.includes("browser");

  return (
    <div className="flex h-full bg-bg0">
      <div className="flex-1 min-w-0 min-h-0 overflow-hidden relative">
        {/* Keep BrowserPanel always mounted to preserve iframe state */}
        {hasBrowser && (
          <div className={cn("w-full h-full", dock.activePanel !== "browser" && "hidden")}>
            <BrowserPanel />
          </div>
        )}
        {dock.activePanel !== "browser" && (
          <PanelContent panel={dock.activePanel} />
        )}
      </div>
    </div>
  );
}
