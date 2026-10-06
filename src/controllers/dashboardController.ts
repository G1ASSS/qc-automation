export function dashboardHtml(): string {
  return '<!doctype html>\n' +
'<html lang="en" data-theme="light">\n' +
'<head>\n' +
'<meta charset="utf-8" />\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />\n' +
'<meta name="theme-color" content="#0b1e3a" />\n' +
'<title>QC Pulse — Factory QC Command Center</title>\n' +
'<style>\n' +
':root{\n' +
'  --bg:#eef2f7; --bg2:#e6edf5; --card:#ffffff; --card2:#f7fafd;\n' +
'  --ink:#0f1e33; --muted:#5d6f88; --line:#e2eaf3; --line2:#d4dfea;\n' +
'  --brand:#1f4e79; --brand2:#2f7dd1; --accent:#22c1a3; --warn:#f59e0b; --bad:#ef4444; --ok:#16a34a;\n' +
'  --shadow:0 10px 30px rgba(15,30,51,.10); --shadow-sm:0 4px 14px rgba(15,30,51,.08);\n' +
'  --r:18px; --r-sm:12px;\n' +
'}\n' +
'[data-theme="dark"]{ --bg:#0a1322; --bg2:#0d1930; --card:#111f36; --card2:#0e1a30; --ink:#e8eff9; --muted:#93a6c2; --line:#1f3355; --line2:#274067; --shadow:0 12px 32px rgba(0,0,0,.45); --shadow-sm:0 4px 14px rgba(0,0,0,.4); }\n' +
'*{box-sizing:border-box}\n' +
'html{-webkit-text-size-adjust:100%}\n' +
'body{margin:0;font-family:ui-sans-system,-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Inter,Helvetica,Arial,sans-serif;background:radial-gradient(1200px 500px at 20% -10%,#cfe3ff 0%,transparent 60%),radial-gradient(900px 420px at 95% 0%,#c9fff1 0%,transparent 55%),var(--bg);color:var(--ink);min-height:100vh}\n' +
'[data-theme="dark"] body{background:radial-gradient(1000px 480px at 15% -10%,#1a3a6b 0%,transparent 60%),radial-gradient(800px 400px at 95% 0%,#0f4a44 0%,transparent 55%),var(--bg)}\n' +
'a{color:inherit}\n' +
'.topbar{position:sticky;top:0;z-index:40;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);background:color-mix(in srgb,var(--card) 82%,transparent);border-bottom:1px solid var(--line)}\n' +
'.topbar-inner{max-width:1280px;margin:0 auto;padding:12px 18px;display:flex;align-items:center;gap:12px}\n' +
'.logo{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#1f4e79,#2f7dd1 55%,#22c1a3);box-shadow:var(--shadow-sm);flex:none;animation:float 5s ease-in-out infinite}\n' +
'@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}\n' +
'.brand h1{margin:0;font-size:17px;letter-spacing:.01em}\n' +
'.brand p{margin:1px 0 0;font-size:12px;color:var(--muted)}\n' +
'.spacer{flex:1}\n' +
'.pill{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;padding:7px 11px;border-radius:999px;border:1px solid var(--line);background:var(--card);white-space:nowrap}\n' +
'.dot{width:8px;height:8px;border-radius:50%;background:#9aa9bf;flex:none}\n' +
'.dot.live{background:var(--ok);box-shadow:0 0 0 4px rgba(22,163,74,.18);animation:pulse 1.8s infinite}\n' +
'.dot.bad{background:var(--bad);box-shadow:0 0 0 4px rgba(239,68,68,.15)}\n' +
'@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(22,163,74,.35)}70%{box-shadow:0 0 0 8px rgba(22,163,74,0)}100%{box-shadow:0 0 0 0 rgba(22,163,74,0)}}\n' +
'.btn{display:inline-flex;align-items:center;gap:8px;border:1px solid transparent;border-radius:12px;padding:10px 14px;font-size:13.5px;font-weight:800;cursor:pointer;transition:transform .15s,box-shadow .2s,background .2s; text-decoration:none}\n' +
'.btn:active{transform:scale(.97)}\n' +
'.btn-primary{background:linear-gradient(135deg,var(--brand),var(--brand2));color:#fff;box-shadow:0 8px 20px rgba(47,125,209,.35)}\n' +
'.btn-primary:hover{transform:translateY(-1px);box-shadow:0 12px 26px rgba(47,125,209,.42)}\n' +
'.btn-ghost{background:var(--card);border-color:var(--line2);color:var(--ink)}\n' +
'.btn-ghost:hover{border-color:var(--brand2)}\n' +
'.iconbtn{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;border:1px solid var(--line);background:var(--card);cursor:pointer;color:var(--ink)}\n' +
'.container{max-width:1280px;margin:0 auto;padding:18px 18px 40px}\n' +
'.hero{position:relative;overflow:hidden;border-radius:22px;padding:22px;background:linear-gradient(120deg,#0b1e3a 0%,#1f4e79 45%,#2f7dd1 75%,#22c1a3 130%);color:#fff;box-shadow:var(--shadow);animation:rise .6s ease both}\n' +
'.hero::after{content:"";position:absolute;inset:-40%;background:radial-gradient(420px 220px at 80% 20%,rgba(255,255,255,.22),transparent 60%),radial-gradient(500px 260px at 10% 90%,rgba(34,193,163,.35),transparent 60%);pointer-events:none;animation:drift 9s ease-in-out infinite alternate}\n' +
'@keyframes drift{from{transform:translateX(-2%)}to{transform:translateX(2%)}}\n' +
'@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}\n' +
'.hero-grid{position:relative;z-index:1;display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap}\n' +
'.hero h2{margin:0;font-size:clamp(20px,3vw,28px);letter-spacing:-.02em}\n' +
'.hero p{margin:6px 0 0;opacity:.85;font-size:13.5px;max-width:560px;line-height:1.5}\n' +
'.hero-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}\n' +
'.chip{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);padding:7px 11px;border-radius:999px;font-size:12px;font-weight:700;backdrop-filter:blur(6px)}\n' +
'.hero-actions{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}\n' +
'.hero-actions .btn-ghost{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.25);color:#fff}\n' +
'.kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin:14px 0}\n' +
'.kpi{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:14px;box-shadow:var(--shadow-sm);position:relative;overflow:hidden;animation:rise .6s ease both}\n' +
'.kpi:nth-child(2){animation-delay:.05s}.kpi:nth-child(3){animation-delay:.1s}.kpi:nth-child(4){animation-delay:.15s}.kpi:nth-child(5){animation-delay:.2s}.kpi:nth-child(6){animation-delay:.25s}\n' +
'.kpi:hover{transform:translateY(-2px);box-shadow:var(--shadow)}\n' +
'.kpi{transition:transform .2s,box-shadow .2s}\n' +
'.kpi-top{display:flex;align-items:center;gap:9px}\n' +
'.kpi-ic{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;color:#fff;flex:none}\n' +
'.kpi h3{margin:0;font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}\n' +
'.kpi .val{margin:8px 0 0;font-size:30px;font-weight:900;letter-spacing:-.03em;line-height:1}\n' +
'.kpi .sub{margin:6px 0 0;font-size:12px;color:var(--muted)}\n' +
'.kpi::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--c,var(--brand2))}\n' +
'.grid2{display:grid;grid-template-columns:1.2fr .8fr;gap:12px;margin:0 0 12px}\n' +
'.panel{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow-sm);padding:16px;animation:rise .6s ease both}\n' +
'.panel h3{margin:0 0 2px;font-size:14px}\n' +
'.panel p.desc{margin:0 0 12px;font-size:12px;color:var(--muted)}\n' +
'.bars{display:flex;align-items:flex-end;gap:8px;height:170px;padding:8px 4px 0}\n' +
'.bar{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}\n' +
'.bar-track{width:100%;max-width:44px;height:130px;border-radius:10px;background:var(--bg2);border:1px solid var(--line);display:flex;align-items:flex-end;overflow:hidden}\n' +
'.bar-fill{width:100%;border-radius:8px;background:linear-gradient(180deg,var(--brand2),var(--brand));transition:height 1s cubic-bezier(.2,.8,.2,1);height:0}\n' +
'.bar.ng .bar-fill{background:linear-gradient(180deg,#fca5a5,var(--bad))}\n' +
'.bar span{font-size:11px;color:var(--muted);white-space:nowrap}\n' +
'.bar b{font-size:12px}\n' +
'.donut-wrap{display:flex;gap:14px;align-items:center;flex-wrap:wrap}\n' +
'.legend{display:grid;gap:8px;font-size:13px}\n' +
'.legend i{width:10px;height:10px;border-radius:3px;display:inline-block;margin-right:7px}\n' +
'.toolbar{position:sticky;top:66px;z-index:20;background:color-mix(in srgb,var(--card) 88%,transparent);backdrop-filter:blur(12px);border:1px solid var(--line);border-radius:var(--r);padding:12px;box-shadow:var(--shadow-sm)}\n' +
'.filters{display:grid;grid-template-columns:150px 1fr 1fr 130px 140px 120px 150px auto;gap:8px}\n' +
'.field{display:flex;align-items:center;gap:8px;background:var(--card2);border:1px solid var(--line);border-radius:12px;padding:0 10px}\n' +
'.field svg{flex:none;opacity:.6}\n' +
'.field input,.field select{border:0;background:transparent;outline:0;width:100%;padding:10px 0;font-size:13.5px;color:var(--ink)}\n' +
'.actions{display:flex;gap:8px}\n' +
'.seg{display:flex;background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:3px;margin-top:10px;width:max-content;max-width:100%}\n' +
'.seg button{border:0;background:transparent;padding:8px 13px;border-radius:9px;font-size:13px;font-weight:800;color:var(--muted);cursor:pointer;display:inline-flex;gap:7px;align-items:center}\n' +
'.seg button.on{background:var(--card);color:var(--ink);box-shadow:var(--shadow-sm)}\n' +
'.meta{display:flex;gap:10px;align-items:center;margin:12px 2px;font-size:12.5px;color:var(--muted);flex-wrap:wrap}\n' +
'.tablewrap{background:var(--card);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;box-shadow:var(--shadow-sm)}\n' +
'.tscroll{overflow:auto;max-height:640px}\n' +
'table{width:100%;border-collapse:separate;border-spacing:0;min-width:1240px;font-size:13px}\n' +
'thead th{position:sticky;top:0;z-index:2;background:var(--card2);text-align:left;padding:11px 10px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--line);white-space:nowrap}\n' +
'tbody td{padding:11px 10px;border-bottom:1px solid var(--line);vertical-align:middle}\n' +
'tbody tr{transition:background .15s;cursor:pointer;animation:fadein .4s ease both}\n' +
'tbody tr:hover{background:color-mix(in srgb,var(--brand2) 7%,transparent)}\n' +
'@keyframes fadein{from{opacity:0}to{opacity:1}}\n' +
'.mono{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}\n' +
'.badge{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:800;padding:5px 9px;border-radius:999px;border:1px solid;white-space:nowrap}\n' +
'.b-ok{color:#15803d;background:#dcfce7;border-color:#86efac}\n' +
'.b-ng{color:#b91c1c;background:#fee2e2;border-color:#fca5a5}\n' +
'.b-un{color:#92400e;background:#fef3c7;border-color:#fcd34d}\n' +
'.b-na{color:var(--muted);background:var(--bg2);border-color:var(--line2)}\n' +
'.b-sync{color:#1d4ed8;background:#dbeafe;border-color:#93c5fd}\n' +
'[data-theme="dark"] .b-ok{color:#86efac;background:rgba(22,163,74,.15);border-color:rgba(34,197,94,.4)}\n' +
'[data-theme="dark"] .b-ng{color:#fca5a5;background:rgba(239,68,68,.14);border-color:rgba(239,68,68,.4)}\n' +
'[data-theme="dark"] .b-un{color:#fcd34d;background:rgba(245,158,11,.14);border-color:rgba(245,158,11,.4)}\n' +
'[data-theme="dark"] .b-sync{color:#93c5fd;background:rgba(47,125,209,.15);border-color:rgba(47,125,209,.45)}\n' +
'.job{font-weight:800}\n' +
'.remark{max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;vertical-align:bottom}\n' +
'.cards{display:none;grid-template-columns:1fr;gap:10px;padding:12px}\n' +
'.rcard{background:var(--card2);border:1px solid var(--line);border-radius:14px;padding:12px;animation:rise .4s ease both}\n' +
'.rcard-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}\n' +
'.rcard-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;margin-top:10px;font-size:12.5px}\n' +
'.rcard-grid div b{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:2px}\n' +
'.pager{display:flex;align-items:center;gap:10px;padding:12px 14px;border-top:1px solid var(--line);flex-wrap:wrap}\n' +
'.skel{padding:14px;display:grid;gap:10px}\n' +
'.sk{height:52px;border-radius:12px;background:linear-gradient(90deg,var(--bg2) 25%,var(--line) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.2s infinite}\n' +
'@keyframes shimmer{to{background-position:-200% 0}}\n' +
'.empty{padding:40px 20px;text-align:center;color:var(--muted)}\n' +
'.empty svg{opacity:.5;margin-bottom:8px}\n' +
'.modal{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;padding:16px}\n' +
'.modal.open{display:flex}\n' +
'.backdrop{position:absolute;inset:0;background:rgba(5,12,24,.55);backdrop-filter:blur(4px);animation:fadein .2s}\n' +
'.sheet{position:relative;width:min(680px,100%);max-height:88vh;overflow:auto;background:var(--card);border:1px solid var(--line);border-radius:20px;box-shadow:var(--shadow);padding:18px;animation:pop .25s cubic-bezier(.2,.9,.3,1.2)}\n' +
'@keyframes pop{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:none}}\n' +
'.kv{display:grid;grid-template-columns:150px 1fr;gap:8px 12px;font-size:13px;margin-top:12px}\n' +
'.kv dt{color:var(--muted)}.kv dd{margin:0;word-break:break-word}\n' +
'.orig{background:var(--card2);border:1px solid var(--line);border-radius:12px;padding:12px;white-space:pre-wrap;font-size:12.5px;line-height:1.6;margin-top:10px}\n' +
'.toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%) translateY(20px);z-index:80;background:#0b1e3a;color:#fff;padding:12px 16px;border-radius:14px;font-size:13px;font-weight:700;opacity:0;pointer-events:none;transition:.25s;box-shadow:var(--shadow);max-width:92vw}\n' +
'.toast.show{opacity:1;transform:translateX(-50%)}\n' +
'footer{margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;color:var(--muted);font-size:12px}\n' +
'.sum-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}\n' +
'.sum-line{background:var(--card2);border:1px solid var(--line);border-radius:12px;padding:10px;overflow:hidden}\n' +
'.sum-line h4{margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}\n' +
'.sum-job{font-size:13px;font-weight:700;margin:4px 0}\n' +
'.sum-pre{background:#0b1e3a;color:#e8eff9;border-radius:12px;padding:12px;white-space:pre-wrap;font-size:12.5px;line-height:1.6;margin-top:10px;max-height:340px;overflow:auto}\n' +
'@media(max-width:860px){.sum-grid{grid-template-columns:1fr 1fr}}\n' +
'@media(max-width:560px){.sum-grid{grid-template-columns:1fr}}\n' +
'@media(max-width:1120px){.kpis{grid-template-columns:repeat(3,1fr)}.filters{grid-template-columns:1fr 1fr}.grid2{grid-template-columns:1fr}}\n' +
'@media(max-width:860px){\n' +
'  .tscroll table{display:none}.cards{display:grid}\n' +
'  .filters{grid-template-columns:1fr 1fr}\n' +
'  .toolbar{top:62px}\n' +
'  .topbar-inner{padding:10px 12px}.container{padding:12px 12px 30px}\n' +
'  .hero{padding:18px}.hero-actions{margin-left:0;width:100%}.hero-actions .btn{flex:1;justify-content:center}\n' +
'  .hide-sm{display:none!important}\n' +
'}\n' +
'@media(max-width:560px){.kpis{grid-template-columns:repeat(2,1fr)}.filters{grid-template-columns:1fr}.kpi .val{font-size:26px}.kv{grid-template-columns:1fr}.kv dt{margin-top:8px}}\n' +
'@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}\n' +
'.login-veil{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:18px;background:radial-gradient(800px 400px at 50% 0%,rgba(47,125,209,.35),transparent 60%),rgba(5,12,24,.78);backdrop-filter:blur(10px)}\n' +
'.login-card{width:min(420px,100%);background:var(--card);border:1px solid var(--line);border-radius:22px;box-shadow:var(--shadow);padding:26px;animation:pop .3s cubic-bezier(.2,.9,.3,1.15);text-align:center}\n' +
'.login-card .logo{margin:0 auto 10px}\n' +
'.login-card h2{margin:6px 0 4px;font-size:22px;letter-spacing:-.02em}\n' +
'.login-card p{margin:0 0 14px;font-size:13px;color:var(--muted);line-height:1.55}\n' +
'.login-input{display:flex;align-items:center;gap:9px;background:var(--card2);border:1px solid var(--line2);border-radius:13px;padding:0 13px;margin:10px 0}\n' +
'.login-input input{border:0;background:transparent;outline:0;width:100%;padding:13px 0;font-size:15px;font-weight:700;color:var(--ink)}\n' +
'.login-card .btn{width:100%;justify-content:center;margin-top:4px;padding:13px}\n' +
'.login-mgr{margin-top:10px;font-size:12.5px;color:var(--muted);background:none;border:0;cursor:pointer;text-decoration:underline}\n' +
'.login-err{display:none;margin-top:10px;font-size:12.5px;font-weight:800;color:#b91c1c;background:#fee2e2;border:1px solid #fca5a5;border-radius:10px;padding:8px}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>\n' +
'<symbol id="i-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></symbol>\n' +
'<symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></symbol>\n' +
'<symbol id="i-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></symbol>\n' +
'<symbol id="i-alert" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></symbol>\n' +
'<symbol id="i-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>\n' +
'<symbol id="i-sync" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/></symbol>\n' +
'<symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></symbol>\n' +
'<symbol id="i-dl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></symbol>\n' +
'<symbol id="i-factory" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V10l6 4v-4l6 4V6l6 4v11H3ZM7 17h2m4 0h2m4 0h2"/></symbol>\n' +
'<symbol id="i-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/></symbol>\n' +
'<symbol id="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></symbol>\n' +
'<symbol id="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></symbol>\n' +
'<symbol id="i-out" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></symbol>\n' +
'<symbol id="i-inbox" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z"/></symbol>\n' +
'</defs></svg>\n' +
'<div class="login-veil" id="login-veil"><div class="login-card"><div class="logo"><svg width="22" height="22"><use href="#i-factory"/></svg></div><h2>QC Pulse sign in</h2><p>Enter your Telegram username.<br>You will only see your own inspections and summaries.</p><label class="login-input"><svg width="17" height="17"><use href="#i-search"/></svg><input id="login-name" placeholder="e.g. G1ASS" autocomplete="username" /></label><div class="login-err" id="login-err">Username not found in reports. Check spelling (without @ also works).</div><button class="btn btn-primary" id="btn-login">Sign in as QC</button><button class="login-mgr" id="btn-mgr">Manager - view all QCs</button></div></div>\n' +
'<header class="topbar"><div class="topbar-inner">\n' +
'<div class="logo"><svg width="22" height="22"><use href="#i-factory"/></svg></div>\n' +
'<div class="brand"><h1>QC Pulse</h1><p>Factory QC Command Center · Asia/Bangkok</p></div>\n' +
'<div class="spacer"></div>\n' +
'<span class="pill hide-sm" id="pill-health"><span class="dot" id="health-dot"></span><span id="health-txt">Connecting…</span></span>\n' +
'<span class="pill hide-sm mono" id="pill-clock">—</span>\n' +
'<span class="pill" id="pill-user" style="display:none"></span>\n' +
'<button class="iconbtn" id="btn-logout" title="Log out" aria-label="Log out" style="display:none"><svg width="18" height="18"><use href="#i-out"/></svg></button>\n' +
'<button class="iconbtn" id="btn-theme" title="Toggle theme" aria-label="Toggle theme"><svg width="18" height="18"><use href="#i-moon" id="theme-ic"/></svg></button>\n' +
'<button class="btn btn-primary hide-sm" id="btn-export-top"><svg width="16" height="16"><use href="#i-dl"/></svg>Export</button>\n' +
'</div></header>\n' +
'<main class="container">\n' +
'<section class="hero"><div class="hero-grid">\n' +
'<div><h2 id="hero-title">Today&#39;s quality at a glance</h2><p>Live from Telegram QC reports → PostgreSQL → Google Sheets. Filter, inspect every record, and export production-ready Excel in one tap. Fully responsive from 4K monitors to factory phones.</p>\n' +
'<div class="hero-meta"><span class="chip"><svg width="14" height="14"><use href="#i-cal"/></svg><span id="hero-date">—</span></span><span class="chip"><svg width="14" height="14"><use href="#i-sync"/></svg><span id="hero-sync">Sheets: —</span></span><span class="chip"><svg width="14" height="14"><use href="#i-grid"/></svg><span id="hero-total">— records</span></span></div></div>\n' +
'<div class="hero-actions"><button class="btn btn-primary" id="btn-refresh"><svg width="16" height="16"><use href="#i-sync"/></svg>Refresh</button><button class="btn btn-ghost" id="btn-export"><svg width="16" height="16"><use href="#i-dl"/></svg>Export .xlsx</button></div>\n' +
'</div></section>\n' +
'<section class="kpis" id="kpis" aria-live="polite"></section>\n' +
'<section class="grid2">\n' +
'<div class="panel"><h3>Inspection trend</h3><p class="desc">Volume per inspection day (from loaded records, animated)</p><div class="bars" id="bars"></div></div>\n' +
'<div class="panel"><h3>Quality split</h3><p class="desc">OK vs NG vs pending result</p><div class="donut-wrap"><svg id="donut" width="150" height="150" viewBox="0 0 42 42" role="img" aria-label="Quality split"></svg><div class="legend" id="legend"></div></div></div>\n' +
'</section>\n' +
'<section class="panel" id="summary-panel" style="margin:0 0 12px">\n' +
'<div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">\n' +
'<div style="min-width:220px;flex:1"><h3>Daily work summary - what QC did today</h3><p class="desc" style="margin:2px 0 0">Cutting / Border / Hole / Cleaning / Packing / Special + problems + totals. Same factory format.</p></div>\n' +
'<label class="field" style="max-width:190px"><svg width="16" height="16"><use href="#i-cal"/></svg><input id="s-date" type="date" aria-label="Summary date" /></label>\n' +
'<label class="field" style="max-width:150px"><svg width="16" height="16"><use href="#i-clock"/></svg><select id="s-shift" aria-label="Summary shift"><option value="">All shifts</option><option value="A">Shift A</option><option value="B">Shift B</option><option value="C">Shift C</option><option value="N">Night</option></select></label>\n' +
'<button class="btn btn-primary" id="btn-sum"><svg width="16" height="16"><use href="#i-grid"/></svg>Generate</button>\n' +
'<button class="btn btn-ghost" id="btn-copy">Copy text</button>\n' +
'<button class="btn btn-ghost" id="btn-sumtxt">Open .txt</button>\n' +
'</div>\n' +
'<div class="sum-grid" id="sum-cards"></div>\n' +
'<pre class="sum-pre" id="sum-text">Tap Generate - defaults to today (Bangkok).</pre>\n' +
'<section class="toolbar"><div class="filters">\n' +
'<label class="field"><svg width="16" height="16"><use href="#i-cal"/></svg><input id="f-date" type="date" aria-label="Date" /></label>\n' +
'<label class="field"><svg width="16" height="16"><use href="#i-factory"/></svg><input id="f-factory" placeholder="Factory — e.g. Factory 2" aria-label="Factory" /></label>\n' +
'<label class="field"><svg width="16" height="16"><use href="#i-search"/></svg><input id="f-job" placeholder="Job number — e.g. CT-141" aria-label="Job number" /></label>\n' +
'<label class="field"><svg width="16" height="16"><use href="#i-grid"/></svg><input id="f-machine" placeholder="Machine No" aria-label="Machine" /></label>\n' +
'<label class="field"><svg width="16" height="16"><use href="#i-grid"/></svg><input id="f-user" placeholder="QC user - e.g. G1ASS" aria-label="QC user" /></label>\n' +
'<label class="field"><svg width="16" height="16"><use href="#i-clock"/></svg><select id="f-shift" aria-label="Shift"><option value="">All shifts</option><option value="A">Shift A</option><option value="B">Shift B</option><option value="C">Shift C</option><option value="N">Night</option></select></label>\n' +
'<label class="field"><svg width="16" height="16"><use href="#i-alert"/></svg><select id="f-status" aria-label="Status"><option value="">All statuses</option><option value="Unfinished">Unfinished</option><option>OK</option><option>NG</option></select></label>\n' +
'<div class="actions"><button class="btn btn-primary" id="btn-search"><svg width="16" height="16"><use href="#i-search"/></svg>Search</button><button class="btn btn-ghost" id="btn-reset">Reset</button></div>\n' +
'</div>\n' +
'<div class="seg" role="tablist"><button id="view-table" class="on"><svg width="15" height="15"><use href="#i-grid"/></svg>Table</button><button id="view-cards"><svg width="15" height="15"><use href="#i-inbox"/></svg>Cards</button></div>\n' +
'</section>\n' +
'<div class="meta"><span id="meta-count" class="mono">—</span><span>·</span><span>Tap any row for full Telegram source</span><span class="spacer" style="flex:1"></span><span id="meta-page" class="mono"></span></div>\n' +
'<section class="tablewrap">\n' +
'<div class="tscroll" id="tscroll"><table id="tbl"><thead><tr><th>Date</th><th>Job</th><th>Factory / Process</th><th>Machine</th><th>QC</th><th>Result</th><th>Status</th><th>Remark</th><th>Qty insp/found/NG</th><th>Shift</th><th>Time</th><th>User</th><th>Sync</th></tr></thead><tbody id="rows"></tbody></table><div class="cards" id="mcards"></div><div class="skel" id="skel"><div class="sk"></div><div class="sk"></div><div class="sk"></div></div><div class="empty" id="empty" style="display:none"><svg width="42" height="42"><use href="#i-inbox"/></svg><div style="font-weight:800;color:var(--ink)">No inspections match</div><div>Try clearing filters or picking another date.</div></div></div>\n' +
'<div class="pager"><button class="btn btn-ghost" id="prev">← Prev</button><button class="btn btn-ghost" id="next">Next →</button><span class="mono" id="pageinfo"></span><span style="flex:1"></span><button class="btn btn-ghost" id="btn-export2"><svg width="15" height="15"><use href="#i-dl"/></svg>Export filtered .xlsx</button></div>\n' +
'</section>\n' +
'<footer><span>QC Pulse · Telegram → Postgres → Sheets → Excel · <span id="foot-health">checking…</span></span><span class="mono" id="foot-time"></span></footer>\n' +
'</main>\n' +
'<div class="modal" id="modal" role="dialog" aria-modal="true"><div class="backdrop" id="mback"></div><div class="sheet"><div style="display:flex;gap:10px;align-items:center"><div class="logo" style="width:36px;height:36px"><svg width="18" height="18"><use href="#i-factory"/></svg></div><div><div id="m-title" style="font-weight:900">Inspection</div><div id="m-sub" style="font-size:12px;color:var(--muted)">—</div></div><div style="flex:1"></div><button class="iconbtn" id="mclose" aria-label="Close"><svg width="16" height="16"><use href="#i-x"/></svg></button></div><div id="m-body"></div></div></div>\n' +
'<div class="toast" id="toast"></div>\n' +
'<script>\n' +
'var S={page:0,limit:50,total:0,rows:[],all:[],view:"auto"};\n' +
'function $(id){return document.getElementById(id)}\n' +
'function esc(s){return String(s==null?"":s).replace(/[&<>"\\\']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",\'"\':"&quot;","\'":"&#39;"}[c]})}\n' +
'function fmtDate(iso){try{return String(iso).slice(0,10).split("-").reverse().join("/")}catch(e){return iso}}\n' +
'function fmtDT(iso){try{var d=new Date(iso);var p=function(n){return String(n).padStart(2,"0")};return p(d.getDate())+"/"+p(d.getMonth()+1)+"/"+d.getFullYear()+", "+p(d.getHours())+":"+p(d.getMinutes())}catch(e){return iso}}\n' +
'function toast(m){var t=$("toast");t.textContent=m;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("show")},2600)}\n' +
'function bkkNow(){try{return new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Bangkok",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(new Date())}catch(e){return new Date().toLocaleString()}}\n' +
'setInterval(function(){$("pill-clock").textContent=bkkNow()+" (BKK)";$("foot-time").textContent=bkkNow()},1000);\n' +
'(function theme(){var k="qc-theme";try{var v=localStorage.getItem(k);if(v)document.documentElement.setAttribute("data-theme",v)}catch(e){} $("btn-theme").onclick=function(){var c=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",c);try{localStorage.setItem(k,c)}catch(e){}$("theme-ic").setAttribute("href",c==="dark"?"#i-sun":"#i-moon")}} )();\n' +
'function countUp(el,to){var t0=null,dur=900;function f(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/dur);var e=1-Math.pow(1-p,3);el.textContent=Math.round(to*e);if(p<1)requestAnimationFrame(f)}requestAnimationFrame(f)}\n' +
'function qs(page){var p=new URLSearchParams();if($("f-date").value)p.set("date",$("f-date").value);if($("f-factory").value.trim())p.set("factory",$("f-factory").value.trim());if($("f-job").value.trim())p.set("jobNumber",$("f-job").value.trim());if($("f-machine").value.trim())p.set("machineNumber",$("f-machine").value.trim());if($("f-user").value.trim())p.set("user",$("f-user").value.trim().replace(/^@/,""));if($("f-status").value)p.set("status",$("f-status").value);if($("f-shift").value)p.set("shift",$("f-shift").value);if(effUser())p.set("user",effUser());p.set("limit",String(S.limit));p.set("offset",String(page*S.limit));return p.toString()}\n' +
'function qsexp(){var p=new URLSearchParams();if($("f-date").value)p.set("date",$("f-date").value);if($("f-factory").value.trim())p.set("factory",$("f-factory").value.trim());if($("f-job").value.trim())p.set("jobNumber",$("f-job").value.trim());if($("f-machine").value.trim())p.set("machineNumber",$("f-machine").value.trim());if($("f-user").value.trim())p.set("user",$("f-user").value.trim().replace(/^@/,""));if($("f-status").value)p.set("status",$("f-status").value);if($("f-shift").value)p.set("shift",$("f-shift").value);if(effUser())p.set("user",effUser());return p.toString()}\n' +
'function kpiCard(ic,bg,label,val,sub,c){return \'<div class="kpi" style="--c:\'+c+\'"><div class="kpi-top"><span class="kpi-ic" style="background:\'+bg+\'"><svg width="17" height="17"><use href="#\'+ic+\'"/></svg></span><h3>\'+label+\'</h3></div><p class="val" data-v="\'+val+\'">0</p><p class="sub">\'+sub+\'</p></div>\'}\n' +
'async function loadAll(){\n' +
'  try{\n' +
'    var h=await fetch("/health").then(function(r){return r.json()});\n' +
'    var ok=h.status==="ok"&&h.database==="connected";\n' +
'    $("health-dot").className="dot "+(ok?"live":"bad");$("health-txt").textContent=ok?"Live · DB connected":"Degraded";$("foot-health").textContent="DB "+h.database+" · Telegram "+h.telegram+" · Sheets "+h.sheets;\n' +
'  }catch(e){$("health-dot").className="dot bad";$("health-txt").textContent="Offline"}\n' +
'  try{\n' +
'    var s=await fetch("/api/admin/stats"+(effUser()?"?user="+encodeURIComponent(effUser()):"")).then(function(r){return r.json()});\n' +
'    var t=s.today||{};\n' +
'    $("hero-date").textContent="Bangkok · "+(t.date||"today");\n' +
'    $("hero-sync").textContent="Sheets pending "+(s.pendingSync||0)+" · failed "+(s.failedSync||0);\n' +
'    var cards=kpiCard("i-grid","linear-gradient(135deg,#1f4e79,#2f7dd1)","Today total",t.total||0,(t.byFactory||[]).map(function(f){return esc(f.factory)}).join(" · ")||"all factories","#2f7dd1")+kpiCard("i-check","linear-gradient(135deg,#16a34a,#22c1a3)","OK",t.ok||0,"passed inspections","#16a34a")+kpiCard("i-x","linear-gradient(135deg,#ef4444,#f97316)","NG",t.ng||0,"needs action","#ef4444")+kpiCard("i-clock","linear-gradient(135deg,#f59e0b,#f97316)","Unfinished",t.unfinished||0,"still open","#f59e0b")+kpiCard("i-sync","linear-gradient(135deg,#2f7dd1,#8b5cf6)","Pending sync",s.pendingSync||0,"sheets queue","#8b5cf6")+kpiCard("i-alert","linear-gradient(135deg,#64748b,#0f172a)","Failed", (s.failedSync||0)+(s.failedMessages||0),"sync + parse","#64748b");\n' +
'    $("kpis").innerHTML=cards;\n' +
'    var vals=document.querySelectorAll(".kpi .val");for(var i=0;i<vals.length;i++){countUp(vals[i],Number(vals[i].getAttribute("data-v")||0))}\n' +
'  }catch(e){}\n' +
'  try{\n' +
'    var a=await fetch("/api/qc?limit=500&offset=0"+(effUser()?"&user="+encodeURIComponent(effUser()):"")).then(function(r){return r.json()});\n' +
'    S.all=a.data||[];$("hero-total").textContent=(a.total||S.all.length)+" records total";renderCharts(S.all);\n' +
'  }catch(e){}\n' +
'}\n' +
'function renderCharts(rows){\n' +
'  var byDate={};for(var i=0;i<rows.length;i++){var d=String(rows[i].inspectionDate||"").slice(0,10);byDate[d]=(byDate[d]||0)+1}\n' +
'  var keys=Object.keys(byDate).sort().slice(-8);\n' +
'  var max=1;for(var k=0;k<keys.length;k++){if(byDate[keys[k]]>max)max=byDate[keys[k]]}\n' +
'  var html="";for(var j=0;j<keys.length;j++){var v=byDate[keys[j]];var h=Math.max(6,Math.round(v/max*124));html+=\'<div class="bar"><b class="mono">\'+v+\'</b><div class="bar-track"><div class="bar-fill" data-h="\'+h+\'"></div></div><span>\'+keys[j].slice(5).replace("-","/")+\'</span></div>\'}\n' +
'  $("bars").innerHTML=html||\'<div class="empty">No data yet</div>\';\n' +
'  requestAnimationFrame(function(){requestAnimationFrame(function(){var f=document.querySelectorAll(".bar-fill");for(var q=0;q<f.length;q++){f[q].style.height=f[q].getAttribute("data-h")+"px"}})});\n' +
'  var ok=0,ng=0,na=0;for(var m=0;m<rows.length;m++){var r=String(rows[m].qcResult||"").toUpperCase();if(r==="OK")ok++;else if(r==="NG")ng++;else na++}\n' +
'  var tot=Math.max(1,ok+ng+na);var p1=(ok/tot*100),p2=(ng/tot*100);\n' +
'  var C=2*Math.PI*15.9155;\n' +
'  $("donut").innerHTML=\'<circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--bg2)" stroke-width="6"/><circle cx="21" cy="21" r="15.9155" fill="none" stroke="#16a34a" stroke-width="6" stroke-dasharray="\'+p1+\' \'+(100-p1)+\'" stroke-dashoffset="25" stroke-linecap="round"><animate attributeName="stroke-dasharray" from="0 100" to="\'+p1+\' \'+(100-p1)+\'" dur="1s" fill="freeze"/></circle><circle cx="21" cy="21" r="15.9155" fill="none" stroke="#ef4444" stroke-width="6" stroke-dasharray="\'+p2+\' \'+(100-p2)+\'" stroke-dashoffset="\'+(25-p1)+\'" stroke-linecap="round"/><text x="21" y="22" text-anchor="middle" font-size="7" font-weight="900" fill="var(--ink)">\'+Math.round(p1)+\'%</text><text x="21" y="27" text-anchor="middle" font-size="3.4" fill="var(--muted)">OK rate</text>\';\n' +
'  $("legend").innerHTML=\'<div><i style="background:#16a34a"></i><b class="mono">\'+ok+\'</b> OK</div><div><i style="background:#ef4444"></i><b class="mono">\'+ng+\'</b> NG</div><div><i style="background:var(--line2)"></i><b class="mono">\'+na+\'</b> no result</div>\';\n' +
'}\n' +
'function pillResult(r){if(r==="OK")return \'<span class="badge b-ok"><svg width="12" height="12"><use href="#i-check"/></svg>OK</span>\';if(r==="NG")return \'<span class="badge b-ng"><svg width="12" height="12"><use href="#i-x"/></svg>NG</span>\';return \'<span class="badge b-na">—</span>\'}\n' +
'function pillStatus(s){if(!s)return \'<span style="color:var(--muted)">—</span>\';if(String(s).toLowerCase()==="unfinished")return \'<span class="badge b-un"><svg width="12" height="12"><use href="#i-clock"/></svg>Unfinished</span>\';return \'<span class="badge b-na">\'+esc(s)+\'</span>\'}\n' +
'function qtyStr(x){if(x.inspectionQty==null&&x.foundQty==null&&x.totalNg==null)return "\u2014";return (x.inspectionQty==null?"\u2014":x.inspectionQty)+"/"+(x.foundQty==null?"\u2014":x.foundQty)+"/"+(x.totalNg==null?"\u2014":x.totalNg)}\n' +
'async function loadRows(){\n' +
'  $("skel").style.display="grid";$("empty").style.display="none";$("rows").innerHTML="";$("mcards").innerHTML="";\n' +
'  try{\n' +
'    var r=await fetch("/api/qc?"+qs(S.page)).then(function(x){return x.json()});\n' +
'    S.total=r.total||0;S.rows=r.data||[];\n' +
'    $("skel").style.display="none";\n' +
'    if(!S.rows.length){$("empty").style.display="block"}\n' +
'    var html="";\n' +
'    for(var i=0;i<S.rows.length;i++){var x=S.rows[i];\n' +
'      html+=\'<tr data-i="\'+i+\'"><td class="mono">\'+fmtDate(x.inspectionDate)+\'</td><td><span class="job">\'+esc(x.jobNumber)+\'</span><div style="font-size:11px;color:var(--muted)">\'+esc(x.inspectionType||"")+\'</div></td><td>\'+esc(x.factory)+\'<div style="font-size:11px;color:var(--muted)">\'+esc(x.process||"")+\'</div></td><td class="mono"><b>M\'+esc(x.machineNumber||"—")+\'</b><div style="font-size:11px;color:var(--muted)">No. \'+esc(x.number||"—")+\'</div></td><td class="mono">\'+esc(x.qcCheck||"—")+\'</td><td>\'+pillResult(x.qcResult)+\'</td><td>\'+pillStatus(x.status)+\'</td><td>\'+(x.defectRemark?\'<span class="remark" title="\'+esc(x.defectRemark)+\'">\'+esc(x.defectRemark)+\'</span>\':\'<span style="color:var(--muted)">—</span>\')+\'</td><td class="mono">\'+qtyStr(x)+\'</td><td>\'+(x.shift?esc(x.shift):"\u2014")+\'</td><td class="mono">\'+esc(x.inspectionTime||"—")+\'</td><td>\'+(x.telegramUsername?"@"+esc(x.telegramUsername):"—")+\'</td><td><span class="badge b-sync">\'+esc(x.sheetSyncStatus||"")+\'</span></td></tr>\';\n' +
'    }\n' +
'    $("rows").innerHTML=html;\n' +
'    var mh="";for(var j=0;j<S.rows.length;j++){var y=S.rows[j];mh+=\'<div class="rcard" data-i="\'+j+\'"><div class="rcard-top"><span class="job">\'+esc(y.jobNumber)+\'</span>\'+pillResult(y.qcResult)+pillStatus(y.status)+\'<span style="flex:1"></span><span class="mono" style="font-size:11px;color:var(--muted)">\'+fmtDate(y.inspectionDate)+\'</span></div><div class="rcard-grid"><div><b>Factory</b>\'+esc(y.factory)+\' · \'+esc(y.process||"")+\'</div><div><b>Machine</b>M\'+esc(y.machineNumber||"—")+\' · No.\'+esc(y.number||"—")+\'</div><div><b>Time</b>\'+esc(y.inspectionTime||"—")+\'</div>\'+(((y.inspectionQty!=null||y.foundQty!=null||y.totalNg!=null)?"<div><b>Qty insp/found/NG</b>"+qtyStr(y)+"</div>":"")+((y.shift)?"<div><b>Shift</b>"+esc(y.shift)+"</div>":""))+\'<div><b>User</b>\'+(y.telegramUsername?"@"+esc(y.telegramUsername):"—")+\'</div></div>\'+(y.defectRemark?\'<div style="margin-top:8px;font-size:12px;background:var(--bg2);border:1px solid var(--line);border-radius:9px;padding:7px 9px">\'+esc(y.defectRemark)+\'</div>\':"")+\'</div>\'}\n' +
'    $("mcards").innerHTML=mh;\n' +
'    var trs=document.querySelectorAll("tr[data-i],.rcard[data-i]");for(var k=0;k<trs.length;k++){trs[k].onclick=function(){openModal(Number(this.getAttribute("data-i")))}}\n' +
'    var pages=Math.max(1,Math.ceil(S.total/S.limit));\n' +
'    $("meta-count").textContent=S.total+" inspections · page "+(S.page+1)+" / "+pages;\n' +
'    $("pageinfo").textContent=(S.page*S.limit+1)+"–"+Math.min(S.total,(S.page+1)*S.limit)+" of "+S.total;\n' +
'    $("meta-page").textContent="limit "+S.limit+" / page";\n' +
'    applyView();\n' +
'  }catch(e){$("skel").style.display="none";toast("Failed to load rows — is the DB up?")}\n' +
'}\n' +
'function applyView(){var w=window.innerWidth;var v=S.view;if(v==="auto"){var tbl=$("tbl").style;var cds=$("mcards").style;if(w<=860){tbl.display="none";cds.display="grid"}else{tbl.display="";cds.display=""}}else if(v==="cards"){$("tbl").style.display="none";$("mcards").style.display="grid"}else{$("tbl").style.display="";$("mcards").style.display=""}}\n' +
'window.addEventListener("resize",applyView);\n' +
'function openModal(i){var x=S.rows[i];if(!x)return;$("m-title").textContent=x.jobNumber+" · M"+(x.machineNumber||"—");$("m-sub").textContent=fmtDate(x.inspectionDate)+" · "+(x.factory||"")+" · "+(x.process||"");$("m-body").innerHTML=\'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">\'+pillResult(x.qcResult)+pillStatus(x.status)+\'<span class="badge b-sync">\'+esc(x.sheetSyncStatus||"")+\'</span></div><dl class="kv"><dt>Inspection</dt><dd>\'+esc(x.inspectionType||"")+\'</dd><dt>Job / Number</dt><dd class="mono">\'+esc(x.jobNumber)+\' / \'+esc(x.number||"—")+\'</dd><dt>Machine / Time</dt><dd class="mono">M\'+esc(x.machineNumber||"—")+\' · \'+esc(x.inspectionTime||"—")+\'</dd><dt>QC check</dt><dd>\'+esc(x.qcCheck||"—")+\'</dd><dt>Defect</dt><dd>\'+esc(x.defectRemark||"—")+\'</dd><dt>Shift / Qty</dt><dd class="mono">\'+esc(x.shift||"—")+\' · insp \'+esc(x.inspectionQty==null?"—":x.inspectionQty)+\' · found \'+esc(x.foundQty==null?"—":x.foundQty)+\' · NG \'+esc(x.totalNg==null?"—":x.totalNg)+\'</dd><dt>Telegram</dt><dd>\'+(x.telegramUsername?"@"+esc(x.telegramUsername):"—")+\' · \'+fmtDT(x.receivedAt)+\'</dd></dl><div class="orig">\'+esc(x.originalMessage||"")+\'</div>\';$("modal").classList.add("open")}\n' +
'$("mclose").onclick=function(){$("modal").classList.remove("open")};$("mback").onclick=function(){$("modal").classList.remove("open")};document.addEventListener("keydown",function(e){if(e.key==="Escape")$("modal").classList.remove("open")});\n' +
'function doExport(){var q=qsexp();toast("Building Excel…");window.location.href="/api/qc/export.xlsx?"+q}\n' +
'$("btn-search").onclick=function(){S.page=0;loadRows()};$("btn-reset").onclick=function(){$("f-date").value="";$("f-factory").value="";$("f-job").value="";$("f-machine").value="";$("f-user").value="";$("f-shift").value="";$("f-status").value="";S.page=0;loadRows()};\n' +
'$("btn-export").onclick=doExport;$("btn-export2").onclick=doExport;$("btn-export-top").onclick=doExport;\n' +
'$("btn-refresh").onclick=function(){loadAll();loadRows();toast("Refreshing live data…")};\n' +
'$("prev").onclick=function(){if(S.page>0){S.page--;loadRows();$("tscroll").scrollTop=0}};\n' +
'$("next").onclick=function(){S.page++;loadRows();$("tscroll").scrollTop=0};\n' +
'$("view-table").onclick=function(){S.view="table";$("view-table").classList.add("on");$("view-cards").classList.remove("on");applyView()};\n' +
'$("view-cards").onclick=function(){S.view="cards";$("view-cards").classList.add("on");$("view-table").classList.remove("on");applyView()};\n' +
'var deb=null;["f-factory","f-job","f-machine","f-user"].forEach(function(id){$(id).addEventListener("input",function(){clearTimeout(deb);deb=setTimeout(function(){S.page=0;loadRows()},450)})});\n' +
'$("f-date").addEventListener("change",function(){S.page=0;loadRows()});$("f-status").addEventListener("change",function(){S.page=0;loadRows()});$("f-shift").addEventListener("change",function(){S.page=0;loadRows()});\n' +
'function sumToday(){try{return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Bangkok",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}catch(e){var d=new Date();var p=function(n){return String(n).padStart(2,"0")};return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())}}\n' +
'async function loadSummary(){var d=document.getElementById("s-date").value||sumToday();document.getElementById("sum-text").textContent="Building "+d+"...";try{var s=await fetch("/api/qc/summary?date="+d+(effUser()?"&user="+encodeURIComponent(effUser()):"")+(document.getElementById("s-shift").value?"&shift="+encodeURIComponent(document.getElementById("s-shift").value):"")).then(function(r){return r.json()});var D=s.data;if(!D){throw 0}document.getElementById("sum-text").textContent=D.text;var order=[["cutting","Cutting"],["border","Border"],["hole","Hole"],["cleaning","Cleaning"],["packing","Packing"],["special","Special"]];var h="";for(var i=0;i<order.length;i++){var k=order[i][0],title=order[i][1];var jobs=D.lines[k]||[];h+="<div class=sum-line><h4>"+title+" "+(D.lineCounts[k]||0)+"</h4>";if(!jobs.length){h+="<div>--</div>"}else{for(var j=0;j<jobs.length;j++){h+="<div class=sum-job>"+esc(jobs[j].jobNumber)+"("+jobs[j].machines.join(",")+")</div>"}}h+="</div>"}h+="<div class=sum-line><h4>Problems "+D.problems.length+"</h4>"+(D.problems.length?D.problems.slice(0,6).map(function(q){return "<div>"+esc(q.jobNumber)+" M"+esc(q.machineNumber||"-")+" - "+esc(q.defectRemark||q.qcResult||"")+"</div>"}).join("")+"</div>":"<div>All OK</div></div>")+"<div class=sum-line><h4>Totals</h4><div>Total - "+D.total+"<br>H - "+D.lineCounts.hole+"<br>CT - "+D.lineCounts.cutting+"<br>Border - "+D.lineCounts.border+"<br>NG - "+D.ng+"</div></div>";document.getElementById("sum-cards").innerHTML=h;}catch(e){document.getElementById("sum-text").textContent="Failed."}}\n' +
'document.getElementById("btn-sum").onclick=loadSummary;\n' +
'document.getElementById("btn-copy").onclick=function(){var v=document.getElementById("sum-text").textContent||"";if(navigator.clipboard){navigator.clipboard.writeText(v).then(function(){toast("Copied - paste to Telegram")})}else{toast("Copy not supported")}};\n' +
'document.getElementById("btn-sumtxt").onclick=function(){var d=document.getElementById("s-date").value||sumToday();window.open("/api/qc/summary?date="+d+"&format=text"+(effUser()?"&user="+encodeURIComponent(effUser()):"")+(document.getElementById("s-shift").value?"&shift="+encodeURIComponent(document.getElementById("s-shift").value):""),"_blank")};\n' +
'try{document.getElementById("s-date").value=sumToday()}catch(e){}\n' +
'function me(){try{return (localStorage.getItem("qc-user")||"").replace(/^@/,"").trim()}catch(e){return ""}}\n' +
'function isMgr(){try{return localStorage.getItem("qc-mgr")==="1"}catch(e){return false}}\n' +
'function effUser(){return isMgr()?"":me()}\n' +
'function applyLogin(){var u=effUser();var mgr=isMgr();var pill=document.getElementById("pill-user");if(mgr){pill.style.display="";pill.textContent="Manager - all QCs"}else if(u){pill.style.display="";pill.textContent="@"+u}else{pill.style.display="none"}document.getElementById("btn-logout").style.display="";var f=document.getElementById("f-user");if(f){if(u){f.value=u;f.setAttribute("disabled","disabled")}else{f.value="";f.removeAttribute("disabled")}}if(u){document.getElementById("hero-title").textContent="@"+u+" - your QC work"}}\n' +
'async function validUser(u){try{var r=await fetch("/api/qc?limit=1&user="+encodeURIComponent(u)).then(function(x){return x.json()});return (r.total||0)>0}catch(e){return false}}\n' +
'async function doLogin(u,mgr){u=(u||"").replace(/^@/,"").trim();if(mgr){try{localStorage.setItem("qc-mgr","1");localStorage.removeItem("qc-user")}catch(e){}document.getElementById("login-veil").style.display="none";applyLogin();boot();return}if(!u){return}document.getElementById("login-err").style.display="none";var ok=await validUser(u);if(!ok){document.getElementById("login-err").style.display="block";return}try{localStorage.setItem("qc-user",u);localStorage.removeItem("qc-mgr")}catch(e){}document.getElementById("login-veil").style.display="none";applyLogin();boot()}\n' +
'function boot(){S.page=0;loadAll();loadRows();applyView();try{document.getElementById("s-date").value=sumToday()}catch(e){}loadSummary()}\n' +
'document.getElementById("btn-login").onclick=function(){doLogin(document.getElementById("login-name").value,false)};\n' +
'document.getElementById("login-name").addEventListener("keydown",function(e){if(e.key==="Enter")doLogin(document.getElementById("login-name").value,false)});\n' +
'document.getElementById("btn-mgr").onclick=function(){doLogin("",true)};\n' +
'document.getElementById("btn-logout").onclick=function(){try{localStorage.removeItem("qc-user");localStorage.removeItem("qc-mgr")}catch(e){}location.reload()};\n' +
'try{document.getElementById("s-date").value=sumToday()}catch(e){}\n' +
'if(me()||isMgr()){document.getElementById("login-veil").style.display="none";applyLogin();boot()}\n' +
'setInterval(function(){if(me()||isMgr())loadAll()},60000);\n' +
'</script>\n' +
'</body>\n' +
'</html>';
}
