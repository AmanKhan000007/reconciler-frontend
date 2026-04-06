import { useState, useEffect, useRef, useCallback } from "react";
import * as API from "./api/index.js";
import DemoPlayer from "./components/DemoPlayer.jsx";

// ── Fonts & Global CSS ──────────────────────────────────────────────────────
function useGlobalStyles() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    const s = document.createElement("style");
    s.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { font-family: 'Geist', sans-serif; background: #0A0A0A; color: #FAFAFA; overflow-x: hidden; }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: #111; }
      ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      input, textarea, select { font-family: 'Geist', sans-serif; }
      button { font-family: 'Geist', sans-serif; cursor: pointer; }
      a { text-decoration: none; }

      @keyframes fadeUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; } }
      @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
      @keyframes slideIn  { from { opacity:0; transform:translateX(-16px); } to { opacity:1; transform:none; } }
      @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:.45; } }
      @keyframes spin     { to { transform: rotate(360deg); } }
      @keyframes shimmer  { from { background-position: -200% 0; } to { background-position: 200% 0; } }
      @keyframes marq     { from { transform:translateX(0); } to { transform:translateX(-50%); } }
      @keyframes blob     { 0%,100%{transform:translate(0,0) scale(1);} 45%{transform:translate(40px,-30px) scale(1.1);} 70%{transform:translate(-25px,20px) scale(.96);} }
      @keyframes glow     { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,.3);} 50%{box-shadow:0 0 40px rgba(99,102,241,.6);} }

      .fu0{animation:fadeUp .7s .00s both} .fu1{animation:fadeUp .7s .08s both} .fu2{animation:fadeUp .7s .16s both}
      .fu3{animation:fadeUp .7s .24s both} .fu4{animation:fadeUp .7s .34s both} .fu5{animation:fadeUp .7s .44s both}
      .fi {animation:fadeIn .4s both}
      .reveal { opacity:0; transform:translateY(20px); transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
      .reveal.vis { opacity:1; transform:none; }
      .rd1{transition-delay:.06s} .rd2{transition-delay:.12s} .rd3{transition-delay:.18s} .rd4{transition-delay:.24s}

      .card { background:#111; border:1px solid #1F1F1F; border-radius:12px; transition: all .2s; }
      .card:hover { border-color:#2A2A2A; }
      .btn-primary { background:#6366F1; color:#fff; border:none; border-radius:8px; padding:10px 20px; font-size:14px; font-weight:600; transition: all .2s; }
      .btn-primary:hover { background:#5254CC; transform:translateY(-1px); box-shadow:0 4px 16px rgba(99,102,241,.4); }
      .btn-ghost  { background:transparent; color:#888; border:1px solid #2A2A2A; border-radius:8px; padding:10px 18px; font-size:14px; font-weight:500; transition: all .2s; }
      .btn-ghost:hover { color:#fff; border-color:#444; background:#1A1A1A; }
      .btn-danger { background:transparent; color:#F87171; border:1px solid #3A1515; border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; transition: all .2s; }
      .btn-danger:hover { background:#3A1515; }
      .inp { background:#0F0F0F; border:1px solid #2A2A2A; border-radius:8px; padding:10px 12px; font-size:14px; color:#FAFAFA; outline:none; width:100%; transition: border .2s; }
      .inp:focus { border-color:#6366F1; box-shadow:0 0 0 3px rgba(99,102,241,.12); }
      .inp::placeholder { color:#444; }
      label { font-size:12px; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:.5px; display:block; margin-bottom:6px; }
      table { width:100%; border-collapse:collapse; font-size:13px; }
      th { text-align:left; padding:10px 14px; color:#555; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; border-bottom:1px solid #1A1A1A; }
      td { padding:11px 14px; border-bottom:1px solid #161616; color:#CCC; vertical-align:middle; }
      tr:hover td { background:rgba(255,255,255,.02); }
      tr:last-child td { border-bottom:none; }
      .mono { font-family:'Geist Mono', monospace; }
      .tag { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; padding:3px 9px; border-radius:100px; }
    `;
    document.head.appendChild(s);

    // reveal observer
    const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add("vis"); }), { threshold: .08 });
    const watch = () => document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
    const t = setTimeout(watch, 200);
    return () => { clearTimeout(t); obs.disconnect(); };
  }, []);
}

// ── Primitives ──────────────────────────────────────────────────────────────
const Spinner = ({ size = 18, color = "#6366F1" }) => (
  <div style={{ width: size, height: size, border: `2px solid ${color}22`, borderTopColor: color, borderRadius: "50%", animation: "spin .8s linear infinite", flexShrink: 0 }} />
);

function Tag({ label, color }) {
  const map = {
    matched:   ["#052E16","#4ADE80"], pending:   ["#1C1917","#A8A29E"],
    unmatched: ["#2D1515","#FCA5A5"], exception: ["#2D1A00","#FCD34D"],
    duplicate: ["#1E1B2E","#A78BFA"], open:      ["#1C2533","#60A5FA"],
    closed:    ["#0D1F0D","#4ADE80"], resolved:  ["#0D1F0D","#4ADE80"],
    "in-progress":["#2D1A00","#FCD34D"],
    admin:     ["#1E1B2E","#A78BFA"], member: ["#111","#888"], viewer: ["#111","#666"],
    bank:      ["#0A1628","#60A5FA"], internal: ["#1A0A28","#C084FC"],
    low:       ["#0D1F0D","#4ADE80"], medium: ["#2D1A00","#FCD34D"], high: ["#2D1515","#FCA5A5"],
    healthy:   ["#052E16","#4ADE80"],
  };
  const [bg, cl] = map[label?.toLowerCase()] || ["#1A1A1A","#888"];
  return <span className="tag" style={{ background: bg, color: cl }}>{label}</span>;
}

const Card = ({ children, style = {}, className = "" }) => (
  <div className={`card ${className}`} style={{ padding: 24, ...style }}>{children}</div>
);

function Metric({ label, value, sub, color = "#6366F1", icon }) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</span>
        {icon && <span style={{ fontSize: 18, opacity: .6 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-1px", fontVariantNumeric: "tabular-nums" }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize: 12, color: "#555" }}>{sub}</div>}
    </Card>
  );
}

function Toast({ msg, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const colors = { success: "#4ADE80", error: "#F87171", info: "#60A5FA" };
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#161616", border: `1px solid ${colors[type]}44`, borderRadius: 10, padding: "12px 18px", maxWidth: 320, display: "flex", alignItems: "center", gap: 10, animation: "fadeUp .3s both", boxShadow: "0 8px 32px rgba(0,0,0,.5)" }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[type], flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: "#DDD", flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 16, padding: 0 }}>×</button>
    </div>
  );
}

function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#111", border: "1px solid #222", borderRadius: 14, width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto", animation: "fadeUp .25s both" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #1A1A1A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Mini Sparkline ───────────────────────────────────────────────────────────
function Spark({ data, color = "#6366F1", h = 50, w = 200 }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => typeof d === "object" ? (d.total || d.count || 0) : d);
  const max = Math.max(...vals), mn = Math.min(...vals) * .9;
  const pts = vals.map((v, i) => ({ x: (i / (vals.length - 1)) * w, y: h - ((v - mn) / (max - mn || 1)) * (h * .85) - h * .075 }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x},${h + 4} L0,${h + 4} Z`;
  const id = `sg${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: h }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard",    icon: "⊞", label: "Dashboard" },
  { id: "transactions", icon: "⇄", label: "Transactions" },
  { id: "reconcile",   icon: "◎", label: "Reconcile" },
  { id: "ledger",      icon: "≡", label: "Ledger" },
  { id: "tickets",     icon: "◫", label: "Tickets" },
  { id: "admin",       icon: "⚙", label: "Admin", adminOnly: true },
  { id: "settings",    icon: "◈", label: "Settings" },
];

function Sidebar({ tab, setTab, user, onLogout }) {
  return (
    <div style={{ width: 220, background: "#0D0D0D", borderRight: "1px solid #1A1A1A", display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>
      {/* Logo */}
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid #1A1A1A" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>R</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-.4px" }}>Reconciler</div>
            <div style={{ fontSize: 10, color: "#444", fontWeight: 500 }}>v3.0 · {user?.role}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {NAV.filter(n => !n.adminOnly || user?.role === "admin").map(n => (
          <button key={n.id} onClick={() => setTab(n.id)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: tab === n.id ? "rgba(99,102,241,.15)" : "transparent", border: tab === n.id ? "1px solid rgba(99,102,241,.25)" : "1px solid transparent", color: tab === n.id ? "#A5B4FC" : "#555", marginBottom: 2, transition: "all .15s", fontWeight: tab === n.id ? 600 : 400 }}
            onMouseEnter={e => { if (tab !== n.id) { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.color = "#888"; } }}
            onMouseLeave={e => { if (tab !== n.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#555"; } }}>
            <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{n.icon}</span>
            <span style={{ fontSize: 13 }}>{n.label}</span>
            {n.id === "reconcile" && <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#6366F1", animation: "pulse 2s infinite" }} />}
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: "14px", borderTop: "1px solid #1A1A1A" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 800, flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#DDD", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name || "User"}</div>
            <div style={{ fontSize: 10, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
          </div>
        </div>
        <button onClick={onLogout} className="btn-ghost" style={{ width: "100%", padding: "8px", fontSize: 12 }}>Sign out</button>
      </div>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ user }) {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.getSummary().catch(() => null),
      user?.role === "admin" ? API.getAdminAnalytics().catch(() => null) : Promise.resolve(null),
    ]).then(([s, a]) => { setSummary(s); setAnalytics(a); setLoading(false); });
  }, []);

  if (loading) return <PageShell title="Dashboard"><div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spinner size={32} /></div></PageShell>;

  const rate = analytics?.overview?.reconciliationRate ?? (summary ? Math.round(((summary.by_status?.matched || 0) / (summary.total || 1)) * 100) : 0);

  return (
    <PageShell title="Dashboard" sub={`Welcome back, ${user?.name?.split(" ")[0]} 👋`}>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <Metric icon="₹" label="Bank Balance"    value={fmt(summary?.bank_balance)}     color="#60A5FA" sub="Total bank transactions" />
        <Metric icon="⇄" label="Internal Balance" value={fmt(summary?.internal_balance)} color="#A78BFA" sub="Total internal records" />
        <Metric icon="△" label="Variance"         value={fmt(summary?.variance)}         color={Math.abs(summary?.variance || 0) < 1 ? "#4ADE80" : "#FCA5A5"} sub="Bank vs internal" />
        <Metric icon="%" label="Reconciled"       value={`${rate}%`} color="#4ADE80"     sub={`${summary?.by_status?.matched || 0} of ${summary?.total || 0} matched`} />
      </div>

      {/* Status breakdown + chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 14, marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, color: "#CCC" }}>Transaction Status</div>
          {["pending","matched","unmatched","exception","duplicate"].map(s => {
            const count = summary?.by_status?.[s] || 0;
            const pct   = summary?.total ? (count / summary.total) * 100 : 0;
            return (
              <div key={s} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Tag label={s} /><span style={{ fontSize: 12, color: "#777" }}>{count}</span></div>
                  <span style={{ fontSize: 11, color: "#555", fontFamily: "Geist Mono" }}>{pct.toFixed(1)}%</span>
                </div>
                <div style={{ height: 4, background: "#1A1A1A", borderRadius: 2 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: s === "matched" ? "#4ADE80" : s === "exception" ? "#FCD34D" : s === "unmatched" ? "#FCA5A5" : s === "duplicate" ? "#A78BFA" : "#555", borderRadius: 2, transition: "width .8s" }} />
                </div>
              </div>
            );
          })}
        </Card>

        {analytics && (
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#CCC" }}>Transaction Volume</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Last 30 days</div>
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#6366F1", letterSpacing: "-1px" }}>{analytics.overview?.totalTx ?? 0}</span>
            </div>
            <Spark data={analytics.volumeByDay || []} color="#6366F1" h={90} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 16 }}>
              {[
                { l: "Users",    v: analytics.overview?.totalUsers || 0,    c: "#A78BFA" },
                { l: "Tickets",  v: analytics.overview?.totalTickets || 0,  c: "#60A5FA" },
                { l: "Open",     v: analytics.overview?.openTickets || 0,   c: "#FCA5A5" },
              ].map(m => (
                <div key={m.l} style={{ background: "#0A0A0A", borderRadius: 8, padding: "10px 12px", border: "1px solid #1A1A1A" }}>
                  <div style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{m.l}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: m.c }}>{m.v}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Categories */}
      {summary?.by_category && Object.keys(summary.by_category).length > 0 && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: "#CCC" }}>Top Categories</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
            {Object.entries(summary.by_category).slice(0, 8).map(([cat, d]) => (
              <div key={cat} style={{ background: "#0A0A0A", borderRadius: 8, padding: "12px 14px", border: "1px solid #1A1A1A" }}>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4, fontWeight: 600, textTransform: "capitalize" }}>{cat}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#CCC", letterSpacing: "-.5px" }}>{fmt(d.total)}</div>
                <div style={{ fontSize: 10, color: "#555" }}>{d.count} transactions</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageShell>
  );
}

// ── Transactions ─────────────────────────────────────────────────────────────
function Transactions({ toast }) {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState({ date: "", description: "", amount: "", currency: "INR", reference: "", source: "bank", category: "" });
  const [importFile, setImportFile] = useState(null);
  const [importSource, setImportSource] = useState("bank");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setTxs(await API.getTransactions(filter)); }
    catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await API.createTransaction({ ...form, amount: parseFloat(form.amount) });
      toast("Transaction created"); setShowAdd(false);
      setForm({ date: "", description: "", amount: "", currency: "INR", reference: "", source: "bank", category: "" });
      load();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    try { await API.deleteTransaction(id); toast("Deleted"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setSaving(true);
    try {
      const r = await API.importCSV(importFile, importSource);
      toast(`Imported ${r.imported} transactions`); setShowImport(false); load();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <PageShell title="Transactions" sub={`${txs.length} records`}
      actions={
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowImport(true)}>↑ Import CSV</button>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowAdd(true)}>+ Add Transaction</button>
        </div>
      }>
      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {[
          { key: "source", opts: ["", "bank", "internal"], labels: ["All Sources", "Bank", "Internal"] },
          { key: "status", opts: ["", "pending", "matched", "unmatched", "exception", "duplicate"], labels: ["All Status", "Pending", "Matched", "Unmatched", "Exception", "Duplicate"] },
        ].map(f => (
          <select key={f.key} className="inp" style={{ width: "auto", padding: "8px 12px" }}
            value={filter[f.key] || ""}
            onChange={e => setFilter(p => ({ ...p, [f.key]: e.target.value || undefined }))}>
            {f.opts.map((o, i) => <option key={o} value={o}>{f.labels[i]}</option>)}
          </select>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 40, textAlign: "center" }}><Spinner /></div> : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>Date</th><th>Description</th><th>Source</th><th>Category</th><th>Reference</th><th className="mono" style={{ textAlign: "right" }}>Amount</th><th>Status</th><th /></tr></thead>
              <tbody>
                {txs.length === 0 ? <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#555" }}>No transactions found</td></tr> :
                  txs.map(t => (
                    <tr key={t._id}>
                      <td className="mono" style={{ color: "#888" }}>{t.date}</td>
                      <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</td>
                      <td><Tag label={t.source} /></td>
                      <td style={{ color: "#666" }}>{t.category || "—"}</td>
                      <td className="mono" style={{ color: "#555", fontSize: 12 }}>{t.reference || "—"}</td>
                      <td className="mono" style={{ textAlign: "right", color: t.amount >= 0 ? "#4ADE80" : "#FCA5A5", fontWeight: 600 }}>{t.currency} {t.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td><Tag label={t.status} /></td>
                      <td><button className="btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => handleDelete(t._id)}>Delete</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showAdd && (
        <Modal title="Add Transaction" onClose={() => setShowAdd(false)}>
          <div style={{ display: "grid", gap: 14 }}>
            {[
              { l: "Date", k: "date", type: "date" }, { l: "Description", k: "description" },
              { l: "Amount", k: "amount", type: "number" }, { l: "Currency", k: "currency" },
              { l: "Reference", k: "reference" }, { l: "Category", k: "category" },
            ].map(f => (
              <div key={f.k}><label>{f.l}</label><input className="inp" type={f.type || "text"} value={form[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} /></div>
            ))}
            <div>
              <label>Source</label>
              <select className="inp" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}>
                <option value="bank">Bank</option><option value="internal">Internal</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Create"}</button>
            </div>
          </div>
        </Modal>
      )}

      {showImport && (
        <Modal title="Import CSV" onClose={() => setShowImport(false)}>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ background: "#0A0A0A", borderRadius: 8, padding: 16, border: "1px solid #222", fontSize: 12, color: "#666", lineHeight: 1.7 }}>
              CSV must have columns: <span className="mono" style={{ color: "#A78BFA" }}>date, description, amount, currency, reference, category</span>
            </div>
            <div><label>Source</label>
              <select className="inp" value={importSource} onChange={e => setImportSource(e.target.value)}>
                <option value="bank">Bank</option><option value="internal">Internal</option>
              </select>
            </div>
            <div>
              <label>CSV File</label>
              <input type="file" accept=".csv" className="inp" style={{ padding: "8px" }} onChange={e => setImportFile(e.target.files[0])} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowImport(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleImport} disabled={saving || !importFile}>{saving ? "Importing…" : "Import"}</button>
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}

// ── Reconcile ─────────────────────────────────────────────────────────────────
function Reconcile({ toast }) {
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true); setResult(null);
    try { const r = await API.reconcile(); setResult(r); toast("Reconciliation complete!"); }
    catch (e) { toast(e.message, "error"); }
    finally { setRunning(false); }
  };

  return (
    <PageShell title="Reconciliation Engine" sub="Match bank ↔ internal transactions automatically">
      <div style={{ maxWidth: 700 }}>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#DDD", marginBottom: 4 }}>Run Reconciliation</div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>Compares all bank and internal transactions, matches by amount+reference, and flags exceptions.</div>
            </div>
            <button className="btn-primary" style={{ padding: "12px 28px", fontSize: 14, minWidth: 140 }} onClick={run} disabled={running}>
              {running ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Spinner size={14} color="#fff" />Running…</div> : "▶ Run now"}
            </button>
          </div>
        </Card>

        {result && (
          <div className="fi">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
              <Metric label="Matched"   value={result.matched   ?? 0} color="#4ADE80" icon="✓" />
              <Metric label="Unmatched" value={result.unmatched ?? 0} color="#FCA5A5" icon="✗" />
              <Metric label="Exceptions"value={result.exceptions?? 0} color="#FCD34D" icon="!" />
            </div>
            <Card>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#CCC", marginBottom: 14 }}>Summary</div>
              <pre style={{ fontFamily: "Geist Mono", fontSize: 12, color: "#555", background: "#0A0A0A", borderRadius: 8, padding: 16, overflow: "auto", border: "1px solid #1A1A1A" }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </Card>
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ── Ledger ────────────────────────────────────────────────────────────────────
function Ledger({ toast }) {
  const [source, setSource] = useState("bank");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    API.getLedger(source).then(setRows).catch(e => toast(e.message, "error")).finally(() => setLoading(false));
  }, [source]);

  return (
    <PageShell title="Ledger" sub="Running balance view"
      actions={
        <div style={{ display: "flex", gap: 6 }}>
          {["bank", "internal"].map(s => (
            <button key={s} onClick={() => setSource(s)}
              className={source === s ? "btn-primary" : "btn-ghost"}
              style={{ padding: "8px 16px", fontSize: 13 }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      }>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 40, textAlign: "center" }}><Spinner /></div> : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Description</th><th>Category</th><th>Ref</th>
                  <th className="mono" style={{ textAlign: "right" }}>Debit</th>
                  <th className="mono" style={{ textAlign: "right" }}>Credit</th>
                  <th className="mono" style={{ textAlign: "right" }}>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#555" }}>No entries found</td></tr> :
                  rows.map(r => (
                    <tr key={r.id}>
                      <td className="mono" style={{ color: "#888", fontSize: 12 }}>{r.date}</td>
                      <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</td>
                      <td style={{ color: "#666" }}>{r.category || "—"}</td>
                      <td className="mono" style={{ color: "#555", fontSize: 11 }}>{r.reference || "—"}</td>
                      <td className="mono" style={{ textAlign: "right", color: "#FCA5A5" }}>{r.debit ? r.debit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}</td>
                      <td className="mono" style={{ textAlign: "right", color: "#4ADE80" }}>{r.credit ? r.credit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}</td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: r.balance >= 0 ? "#DDD" : "#FCA5A5" }}>{r.balance?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td><Tag label={r.status} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageShell>
  );
}

// ── Tickets ───────────────────────────────────────────────────────────────────
function Tickets({ user, toast }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", category: "" });
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); API.getTickets().then(setTickets).catch(e => toast(e.message, "error")).finally(() => setLoading(false)); };
  useEffect(load, []);

  const create = async () => {
    setSaving(true);
    try { await API.createTicket(form); toast("Ticket created"); setShowNew(false); setForm({ title: "", description: "", priority: "medium", category: "" }); load(); }
    catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    setSaving(true);
    try {
      const updated = await API.updateTicket(selected._id, { comment });
      setSelected(updated); setComment(""); toast("Comment added");
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const changeStatus = async (id, status) => {
    try { await API.updateTicket(id, { status }); toast("Status updated"); load(); if (selected?._id === id) setSelected(t => ({ ...t, status })); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <PageShell title="Support Tickets" sub={`${tickets.length} tickets`}
      actions={<button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowNew(true)}>+ New Ticket</button>}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 40, textAlign: "center" }}><Spinner /></div> : (
          <table>
            <thead><tr><th>Title</th><th>Priority</th><th>Category</th><th>Status</th><th>Created</th><th /></tr></thead>
            <tbody>
              {tickets.length === 0 ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#555" }}>No tickets</td></tr> :
                tickets.map(t => (
                  <tr key={t._id} style={{ cursor: "pointer" }} onClick={() => setSelected(t)}>
                    <td style={{ fontWeight: 600, color: "#DDD" }}>{t.title}</td>
                    <td><Tag label={t.priority} /></td>
                    <td style={{ color: "#666" }}>{t.category || "—"}</td>
                    <td><Tag label={t.status} /></td>
                    <td style={{ color: "#555", fontSize: 12 }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td>
                      {user?.role === "admin" && (
                        <select className="inp" style={{ padding: "4px 8px", fontSize: 11, width: "auto" }}
                          value={t.status} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); changeStatus(t._id, e.target.value); }}>
                          {["open","in-progress","resolved","closed"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </Card>

      {showNew && (
        <Modal title="New Ticket" onClose={() => setShowNew(false)}>
          <div style={{ display: "grid", gap: 14 }}>
            <div><label>Title</label><input className="inp" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Describe the issue…" /></div>
            <div><label>Description</label><textarea className="inp" rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide more details…" style={{ resize: "vertical" }} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label>Priority</label>
                <select className="inp" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
              <div><label>Category</label><input className="inp" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. billing" /></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={create} disabled={saving}>{saving ? "Creating…" : "Create Ticket"}</button>
            </div>
          </div>
        </Modal>
      )}

      {selected && (
        <Modal title={`Ticket — ${selected.title}`} onClose={() => setSelected(null)} width={560}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag label={selected.status} /><Tag label={selected.priority} />
              {selected.category && <Tag label={selected.category} />}
            </div>
            <div style={{ background: "#0A0A0A", borderRadius: 8, padding: 14, fontSize: 13, color: "#888", lineHeight: 1.7, border: "1px solid #1A1A1A" }}>{selected.description}</div>
            {/* Comments */}
            {selected.comments?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".5px" }}>Comments ({selected.comments.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selected.comments.map((c, i) => (
                    <div key={i} style={{ background: "#0A0A0A", borderRadius: 8, padding: "10px 14px", border: "1px solid #1A1A1A" }}>
                      <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>{c.user?.name || "User"} · {new Date(c.createdAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: 13, color: "#AAA" }}>{c.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label>Add Comment</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="inp" value={comment} onChange={e => setComment(e.target.value)} placeholder="Write a comment…" onKeyDown={e => e.key === "Enter" && addComment()} />
                <button className="btn-primary" onClick={addComment} disabled={saving}>Post</button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}

// ── Admin ─────────────────────────────────────────────────────────────────────
function Admin({ toast }) {
  const [sub, setSub] = useState("users");
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [monitoring, setMonitoring] = useState(null);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.getAdminUsers().catch(() => []),
      API.getAdminAnalytics().catch(() => null),
      API.getMonitoring().catch(() => null),
      API.getAuditLog().catch(() => ({ logs: [] })),
    ]).then(([u, a, m, au]) => { setUsers(u); setAnalytics(a); setMonitoring(m); setAudit(au.logs || []); setLoading(false); });
  }, []);

  const toggleRole = async (id, role) => {
    try { const u = await API.updateAdminUser(id, { role }); setUsers(p => p.map(x => x._id === id ? { ...x, role: u.role } : x)); toast("Role updated"); }
    catch (e) { toast(e.message, "error"); }
  };

  const delUser = async (id) => {
    if (!confirm("Delete user and all their data?")) return;
    try { await API.deleteAdminUser(id); setUsers(p => p.filter(x => x._id !== id)); toast("User deleted"); }
    catch (e) { toast(e.message, "error"); }
  };

  const TABS = [{ id: "users", l: "Users" }, { id: "analytics", l: "Analytics" }, { id: "monitoring", l: "Monitoring" }, { id: "audit", l: "Audit Log" }];

  return (
    <PageShell title="Admin Panel" sub="Platform management">
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {TABS.map(t => <button key={t.id} onClick={() => setSub(t.id)} className={sub === t.id ? "btn-primary" : "btn-ghost"} style={{ padding: "8px 16px", fontSize: 13 }}>{t.l}</button>)}
      </div>

      {loading ? <div style={{ padding: 60, textAlign: "center" }}><Spinner size={28} /></div> : <>
        {sub === "users" && (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Transactions</th><th>Joined</th><th /></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ color: "#666", fontSize: 12 }}>{u.email}</td>
                    <td>
                      <select className="inp" style={{ padding: "4px 8px", fontSize: 11, width: "auto" }} value={u.role} onChange={e => toggleRole(u._id, e.target.value)}>
                        <option>admin</option><option>member</option><option>viewer</option>
                      </select>
                    </td>
                    <td style={{ color: "#666" }}>{u.txCount}</td>
                    <td style={{ color: "#555", fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td><button className="btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => delUser(u._id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {sub === "analytics" && analytics && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
              <Metric label="Total Users" value={analytics.overview?.totalUsers} color="#A78BFA" />
              <Metric label="Transactions" value={analytics.overview?.totalTx} color="#60A5FA" />
              <Metric label="Reconciled %" value={`${analytics.overview?.reconciliationRate}%`} color="#4ADE80" />
              <Metric label="Open Tickets" value={analytics.overview?.openTickets} color="#FCD34D" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Card><div style={{ fontSize: 13, fontWeight: 700, color: "#CCC", marginBottom: 12 }}>Transaction Volume (30d)</div><Spark data={analytics.volumeByDay} color="#6366F1" h={100} /></Card>
              <Card><div style={{ fontSize: 13, fontWeight: 700, color: "#CCC", marginBottom: 12 }}>User Growth (30d)</div><Spark data={analytics.userGrowth} color="#4ADE80" h={100} /></Card>
            </div>
          </div>
        )}

        {sub === "monitoring" && monitoring && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
              <Metric label="Status"    value={monitoring.status}     color="#4ADE80" />
              <Metric label="Uptime"    value={`${Math.round(monitoring.uptime / 3600)}h`} color="#60A5FA" />
              <Metric label="Heap Used" value={`${monitoring.memory?.used}MB`} color="#FCD34D" />
              <Metric label="TX 24h"    value={monitoring.activity?.txLast24h} color="#A78BFA" />
            </div>
            <Card>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#CCC", marginBottom: 14 }}>Recent Errors ({monitoring.recentErrors?.length || 0})</div>
              {monitoring.recentErrors?.length === 0 ? <div style={{ color: "#4ADE80", fontSize: 13 }}>✓ No recent errors</div> :
                monitoring.recentErrors?.map((e, i) => <div key={i} style={{ fontFamily: "Geist Mono", fontSize: 11, color: "#FCA5A5", marginBottom: 6 }}>{JSON.stringify(e)}</div>)}
            </Card>
          </div>
        )}

        {sub === "audit" && (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <table>
              <thead><tr><th>User</th><th>Action</th><th>Entity</th><th>Timestamp</th></tr></thead>
              <tbody>
                {audit.length === 0 ? <tr><td colSpan={4} style={{ textAlign: "center", padding: 40, color: "#555" }}>No audit logs</td></tr> :
                  audit.map(a => (
                    <tr key={a._id}>
                      <td>{a.user?.name || "System"}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{a.action}</td>
                      <td style={{ color: "#666" }}>{a.entityType} {a.entityId ? `#${a.entityId.toString().slice(-6)}` : ""}</td>
                      <td style={{ color: "#555", fontSize: 12 }}>{new Date(a.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        )}
      </>}
    </PageShell>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
function Settings({ user, setUser, toast }) {
  const [name, setName] = useState(user?.name || "");
  const [currency, setCurrency] = useState(user?.currency || "USD");
  const [cur, setCur] = useState(""); const [np, setNp] = useState("");
  const [saving, setSaving] = useState(false); const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try { const u = await API.updateProfile({ name, currency }); setUser(p => ({ ...p, ...u })); toast("Profile updated"); }
    catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const changePw = async () => {
    setSavingPw(true);
    try { await API.changePassword(cur, np); toast("Password changed"); setCur(""); setNp(""); }
    catch (e) { toast(e.message, "error"); }
    finally { setSavingPw(false); }
  };

  return (
    <PageShell title="Settings">
      <div style={{ maxWidth: 560, display: "grid", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#CCC", marginBottom: 20 }}>Profile</div>
          <div style={{ display: "grid", gap: 14 }}>
            <div><label>Full Name</label><input className="inp" value={name} onChange={e => setName(e.target.value)} /></div>
            <div><label>Email</label><input className="inp" value={user?.email || ""} disabled style={{ opacity: .5 }} /></div>
            <div><label>Currency</label>
              <select className="inp" value={currency} onChange={e => setCurrency(e.target.value)}>
                {["USD","INR","EUR","GBP","AED","SGD"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button className="btn-primary" style={{ width: "fit-content" }} onClick={saveProfile} disabled={saving}>{saving ? "Saving…" : "Save Profile"}</button>
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#CCC", marginBottom: 20 }}>Change Password</div>
          <div style={{ display: "grid", gap: 14 }}>
            <div><label>Current Password</label><input className="inp" type="password" value={cur} onChange={e => setCur(e.target.value)} /></div>
            <div><label>New Password</label><input className="inp" type="password" value={np} onChange={e => setNp(e.target.value)} /></div>
            <button className="btn-primary" style={{ width: "fit-content" }} onClick={changePw} disabled={savingPw}>{savingPw ? "Updating…" : "Update Password"}</button>
          </div>
        </Card>
        <Card style={{ padding: "18px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#DDD" }}>API Base URL</div>
              <div className="mono" style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{import.meta.env.VITE_API_URL || "http://localhost:5000"}</div>
            </div>
            <Tag label="connected" />
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

// ── Page Shell ────────────────────────────────────────────────────────────────
function PageShell({ title, sub, actions, children }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #1A1A1A", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.5px" }}>{title}</h1>
          {sub && <div style={{ fontSize: 13, color: "#555", marginTop: 3 }}>{sub}</div>}
        </div>
        {actions}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>{children}</div>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
function AppShell({ user, setUser }) {
  const [tab, setTab] = useState("dashboard");
  const [toasts, setToasts] = useState([]);
  const toast = (msg, type = "success") => setToasts(p => [...p, { id: Date.now(), msg, type }]);
  const logout = () => { localStorage.removeItem("rec_token"); setUser(null); };
  const props = { user, toast };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar tab={tab} setTab={setTab} user={user} onLogout={logout} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {tab === "dashboard"    && <Dashboard   {...props} />}
        {tab === "transactions" && <Transactions {...props} />}
        {tab === "reconcile"   && <Reconcile   {...props} />}
        {tab === "ledger"      && <Ledger      {...props} />}
        {tab === "tickets"     && <Tickets     {...props} />}
        {tab === "admin"       && user?.role === "admin" && <Admin {...props} />}
        {tab === "settings"    && <Settings    {...props} setUser={setUser} />}
      </div>
      {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />)}
    </div>
  );
}

// ── Auth Forms ────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      const r = mode === "login"
        ? await API.login(form.email, form.password)
        : await API.register(form.name, form.email, form.password);
      localStorage.setItem("rec_token", r.token);
      onLogin(r.user);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0A", padding: 16, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "20%", left: "30%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.08) 0%,transparent 70%)", pointerEvents: "none", animation: "blob 18s ease-in-out infinite" }} />
      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }} className="fu0">
          <div style={{ width: 52, height: 52, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 8px 24px rgba(99,102,241,.4)", animation: "glow 3s ease-in-out infinite" }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>R</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-1px" }}>Reconciler</div>
          <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>Financial transaction reconciliation platform</div>
        </div>

        <div style={{ background: "#111", border: "1px solid #1F1F1F", borderRadius: 16, padding: 32, boxShadow: "0 24px 80px rgba(0,0,0,.6)" }} className="fu1">
          {/* Toggle */}
          <div style={{ display: "flex", background: "#0A0A0A", borderRadius: 8, padding: 3, marginBottom: 24 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ flex: 1, padding: "8px", borderRadius: 6, border: "none", background: mode === m ? "#1F1F1F" : "transparent", color: mode === m ? "#DDD" : "#555", fontSize: 13, fontWeight: mode === m ? 600 : 400, transition: "all .2s" }}>
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {mode === "register" && (
              <div><label>Full Name</label><input className="inp" placeholder="Sarah Kim" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            )}
            <div><label>Email</label><input className="inp" type="email" placeholder="you@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div><label>Password</label><input className="inp" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && submit()} /></div>

            {err && <div style={{ background: "#1F0A0A", border: "1px solid #3A1515", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#FCA5A5" }}>{err}</div>}

            <button className="btn-primary" style={{ padding: "13px", fontSize: 15, marginTop: 4 }} onClick={submit} disabled={loading}>
              {loading ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Spinner size={16} color="#fff" />{mode === "login" ? "Signing in…" : "Creating account…"}</div>
                : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────
function Landing({ onEnter }) {
  const [scrolled, setScrolled] = useState(false);
  const [pct, setPct] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const fn = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setPct((window.scrollY / h) * 100);
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const FEATS = [
    { icon: "⇄", title: "Smart Matching", desc: "Automatically matches bank transactions with internal records by amount, reference and date. Sub-second reconciliation." },
    { icon: "↑", title: "CSV Bulk Import", desc: "Upload thousands of transactions at once from any bank CSV format. Intelligent field detection." },
    { icon: "≡", title: "Running Ledger", desc: "Real-time running balance ledger view with debit/credit columns and transaction status at a glance." },
    { icon: "◎", title: "Exception Engine", desc: "Automatically flags duplicates, unmatched items and anomalies. Never miss a discrepancy again." },
    { icon: "↗", title: "Live Analytics", desc: "Platform-wide analytics dashboard for admins — volume trends, user growth, reconciliation rates." },
    { icon: "◫", title: "Support Tickets", desc: "Built-in ticket system for users to raise issues. Admin assignment, comments, and status tracking." },
  ];

  const STEPS = [
    { n: "01", title: "Import Transactions", desc: "Upload CSV from your bank and internal system, or add transactions manually via the API." },
    { n: "02", title: "Run Reconciliation", desc: "One click — the engine matches, flags exceptions, detects duplicates, and generates a full report." },
    { n: "03", title: "Review & Resolve", desc: "Review the ledger, respond to exceptions via tickets, and export a clean reconciliation summary." },
  ];

  return (
    <div style={{ background: "#0A0A0A", color: "#FAFAFA", overflowX: "hidden", fontFamily: "Geist, sans-serif" }}>
      {/* Scroll bar */}
      <div style={{ position: "fixed", top: 0, left: 0, zIndex: 2000, height: 2, width: `${pct}%`, background: "linear-gradient(90deg,#6366F1,#8B5CF6)", transition: "width .1s" }} />

      {/* Nav */}
      <nav style={{ position: "fixed", top: 2, left: 0, right: 0, zIndex: 100, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6%", background: scrolled ? "rgba(10,10,10,.9)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid #1A1A1A" : "none", transition: "all .35s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>R</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-.4px" }}>Reconciler</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={{ background: "transparent", color: "#888", border: "none", fontSize: 14, fontWeight: 500 }} onClick={onEnter}>Sign in</button>
          <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 13 }} onClick={onEnter}>Get started →</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "100px 6% 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(99,102,241,.06) 1px, transparent 1px)", backgroundSize: "40px 40px", maskImage: "radial-gradient(ellipse 70% 70% at 50% 40%, black 30%, transparent 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "10%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.1) 0%,transparent 70%)", animation: "blob 14s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.06) 0%,transparent 70%)", animation: "blob 20s 3s ease-in-out infinite", pointerEvents: "none" }} />

        <div style={{ maxWidth: 780, position: "relative", zIndex: 1 }}>
          <div className="fu0" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#111", border: "1px solid #2A2A2A", borderRadius: 100, padding: "5px 14px 5px 8px", marginBottom: 28 }}>
            <div style={{ width: 20, height: 20, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>✦</div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>Financial reconciliation · API v3.0</span>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ADE80", animation: "pulse 2.5s infinite" }} />
          </div>

          <h1 className="fu1" style={{ fontSize: "clamp(40px,6vw,80px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-4px", marginBottom: 24 }}>
            Bank ↔ Internal.<br />
            <span style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6,#A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Reconciled.</span>
          </h1>

          <p className="fu2" style={{ fontSize: 18, color: "#666", lineHeight: 1.7, maxWidth: 540, marginBottom: 40, letterSpacing: "-.2px" }}>
            The engine that matches thousands of transactions in seconds, flags every exception, and gives your finance team a single source of truth.
          </p>

          <div className="fu3" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn-primary" style={{ padding: "14px 28px", fontSize: 15 }} onClick={onEnter}>Start reconciling →</button>
            <button style={{ display: "flex", alignItems: "center", gap: 8, background: "#111", color: "#DDD", border: "1px solid #2A2A2A", borderRadius: 8, padding: "13px 22px", fontSize: 15, fontWeight: 500, transition: "all .2s" }}
              onClick={() => setShowVideo(true)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366F1"; e.currentTarget.style.color = "#A5B4FC"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#2A2A2A"; e.currentTarget.style.color = "#DDD"; }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: "#fff", marginLeft: 2 }}>▶</span>
              </div>
              Watch demo
            </button>
          </div>

          <div className="fu4" style={{ display: "flex", gap: 32, marginTop: 48, paddingTop: 32, borderTop: "1px solid #1A1A1A", flexWrap: "wrap" }}>
            {[["∞", "Transactions matched"], ["< 1s", "Reconciliation speed"], ["100%", "Audit trail coverage"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#A5B4FC", letterSpacing: "-1px" }}>{v}</div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div style={{ overflow: "hidden", borderTop: "1px solid #1A1A1A", borderBottom: "1px solid #1A1A1A", background: "#0D0D0D", padding: "12px 0" }}>
        <div style={{ animation: "marq 25s linear infinite", whiteSpace: "nowrap", display: "inline-block" }}>
          {[1, 2, 3].map(k => <span key={k} style={{ fontSize: 12, fontWeight: 600, color: "#333", letterSpacing: ".5px", paddingRight: 0 }}>CSV Import · Bank Reconciliation · Exception Flagging · Ledger View · Audit Logs · Role-based Access · Real-time Analytics · Ticket Management · </span>)}
        </div>
      </div>

      {/* Video Demo Section */}
      <section style={{ padding: "100px 6%", textAlign: "center" }}>
        <div className="reveal" style={{ marginBottom: 14, display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.2)", borderRadius: 100, padding: "5px 14px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366F1" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: ".5px" }}>Product Demo</span>
        </div>
        <h2 className="reveal rd1" style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-2.5px", marginBottom: 16 }}>
          See it in action
        </h2>
        <p className="reveal rd2" style={{ fontSize: 16, color: "#555", marginBottom: 48, maxWidth: 480, margin: "0 auto 48px" }}>
          Watch how Reconciler processes a real CSV import, runs the matching engine, and generates a full reconciliation report in under 30 seconds.
        </p>

        {/* Animated Demo Player */}
        <div className="reveal rd3">
          <DemoPlayer />
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button className="btn-primary" style={{ padding: "12px 28px", fontSize: 14 }} onClick={onEnter}>Try it live — it's free →</button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 6%", background: "#0D0D0D" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 className="reveal" style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-2.5px", marginBottom: 14 }}>
              Everything your finance team needs.
            </h2>
            <p className="reveal rd1" style={{ fontSize: 16, color: "#555", maxWidth: 440, margin: "0 auto" }}>Purpose-built for reconciliation. Every feature earns its place.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {FEATS.map((f, i) => (
              <div key={f.title} className={`reveal rd${(i % 4) + 1}`} style={{ background: "#111", border: "1px solid #1A1A1A", borderRadius: 14, padding: "26px", transition: "all .3s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366F155"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(99,102,241,.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1A1A1A"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ width: 40, height: 40, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 18 }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: "#DDD" }}>{f.title}</div>
                <div style={{ fontSize: 13.5, color: "#555", lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "100px 6%" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 className="reveal" style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, letterSpacing: "-2.5px" }}>How it works</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, position: "relative" }}>
            <div style={{ position: "absolute", top: "30%", left: "16.6%", right: "16.6%", height: 1, background: "linear-gradient(90deg,transparent,#2A2A2A,#6366F1,#2A2A2A,transparent)", pointerEvents: "none" }} />
            {STEPS.map((s, i) => (
              <div key={s.n} className={`reveal rd${i + 1}`} style={{ background: "#111", border: "1px solid #1A1A1A", borderRadius: 14, padding: "28px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontFamily: "Geist Mono", color: "#6366F1", fontWeight: 700, marginBottom: 14 }}>{s.n}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#DDD", marginBottom: 10 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "90px 6%", background: "#0D0D0D", textAlign: "center" }}>
        <div className="reveal" style={{ width: 56, height: 56, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 24, fontWeight: 800, color: "#fff", boxShadow: "0 8px 32px rgba(99,102,241,.4)", animation: "glow 3s ease-in-out infinite" }}>R</div>
        <h2 className="reveal rd1" style={{ fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, letterSpacing: "-3px", marginBottom: 16 }}>Start reconciling today.</h2>
        <p className="reveal rd2" style={{ fontSize: 16, color: "#555", marginBottom: 36, maxWidth: 380, margin: "0 auto 36px" }}>Free to start. No credit card. Deploy in minutes on your own infrastructure.</p>
        <div className="reveal rd3" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="btn-primary" style={{ padding: "14px 32px", fontSize: 15 }} onClick={onEnter}>Get started free →</button>
          <button className="btn-ghost" style={{ padding: "13px 24px", fontSize: 14 }} onClick={() => setShowVideo(true)}>Watch demo</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "48px 6% 28px", borderTop: "1px solid #1A1A1A" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>R</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Reconciler</span>
          </div>
          <div style={{ display: "flex", gap: 28 }}>
            {["Product", "API Docs", "Pricing", "Support"].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: "#555", transition: "color .2s" }}
                onMouseEnter={e => e.target.style.color = "#DDD"} onMouseLeave={e => e.target.style.color = "#555"}>{l}</a>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#333" }}>© 2025 Reconciler. All rights reserved.</div>
        </div>
      </footer>

      {/* Full Demo Modal */}
      {showVideo && (
        <div style={{ position: "fixed", inset: 0, zIndex: 5000, background: "rgba(0,0,0,.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => e.target === e.currentTarget && setShowVideo(false)}>
          <div style={{ width: "100%", maxWidth: 960, animation: "fadeUp .3s both" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button onClick={() => setShowVideo(false)} style={{ background: "#1A1A1A", border: "1px solid #333", borderRadius: 8, color: "#888", padding: "6px 14px", fontSize: 13 }}>✕ Close</button>
            </div>
            <DemoPlayer />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return "—";
  return (n < 0 ? "-" : "") + "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  useGlobalStyles();
  const [screen, setScreen] = useState("landing"); // landing | auth | app
  const [user, setUser] = useState(null);

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem("rec_token");
    if (token) {
      API.getMe().then(u => { setUser(u); setScreen("app"); }).catch(() => localStorage.removeItem("rec_token"));
    }
  }, []);

  if (screen === "landing") return <Landing onEnter={() => setScreen("auth")} />;
  if (screen === "auth")    return <AuthPage onLogin={u => { setUser(u); setScreen("app"); }} />;
  return <AppShell user={user} setUser={setUser} />;
}
