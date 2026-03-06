"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNodepodStore } from "@/stores/nodepod-store";
import { cn } from "@/lib/cn";
import { Activity, X } from "lucide-react";

interface MemoryStats {
  vfs: { fileCount: number; totalBytes: number; dirCount: number; watcherCount: number };
  engine: { moduleCacheSize: number; transformCacheSize: number };
  heap: { usedMB: number; totalMB: number; limitMB: number } | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function heapPercent(stats: MemoryStats): number | null {
  if (!stats.heap) return null;
  return Math.round((stats.heap.usedMB / stats.heap.limitMB) * 100);
}

function heapColor(pct: number | null): string {
  if (pct === null) return "text-t4";
  if (pct < 40) return "text-added";
  if (pct < 70) return "text-warning";
  return "text-deleted";
}

export function PerfMonitor() {
  const instance = useNodepodStore((s) => s.instance);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const poll = useCallback(() => {
    if (!instance) { setStats(null); return; }
    try {
      const s = instance.memoryStats();
      setStats(s);
      if (s.heap) {
        setHistory((h) => {
          const next = [...h, s.heap!.usedMB];
          return next.length > 60 ? next.slice(-60) : next;
        });
      }
    } catch { /* instance may be torn down */ }
  }, [instance]);

  useEffect(() => {
    if (!instance) return;
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [instance, poll]);

  // Close on outside click
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded]);

  if (!stats) return null;

  const pct = heapPercent(stats);
  const color = heapColor(pct);

  return (
    <div className="relative" ref={panelRef}>
      {/* Compact status bar indicator */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-hover transition-colors",
          color
        )}
        title="Performance Monitor"
      >
        <Activity size={11} />
        {stats.heap ? (
          <span className="tabular-nums">{stats.heap.usedMB}MB</span>
        ) : (
          <span>{stats.vfs.fileCount} files</span>
        )}
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div
          className={cn(
            "absolute bottom-full right-0 mb-1 w-[320px] rounded-lg border shadow-xl z-50",
            "bg-bg1 border-border text-[11px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-t2 font-medium flex items-center gap-1.5">
              <Activity size={12} />
              Performance Monitor
            </span>
            <button onClick={() => setExpanded(false)} className="text-t4 hover:text-t2">
              <X size={12} />
            </button>
          </div>

          {/* Heap section */}
          {stats.heap && (
            <div className="px-3 py-2 border-b border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-t3">JS Heap</span>
                <span className={cn("tabular-nums font-medium", color)}>
                  {stats.heap.usedMB} / {stats.heap.limitMB} MB ({pct}%)
                </span>
              </div>
              {/* Heap bar */}
              <div className="h-1.5 rounded-full bg-bg3 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    pct !== null && pct < 40 ? "bg-added" :
                    pct !== null && pct < 70 ? "bg-warning" : "bg-deleted"
                  )}
                  style={{ width: `${pct ?? 0}%` }}
                />
              </div>
              {/* Mini sparkline */}
              {history.length > 1 && (
                <div className="mt-2">
                  <Sparkline data={history} max={stats.heap.limitMB} height={28} />
                </div>
              )}
            </div>
          )}

          {/* VFS section */}
          <div className="px-3 py-2 border-b border-border">
            <div className="text-t3 mb-1">Virtual Filesystem</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <StatRow label="Files" value={stats.vfs.fileCount.toLocaleString()} />
              <StatRow label="Directories" value={stats.vfs.dirCount.toLocaleString()} />
              <StatRow label="Total Size" value={formatBytes(stats.vfs.totalBytes)} />
              <StatRow label="Watchers" value={stats.vfs.watcherCount.toLocaleString()} />
            </div>
          </div>

          {/* Engine section */}
          <div className="px-3 py-2">
            <div className="text-t3 mb-1">Script Engine</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <StatRow label="Cached Modules" value={stats.engine.moduleCacheSize.toLocaleString()} />
              <StatRow label="Transform Cache" value={stats.engine.transformCacheSize.toLocaleString()} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-t4">{label}</span>
      <span className="text-t2 tabular-nums text-right">{value}</span>
    </>
  );
}

function Sparkline({ data, max, height }: { data: number[]; max: number; height: number }) {
  const w = 280;
  const h = height;
  const step = w / Math.max(data.length - 1, 1);
  const points = data
    .map((v, i) => `${i * step},${h - (v / max) * h}`)
    .join(" ");
  const fillPoints = `0,${h} ${points} ${(data.length - 1) * step},${h}`;

  return (
    <svg width={w} height={h} className="w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polygon points={fillPoints} fill="currentColor" className="text-accent/10" />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent" />
    </svg>
  );
}
