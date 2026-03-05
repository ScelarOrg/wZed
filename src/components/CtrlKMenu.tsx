"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useKeymapStore } from "@/stores/keymap-store";
import { executeAction } from "@/lib/keybind-dispatcher";
import {
  SplitSquareHorizontal,
  ArrowDown,
  Palette,
  Keyboard,
  X,
  Eye,
  Maximize2,
  FolderOpen,
  PanelBottom,
  Globe,
  FileText,
} from "lucide-react";

// format chord key for display, e.g. "Ctrl-T" -> "Ctrl+T"
function formatKey(raw: string): string {
  return raw
    .replace("Right", "\u2192")
    .replace("Down", "\u2193")
    .replace("Left", "\u2190")
    .replace("Up", "\u2191")
    .replace(/-/g, "+");
}

// "theme: select theme" -> "Select Theme"
function formatLabel(action: string): string {
  const after = action.includes(": ") ? action.split(": ").slice(1).join(": ") : action;
  return after.replace(/\b\w/g, (c) => c.toUpperCase());
}

interface QuickAction {
  label: string;
  action: string;
  icon: React.ReactNode;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Toggle Minimap", action: "view: toggle minimap", icon: <Eye size={13} /> },
  { label: "Maximize Bottom Panel", action: "view: maximize panel", icon: <Maximize2 size={13} /> },
  { label: "Reveal Active File", action: "project: reveal active file", icon: <FolderOpen size={13} /> },
  { label: "Toggle Terminal", action: "view: toggle terminal", icon: <PanelBottom size={13} /> },
  { label: "Open Browser Tab", action: "view: open browser tab", icon: <Globe size={13} /> },
  { label: "New File", action: "file: new file", icon: <FileText size={13} /> },
];

const CHORD_ICONS: Record<string, React.ReactNode> = {
  "theme: select theme": <Palette size={13} />,
  "settings: open keymap": <Keyboard size={13} />,
  "editor: split right": <SplitSquareHorizontal size={13} />,
  "editor: split down": <ArrowDown size={13} />,
  "editor: close all tabs": <X size={13} />,
};

export function CtrlKMenu() {
  const ctrlKMenuOpen = useWorkspaceStore((s) => s.ctrlKMenuOpen);
  const bindings = useKeymapStore((s) => s.bindings);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const chordItems = useMemo(() => bindings
    .filter((b) => b.keys.startsWith("Ctrl-K ") && b.keys !== "Ctrl-K")
    .map((b) => ({
      secondKey: b.keys.slice(7), // after "Ctrl-K "
      action: b.action,
      label: formatLabel(b.action),
      icon: CHORD_ICONS[b.action] ?? null,
    })), [bindings]);

  const allItems = useMemo(() => [
    ...chordItems.map((c) => ({ type: "chord" as const, ...c })),
    ...QUICK_ACTIONS.map((q) => ({ type: "quick" as const, secondKey: "", ...q })),
  ], [chordItems]);

  useEffect(() => {
    if (ctrlKMenuOpen) setSelectedIndex(0);
  }, [ctrlKMenuOpen]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useEffect(() => {
    if (!ctrlKMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        const item = allItems[selectedIndex];
        if (item) {
          useWorkspaceStore.setState({ ctrlKMenuOpen: false });
          executeAction(item.action);
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [ctrlKMenuOpen, allItems, selectedIndex]);

  if (!ctrlKMenuOpen) return null;

  const close = () => useWorkspaceStore.setState({ ctrlKMenuOpen: false });

  const run = (action: string) => {
    close();
    executeAction(action);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={close} />

      {/* Menu */}
      <div className="relative w-[480px] bg-bg3 border border-border rounded-lg shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-3 py-2.5 border-b border-border">
          <span className="text-[12px] text-t4">Press a key or pick an action...</span>
        </div>

        {/* Chord completions */}
        <div ref={listRef} className="max-h-[340px] overflow-y-auto scrollbar-thin py-1">
          {chordItems.length > 0 && (
            <div className="px-3 pt-1.5 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-t5">Chord Keys</span>
            </div>
          )}
          {chordItems.map((item, idx) => (
            <button
              key={item.action}
              onClick={() => run(item.action)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] cursor-pointer",
                idx === selectedIndex ? "bg-selection text-t1" : "text-t3 hover:bg-hover",
              )}
            >
              <span className="w-5 shrink-0 text-t4">{item.icon}</span>
              <span className="flex-1 text-left truncate">{item.label}</span>
              <kbd className="text-[11px] font-mono text-t4 bg-bg1 rounded px-1.5 py-0.5 shrink-0">
                {formatKey(item.secondKey)}
              </kbd>
            </button>
          ))}

          {/* Divider */}
          <div className="mx-3 my-1.5 border-t border-border" />

          {/* Quick actions */}
          <div className="px-3 pt-0.5 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-t5">Quick Actions</span>
          </div>
          {QUICK_ACTIONS.map((item, i) => {
            const idx = chordItems.length + i;
            return (
              <button
                key={item.action}
                onClick={() => run(item.action)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] cursor-pointer",
                  idx === selectedIndex ? "bg-selection text-t1" : "text-t3 hover:bg-hover",
                )}
              >
                <span className="w-5 shrink-0 text-t4">{item.icon}</span>
                <span className="flex-1 text-left truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
