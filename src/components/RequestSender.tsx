"use client";
import { useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import {
  Send,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
type Method = (typeof METHODS)[number];

const METHOD_COLORS: Record<Method, string> = {
  GET: "text-green-400",
  POST: "text-yellow-400",
  PUT: "text-blue-400",
  PATCH: "text-orange-400",
  DELETE: "text-red-400",
  HEAD: "text-purple-400",
  OPTIONS: "text-gray-400",
};

const HAS_BODY: Record<Method, boolean> = {
  GET: false,
  POST: true,
  PUT: true,
  PATCH: true,
  DELETE: false,
  HEAD: false,
  OPTIONS: false,
};

interface HeaderRow {
  key: string;
  value: string;
  enabled: boolean;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
}

interface RequestSenderProps {
  baseUrl: string;
}

export function RequestSender({ baseUrl }: RequestSenderProps) {
  const [method, setMethod] = useState<Method>("GET");
  const [url, setUrl] = useState(baseUrl);
  const [headers, setHeaders] = useState<HeaderRow[]>([
    { key: "Content-Type", value: "application/json", enabled: true },
  ]);
  const [body, setBody] = useState("{\n  \n}");
  const [showHeaders, setShowHeaders] = useState(false);
  const [showBody, setShowBody] = useState(false);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);

  const addHeader = () => {
    setHeaders((prev) => [...prev, { key: "", value: "", enabled: true }]);
  };

  const removeHeader = (idx: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateHeader = (idx: number, field: "key" | "value", val: string) => {
    setHeaders((prev) =>
      prev.map((h, i) => (i === idx ? { ...h, [field]: val } : h))
    );
  };

  const toggleHeader = (idx: number) => {
    setHeaders((prev) =>
      prev.map((h, i) => (i === idx ? { ...h, enabled: !h.enabled } : h))
    );
  };

  const sendRequest = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    const startTime = performance.now();
    try {
      const reqHeaders: Record<string, string> = {};
      for (const h of headers) {
        if (h.enabled && h.key.trim()) {
          reqHeaders[h.key.trim()] = h.value;
        }
      }

      const opts: RequestInit = {
        method,
        headers: reqHeaders,
      };
      if (HAS_BODY[method] && body.trim()) {
        opts.body = body;
      }

      const res = await fetch(url, opts);
      const elapsed = Math.round(performance.now() - startTime);

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        resHeaders[k] = v;
      });

      let resBody: string;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json")) {
        try {
          const json = await res.json();
          resBody = JSON.stringify(json, null, 2);
        } catch {
          resBody = await res.text();
        }
      } else {
        resBody = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: resBody,
        time: elapsed,
      });
    } catch (e: any) {
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }, [method, url, headers, body]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendRequest();
    }
  };

  const statusColor = response
    ? response.status < 300
      ? "text-green-400"
      : response.status < 400
        ? "text-yellow-400"
        : "text-red-400"
    : "";

  return (
    <div
      className="flex flex-col h-full bg-bg0 text-t2 overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* Request line: method + url + send */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border shrink-0">
        {/* Method selector */}
        <div className="relative">
          <button
            onClick={() => setMethodOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-[12px] font-semibold bg-bg3 border border-border hover:border-focus min-w-[70px] justify-between",
              METHOD_COLORS[method]
            )}
          >
            {method}
            <ChevronDown size={10} className="text-t4" />
          </button>
          {methodOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMethodOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1 bg-bg2 border border-border rounded shadow-lg z-30 py-1 min-w-[90px]">
                {METHODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMethod(m);
                      setMethodOpen(false);
                      if (HAS_BODY[m]) setShowBody(true);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1 text-[12px] font-semibold hover:bg-hover",
                      METHOD_COLORS[m],
                      m === method && "bg-hover"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* URL input */}
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/__preview__/3000/api/endpoint"
          className="flex-1 bg-bg3 border border-border rounded px-2 py-1 text-[12px] text-t1 placeholder-t4 outline-none focus:border-focus min-w-0"
          spellCheck={false}
        />

        {/* Send button */}
        <button
          onClick={sendRequest}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-accent text-white text-[12px] font-medium hover:opacity-90 disabled:opacity-50 shrink-0"
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Send size={12} />
          )}
          Send
        </button>
      </div>

      {/* Collapsible sections: Headers + Body */}
      <div className="shrink-0 border-b border-border max-h-[40%] overflow-auto">
        {/* Headers section */}
        <button
          onClick={() => setShowHeaders((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-t3 hover:text-t1 w-full text-left"
        >
          {showHeaders ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          Headers
          <span className="text-t5 ml-1">
            ({headers.filter((h) => h.enabled && h.key.trim()).length})
          </span>
        </button>
        {showHeaders && (
          <div className="px-3 pb-2 space-y-1">
            {headers.map((h, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={h.enabled}
                  onChange={() => toggleHeader(idx)}
                  className="shrink-0 accent-accent"
                />
                <input
                  value={h.key}
                  onChange={(e) => updateHeader(idx, "key", e.target.value)}
                  placeholder="Header"
                  className="flex-1 bg-bg3 border border-border rounded px-1.5 py-0.5 text-[11px] text-t1 placeholder-t5 outline-none focus:border-focus min-w-0"
                />
                <input
                  value={h.value}
                  onChange={(e) => updateHeader(idx, "value", e.target.value)}
                  placeholder="Value"
                  className="flex-1 bg-bg3 border border-border rounded px-1.5 py-0.5 text-[11px] text-t1 placeholder-t5 outline-none focus:border-focus min-w-0"
                />
                <button
                  onClick={() => removeHeader(idx)}
                  className="p-0.5 rounded text-t5 hover:text-red-400 hover:bg-hover shrink-0"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
            <button
              onClick={addHeader}
              className="flex items-center gap-1 text-[11px] text-t4 hover:text-t2 mt-1"
            >
              <Plus size={10} /> Add header
            </button>
          </div>
        )}

        {/* Body section (only for methods that have bodies) */}
        {HAS_BODY[method] && (
          <>
            <button
              onClick={() => setShowBody((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-t3 hover:text-t1 w-full text-left border-t border-border"
            >
              {showBody ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              Body
            </button>
            {showBody && (
              <div className="px-3 pb-2">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={5}
                  className="w-full bg-bg3 border border-border rounded p-2 text-[11px] text-t1 placeholder-t5 outline-none focus:border-focus font-mono resize-y min-h-[60px]"
                  spellCheck={false}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Response area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Response status bar */}
        {(response || error) && (
          <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border shrink-0 text-[11px]">
            {response && (
              <>
                <span className={cn("font-semibold", statusColor)}>
                  {response.status} {response.statusText}
                </span>
                <span className="text-t5">{response.time}ms</span>
                <span className="text-t5">
                  {response.body.length > 1024
                    ? `${(response.body.length / 1024).toFixed(1)} KB`
                    : `${response.body.length} B`}
                </span>
              </>
            )}
            {error && <span className="text-red-400 font-medium">{error}</span>}
          </div>
        )}

        {/* Response body */}
        <div className="flex-1 min-h-0 overflow-auto">
          {response ? (
            <pre className="p-3 text-[11px] text-t1 font-mono whitespace-pre-wrap break-words">
              {response.body}
            </pre>
          ) : !error ? (
            <div className="flex items-center justify-center h-full text-t5 text-[12px]">
              Send a request to see the response
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
