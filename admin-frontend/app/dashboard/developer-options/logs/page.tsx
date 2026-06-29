"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { Terminal, Shield, Play, Pause, RefreshCw, Trash2, Search, SlidersHorizontal, ExternalLink } from "lucide-react";

const JsonViewer = ({ data }: { data: any }) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const lines = jsonStr.split('\n');
  const isLarge = lines.length > 3;

  const handleOpenWindow = () => {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (!isLarge) {
    return (
      <pre className="text-[10px] text-slate-500 mt-1 max-w-full overflow-x-auto bg-slate-900/20 p-2 rounded">
        {jsonStr}
      </pre>
    );
  }

  return (
    <div className="mt-1 relative max-w-full">
      <pre className="text-[10px] text-slate-500 overflow-x-auto bg-slate-900/20 p-2 rounded opacity-70 max-h-[4rem] overflow-y-hidden">
        {lines.slice(0, 3).join('\n')}...
      </pre>
      <button 
        onClick={handleOpenWindow}
        className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/40 hover:bg-black/60 transition rounded cursor-pointer group"
      >
        <span className="bg-primary text-white text-xs px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg flex items-center gap-1.5">
          <ExternalLink size={12} />
          View Full JSON
        </span>
      </button>
    </div>
  );
};
interface LogEntry {
  id: string;
  level: string;
  message: string;
  source: string;
  instanceId?: string;
  method?: string;
  endpoint?: string;
  status?: number;
  duration?: number;
  ip?: string;
  metadata?: any;
  createdAt: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"app" | "render_main" | "render_admin" | "render_workers">("app");
  const [isLive, setIsLive] = useState(true);
  
  // App filters
  const [level, setLevel] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [instanceId, setInstanceId] = useState("");
  
  // Render services
  const [renderServices, setRenderServices] = useState<{ label: string; id: string; type: string }[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");

  const [retentionDays, setRetentionDays] = useState("30");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  // Fetch available Render services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get("/logs/render/services");
        const list = res.data.services || [];
        setRenderServices(list);
        const firstWorker = list.find((s: any) => s.type === "worker");
        if (firstWorker) {
          setSelectedWorkerId(firstWorker.id);
        }
      } catch (err) {
        // Ignored
      }
    };
    fetchServices();
  }, []);

  // Fetch static logs initially or when filters/tabs change
  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === "app") {
        const params: any = { limit: 100 };
        if (level) params.level = level;
        if (source) params.source = source;
        if (status) params.status = status;
        if (search) params.search = search;
        if (endpoint) params.endpoint = endpoint;
        if (instanceId) params.instanceId = instanceId;

        const res = await api.get("/logs/app", { params });
        setLogs(res.data.data || []);
      } else if (activeTab === "render_main" || activeTab === "render_admin") {
        const mainService = renderServices.find((s) => s.type === "main");
        if (!mainService) {
          setLogs([]);
          return;
        }

        const res = await api.get(`/logs/render?serviceId=${mainService.id}`);
        const rawLogs = res.data.logs || res.data || [];

        // Client-side filtering: check if route message contains '/api/admin'
        const filtered = rawLogs.filter((l: any) => {
          const msg = typeof l === "string" ? l : l.message || "";
          const isAdminRoute = msg.includes("/api/admin");
          return activeTab === "render_admin" ? isAdminRoute : !isAdminRoute;
        });

        setLogs(filtered.map((l: any, idx: number) => ({
          id: String(idx),
          level: l.level || (l.message?.toLowerCase().includes("err") ? "ERROR" : "INFO"),
          message: typeof l === "string" ? l : l.message || JSON.stringify(l),
          source: activeTab === "render_main" ? "render-backend" : "render-admin",
          createdAt: l.timestamp || new Date().toISOString()
        })));
      } else if (activeTab === "render_workers") {
        if (!selectedWorkerId) {
          setLogs([]);
          return;
        }

        const res = await api.get(`/logs/render?serviceId=${selectedWorkerId}`);
        const rawLogs = res.data.logs || res.data || [];

        setLogs(rawLogs.map((l: any, idx: number) => ({
          id: String(idx),
          level: l.level || (l.message?.toLowerCase().includes("err") ? "ERROR" : "INFO"),
          message: typeof l === "string" ? l : l.message || JSON.stringify(l),
          source: "render-worker",
          createdAt: l.timestamp || new Date().toISOString()
        })));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeTab, level, source, status, endpoint, instanceId, selectedWorkerId, renderServices]);

  // Set up SSE Stream connection for real-time app logs
  useEffect(() => {
    if (activeTab !== "app" || !isLive) {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      return;
    }

    const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:8080/api/admin";
    // Setup SSE connection
    const sse = new EventSource(`${baseURL}/logs/app/stream`, { withCredentials: true });
    sseRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data);
        
        // Dynamic frontend filter validation matching active inputs
        if (level && log.level !== level) return;
        if (source && log.source !== source) return;
        if (instanceId && log.instanceId !== instanceId) return;
        if (status && String(log.status) !== status) return;
        if (endpoint && !log.endpoint?.toLowerCase().includes(endpoint.toLowerCase())) return;
        if (search && !log.message?.toLowerCase().includes(search.toLowerCase()) && !log.ip?.toLowerCase().includes(search.toLowerCase())) return;

        setLogs((prev) => [log, ...prev].slice(0, 200)); // Cap live streaming window to 200 elements
      } catch (err) {
        // parsing issues
      }
    };

    sse.onerror = () => {
      // Stream error
    };

    return () => {
      sse.close();
    };
  }, [activeTab, isLive, level, source, status, endpoint, search, instanceId]);

  useEffect(() => {
    if (isLive && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isLive]);

  const handleCleanup = async () => {
    if (!confirm(`Are you sure you want to delete database log records older than ${retentionDays} days?`)) return;
    try {
      const res = await api.delete(`/logs/app/cleanup?retentionDays=${retentionDays}`);
      alert(res.data.message);
      fetchLogs();
    } catch (err: any) {
      alert(err.response?.data?.error || "Cleanup failed");
    }
  };

  const getLevelColor = (lvl: string) => {
    switch (lvl?.toUpperCase()) {
      case "ERROR": return "text-red-500 bg-red-500/10 border-red-500/20";
      case "WARN": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "INFO": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">System Logs</h1>
          <p className="text-secondary mt-1 text-sm">Monitor application database logs and live Render runtime deployment instances.</p>
        </div>
        
        {/* Logs Retention Setup */}
        <div className="flex items-center gap-2 bg-card border border-border p-2.5 rounded-2xl shadow-premium">
          <span className="text-xs font-semibold text-secondary px-2">Auto Retention:</span>
          <input
            type="number"
            value={retentionDays}
            onChange={(e) => setRetentionDays(e.target.value)}
            className="w-12 bg-background border border-border text-center text-sm font-bold p-1 rounded-lg text-text focus:outline-none focus:border-primary"
            min="1"
          />
          <span className="text-xs text-secondary">days</span>
          <button
            onClick={handleCleanup}
            className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg cursor-pointer transition"
            title="Clean old logs"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border bg-card/40 p-1.5 rounded-2xl border gap-2 shadow-glass max-w-2xl">
        <button
          onClick={() => setActiveTab("app")}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${activeTab === "app" ? "bg-primary text-white" : "text-secondary hover:text-text hover:bg-black/5"}`}
        >
          <Terminal size={16} />
          Application Logs
        </button>
        <button
          onClick={() => setActiveTab("render_main")}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${activeTab === "render_main" ? "bg-primary text-white" : "text-secondary hover:text-text hover:bg-black/5"}`}
        >
          <Shield size={16} />
          Render Backend
        </button>
        <button
          onClick={() => setActiveTab("render_admin")}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${activeTab === "render_admin" ? "bg-primary text-white" : "text-secondary hover:text-text hover:bg-black/5"}`}
        >
          <Shield size={16} />
          Render Admin
        </button>
        <button
          onClick={() => setActiveTab("render_workers")}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${activeTab === "render_workers" ? "bg-primary text-white" : "text-secondary hover:text-text hover:bg-black/5"}`}
        >
          <Shield size={16} />
          Render Workers
        </button>
      </div>

      {/* Render Workers selector dropdown */}
      {activeTab === "render_workers" && (
        <div className="bg-card border border-border p-4 rounded-2xl shadow-premium flex flex-col gap-2 max-w-sm">
          <label className="text-xs font-bold text-secondary uppercase block">Select Worker Service</label>
          {renderServices.filter(s => s.type === "worker").length > 0 ? (
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full bg-background border border-border p-2.5 rounded-xl text-sm font-medium focus:outline-none focus:border-primary text-text cursor-pointer"
            >
              {renderServices.filter(s => s.type === "worker").map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-secondary italic">No worker instances configured. Set RENDER_WORKER_SERVICE_IDS in the environment.</span>
          )}
        </div>
      )}

      {/* Filter panel for app logs */}
      {activeTab === "app" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 bg-card border border-border p-4 rounded-2xl shadow-premium">
          <div>
            <label className="text-xs font-bold text-secondary uppercase block mb-1">Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-background border border-border p-2 rounded-xl text-sm font-medium focus:outline-none focus:border-primary text-text cursor-pointer"
            >
              <option value="">All Levels</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-secondary uppercase block mb-1">Method</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-background border border-border p-2 rounded-xl text-sm font-medium focus:outline-none focus:border-primary text-text cursor-pointer"
            >
              <option value="">All Sources</option>
              <option value="admin-backend">admin-backend</option>
              <option value="backend">backend</option>
              <option value="gateway">gateway</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-secondary uppercase block mb-1">Status</label>
            <input
              type="text"
              placeholder="e.g. 200, 500"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-background border border-border p-2 rounded-xl text-sm font-medium focus:outline-none focus:border-primary text-text"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-secondary uppercase block mb-1">Endpoint Path</label>
            <input
              type="text"
              placeholder="/api/students"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="w-full bg-background border border-border p-2 rounded-xl text-sm font-medium focus:outline-none focus:border-primary text-text"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-secondary uppercase block mb-1">Instance</label>
            <input
              type="text"
              placeholder="e.g. worker-1"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              className="w-full bg-background border border-border p-2 rounded-xl text-sm font-medium focus:outline-none focus:border-primary text-text"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-secondary uppercase block mb-1">Search text</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border pl-8 pr-3 p-2 rounded-xl text-sm font-medium focus:outline-none focus:border-primary text-text"
              />
              <Search className="absolute left-2.5 top-3 text-secondary" size={14} />
            </div>
          </div>
        </div>
      )}

      {/* Terminal logs content container */}
      <div className="bg-slate-950 border border-slate-900 shadow-glass rounded-3xl overflow-hidden flex flex-col h-[500px]">
        {/* Terminal Header */}
        <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs font-mono text-slate-500 ml-2">logs_stream_{activeTab}.sh</span>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "app" && (
              <button
                onClick={() => setIsLive(!isLive)}
                className={`flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-mono font-bold transition cursor-pointer border ${isLive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-700"}`}
              >
                {isLive ? <Pause size={10} /> : <Play size={10} />}
                {isLive ? "LIVE STREAM" : "PAUSED"}
              </button>
            )}

            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-40 transition cursor-pointer"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Terminal console output */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {error && <div className="text-red-400 border border-red-900/40 bg-red-950/20 p-3 rounded-xl">{error}</div>}
          {logs.length === 0 && !isLoading && (
            <div className="text-slate-500 text-center py-20">No matching log records found.</div>
          )}
          {logs.slice().reverse().map((log) => (
            <div key={log.id} className="border-b border-slate-900/40 pb-2 flex flex-col md:flex-row md:items-start gap-2 hover:bg-slate-900/10 px-1 rounded transition">
              <span className="text-slate-500 shrink-0 font-light select-none">
                {new Date(log.createdAt).toLocaleTimeString()}
              </span>
              
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border shrink-0 inline-block text-center ${getLevelColor(log.level)}`}>
                {log.level}
              </span>

              {log.instanceId && (
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold border shrink-0 inline-block text-center text-indigo-400 bg-indigo-500/10 border-indigo-500/20" title="Instance ID">
                  {log.instanceId}
                </span>
              )}

              {log.method && (
                <span className="text-sky-400 font-bold shrink-0">
                  {log.method}
                </span>
              )}

              {log.endpoint && (
                <span className="text-emerald-400 font-semibold truncate max-w-xs shrink-0" title={log.endpoint}>
                  {log.endpoint}
                </span>
              )}

              {log.status && (
                <span className={log.status >= 400 ? "text-red-400 font-bold shrink-0" : "text-emerald-500 font-bold shrink-0"}>
                  ({log.status})
                </span>
              )}

              {log.duration && (
                <span className="text-slate-500 shrink-0">
                  {log.duration}ms
                </span>
              )}

              <span className="text-slate-200 select-all whitespace-pre-wrap word-break">
                {log.message}
              </span>

              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <JsonViewer data={log.metadata} />
              )}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
