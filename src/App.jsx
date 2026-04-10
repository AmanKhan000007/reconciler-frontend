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
       body { font-family: 'Geist', sans-serif; background: #FFFFFF; color: #111827; overflow-x: hidden; }
       ::-webkit-scrollbar { width: 5px; height: 5px; }
       ::-webkit-scrollbar-track { background: #F9FAFB; }
       ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
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
       @keyframes glow     { 0%,100%{box-shadow:0 0 20px rgba(239,68,68,.2);} 50%{box-shadow:0 0 40px rgba(239,68,68,.4);} }
 
       .fu0{animation:fadeUp .7s .00s both} .fu1{animation:fadeUp .7s .08s both} .fu2{animation:fadeUp .7s .16s both}
       .fu3{animation:fadeUp .7s .24s both} .fu4{animation:fadeUp .7s .34s both} .fu5{animation:fadeUp .7s .44s both}
       .fi {animation:fadeIn .4s both}
       .reveal { opacity:0; transform:translateY(20px); transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
       .reveal.vis { opacity:1; transform:none; }
       .rd1{transition-delay:.06s} .rd2{transition-delay:.12s} .rd3{transition-delay:.18s} .rd4{transition-delay:.24s}
 
       .card { background:#FFFFFF; border:1px solid #E5E7EB; border-radius:12px; transition: all .2s; }
       .card:hover { border-color:#D1D5DB; }
       .btn-primary { background:#EF4444; color:#fff; border:none; border-radius:8px; padding:10px 20px; font-size:14px; font-weight:600; transition: all .2s; }
       .btn-primary:hover { background:#DC2626; transform:translateY(-1px); box-shadow:0 4px 16px rgba(239,68,68,.3); }
       .btn-ghost  { background:transparent; color:#6B7280; border:1px solid #E5E7EB; border-radius:8px; padding:10px 18px; font-size:14px; font-weight:500; transition: all .2s; }
       .btn-ghost:hover { color:#111827; border-color:#D1D5DB; background:#F9FAFB; }
       .btn-danger { background:transparent; color:#DC2626; border:1px solid #FEE2E2; border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; transition: all .2s; }
       .btn-danger:hover { background:#FEF2F2; }
       .inp { background:#F9FAFB; border:1px solid #E5E7EB; border-radius:8px; padding:10px 12px; font-size:14px; color:#111827; outline:none; width:100%; transition: border .2s; }
       .inp:focus { border-color:#EF4444; box-shadow:0 0 0 3px rgba(239,68,68,.1); }
       .inp::placeholder { color:#9CA3AF; }
       label { font-size:12px; font-weight:600; color:#6B7280; text-transform:uppercase; letter-spacing:.5px; display:block; margin-bottom:6px; }
       table { width:100%; border-collapse:collapse; font-size:13px; }
       th { text-align:left; padding:10px 14px; color:#9CA3AF; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; border-bottom:1px solid #E5E7EB; }
       td { padding:11px 14px; border-bottom:1px solid #F3F4F6; color:#4B5563; vertical-align:middle; }
       tr:hover td { background:rgba(0,0,0,.01); }
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
 const Spinner = ({ size = 18, color = "#EF4444" }) => (
   <div style={{ width: size, height: size, border: `2px solid ${color}22`, borderTopColor: color, borderRadius: "50%", animation: "spin .8s linear infinite", flexShrink: 0 }} />
 );
 
 function Tag({ label, color }) {
   const map = {
     matched:   ["#F0FDF4","#16A34A"], pending:   ["#F3F4F6","#6B7280"],
     unmatched: ["#FEF2F2","#DC2626"], exception: ["#FFFBEB","#D97706"],
     duplicate: ["#F5F3FF","#7C3AED"], open:      ["#EFF6FF","#2563EB"],
     closed:    ["#F0FDF4","#16A34A"], resolved:  ["#F0FDF4","#16A34A"],
     "in-progress":["#FFFBEB","#D97706"],
     admin:     ["#F5F3FF","#7C3AED"], member: ["#F3F4F6","#6B7280"], viewer: ["#F3F4F6","#9CA3AF"],
     bank:      ["#EFF6FF","#2563EB"], internal: ["#F5F3FF","#7C3AED"],
     low:       ["#F0FDF4","#16A34A"], medium: ["#FFFBEB","#D97706"], high: ["#FEF2F2","#DC2626"],
     healthy:   ["#F0FDF4","#16A34A"],
     connected: ["#F0FDF4","#16A34A"],
   };
   const [bg, cl] = map[label?.toLowerCase()] || ["#F3F4F6","#6B7280"];
   return <span className="tag" style={{ background: bg, color: cl }}>{label}</span>;
 }
 
 const Card = ({ children, style = {}, className = "" }) => (
   <div className={`card ${className}`} style={{ padding: 24, ...style }}>{children}</div>
 );
 
 function Metric({ label, value, sub, color = "#EF4444", icon }) {
   return (
     <Card style={{ display: "flex", flexDirection: "column", gap: 8 }}>
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
         <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</span>
         {icon && <span style={{ fontSize: 18, opacity: .5 }}>{icon}</span>}
       </div>
       <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-1px", fontVariantNumeric: "tabular-nums" }}>{value ?? "—"}</div>
       {sub && <div style={{ fontSize: 12, color: "#9CA3AF" }}>{sub}</div>}
     </Card>
   );
 }
 
 function Toast({ msg, type = "success", onClose }) {
   useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
   const colors = { success: "#16A34A", error: "#DC2626", info: "#2563EB" };
   return (
     <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#FFFFFF", border: `1px solid ${colors[type]}33`, borderRadius: 10, padding: "12px 18px", maxWidth: 320, display: "flex", alignItems: "center", gap: 10, animation: "fadeUp .3s both", boxShadow: "0 8px 32px rgba(0,0,0,.1)" }}>
       <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[type], flexShrink: 0 }} />
       <span style={{ fontSize: 13, color: "#374151", flex: 1 }}>{msg}</span>
       <button onClick={onClose} style={{ background: "none", border: "none", color: "#9CA3AF", fontSize: 16, padding: 0 }}>×</button>
     </div>
   );
 }
 
 function Modal({ title, onClose, children, width = 480 }) {
   return (
     <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
       <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14, width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto", animation: "fadeUp .25s both", boxShadow: "0 24px 80px rgba(0,0,0,.15)" }}>
         <div style={{ padding: "18px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
           <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{title}</span>
           <button onClick={onClose} style={{ background: "none", border: "none", color: "#9CA3AF", fontSize: 20, lineHeight: 1 }}>×</button>
         </div>
         <div style={{ padding: 24 }}>{children}</div>
       </div>
     </div>
   );
 }
 
 // ── Mini Sparkline ───────────────────────────────────────────────────────────
 function Spark({ data, color = "#EF4444", h = 50, w = 200 }) {
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
           <stop offset="0%" stopColor={color} stopOpacity=".15" />
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
   { id: "team",         icon: "◉", label: "Team" },
   { id: "ledger",      icon: "≡", label: "Ledger" },
   { id: "tickets",     icon: "◫", label: "Tickets" },
   { id: "admin",       icon: "⚙", label: "Admin", adminOnly: true },
   { id: "settings",    icon: "◈", label: "Settings" },
 ];
 
 function Sidebar({ tab, setTab, user, onLogout }) {
   return (
     <div style={{ width: 220, background: "#FFFFFF", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>
       {/* Logo */}
       <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid #E5E7EB" }}>
         <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
           <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#EF4444,#F87171)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
             <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>R</span>
           </div>
           <div>
             <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", letterSpacing: "-.4px" }}>Relay</div>
             <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>v3.0 · {user?.role}</div>
           </div>
         </div>
       </div>
 
       {/* Nav */}
       <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
         {NAV.filter(n => !n.adminOnly || user?.role === "admin").map(n => (
           <button key={n.id} onClick={() => setTab(n.id)}
             style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: tab === n.id ? "rgba(239,68,68,.06)" : "transparent", border: tab === n.id ? "1px solid rgba(239,68,68,.15)" : "1px solid transparent", color: tab === n.id ? "#EF4444" : "#6B7280", marginBottom: 2, transition: "all .15s", fontWeight: tab === n.id ? 600 : 400 }}
             onMouseEnter={e => { if (tab !== n.id) { e.currentTarget.style.background = "rgba(0,0,0,.02)"; e.currentTarget.style.color = "#374151"; } }}
             onMouseLeave={e => { if (tab !== n.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; } }}>
             <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{n.icon}</span>
             <span style={{ fontSize: 13 }}>{n.label}</span>
             {n.id === "reconcile" && <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#EF4444", animation: "pulse 2s infinite" }} />}
           </button>
         ))}
       </nav>
 
       {/* User */}
       <div style={{ padding: "14px", borderTop: "1px solid #E5E7EB" }}>
         <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
           <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#EF4444,#F87171)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 800, flexShrink: 0 }}>
             {user?.name?.[0]?.toUpperCase() || "U"}
           </div>
           <div style={{ flex: 1, minWidth: 0 }}>
             <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name || "User"}</div>
             <div style={{ fontSize: 10, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
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
     <PageShell title="Dashboard" sub={`Welcome back, ${user?.name?.split(" ")[0]}`}>
       {/* KPI row */}
       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
         <Metric icon="$" label="Bank Balance"    value={fmt(summary?.bank_balance)}     color="#2563EB" sub="Total bank transactions" />
         <Metric icon="⇄" label="Internal Balance" value={fmt(summary?.internal_balance)} color="#7C3AED" sub="Total internal records" />
         <Metric icon="△" label="Variance"         value={fmt(summary?.variance)}         color={Math.abs(summary?.variance || 0) < 1 ? "#16A34A" : "#DC2626"} sub="Bank vs internal" />
         <Metric icon="%" label="Reconciled"       value={`${rate}%`} color="#16A34A"     sub={`${summary?.by_status?.matched || 0} of ${summary?.total || 0} matched`} />
       </div>
 
       {/* Status breakdown + chart */}
       <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 14, marginBottom: 20 }}>
         <Card>
           <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, color: "#374151" }}>Transaction Status</div>
           {["pending","matched","unmatched","exception","duplicate"].map(s => {
             const count = summary?.by_status?.[s] || 0;
             const pct   = summary?.total ? (count / summary.total) * 100 : 0;
             return (
               <div key={s} style={{ marginBottom: 14 }}>
                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                   <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Tag label={s} /><span style={{ fontSize: 12, color: "#6B7280" }}>{count}</span></div>
                   <span style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "Geist Mono" }}>{pct.toFixed(1)}%</span>
                 </div>
                 <div style={{ height: 4, background: "#F3F4F6", borderRadius: 2 }}>
                   <div style={{ width: `${pct}%`, height: "100%", background: s === "matched" ? "#16A34A" : s === "exception" ? "#D97706" : s === "unmatched" ? "#DC2626" : s === "duplicate" ? "#7C3AED" : "#9CA3AF", borderRadius: 2, transition: "width .8s" }} />
                 </div>
               </div>
             );
           })}
         </Card>
 
         {analytics && (
           <Card>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
               <div>
                 <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Transaction Volume</div>
                 <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Last 30 days</div>
               </div>
               <span style={{ fontSize: 22, fontWeight: 800, color: "#EF4444", letterSpacing: "-1px" }}>{analytics.overview?.totalTx ?? 0}</span>
             </div>
             <Spark data={analytics.volumeByDay || []} color="#EF4444" h={90} />
             <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 16 }}>
               {[
                 { l: "Users",    v: analytics.overview?.totalUsers || 0,    c: "#7C3AED" },
                 { l: "Tickets",  v: analytics.overview?.totalTickets || 0,  c: "#2563EB" },
                 { l: "Open",     v: analytics.overview?.openTickets || 0,   c: "#DC2626" },
               ].map(m => (
                 <div key={m.l} style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px", border: "1px solid #E5E7EB" }}>
                   <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{m.l}</div>
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
           <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: "#374151" }}>Top Categories</div>
           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
             {Object.entries(summary.by_category).slice(0, 8).map(([cat, d]) => (
               <div key={cat} style={{ background: "#F9FAFB", borderRadius: 8, padding: "12px 14px", border: "1px solid #E5E7EB" }}>
                 <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4, fontWeight: 600, textTransform: "capitalize" }}>{cat}</div>
                 <div style={{ fontSize: 17, fontWeight: 800, color: "#1F2937", letterSpacing: "-.5px" }}>{fmt(d.total)}</div>
                 <div style={{ fontSize: 10, color: "#9CA3AF" }}>{d.count} transactions</div>
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
   const [form, setForm] = useState({ date: "", description: "", amount: "", currency: "USD", reference: "", source: "bank", category: "" });
   const [importFile, setImportFile] = useState(null);
   const [importSource, setImportSource] = useState("bank");
   const [saving, setSaving] = useState(false);
   const [editingTx, setEditingTx] = useState(null);
   const [editForm, setEditForm] = useState({ category: "", note: "" });
 
   const load = useCallback(async () => {
     setLoading(true);
     try { setTxs(await API.getTransactions(filter)); }
     catch (e) { toast(e.message, "error"); }
     finally { setLoading(false); }
   }, [filter,toast]);
 
   useEffect(() => { load(); }, [load]);
 
   const handleAdd = async () => {
     setSaving(true);
     try {
       await API.createTransaction({ ...form, amount: parseFloat(form.amount) });
       toast("Transaction created"); setShowAdd(false);
       setForm({ date: "", description: "", amount: "", currency: "USD", reference: "", source: "bank", category: "" });
       load();
     } catch (e) { toast(e.message, "error"); }
     finally { setSaving(false); }
   };
 
  const handleDelete = async (id) => {
     if (!confirm("Delete this transaction?")) return;
     try { await API.deleteTransaction(id); toast("Deleted"); load(); }
     catch (e) { toast(e.message, "error"); }
   };
   
   const openEdit = (tx) => {
    setEditingTx(tx);
    setEditForm({ category: tx.category || "", note: tx.note || "" });
  };

  const handleUpdate = async () => {
    if (!editingTx?._id) return;
    setSaving(true);
    try {
      await API.updateTransaction(editingTx._id, { category: editForm.category, note: editForm.note });
      toast("Transaction updated");
      setEditingTx(null);
      load();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
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
               <thead><tr><th>Date</th><th>Description</th><th>Source</th><th>Category</th><th>Reference</th><th className="mono" style={{ textAlign: "right" }}>Amount</th><th>Status</th><th>Actions</th><th /></tr></thead>
               <tbody>
                 {txs.length === 0 ? <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>No transactions found</td></tr> :
                   txs.map(t => (
                     <tr key={t._id}>
                       <td className="mono" style={{ color: "#6B7280" }}>{t.date}</td>
                       <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</td>
                       <td><Tag label={t.source} /></td>
                       <td style={{ color: "#6B7280" }}>{t.category || "—"}</td>
                       <td className="mono" style={{ color: "#9CA3AF", fontSize: 12 }}>{t.reference || "—"}</td>
                       <td className="mono" style={{ textAlign: "right", color: t.amount >= 0 ? "#16A34A" : "#DC2626", fontWeight: 600 }}>{t.currency} {t.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                       <td><Tag label={t.status} /></td>
                        <td style={{ display: "flex", gap: 6 }}>
                         <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => openEdit(t)}>Edit</button>
                         <button className="btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => handleDelete(t._id)}>Delete</button>
                       </td>
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
             <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 16, border: "1px solid #E5E7EB", fontSize: 12, color: "#6B7280", lineHeight: 1.7 }}>
               CSV must have columns: <span className="mono" style={{ color: "#7C3AED" }}>date, description, amount, currency, reference, category</span>
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

      {editingTx && (
        <Modal title="Edit Transaction" onClose={() => setEditingTx(null)}>
          <div style={{ display: "grid", gap: 14 }}>
            <div><label>Category</label><input className="inp" value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. transfer" /></div>
            <div><label>Note</label><textarea className="inp" rows={4} value={editForm.note} onChange={e => setEditForm(p => ({ ...p, note: e.target.value }))} placeholder="Add reconciliation context..." style={{ resize: "vertical" }} /></div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setEditingTx(null)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleUpdate} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
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

  const downloadFile = (name, content, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const buildSimplePdf = (rawText) => {
    const escapePdfText = (value) => value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    const lines = rawText.split("\n");
    const textOps = lines
      .map((line, i) => {
        const y = 780 - i * 16;
        return `BT /F1 12 Tf 50 ${y} Td (${escapePdfText(line)}) Tj ET`;
      })
      .join("\n");
    const stream = `${textOps}\n`;

    const objects = [
      "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
      "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
      "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
      "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
      `5 0 obj << /Length ${stream.length} >> stream\n${stream}endstream endobj`,
    ];

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((obj) => {
      offsets.push(pdf.length);
      pdf += `${obj}\n`;
    });
    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    offsets.slice(1).forEach((off) => {
      pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    return new TextEncoder().encode(pdf);
  };

  const exportCSV = () => {
    if (!result) return;
    const rows = [
      ["status", result.status || ""],
      ["matched", result.matched ?? 0],
      ["unmatched", result.unmatched ?? 0],
      ["exceptions", result.exceptions ?? 0],
      ["bank_total", result.bank_total ?? 0],
      ["internal_total", result.internal_total ?? 0],
      ["variance", result.variance ?? 0],
      ["generated_at", new Date().toISOString()],
    ];
    const csv = rows.map(([k, v]) => `${k},${JSON.stringify(v)}`).join("\n");
    downloadFile(`reconciliation-report-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
  };

  const exportPDF = () => {
    if (!result) return;
    const text = [
      "RECONCILIATION REPORT",
      "====================",
      `Status: ${result.status || "UNKNOWN"}`,
      `Matched: ${result.matched ?? 0}`,
      `Unmatched: ${result.unmatched ?? 0}`,
      `Exceptions: ${result.exceptions ?? 0}`,
      `Bank Total: ${result.bank_total ?? 0}`,
      `Internal Total: ${result.internal_total ?? 0}`,
      `Variance: ${result.variance ?? 0}`,
      `Generated At: ${new Date().toISOString()}`,
    ].join("\n");
    const pdfBytes = buildSimplePdf(text);
    downloadFile(`reconciliation-report-${new Date().toISOString().slice(0, 10)}.pdf`, pdfBytes, "application/pdf");
  };
 
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
               <div style={{ fontSize: 15, fontWeight: 700, color: "#1F2937", marginBottom: 4 }}>Run Reconciliation</div>
               <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>Compares all bank and internal transactions, matches by amount+reference, and flags exceptions.</div>
             </div>
             <button className="btn-primary" style={{ padding: "12px 28px", fontSize: 14, minWidth: 140 }} onClick={run} disabled={running}>
               {running ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Spinner size={14} color="#fff" />Running…</div> : "▶ Run now"}
             </button>
           </div>
         </Card>
 
          {result && (
          <div className="fi">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
              <Metric label="Matched"   value={result.matched   ?? 0} color="#16A34A" icon="✓" />
              <Metric label="Unmatched" value={result.unmatched ?? 0} color="#DC2626" icon="✗" />
              <Metric label="Exceptions"value={result.exceptions?? 0} color="#D97706" icon="!" />
              <Metric label="Status" value={result.status || (Math.abs(result.variance || 0) < 1 ? "BALANCED" : "VARIANCE DETECTED")} color={Math.abs(result.variance || 0) < 1 ? "#16A34A" : "#DC2626"} icon="◎" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
              <Metric label="Bank Total" value={fmt(result.bank_total)} color="#2563EB" />
              <Metric label="Internal Total" value={fmt(result.internal_total)} color="#7C3AED" />
              <Metric label="Variance" value={fmt(result.variance)} color={Math.abs(result.variance || 0) < 1 ? "#16A34A" : "#DC2626"} />
            </div>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Summary</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={exportCSV}>Download CSV</button>
                  <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={exportPDF}>Download PDF</button>
                </div>
              </div>
              <pre style={{ fontFamily: "Geist Mono", fontSize: 12, color: "#6B7280", background: "#F9FAFB", borderRadius: 8, padding: 16, overflow: "auto", border: "1px solid #E5E7EB", maxHeight: 320, whiteSpace: "pre-wrap" }}>
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
                 {rows.length === 0 ? <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>No entries found</td></tr> :
                   rows.map(r => (
                     <tr key={r.id}>
                       <td className="mono" style={{ color: "#6B7280", fontSize: 12 }}>{r.date}</td>
                       <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</td>
                       <td style={{ color: "#6B7280" }}>{r.category || "—"}</td>
                       <td className="mono" style={{ color: "#9CA3AF", fontSize: 11 }}>{r.reference || "—"}</td>
                       <td className="mono" style={{ textAlign: "right", color: "#DC2626" }}>{r.debit ? r.debit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}</td>
                       <td className="mono" style={{ textAlign: "right", color: "#16A34A" }}>{r.credit ? r.credit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}</td>
                       <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: r.balance >= 0 ? "#1F2937" : "#DC2626" }}>{r.balance?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
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

  const removeTicket = async (id) => {
    if (!confirm("Delete this ticket?")) return;
    try {
      await API.deleteTicket(id);
      toast("Ticket deleted");
      if (selected?._id === id) setSelected(null);
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  };
 
   return (
     <PageShell title="Support Tickets" sub={`${tickets.length} tickets`}
       actions={<button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowNew(true)}>+ New Ticket</button>}>
       <Card style={{ padding: 0, overflow: "hidden" }}>
         {loading ? <div style={{ padding: 40, textAlign: "center" }}><Spinner /></div> : (
           <table>
             <thead><tr><th>Title</th><th>Priority</th><th>Category</th><th>Status</th><th>Created</th><th>Actions</th><th /></tr></thead>
             <tbody>
               {tickets.length === 0 ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>No tickets</td></tr> :
                 tickets.map(t => (
                   <tr key={t._id} style={{ cursor: "pointer" }} onClick={() => setSelected(t)}>
                     <td style={{ fontWeight: 600, color: "#1F2937" }}>{t.title}</td>
                     <td><Tag label={t.priority} /></td>
                     <td style={{ color: "#6B7280" }}>{t.category || "—"}</td>
                     <td><Tag label={t.status} /></td>
                     <td style={{ color: "#9CA3AF", fontSize: 12 }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                     <td>
                        <div style={{ display: "flex", gap: 6 }}>
                         {user?.role === "admin" && (
                           <select className="inp" style={{ padding: "4px 8px", fontSize: 11, width: "auto" }}
                             value={t.status} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); changeStatus(t._id, e.target.value); }}>
                             {["open","in-progress","resolved","closed"].map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                         )}
                         <button className="btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={e => { e.stopPropagation(); removeTicket(t._id); }}>
                           Delete
                         </button>
                       </div>
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
             <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 14, fontSize: 13, color: "#4B5563", lineHeight: 1.7, border: "1px solid #E5E7EB" }}>{selected.description}</div>
             {/* Comments */}
             {selected.comments?.length > 0 && (
               <div>
                 <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".5px" }}>Comments ({selected.comments.length})</div>
                 <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                   {selected.comments.map((c, i) => (
                     <div key={i} style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 14px", border: "1px solid #E5E7EB" }}>
                       <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>{c.user?.name || "User"} · {new Date(c.createdAt).toLocaleDateString()}</div>
                       <div style={{ fontSize: 13, color: "#4B5563" }}>{c.message}</div>
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
 

// ── Team ──────────────────────────────────────────────────────────────────────
function Team({ toast }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState({ email: "", role: "member" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.getTeamMembers();
      setMembers(Array.isArray(response) ? response : response.members || []);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const sendInvite = async () => {
    if (!invite.email.trim()) return;
    setSaving(true);
    try {
      await API.inviteTeamMember(invite.email.trim(), invite.role);
      toast("Team invite sent");
      setInvite({ email: "", role: "member" });
      load();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (id, role) => {
    try {
      await API.updateTeamMemberRole(id, role);
      setMembers(prev => prev.map(m => (m._id === id ? { ...m, role } : m)));
      toast("Role updated");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const removeMember = async (id) => {
    if (!confirm("Remove this team member?")) return;
    try {
      await API.removeTeamMember(id);
      setMembers(prev => prev.filter(m => m._id !== id));
      toast("Member removed");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <PageShell
      title="Team Management"
      sub={`${members.length} members`}
      actions={(
        <div style={{ display: "flex", gap: 8 }}>
          <input className="inp" placeholder="invite@company.com" value={invite.email} onChange={e => setInvite(p => ({ ...p, email: e.target.value }))} style={{ width: 220 }} />
          <select className="inp" value={invite.role} onChange={e => setInvite(p => ({ ...p, role: e.target.value }))} style={{ width: 120 }}>
            <option value="admin">admin</option>
            <option value="member">member</option>
            <option value="viewer">viewer</option>
          </select>
          <button className="btn-primary" onClick={sendInvite} disabled={saving}>{saving ? "Inviting…" : "Invite"}</button>
        </div>
      )}
    >
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><Spinner /></div>
        ) : (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>No team members found</td></tr>
              ) : members.map(member => (
                <tr key={member._id}>
                  <td style={{ fontWeight: 600, color: "#1F2937" }}>{member.name || "Invited user"}</td>
                  <td style={{ color: "#6B7280", fontSize: 12 }}>{member.email}</td>
                  <td>
                    <select className="inp" style={{ padding: "4px 8px", fontSize: 11, width: "auto" }} value={member.role} onChange={e => changeRole(member._id, e.target.value)}>
                      <option value="admin">admin</option>
                      <option value="member">member</option>
                      <option value="viewer">viewer</option>
                    </select>
                  </td>
                  <td style={{ color: "#9CA3AF", fontSize: 12 }}>{member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "—"}</td>
                  <td><button className="btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => removeMember(member._id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
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
   const [auditPage, setAuditPage] = useState(1);
   const [auditHasMore, setAuditHasMore] = useState(true);
   const [auditLoadingMore, setAuditLoadingMore] = useState(false);
   const [loading, setLoading] = useState(true);

  const loadAuditPage = useCallback(async (page, append = false) => {
    const payload = await API.getAuditLog(page).catch(() => ({ logs: [] }));
    const logs = Array.isArray(payload?.logs) ? payload.logs : Array.isArray(payload) ? payload : [];
    const hasMoreByMeta =
      typeof payload?.hasMore === "boolean"
        ? payload.hasMore
        : typeof payload?.totalPages === "number" && typeof payload?.page === "number"
          ? payload.page < payload.totalPages
          : null;
    setAudit(prev => append ? [...prev, ...logs] : logs);
    setAuditHasMore(hasMoreByMeta ?? logs.length > 0);
    setAuditPage(page);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.getAdminUsers().catch(() => []),
      API.getAdminAnalytics().catch(() => null),
      API.getMonitoring().catch(() => null),
      loadAuditPage(1),
    ]).then(([u, a, m]) => { setUsers(u); setAnalytics(a); setMonitoring(m); setLoading(false); });
  }, [loadAuditPage]);
 
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

  const loadMoreAudit = async () => {
    setAuditLoadingMore(true);
    try {
      await loadAuditPage(auditPage + 1, true);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setAuditLoadingMore(false);
    }
  };
 
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
                     <td style={{ fontWeight: 600, color: "#1F2937" }}>{u.name}</td>
                     <td style={{ color: "#6B7280", fontSize: 12 }}>{u.email}</td>
                     <td>
                       <select className="inp" style={{ padding: "4px 8px", fontSize: 11, width: "auto" }} value={u.role} onChange={e => toggleRole(u._id, e.target.value)}>
                         <option>admin</option><option>member</option><option>viewer</option>
                       </select>
                     </td>
                     <td style={{ color: "#6B7280" }}>{u.txCount}</td>
                     <td style={{ color: "#9CA3AF", fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
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
               <Metric label="Total Users" value={analytics.overview?.totalUsers} color="#7C3AED" />
               <Metric label="Transactions" value={analytics.overview?.totalTx} color="#2563EB" />
               <Metric label="Reconciled %" value={`${analytics.overview?.reconciliationRate}%`} color="#16A34A" />
               <Metric label="Open Tickets" value={analytics.overview?.openTickets} color="#D97706" />
             </div>
             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
               <Card><div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Transaction Volume (30d)</div><Spark data={analytics.volumeByDay} color="#EF4444" h={100} /></Card>
               <Card><div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>User Growth (30d)</div><Spark data={analytics.userGrowth} color="#16A34A" h={100} /></Card>
             </div>
           </div>
         )}
 
         {sub === "monitoring" && monitoring && (
           <div style={{ display: "grid", gap: 14 }}>
             <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
               <Metric label="Status"    value={monitoring.status}     color="#16A34A" />
               <Metric label="Uptime"    value={`${Math.round(monitoring.uptime / 3600)}h`} color="#2563EB" />
               <Metric label="Heap Used" value={`${monitoring.memory?.used}MB`} color="#D97706" />
               <Metric label="TX 24h"    value={monitoring.activity?.txLast24h} color="#7C3AED" />
             </div>
             <Card>
               <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 14 }}>Recent Errors ({monitoring.recentErrors?.length || 0})</div>
               {monitoring.recentErrors?.length === 0 ? <div style={{ color: "#16A34A", fontSize: 13 }}>✓ No recent errors</div> :
                 monitoring.recentErrors?.map((e, i) => <div key={i} style={{ fontFamily: "Geist Mono", fontSize: 11, color: "#DC2626", marginBottom: 6 }}>{JSON.stringify(e)}</div>)}
             </Card>
           </div>
         )}
 
          {sub === "audit" && (
          <div style={{ display: "grid", gap: 10 }}>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <table>
                <thead><tr><th>User</th><th>Action</th><th>Entity</th><th>Timestamp</th></tr></thead>
                <tbody>
                  {audit.length === 0 ? <tr><td colSpan={4} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>No audit logs</td></tr> :
                    audit.map(a => (
                      <tr key={a._id}>
                        <td style={{ color: "#1F2937" }}>{a.user?.name || "System"}</td>
                        <td className="mono" style={{ fontSize: 12 }}>{a.action}</td>
                        <td style={{ color: "#6B7280" }}>{a.entityType} {a.entityId ? `#${a.entityId.toString().slice(-6)}` : ""}</td>
                        <td style={{ color: "#9CA3AF", fontSize: 12 }}>{new Date(a.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </Card>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button className="btn-ghost" disabled={!auditHasMore || auditLoadingMore} onClick={loadMoreAudit}>
                {auditLoadingMore ? "Loading…" : auditHasMore ? `Load More (Page ${auditPage + 1})` : "No more logs"}
              </button>
            </div>
          </div>
        )}
       </>}
     </PageShell>
   );
 }
 
 // ── Eye Icon & Password Input ─────────────────────────────────────────────────
 function EyeIcon({ visible }) {
   return visible ? (
     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
     </svg>
   ) : (
     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
     </svg>
   );
 }
 
 function PasswordInput({ value, onChange, placeholder }) {
   const [show, setShow] = useState(false);
   return (
     <div style={{ position: "relative" }}>
       <input className="inp" type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} style={{ paddingRight: 40 }} />
       <button onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
         onMouseEnter={e => e.currentTarget.style.color = "#374151"} onMouseLeave={e => e.currentTarget.style.color = "#9CA3AF"}>
         <EyeIcon visible={show} />
       </button>
     </div>
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
           <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937", marginBottom: 20 }}>Profile</div>
           <div style={{ display: "grid", gap: 14 }}>
             <div><label>Full Name</label><input className="inp" value={name} onChange={e => setName(e.target.value)} /></div>
             <div><label>Email</label><input className="inp" value={user?.email || ""} disabled style={{ opacity: .5 }} /></div>
             <div><label>Currency</label>
               <select className="inp" value={currency} onChange={e => setCurrency(e.target.value)}>
                 {["USD","USD","EUR","GBP","AED","SGD"].map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>
             <button className="btn-primary" style={{ width: "fit-content" }} onClick={saveProfile} disabled={saving}>{saving ? "Saving…" : "Save Profile"}</button>
           </div>
         </Card>
         <Card>
           <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937", marginBottom: 20 }}>Change Password</div>
           <div style={{ display: "grid", gap: 14 }}>
             <div><label>Current Password</label><PasswordInput value={cur} onChange={e => setCur(e.target.value)} /></div>
             <div><label>New Password</label><PasswordInput value={np} onChange={e => setNp(e.target.value)} /></div>
             <button className="btn-primary" style={{ width: "fit-content" }} onClick={changePw} disabled={savingPw}>{savingPw ? "Updating…" : "Update Password"}</button>
           </div>
         </Card>
         <Card style={{ padding: "18px 24px" }}>
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <div>
               <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>API Base URL</div>
               <div className="mono" style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{import.meta.env.VITE_API_URL || "http://localhost:5000"}</div>
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
     <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
       <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
         <div>
           <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.5px", color: "#111827" }}>{title}</h1>
           {sub && <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 3 }}>{sub}</div>}
         </div>
         {actions}
       </div>
       <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 40px", background: "#F9FAFB" }}>{children}</div>
     </div>
   );
 }
 
 function Footer({ compact = false }) {
   if (compact) {
     return (
       <footer style={{ flexShrink: 0, padding: "8px 20px", borderTop: "1px solid #E5E7EB", background: "#FFFFFF", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
         <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
           <div style={{ width: 20, height: 20, background: "linear-gradient(135deg,#EF4444,#F87171)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
             <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>R</span>
           </div>
           <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Relay</span>
         </div>
         <div style={{ display: "flex", gap: 16 }}>
           {[{ l: "Product", href: "#" }, { l: "Pricing", href: "#" }, { l: "Support", href: "#" }].map(item => (
             <a key={item.l} href={item.href} style={{ fontSize: 11, color: "#9CA3AF", transition: "color .2s" }}
               onMouseEnter={e => e.currentTarget.style.color = "#374151"} onMouseLeave={e => e.currentTarget.style.color = "#9CA3AF"}>{item.l}</a>
           ))}
         </div>
         <div style={{ fontSize: 11, color: "#D1D5DB" }}>© 2025 Relay. All rights reserved.</div>
       </footer>
     );
   }
   return (
     <footer style={{ flexShrink: 0, padding: "28px 6% 24px", borderTop: "1px solid rgba(255,255,255,.08)", background: "#2D3748" }}>
       <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
         <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
           <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#EF4444,#F87171)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
             <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>R</span>
           </div>
           <span style={{ fontSize: 15, fontWeight: 700, color: "#F9FAFB" }}>Relay</span>
         </div>
         <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
           {[{ l: "Product", href: "#" }, { l: "Pricing", href: "#" }, { l: "Support", href: "#" }].map(item => (
             <a key={item.l} href={item.href} style={{ fontSize: 13, color: "#CBD5E0", transition: "color .2s" }}
               onMouseEnter={e => e.currentTarget.style.color = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.color = "#CBD5E0"}>{item.l}</a>
           ))}
         </div>
         <div style={{ fontSize: 12, color: "#A0AEC0" }}>© 2025 Relay. All rights reserved.</div>
       </div>
     </footer>
   );
 }
 
 // ── App Shell ─────────────────────────────────────────────────────────────────
 function appTabFromPath(pathname) {
   const match = pathname.match(/^\/app\/([^/]+)/);
   return match ? match[1] : null;
 }
 
 function appPathForTab(tab) {
   return `/app/${tab}`;
 }
 
 function AppShell({ user, setUser }) {
   const [tab, setTab] = useState(() => {
     if (typeof window === "undefined") return "dashboard";
     return window.history.state?.tab || appTabFromPath(window.location.pathname) || localStorage.getItem("rec_tab") || "dashboard";
   });
   const [toasts, setToasts] = useState([]);
   const toast = (msg, type = "success") => setToasts(p => [...p, { id: Date.now(), msg, type }]);
   const logout = () => { localStorage.removeItem("rec_token"); setUser(null); };
   const props = { user, toast };
 
   useEffect(() => {
     if (typeof window !== "undefined") {
       localStorage.setItem("rec_tab", tab);
       const nextPath = appPathForTab(tab);
       if (window.location.pathname !== nextPath) {
         window.history.pushState({ screen: "app", tab }, "", nextPath);
       } else if (window.history.state?.tab !== tab || window.history.state?.screen !== "app") {
         window.history.replaceState({ screen: "app", tab }, "", nextPath);
       }
     }
   }, [tab]);
 
   useEffect(() => {
     const handlePop = event => {
       if (event.state?.tab) {
         setTab(event.state.tab);
       } else {
         setTab(appTabFromPath(window.location.pathname) || "dashboard");
       }
     };
     window.addEventListener("popstate", handlePop);
     return () => window.removeEventListener("popstate", handlePop);
   }, []);
 
   return (
     <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#FFFFFF" }}>
       <Sidebar tab={tab} setTab={setTab} user={user} onLogout={logout} />
       <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
         <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
           <div style={{ display: tab === "dashboard" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
             <Dashboard {...props} />
           </div>
           <div style={{ display: tab === "transactions" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
             <Transactions {...props} />
           </div>
           <div style={{ display: tab === "reconcile" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
             <Reconcile {...props} />
           </div>
           <div style={{ display: tab === "ledger" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
             <Ledger {...props} />
           </div>
           <div style={{ display: tab === "tickets" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
             <Tickets {...props} />
           </div>
           <div style={{ display: tab === "admin" && user?.role === "admin" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
             {user?.role === "admin" && <Admin {...props} />}
           </div>
           <div style={{ display: tab === "settings" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
             <Settings {...props} setUser={setUser} />
           </div>
         </div>
         <Footer compact />
       </div>
       {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />)}
     </div>
   );
 }
 
 // ── Auth Forms ────────────────────────────────────────────────────────────────
 function AuthPage({ onLogin, onBack }) {
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
     <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F9FAFB", padding: 16, position: "relative", overflow: "hidden" }}>
       <div style={{ position: "absolute", top: "20%", left: "30%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(239,68,68,.05) 0%,transparent 70%)", pointerEvents: "none", animation: "blob 18s ease-in-out infinite" }} />
       <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
           <button type="button" onClick={onBack} style={{ background: "none", border: "none", color: "#6B7280", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0 }}>← Back</button>
           <button type="button" onClick={onBack} style={{ background: "none", border: "none", color: "#6B7280", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0 }}>Home</button>
         </div>
 
         {/* Logo */}
         <button type="button" onClick={onBack} style={{ all: "unset", cursor: "pointer", display: "block", textAlign: "center", marginBottom: 36 }} className="fu0">
           <div style={{ width: 52, height: 52, background: "linear-gradient(135deg,#EF4444,#F87171)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 8px 24px rgba(239,68,68,.25)", animation: "glow 3s ease-in-out infinite" }}>
             <span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>R</span>
           </div>
           <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-1px", color: "#111827" }}>Relay</div>
           <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Financial transaction reconciliation platform</div>
         </button>
 
         <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 16, padding: 32, boxShadow: "0 24px 80px rgba(0,0,0,.08)" }} className="fu1">
           {/* Toggle */}
           <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 8, padding: 3, marginBottom: 24 }}>
             {["login", "register"].map(m => (
               <button key={m} onClick={() => setMode(m)}
                 style={{ flex: 1, padding: "8px", borderRadius: 6, border: "none", background: mode === m ? "#FFFFFF" : "transparent", color: mode === m ? "#111827" : "#9CA3AF", fontSize: 13, fontWeight: mode === m ? 600 : 400, transition: "all .2s", boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}>
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
 
             {err && <div style={{ background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#DC2626" }}>{err}</div>}
 
             <button className="btn-primary" style={{ padding: "13px", fontSize: 15, marginTop: 4 }} onClick={submit} disabled={loading}>
               {loading ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Spinner size={16} color="#fff" />{mode === "login" ? "Signing in…" : "Creating account…"}</div>
                 : mode === "login" ? "Sign In" : "Create Account"}
             </button>
           </div>
         </div>
       </div>
     </div>
   );
 }
 
 // ── Mini Dashboard Preview (for Hero) ────────────────────────────────────────
 function HeroDashboardPreview() {
   return (
     <div style={{ width: "100%", maxWidth: 480, background: "#FFFFFF", borderRadius: 16, border: "1px solid #E5E7EB", boxShadow: "0 20px 60px rgba(0,0,0,.08)", overflow: "hidden", animation: "fadeUp .8s .3s both" }}>
       {/* Mini header */}
       <div style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 8 }}>
         <div style={{ width: 24, height: 24, background: "linear-gradient(135deg,#EF4444,#F87171)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
           <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>R</span>
         </div>
         <span style={{ fontSize: 12, fontWeight: 700, color: "#1F2937" }}>Dashboard</span>
         <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
           <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
           <span style={{ fontSize: 10, color: "#9CA3AF" }}>Live</span>
         </div>
       </div>
       {/* KPI row */}
       <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
         {[
           { l: "Matched", v: "94%", c: "#16A34A" },
           { l: "Variance", v: "$0.00", c: "#16A34A" },
           { l: "Pending", v: "12", c: "#D97706" },
         ].map(m => (
           <div key={m.l} style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 10px", border: "1px solid #F3F4F6" }}>
             <div style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{m.l}</div>
             <div style={{ fontSize: 16, fontWeight: 800, color: m.c, letterSpacing: "-.5px" }}>{m.v}</div>
           </div>
         ))}
       </div>
       {/* Mini chart */}
       <div style={{ padding: "4px 16px 12px" }}>
         <svg viewBox="0 0 320 60" style={{ width: "100%", height: 60 }}>
           <defs>
             <linearGradient id="heroG" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="#EF4444" stopOpacity=".15" />
               <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
             </linearGradient>
           </defs>
           <path d="M0,45 L53,38 L106,30 L160,22 L213,18 L267,12 L320,8 L320,64 L0,64 Z" fill="url(#heroG)" />
           <path d="M0,45 L53,38 L106,30 L160,22 L213,18 L267,12 L320,8" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
         </svg>
       </div>
       {/* Mini table */}
       <div style={{ padding: "0 16px 12px" }}>
         {[
           { ref: "REF-0042", desc: "Payment — Acme Corp", status: "matched", amt: "-$12,400" },
           { ref: "REF-0043", desc: "Invoice — Delta Inc", status: "matched", amt: "+$21,000" },
           { ref: "REF-0044", desc: "AWS Subscription", status: "pending", amt: "-$3,200" },
         ].map(r => (
           <div key={r.ref} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: "1px solid #F3F4F6", fontSize: 11 }}>
             <span style={{ fontFamily: "monospace", color: "#9CA3AF", width: 64 }}>{r.ref}</span>
             <span style={{ flex: 1, color: "#4B5563", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.desc}</span>
             <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 100, background: r.status === "matched" ? "#F0FDF4" : "#FFFBEB", color: r.status === "matched" ? "#16A34A" : "#D97706" }}>{r.status}</span>
             <span style={{ fontFamily: "monospace", fontWeight: 600, color: r.amt.startsWith("+") ? "#16A34A" : "#DC2626", width: 72, textAlign: "right" }}>{r.amt}</span>
           </div>
         ))}
       </div>
     </div>
   );
 }
 
 // ── Landing Page ──────────────────────────────────────────────────────────────
 function Landing({ onEnter }) {
   const [scrolled, setScrolled] = useState(false);
   const [pct, setPct] = useState(0);
 
   useEffect(() => {
     window.scrollTo({ top: 0, left: 0 });
     const revealEls = document.querySelectorAll(".reveal");
     revealEls.forEach(el => el.classList.add("vis"));
 
     const fn = () => {
       const h = document.documentElement.scrollHeight - window.innerHeight;
       setPct((window.scrollY / h) * 100);
       setScrolled(window.scrollY > 50);
     };
     window.addEventListener("scroll", fn);
     fn();
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
     <div style={{ background: "#FFFFFF", color: "#111827", overflowX: "hidden", fontFamily: "Geist, sans-serif" }}>
       {/* Scroll bar */}
       <div style={{ position: "fixed", top: 0, left: 0, zIndex: 2000, height: 2, width: `${pct}%`, background: "linear-gradient(90deg,#EF4444,#F87171)", transition: "width .1s" }} />
 
       {/* Nav */}
       <nav style={{ position: "fixed", top: 2, left: 0, right: 0, zIndex: 100, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6%", background: scrolled ? "rgba(255,255,255,.92)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid #E5E7EB" : "none", transition: "all .35s" }}>
         <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
           <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#EF4444,#F87171)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
             <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>R</span>
           </div>
           <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-.4px", color: "#111827" }}>Relay</span>
         </div>
         <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
           <button style={{ background: "transparent", color: "#6B7280", border: "none", fontSize: 14, fontWeight: 500 }} onClick={onEnter}>Sign in</button>
           <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 13 }} onClick={onEnter}>Get started</button>
         </div>
       </nav>
 
       {/* Hero */}
       <section style={{ minHeight: "92vh", display: "flex", alignItems: "center", padding: "100px 6% 60px", position: "relative", overflow: "hidden" }}>
         <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(239,68,68,.04) 1px, transparent 1px)", backgroundSize: "40px 40px", maskImage: "radial-gradient(ellipse 70% 70% at 50% 40%, black 30%, transparent 100%)", pointerEvents: "none" }} />
 
         <div style={{ display: "flex", alignItems: "center", gap: 60, width: "100%", maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
           {/* Left: copy */}
           <div style={{ flex: 1, minWidth: 0 }}>
             <h1 className="fu1" style={{ fontSize: "clamp(36px,5vw,64px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-3px", marginBottom: 24, color: "#111827" }}>
               Bank ↔ Internal.<br />
               <span style={{ background: "linear-gradient(135deg,#EF4444,#F87171)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Reconciled.</span>
             </h1>
 
             <p className="fu2" style={{ fontSize: 17, color: "#6B7280", lineHeight: 1.7, maxWidth: 480, marginBottom: 36, letterSpacing: "-.2px" }}>
               The engine that matches thousands of transactions in seconds, flags every exception, and gives your finance team a single source of truth.
             </p>
 
             <div className="fu3" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
               <button className="btn-primary" style={{ padding: "14px 28px", fontSize: 15 }} onClick={onEnter}>Start reconciling today</button>
             </div>
 
             <div className="fu4" style={{ display: "flex", gap: 32, marginTop: 44, paddingTop: 28, borderTop: "1px solid #E5E7EB", flexWrap: "wrap" }}>
               {[["∞", "Transactions matched"], ["< 1s", "Reconciliation speed"], ["100%", "Audit trail coverage"]].map(([v, l]) => (
                 <div key={l}>
                   <div style={{ fontSize: 24, fontWeight: 800, color: "#EF4444", letterSpacing: "-1px" }}>{v}</div>
                   <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{l}</div>
                 </div>
               ))}
             </div>
           </div>
 
           {/* Right: dashboard preview */}
           <div className="fu2" style={{ flex: "0 0 auto", display: "flex", alignItems: "center" }}>
             <HeroDashboardPreview />
           </div>
         </div>
       </section>
 
       {/* Marquee */}
       <div style={{ overflow: "hidden", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB", background: "#FAFAFA", padding: "12px 0" }}>
         <div style={{ animation: "marq 25s linear infinite", whiteSpace: "nowrap", display: "inline-block" }}>
           {[1, 2, 3].map(k => <span key={k} style={{ fontSize: 12, fontWeight: 600, color: "#D1D5DB", letterSpacing: ".5px", paddingRight: 0 }}>CSV Import · Bank Reconciliation · Exception Flagging · Ledger View · Audit Logs · Role-based Access · Real-time Analytics · Ticket Management · </span>)}
         </div>
       </div>
 
       {/* Product Demo Section */}
       <section style={{ padding: "100px 6%", textAlign: "center" }}>
         <h2 className="reveal" style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-2.5px", marginBottom: 16, color: "#111827" }}>
           See it in action
         </h2>
         <p className="reveal rd1" style={{ fontSize: 16, color: "#6B7280", marginBottom: 48, maxWidth: 480, margin: "0 auto 48px" }}>
           Watch how Relay processes a real CSV import, runs the matching engine, and generates a full reconciliation report in under 30 seconds.
         </p>
 
         <div className="reveal rd2">
           <DemoPlayer />
         </div>
       </section>
 
       {/* Features */}
       <section style={{ padding: "80px 6%", background: "#FAFAFA" }}>
         <div style={{ maxWidth: 1100, margin: "0 auto" }}>
           <div style={{ textAlign: "center", marginBottom: 60 }}>
             <h2 className="reveal" style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-2.5px", marginBottom: 14, color: "#111827" }}>
               Everything your finance team needs.
             </h2>
             <p className="reveal rd1" style={{ fontSize: 16, color: "#6B7280", maxWidth: 440, margin: "0 auto" }}>Purpose-built for reconciliation. Every feature earns its place.</p>
           </div>
           <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
             {FEATS.map((f, i) => (
               <div key={f.title} className={`reveal rd${(i % 4) + 1}`} style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14, padding: "26px", transition: "all .3s" }}
                 onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(239,68,68,.3)"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(239,68,68,.06)"; }}
                 onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                 <div style={{ width: 40, height: 40, background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 18, color: "#EF4444" }}>{f.icon}</div>
                 <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: "#1F2937" }}>{f.title}</div>
                 <div style={{ fontSize: 13.5, color: "#6B7280", lineHeight: 1.65 }}>{f.desc}</div>
               </div>
             ))}
           </div>
         </div>
       </section>
 
       {/* How it works */}
       <section style={{ padding: "100px 6%" }}>
         <div style={{ maxWidth: 900, margin: "0 auto" }}>
           <div style={{ textAlign: "center", marginBottom: 60 }}>
             <h2 className="reveal" style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, letterSpacing: "-2.5px", color: "#111827" }}>How it works</h2>
           </div>
           <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, position: "relative" }}>
             <div style={{ position: "absolute", top: "30%", left: "16.6%", right: "16.6%", height: 1, background: "linear-gradient(90deg,transparent,#D1D5DB,#EF4444,#D1D5DB,transparent)", pointerEvents: "none" }} />
             {STEPS.map((s, i) => (
               <div key={s.n} className={`reveal rd${i + 1}`} style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14, padding: "28px", textAlign: "center" }}>
                 <div style={{ fontSize: 11, fontFamily: "Geist Mono", color: "#EF4444", fontWeight: 700, marginBottom: 14 }}>{s.n}</div>
                 <div style={{ fontSize: 15, fontWeight: 700, color: "#1F2937", marginBottom: 10 }}>{s.title}</div>
                 <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}>{s.desc}</div>
               </div>
             ))}
           </div>
         </div>
       </section>
 
       {/* CTA */}
       <section style={{ padding: "90px 6%", textAlign: "center" }}>
         <h2 className="reveal" style={{ fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, letterSpacing: "-3px", marginBottom: 16, color: "#111827" }}>Start reconciling today.</h2>
         <p className="reveal rd1" style={{ fontSize: 16, color: "#6B7280", marginBottom: 36, maxWidth: 380, margin: "0 auto 36px" }}>Free to start. No credit card. Deploy in minutes on your own infrastructure.</p>
         <div className="reveal rd2" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
           <button className="btn-primary" style={{ padding: "14px 32px", fontSize: 15 }} onClick={onEnter}>Get started free</button>
         </div>
       </section>
 
       <Footer />
     </div>
   );
 }
 
 // ── Helpers ───────────────────────────────────────────────────────────────────
 function fmt(n) {
   if (n == null) return "—";
   return (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 }
 
 const PATH_FOR_SCREEN = { landing: "/", auth: "/signin", app: "/app" };
 function screenFromPath(pathname, hasSession) {
   if (pathname === "/signin" || pathname === "/auth") return "auth";
   if (hasSession) return "app";
   return "landing";
 }
 
 // ── ROOT ──────────────────────────────────────────────────────────────────────
 export default function App() {
   useGlobalStyles();
   const [screen, setScreen] = useState(() => {
     if (typeof window === "undefined") return "landing";
     return window.history.state?.screen || screenFromPath(window.location.pathname, false);
   });
   const [user, setUser] = useState(null);
   const [bootstrapped, setBootstrapped] = useState(false);
 
   const navigate = useCallback(nextScreen => {
     if (typeof window !== "undefined") {
       const nextPath = PATH_FOR_SCREEN[nextScreen];
       if (window.location.pathname !== nextPath) {
         window.history.pushState({ screen: nextScreen }, "", nextPath);
       } else if (window.history.state?.screen !== nextScreen) {
         window.history.replaceState({ screen: nextScreen }, "", nextPath);
       }
     }
     setScreen(nextScreen);
   }, []);
 
   useEffect(() => {
     const token = localStorage.getItem("rec_token");
     if (token) {
       API.getMe()
         .then(u => { setUser(u); navigate("app"); })
         .catch(() => localStorage.removeItem("rec_token"))
         .finally(() => setBootstrapped(true));
     } else {
       setBootstrapped(true);
     }
   }, [navigate]);
 
   useEffect(() => {
     if (!bootstrapped || screen !== "app" || typeof window === "undefined") return;
     if (window.history.state?.screen !== "app") {
       const tab = appTabFromPath(window.location.pathname) || localStorage.getItem("rec_tab") || "dashboard";
       window.history.replaceState({ screen: "app", tab }, "", window.location.pathname);
     }
   }, [bootstrapped, screen]);
 
   useEffect(() => {
     const handlePop = event => {
       if (event.state?.screen) {
         setScreen(event.state.screen);
       } else {
         setScreen(screenFromPath(window.location.pathname, !!user));
       }
     };
     window.addEventListener("popstate", handlePop);
     return () => window.removeEventListener("popstate", handlePop);
   }, [user]);
 
   if (!bootstrapped) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F9FAFB" }}><Spinner size={32} /></div>;
   if (screen === "landing") return <Landing onEnter={() => navigate("auth")} />;
   if (screen === "auth") return <AuthPage onLogin={u => { setUser(u); navigate("app"); }} onBack={() => navigate("landing")} />;
   return <AppShell user={user} setUser={setUser} />;
 }
 