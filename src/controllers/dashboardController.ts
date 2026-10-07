export function dashboardHtml(): string {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#070d1d" />
<title>QC Pulse — Factory QC Command Center</title>
<style>
:root{
  --bg:#070d1d; --bg2:#0b1428;
  --glass:rgba(148,178,255,.08); --glass2:rgba(148,178,255,.13);
  --card:rgba(17,28,54,.62); --card-solid:#101b35;
  --ink:#eef3ff; --muted:#93a4c8; --faint:#64769a;
  --line:rgba(148,178,255,.16); --line2:rgba(148,178,255,.28);
  --brand:#3b82f6; --brand2:#8b5cf6; --teal:#22d3ee; --ok:#34d399; --warn:#fbbf24; --bad:#fb7185;
  --r:22px; --r-sm:15px;
  --shadow:0 24px 60px rgba(2,6,18,.55);
  --ease:cubic-bezier(.22,.9,.28,1.18); --snap:cubic-bezier(.2,.9,.25,1);
}
[data-theme="light"]{
  --bg:#e9eefb; --bg2:#dfe8fa;
  --glass:rgba(255,255,255,.55); --glass2:rgba(255,255,255,.75);
  --card:rgba(255,255,255,.68); --card-solid:#ffffff;
  --ink:#0e1b36; --muted:#54678f; --faint:#8b9bbd;
  --line:rgba(30,64,175,.12); --line2:rgba(30,64,175,.22);
  --shadow:0 24px 55px rgba(30,64,175,.16);
}
html{scroll-behavior:smooth}
body{margin:0;min-height:100vh;color:var(--ink);font-family:ui-sans-system,-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Inter,Helvetica,Arial,sans-serif;background:var(--bg);overflow-x:hidden;transition:background .5s,color .5s}
.bg-stage{position:fixed;inset:0;z-index:-1;overflow:hidden;background:radial-gradient(1100px 520px at 12% -8%,rgba(59,130,246,.28),transparent 60%),radial-gradient(900px 480px at 88% -6%,rgba(139,92,246,.24),transparent 60%),radial-gradient(760px 500px at 50% 110%,rgba(34,211,238,.14),transparent 60%),linear-gradient(var(--bg),var(--bg2))}
[data-theme="light"] .bg-stage{background:radial-gradient(1100px 520px at 12% -8%,rgba(59,130,246,.20),transparent 60%),radial-gradient(900px 480px at 88% -6%,rgba(139,92,246,.16),transparent 60%),radial-gradient(760px 500px at 50% 110%,rgba(34,211,238,.12),transparent 60%),linear-gradient(var(--bg),var(--bg2))}
.blob{position:absolute;border-radius:50%;filter:blur(90px);opacity:.5;animation:drift 14s ease-in-out infinite alternate}
.blob.b1{width:480px;height:480px;left:-140px;top:-120px;background:radial-gradient(circle,#3b82f6,transparent 65%)}
.blob.b2{width:420px;height:420px;right:-120px;top:6%;background:radial-gradient(circle,#8b5cf6,transparent 65%);animation-delay:-5s}
.blob.b3{width:520px;height:420px;left:30%;bottom:-200px;background:radial-gradient(circle,rgba(34,211,238,.7),transparent 65%);animation-delay:-9s;opacity:.35}
@keyframes drift{from{transform:translate(0,0) scale(1)}to{transform:translate(60px,40px) scale(1.12)}}
.topbar{position:sticky;top:12px;z-index:50;margin:12px auto 0;max-width:1280px;padding:0 18px}
.topbar-inner{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:20px;background:var(--glass);border:1px solid var(--line2);box-shadow:0 12px 40px rgba(2,6,18,.35),inset 0 1px 0 rgba(255,255,255,.22);backdrop-filter:blur(22px) saturate(1.6);-webkit-backdrop-filter:blur(22px) saturate(1.6)}
.logo{width:44px;height:44px;border-radius:15px;display:grid;place-items:center;color:#fff;flex:none;background:linear-gradient(135deg,#2563eb,#7c3aed 55%,#06b6d4);box-shadow:0 8px 22px rgba(59,130,246,.5),inset 0 1px 0 rgba(255,255,255,.5);animation:float 5s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-4px) rotate(-2deg)}}
.brand h1{margin:0;font-size:16.5px;letter-spacing:-.01em}
.brand p{margin:1px 0 0;font-size:11.5px;color:var(--muted)}
.spacer{flex:1}
.nav{display:none;gap:2px;padding:4px;border-radius:15px;background:rgba(2,6,18,.28);border:1px solid var(--line);position:relative}
[data-theme="light"] .nav{background:rgba(255,255,255,.5)}
.nav a{display:flex;align-items:center;gap:7px;padding:9px 14px;border-radius:11px;font-size:13px;font-weight:800;color:var(--muted);text-decoration:none;position:relative;z-index:1;transition:color .25s}
.nav a.on{color:var(--ink)}
.nav .ind{position:absolute;top:4px;bottom:4px;border-radius:11px;background:linear-gradient(135deg,rgba(59,130,246,.55),rgba(139,92,246,.55));box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 4px 14px rgba(59,130,246,.35);transition:left .35s var(--snap),width .35s var(--snap);z-index:0}
.gbtn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:14px;padding:11px 16px;font-size:13.5px;font-weight:800;color:var(--ink);cursor:pointer;text-decoration:none;border:1px solid var(--line2);background:linear-gradient(180deg,var(--glass2),var(--glass));box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 6px 18px rgba(2,6,18,.25);backdrop-filter:blur(16px) saturate(1.5);-webkit-backdrop-filter:blur(16px) saturate(1.5);transition:transform .16s var(--snap),box-shadow .25s,background .25s,border-color .25s;white-space:nowrap}
.gbtn:hover{transform:translateY(-2px);box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 12px 28px rgba(59,130,246,.35);border-color:rgba(148,178,255,.45)}
.gbtn:active{transform:scale(.95)}
.gbtn.primary{background:linear-gradient(135deg,#2563eb,#7c3aed 60%,#0891b2);color:#fff;border-color:rgba(255,255,255,.35);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 10px 26px rgba(59,130,246,.5);text-shadow:0 1px 4px rgba(2,6,18,.4)}
.gbtn.primary:hover{box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 16px 36px rgba(124,58,237,.55)}
.iconbtn{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;cursor:pointer;color:var(--ink);border:1px solid var(--line2);background:linear-gradient(180deg,var(--glass2),var(--glass));box-shadow:inset 0 1px 0 rgba(255,255,255,.35);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);transition:transform .16s var(--snap),box-shadow .25s;flex:none}
.iconbtn:hover{transform:translateY(-2px);box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 10px 22px rgba(59,130,246,.35)}
.iconbtn:active{transform:scale(.92)}
.pill{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:800;padding:9px 13px;border-radius:999px;border:1px solid var(--line2);background:var(--glass);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:inset 0 1px 0 rgba(255,255,255,.25);white-space:nowrap}
.dot{width:8px;height:8px;border-radius:50%;background:#8fa1c4;flex:none}
.dot.live{background:var(--ok);box-shadow:0 0 0 4px rgba(52,211,153,.2);animation:pulse 1.8s infinite}
.dot.bad{background:var(--bad)}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(52,211,153,.4)}70%{box-shadow:0 0 0 9px rgba(52,211,153,0)}100%{box-shadow:0 0 0 0 rgba(52,211,153,0)}}
.container{max-width:1280px;margin:0 auto;padding:18px 18px 90px}
section{scroll-margin-top:96px}
.hero{position:relative;overflow:hidden;border-radius:28px;padding:30px 28px;border:1px solid var(--line2);background:linear-gradient(120deg,rgba(15,30,70,.85),rgba(37,52,130,.75) 45%,rgba(88,60,180,.7) 75%,rgba(8,145,178,.65));box-shadow:var(--shadow),inset 0 1px 0 rgba(255,255,255,.35);color:#fff;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
[data-theme="light"] .hero{background:linear-gradient(120deg,#16295e,#2b3f8f 45%,#5b3fb8 75%,#0e7490)}
.hero::before{content:"";position:absolute;width:420px;height:420px;right:-140px;top:-160px;background:radial-gradient(circle,rgba(255,255,255,.28),transparent 65%);animation:drift 10s ease-in-out infinite alternate;pointer-events:none}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.14) 48%,transparent 56%);background-size:280% 100%;animation:sheen 7s ease-in-out infinite;pointer-events:none}
@keyframes sheen{0%{background-position:120% 0}55%,100%{background-position:-40% 0}}
.hero-grid{position:relative;z-index:1}
.hero h2{margin:0;font-size:clamp(24px,3.4vw,34px);letter-spacing:-.03em;text-shadow:0 2px 14px rgba(2,6,18,.4)}
.hero p.sub{margin:8px 0 0;opacity:.88;font-size:13.5px;max-width:600px;line-height:1.6}
.hero-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.chip{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);padding:8px 13px;border-radius:999px;font-size:12px;font-weight:800;backdrop-filter:blur(8px);box-shadow:inset 0 1px 0 rgba(255,255,255,.3)}
.hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.hero-actions .gbtn{border-color:rgba(255,255,255,.4)}
.kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:13px;margin:16px 0}
.kpi{position:relative;overflow:hidden;border-radius:var(--r);padding:16px 15px;animation:kpiIn .55s var(--ease) backwards;border:1px solid var(--line2);background:linear-gradient(180deg,var(--glass2),var(--glass));box-shadow:0 14px 36px rgba(2,6,18,.3),inset 0 1px 0 rgba(255,255,255,.3);backdrop-filter:blur(20px) saturate(1.5);-webkit-backdrop-filter:blur(20px) saturate(1.5);transition:transform .22s var(--snap),box-shadow .3s}
.kpi.in{opacity:1;transform:none;transition:opacity .5s,transform .55s var(--ease)}
@keyframes kpiIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.kpi:nth-child(2){animation-delay:.06s}.kpi:nth-child(3){animation-delay:.12s}.kpi:nth-child(4){animation-delay:.18s}.kpi:nth-child(5){animation-delay:.24s}.kpi:nth-child(6){animation-delay:.3s}
.kpi:hover{transform:translateY(-4px);box-shadow:0 22px 48px rgba(2,6,18,.4),0 0 0 1px var(--line2),0 0 32px rgba(59,130,246,.25)}
.kpi::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--c,#3b82f6);box-shadow:0 0 12px var(--c,#3b82f6)}
.kpi::after{content:"";position:absolute;top:0;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent)}
.kpi-top{display:flex;align-items:center;gap:10px}
.kpi-ic{width:38px;height:38px;border-radius:13px;display:grid;place-items:center;color:#fff;flex:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 6px 16px rgba(2,6,18,.35)}
.kpi h3{margin:0;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.kpi .val{margin:10px 0 0;font-size:31px;font-weight:900;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
.kpi .sub{margin:7px 0 0;font-size:12px;color:var(--muted);line-height:1.45}
.grid2{display:grid;grid-template-columns:1.25fr .75fr;gap:13px;margin:0 0 13px}
.panel{border-radius:var(--r);padding:18px;animation:kpiIn .6s var(--ease) backwards;border:1px solid var(--line2);background:linear-gradient(180deg,var(--glass2),var(--glass));box-shadow:0 14px 36px rgba(2,6,18,.3),inset 0 1px 0 rgba(255,255,255,.3);backdrop-filter:blur(20px) saturate(1.5);-webkit-backdrop-filter:blur(20px) saturate(1.5)}
.panel.in{opacity:1;transform:none;transition:opacity .5s,transform .55s var(--ease)}
.panel h3{margin:0;font-size:15px;letter-spacing:-.01em}
.panel p.desc{margin:3px 0 12px;font-size:12px;color:var(--muted);line-height:1.55}
.bars{display:flex;align-items:flex-end;gap:9px;height:178px;padding:10px 4px 0}
.bar{flex:1;display:flex;flex-direction:column;align-items:center;gap:7px;min-width:0}
.bar-track{width:100%;max-width:46px;height:134px;border-radius:12px;background:rgba(2,6,18,.35);border:1px solid var(--line);display:flex;align-items:flex-end;overflow:hidden;box-shadow:inset 0 2px 8px rgba(2,6,18,.4)}
[data-theme="light"] .bar-track{background:rgba(30,64,175,.07)}
.bar-fill{width:100%;border-radius:9px;background:linear-gradient(180deg,#60a5fa,#2563eb);box-shadow:0 0 14px rgba(59,130,246,.55),inset 0 1px 0 rgba(255,255,255,.5);transition:height 1.1s var(--snap);height:0}
.bar b{font-size:12px;font-variant-numeric:tabular-nums}
.bar span{font-size:10.5px;color:var(--muted)}
.donut-wrap{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.legend{display:grid;gap:9px;font-size:13px}
.legend i{width:11px;height:11px;border-radius:4px;display:inline-block;margin-right:8px;box-shadow:0 0 8px currentColor}
.toolbar{position:sticky;top:82px;z-index:30;border-radius:var(--r);padding:14px;border:1px solid var(--line2);background:color-mix(in srgb,var(--card) 82%,transparent);box-shadow:0 14px 36px rgba(2,6,18,.3);backdrop-filter:blur(22px) saturate(1.6);-webkit-backdrop-filter:blur(22px) saturate(1.6)}
.filters{display:grid;grid-template-columns:150px 1fr 1fr 130px 140px 120px 150px auto;gap:8px}
.field{display:flex;align-items:center;gap:8px;border-radius:13px;padding:0 11px;border:1px solid var(--line);background:rgba(2,6,18,.3);transition:border-color .2s,box-shadow .2s}
[data-theme="light"] .field{background:rgba(255,255,255,.6)}
.field:focus-within{border-color:var(--brand);box-shadow:0 0 0 3px rgba(59,130,246,.25),inset 0 1px 0 rgba(255,255,255,.3)}
.field svg{flex:none;opacity:.65}
.field input,.field select{border:0;background:transparent;outline:0;width:100%;padding:11px 0;font-size:13.5px;color:var(--ink);font-weight:600}
.field select option{color:#0e1b36}
.field input::placeholder{color:var(--faint);font-weight:500}
.field input:disabled{opacity:.75}
.actions{display:flex;gap:8px}
.seg{display:inline-flex;gap:3px;background:rgba(2,6,18,.35);border:1px solid var(--line);border-radius:14px;padding:4px;margin-top:11px;backdrop-filter:blur(10px)}
[data-theme="light"] .seg{background:rgba(30,64,175,.08)}
.seg button{border:0;background:transparent;padding:9px 15px;border-radius:10px;font-size:13px;font-weight:800;color:var(--muted);cursor:pointer;display:inline-flex;gap:7px;align-items:center;transition:all .25s var(--snap)}
.seg button.on{background:linear-gradient(135deg,rgba(59,130,246,.75),rgba(139,92,246,.75));color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 4px 14px rgba(59,130,246,.4)}
.meta{display:flex;gap:10px;align-items:center;margin:13px 3px;font-size:12.5px;color:var(--muted);flex-wrap:wrap}
.tablewrap{border-radius:var(--r);overflow:hidden;border:1px solid var(--line2);background:var(--card);box-shadow:0 14px 36px rgba(2,6,18,.3);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
.tscroll{overflow:auto;max-height:640px}
table{width:100%;border-collapse:separate;border-spacing:0;min-width:1400px;font-size:13px}
thead th{position:sticky;top:0;z-index:2;text-align:left;padding:12px 11px;font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);border-bottom:1px solid var(--line2);white-space:nowrap;background:color-mix(in srgb,var(--card-solid) 88%,transparent);backdrop-filter:blur(14px)}
tbody td{padding:12px 11px;border-bottom:1px solid var(--line);vertical-align:middle}
tbody tr{transition:background .18s;cursor:pointer}
tbody tr:hover{background:rgba(59,130,246,.1)}
.mono{font-variant-numeric:tabular-nums}
.badge{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:800;padding:6px 10px;border-radius:999px;border:1px solid;white-space:nowrap;box-shadow:inset 0 1px 0 rgba(255,255,255,.3)}
.b-ok{color:#6ee7b7;background:rgba(52,211,153,.14);border-color:rgba(52,211,153,.45)}
.b-ng{color:#fda4af;background:rgba(251,113,133,.13);border-color:rgba(251,113,133,.45)}
.b-un{color:#fcd34d;background:rgba(251,191,36,.13);border-color:rgba(251,191,36,.45)}
.b-na{color:var(--muted);background:var(--glass);border-color:var(--line2)}
.b-sync{color:#93c5fd;background:rgba(59,130,246,.14);border-color:rgba(59,130,246,.45)}
[data-theme="light"] .b-ok{color:#047857;background:#d1fae5;border-color:#6ee7b7}
[data-theme="light"] .b-ng{color:#be123c;background:#ffe4e6;border-color:#fda4af}
[data-theme="light"] .b-un{color:#92400e;background:#fef3c7;border-color:#fcd34d}
[data-theme="light"] .b-sync{color:#1d4ed8;background:#dbeafe;border-color:#93c5fd}
.job{font-weight:800}
.remark{max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;vertical-align:bottom}
.cards{display:none;grid-template-columns:1fr;gap:11px;padding:13px}
.rcard{border-radius:17px;padding:14px;border:1px solid var(--line2);background:linear-gradient(180deg,var(--glass2),var(--glass));box-shadow:0 8px 22px rgba(2,6,18,.25),inset 0 1px 0 rgba(255,255,255,.28);backdrop-filter:blur(14px);animation:rise .45s var(--ease) both}
.rcard-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rcard-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px 11px;margin-top:11px;font-size:12.5px}
.rcard-grid div b{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:2px}
.pager{display:flex;align-items:center;gap:10px;padding:13px 15px;border-top:1px solid var(--line);flex-wrap:wrap}
.skel{padding:15px;display:grid;gap:10px}
.sk{height:54px;border-radius:13px;background:linear-gradient(90deg,var(--glass) 25%,var(--glass2) 50%,var(--glass) 75%);background-size:200% 100%;animation:shimmer 1.3s infinite;border:1px solid var(--line)}
@keyframes shimmer{to{background-position:-200% 0}}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.empty{padding:44px 20px;text-align:center;color:var(--muted)}
.empty svg{opacity:.5;margin-bottom:10px}
.sum-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:13px}
.sum-line{border-radius:14px;padding:12px;border:1px solid var(--line);background:rgba(2,6,18,.28);transition:transform .2s var(--snap),box-shadow .25s}
[data-theme="light"] .sum-line{background:rgba(255,255,255,.55)}
.sum-line:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(2,6,18,.3)}
.sum-line h4{margin:0 0 7px;font-size:11.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}
.sum-job{font-size:13px;font-weight:700;margin:5px 0}
.sum-pre{border-radius:14px;padding:14px;white-space:pre-wrap;font-size:12.5px;line-height:1.65;margin-top:11px;max-height:340px;overflow:auto;background:rgba(3,8,22,.78);color:#dbe7ff;border:1px solid var(--line2);box-shadow:inset 0 2px 12px rgba(0,0,0,.4)}
[data-theme="light"] .sum-pre{background:#0b1e3a}
.modal{position:fixed;inset:0;z-index:80;display:none;align-items:flex-end;justify-content:center;padding:0}
.modal.open{display:flex}
.backdrop{position:absolute;inset:0;background:rgba(3,7,18,.6);backdrop-filter:blur(6px);animation:fadein .25s}
@keyframes fadein{from{opacity:0}to{opacity:1}}
.sheet{position:relative;width:min(680px,100%);max-height:88vh;overflow:auto;border-radius:24px 24px 0 0;border:1px solid var(--line2);border-bottom:0;background:var(--card-solid);box-shadow:0 -20px 60px rgba(0,0,0,.5);padding:20px;animation:sheetup .38s var(--ease)}
@keyframes sheetup{from{opacity:0;transform:translateY(60px) scale(.98)}to{opacity:1;transform:none}}
@media(min-width:700px){.modal{align-items:center;padding:18px}.sheet{border-radius:24px;border-bottom:1px solid var(--line2);animation:pop .3s var(--ease)}}
@keyframes pop{from{opacity:0;transform:scale(.94) translateY(10px)}to{opacity:1;transform:none}}
.kv{display:grid;grid-template-columns:150px 1fr;gap:9px 13px;font-size:13px;margin-top:13px}
.kv dt{color:var(--muted)}.kv dd{margin:0;word-break:break-word}
.orig{border-radius:13px;padding:13px;white-space:pre-wrap;font-size:12.5px;line-height:1.65;margin-top:11px;border:1px solid var(--line);background:rgba(2,6,18,.3)}
[data-theme="light"] .orig{background:rgba(30,64,175,.06)}
.delbtn{width:30px;height:30px;border-radius:10px;margin-left:7px;vertical-align:middle}
.delbtn:hover{box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 8px 20px rgba(251,113,133,.4);border-color:rgba(251,113,133,.6);color:var(--bad)}
.gbtn.danger{border-color:rgba(251,113,133,.55);color:var(--bad)}
.gbtn.danger:hover{box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 12px 26px rgba(251,113,133,.4)}
.toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%) translateY(24px) scale(.95);z-index:90;padding:13px 20px;border-radius:16px;font-size:13px;font-weight:800;color:var(--ink);opacity:0;pointer-events:none;transition:all .3s var(--ease);max-width:92vw;border:1px solid var(--line2);background:var(--glass2);box-shadow:0 16px 44px rgba(2,6,18,.5),inset 0 1px 0 rgba(255,255,255,.35);backdrop-filter:blur(20px) saturate(1.6);-webkit-backdrop-filter:blur(20px) saturate(1.6)}
.toast.show{opacity:1;transform:translateX(-50%)}
.login-veil{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(700px 380px at 50% 0%,rgba(59,130,246,.3),transparent 60%),rgba(3,7,18,.8);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.login-card{width:min(430px,100%);text-align:center;border-radius:26px;padding:30px 28px;border:1px solid var(--line2);background:linear-gradient(180deg,rgba(30,45,85,.85),rgba(15,25,50,.9));box-shadow:var(--shadow),inset 0 1px 0 rgba(255,255,255,.35);backdrop-filter:blur(26px) saturate(1.6);animation:pop .4s var(--ease)}
[data-theme="light"] .login-card{background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(240,244,255,.95))}
.login-card .logo{margin:0 auto 12px;width:56px;height:56px;border-radius:19px}
.login-card h2{margin:8px 0 5px;font-size:23px;letter-spacing:-.02em}
.login-card p{margin:0 0 15px;font-size:13px;color:var(--muted);line-height:1.6}
.login-input{display:flex;align-items:center;gap:10px;border-radius:14px;padding:0 14px;margin:11px 0;border:1px solid var(--line2);background:rgba(2,6,18,.4);transition:border-color .2s,box-shadow .2s}
[data-theme="light"] .login-input{background:rgba(255,255,255,.7)}
.login-input:focus-within{border-color:var(--brand);box-shadow:0 0 0 4px rgba(59,130,246,.28)}
.login-input input{border:0;background:transparent;outline:0;width:100%;padding:14px 0;font-size:15px;font-weight:800;color:var(--ink)}
.login-card .gbtn{width:100%;justify-content:center;margin-top:5px;padding:14px}
.login-mgr{margin-top:12px;font-size:12.5px;color:var(--muted);background:none;border:0;cursor:pointer;text-decoration:underline}
.login-err{display:none;margin-top:11px;font-size:12.5px;font-weight:800;color:#fda4af;background:rgba(251,113,133,.12);border:1px solid rgba(251,113,133,.4);border-radius:11px;padding:9px}
.login-card.shake{animation:shake .4s}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-9px)}40%,80%{transform:translateX(9px)}}
footer{margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;color:var(--muted);font-size:12px}
.reveal{animation:kpiIn .65s var(--ease) backwards}
.reveal.in{opacity:1;transform:none}
@media(max-width:1120px){.kpis{grid-template-columns:repeat(3,1fr)}.filters{grid-template-columns:1fr 1fr 1fr}.grid2{grid-template-columns:1fr}}
@media(max-width:860px){
  .tscroll table{display:none}.cards{display:grid}
  .filters{grid-template-columns:1fr 1fr}
  .toolbar{top:76px}
  .topbar{padding:0 10px}.topbar-inner{padding:9px 10px;gap:8px}
  .nav a span{display:none}.nav a{padding:9px 12px}
  .container{padding:13px 10px 100px}
  .hero{padding:22px 18px}.hero-actions .gbtn{flex:1;justify-content:center}
  .hide-sm{display:none!important}
  .sum-grid{grid-template-columns:1fr 1fr}
  .kpis{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:560px){.filters{grid-template-columns:1fr}.kpi .val{font-size:26px}.kv{grid-template-columns:1fr}.kv dt{margin-top:9px}.sum-grid{grid-template-columns:1fr}.brand p{display:none}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}html{scroll-behavior:auto}}
.dock{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:60;display:flex;gap:4px;padding:8px;border-radius:24px;border:1px solid var(--line2);background:color-mix(in srgb,var(--card) 72%,transparent);box-shadow:0 18px 50px rgba(2,6,18,.5),inset 0 1px 0 rgba(255,255,255,.35);backdrop-filter:blur(26px) saturate(1.8);-webkit-backdrop-filter:blur(26px) saturate(1.8);animation:dockin .6s var(--ease) both}
@keyframes dockin{from{opacity:0;transform:translateX(-50%) translateY(30px) scale(.94)}to{opacity:1;transform:translateX(-50%)}}
.dock button{position:relative;border:0;background:transparent;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:68px;padding:9px 10px 7px;border-radius:17px;color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.03em;transition:all .25s var(--snap)}
.dock button svg{transition:transform .25s var(--snap)}
.dock button:hover{color:var(--ink)}
.dock button:active{transform:scale(.88)}
.dock button.on{color:#fff;background:linear-gradient(135deg,#2563eb,#7c3aed 60%,#0891b2);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 8px 22px rgba(59,130,246,.55);text-shadow:0 1px 4px rgba(2,6,18,.4)}
.dock button.on svg{transform:translateY(-1px) scale(1.08)}
@media(max-width:560px){.dock{gap:2px;padding:7px}.dock button{min-width:60px}}
.overline{font-size:10.5px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:var(--teal);margin:0 0 6px}
.report{position:relative;overflow:hidden;background:linear-gradient(180deg,rgba(45,212,191,.09),var(--glass) 40%);border-top:2px solid rgba(45,212,191,.55)}
.report::before{content:"";position:absolute;top:0;left:8%;right:8%;height:1px;background:linear-gradient(90deg,transparent,rgba(45,212,191,.8),transparent)}
.rep-line{border:1px solid var(--line);border-radius:16px;padding:12px 14px;margin-top:9px;background:rgba(2,6,18,.28);transition:transform .2s var(--snap),box-shadow .25s}
[data-theme="light"] .rep-line{background:rgba(255,255,255,.6)}
.rep-line:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(2,6,18,.32)}
.rep-line-h{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--ink)}
.rep-line-h i{width:10px;height:10px;border-radius:50%;flex:none}
.rep-count{margin-left:auto;font-size:11px;font-weight:900;color:var(--muted);background:var(--glass);border:1px solid var(--line2);border-radius:999px;padding:3px 10px}
.rep-jobs{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}
.jobchip{display:inline-flex;align-items:baseline;gap:6px;font-size:12.5px;border-radius:11px;padding:7px 10px;border:1px solid rgba(52,211,153,.4);background:rgba(52,211,153,.1);box-shadow:inset 0 1px 0 rgba(255,255,255,.25);transition:transform .15s var(--snap)}
.jobchip:hover{transform:scale(1.04)}
.jobchip b{font-weight:900}
.jobchip small{color:var(--muted);font-variant-numeric:tabular-nums}
.rep-empty{color:var(--faint);font-size:12.5px}
.prob-wrap{display:grid;gap:9px;margin-top:11px}
.prob-card{border-radius:15px;padding:12px 14px;border:1px solid rgba(251,113,133,.45);background:linear-gradient(180deg,rgba(251,113,133,.13),rgba(251,113,133,.05));box-shadow:inset 3px 0 0 var(--bad),inset 0 1px 0 rgba(255,255,255,.25)}
.prob-h{font-weight:900;font-size:13.5px}
.prob-defect{margin-top:5px;font-size:13px;line-height:1.55;color:var(--ink)}
.prob-meta{margin-top:6px;font-size:11.5px;color:var(--muted);font-variant-numeric:tabular-nums}
.tot-strip{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:11px}
.tot-strip>div{border-radius:14px;padding:11px 6px;text-align:center;border:1px solid var(--line2);background:linear-gradient(180deg,var(--glass2),var(--glass));box-shadow:inset 0 1px 0 rgba(255,255,255,.3)}
.tot-strip b{display:block;font-size:22px;font-weight:900;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.tot-strip span{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.tot-strip .bad b{color:var(--bad)}
.msgcap{display:flex;align-items:center;gap:8px;margin:14px 0 0;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.msgcap::after{content:"";flex:1;height:1px;background:var(--line2)}
.report-pre{border-left:3px solid rgba(45,212,191,.6)}
.fchips{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
.fchips:empty{display:none}
.fchips button{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:800;border-radius:999px;padding:7px 8px 7px 12px;cursor:pointer;color:var(--ink);border:1px solid var(--line2);background:linear-gradient(180deg,var(--glass2),var(--glass));box-shadow:inset 0 1px 0 rgba(255,255,255,.3);transition:transform .15s var(--snap)}
.fchips button:hover{transform:scale(1.05);border-color:var(--bad)}
.fchips button span{opacity:.6}
tbody tr:nth-child(even){background:rgba(148,178,255,.05)}
.findrow{display:grid;grid-template-columns:1fr 170px auto auto;gap:8px}
.find-main{border-width:1.5px;border-radius:15px}
.adv{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}
.adv.hide{display:none}
.toolbar.console .field{background:rgba(2,6,18,.45);border-radius:12px}
[data-theme="light"] .toolbar.console .field{background:rgba(255,255,255,.7)}
#btn-adv.on{background:linear-gradient(135deg,rgba(59,130,246,.7),rgba(139,92,246,.7));color:#fff;border-color:rgba(255,255,255,.35)}
@media(max-width:860px){.findrow{grid-template-columns:1fr 1fr}.adv{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.findrow{grid-template-columns:1fr}.adv{grid-template-columns:1fr}}
tbody tr:hover td:first-child{box-shadow:inset 3px 0 0 var(--brand)}
thead th{background:color-mix(in srgb,var(--card-solid) 88%,transparent);border-bottom:2px solid transparent;border-image:linear-gradient(90deg,var(--brand),var(--brand2),var(--teal)) 1}
.rcard-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-bottom:10px;margin-bottom:4px;border-bottom:1px dashed var(--line2)}
.rcard-head .rdate{margin-left:auto;font-size:11px;color:var(--muted)}
.rcallout{margin-top:10px;font-size:12.5px;line-height:1.55;border-radius:11px;padding:9px 11px;border:1px solid rgba(251,113,133,.4);background:rgba(251,113,133,.09)}
@media(max-width:860px){.tot-strip{grid-template-columns:repeat(3,1fr)}}
body[data-view="overview"] #sec-summary,body[data-view="overview"] #sec-records,body[data-view="overview"] #records-meta,body[data-view="overview"] section.tablewrap{display:none}
body[data-view="summary"] #sec-overview,body[data-view="summary"] #kpis,body[data-view="summary"] section.grid2,body[data-view="summary"] #sec-records,body[data-view="summary"] #records-meta,body[data-view="summary"] section.tablewrap{display:none}
body[data-view="records"] #sec-overview,body[data-view="records"] #kpis,body[data-view="records"] section.grid2,body[data-view="records"] #sec-summary{display:none}
</style>
</head>
<body>
<div class="bg-stage" aria-hidden="true"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div></div>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="i-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></symbol>
<symbol id="i-alert" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
<symbol id="i-sync" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></symbol>
<symbol id="i-dl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></symbol>
<symbol id="i-factory" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V10l6 4v-4l6 4V6l6 4v11H3ZM7 17h2m4 0h2m4 0h2"/></symbol>
<symbol id="i-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/></symbol>
<symbol id="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></symbol>
<symbol id="i-inbox" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z"/></symbol>
<symbol id="i-out" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></symbol>
<symbol id="i-doc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></symbol>
<symbol id="i-rows" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></symbol>
<symbol id="i-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></symbol>
<symbol id="i-txt" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></symbol>
<symbol id="i-sliders" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h10M18 8h2M4 16h4M12 16h8"/><circle cx="16" cy="8" r="2"/><circle cx="10" cy="16" r="2"/></symbol>
<symbol id="i-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6"/></symbol>
<symbol id="i-night" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></symbol>
</defs></svg>
<div class="login-veil" id="login-veil"><div class="login-card" id="login-card"><div class="logo"><svg width="26" height="26"><use href="#i-factory"/></svg></div><h2>QC Pulse sign in</h2><p>Enter your Telegram username.<br />You will only see your own inspections and summaries.</p><label class="login-input"><svg width="17" height="17"><use href="#i-search"/></svg><input id="login-name" placeholder="e.g. G1ASS" autocomplete="username" /></label><div class="login-err" id="login-err">Username not found in reports. Check spelling (without @ also works).</div><button class="gbtn primary" id="btn-login">Sign in as QC</button><button class="login-mgr" id="btn-mgr">Manager - view all QCs</button></div></div>
<header class="topbar"><div class="topbar-inner">
<div class="logo"><svg width="22" height="22"><use href="#i-factory"/></svg></div>
<div class="brand"><h1>QC Pulse</h1><p>Factory QC Command Center · Asia/Bangkok</p></div>
<div class="spacer"></div>
<nav class="nav" id="nav" aria-label="Sections">
<span class="ind" id="nav-ind"></span>
<a href="#sec-overview" data-sec="sec-overview" class="on"><svg width="15" height="15"><use href="#i-grid"/></svg><span>Overview</span></a>
<a href="#sec-summary" data-sec="sec-summary"><svg width="15" height="15"><use href="#i-doc"/></svg><span>Summary</span></a>
<a href="#sec-records" data-sec="sec-records"><svg width="15" height="15"><use href="#i-rows"/></svg><span>Records</span></a>
</nav>
<span class="pill hide-sm" id="pill-health"><span class="dot" id="health-dot"></span><span id="health-txt">Connecting…</span></span>
<span class="pill hide-sm mono" id="pill-clock">—</span>
<span class="pill" id="pill-user" style="display:none"></span>
<button class="iconbtn" id="btn-logout" title="Log out" aria-label="Log out" style="display:none"><svg width="18" height="18"><use href="#i-out"/></svg></button>
<button class="iconbtn" id="btn-theme" title="Toggle theme" aria-label="Toggle theme"><svg width="18" height="18"><use href="#i-moon" id="theme-ic"/></svg></button>
<button class="gbtn primary hide-sm" id="btn-export-top"><svg width="16" height="16"><use href="#i-dl"/></svg>Export</button>
</div></header>
<main class="container">
<section class="hero reveal" id="sec-overview"><div class="hero-grid">
<div><h2 id="hero-title">Today's quality at a glance</h2><p class="sub">Live from Telegram QC reports to Postgres to Sheets. Filter, inspect every record, and export production-ready Excel in one tap — from 4K monitors to factory phones.</p>
<div class="hero-meta"><span class="chip"><svg width="14" height="14"><use href="#i-cal"/></svg><span id="hero-date">—</span></span><span class="chip"><svg width="14" height="14"><use href="#i-sync"/></svg><span id="hero-sync">Sheets: —</span></span><span class="chip"><svg width="14" height="14"><use href="#i-grid"/></svg><span id="hero-total">— records</span></span></div></div>
<div class="hero-actions"><button class="gbtn primary" id="btn-refresh"><svg width="16" height="16"><use href="#i-sync"/></svg>Refresh</button><button class="gbtn" id="btn-export"><svg width="16" height="16"><use href="#i-dl"/></svg>Export .xlsx</button></div>
</div></section>
<section class="grid2 reveal">
<div class="panel"><h3>Inspection trend</h3><p class="desc">Volume per inspection day (from loaded records, animated)</p><div class="bars" id="bars"></div></div>
<div class="panel"><h3>Quality split</h3><p class="desc">OK vs NG vs pending result</p><div class="donut-wrap"><svg id="donut" width="150" height="150" viewBox="0 0 42 42" role="img" aria-label="Quality split"></svg><div class="legend" id="legend"></div></div></div>
</section>
<section class="kpis" id="kpis" aria-live="polite"></section>

<section class="panel reveal report" id="sec-summary" style="margin:0 0 13px">
<div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">
<div style="min-width:220px;flex:1"><div class="overline">Factory report</div><h3>Daily work summary — what QC did today</h3><p class="desc" style="margin:2px 0 0">Cutting / Border / Hole / Cleaning / Packing / Special + problems + totals. Same factory format. Night = picked date 20:00 to next day 08:00. Toggle auto-picks the active night.</p></div>
<label class="field" style="max-width:190px"><svg width="16" height="16"><use href="#i-cal"/></svg><input id="s-date" type="date" aria-label="Summary date" /></label>
<label class="field" style="max-width:150px"><svg width="16" height="16"><use href="#i-clock"/></svg><select id="s-shift" aria-label="Summary shift"><option value="">All shifts</option><option value="A">Shift A</option><option value="B">Shift B</option><option value="C">Shift C</option><option value="N">Night</option></select></label>
<button class="gbtn primary" id="btn-sum"><svg width="16" height="16"><use href="#i-grid"/></svg>Generate</button>
<button class="gbtn" id="btn-night">Night 20-08</button>
<button class="gbtn" id="btn-copy"><svg width="15" height="15"><use href="#i-copy"/></svg>Copy text</button>
<button class="gbtn" id="btn-sumtxt"><svg width="15" height="15"><use href="#i-txt"/></svg>Open .txt</button>
</div>
<div id="sum-cards"></div>
<div class="msgcap"><span>Factory message preview</span></div>
<pre class="sum-pre report-pre" id="sum-text">Tap Generate — defaults to today (Bangkok).</pre>
</section>
<section class="toolbar reveal console" id="sec-records"><div class="overline">Records console</div><div class="findrow">
<label class="field find-main"><svg width="16" height="16"><use href="#i-search"/></svg><input id="f-job" placeholder="Job number — e.g. CT-141" aria-label="Job number" /></label>
<label class="field"><svg width="16" height="16"><use href="#i-cal"/></svg><input id="f-date" type="date" aria-label="Date" /></label>
<button class="gbtn" id="btn-adv"><svg width="16" height="16"><use href="#i-sliders"/></svg>Filters</button>
<button class="gbtn primary" id="btn-search"><svg width="16" height="16"><use href="#i-search"/></svg>Search</button>
</div>
<div class="adv" id="advfilters">
<label class="field"><svg width="16" height="16"><use href="#i-factory"/></svg><input id="f-factory" placeholder="Factory — e.g. Factory 2" aria-label="Factory" /></label>
<label class="field"><svg width="16" height="16"><use href="#i-grid"/></svg><input id="f-machine" placeholder="Machine No" aria-label="Machine" /></label>
<label class="field"><svg width="16" height="16"><use href="#i-grid"/></svg><input id="f-user" placeholder="QC user - e.g. G1ASS" aria-label="QC user" /></label>
<label class="field"><svg width="16" height="16"><use href="#i-clock"/></svg><select id="f-shift" aria-label="Shift"><option value="">All shifts</option><option value="A">Shift A</option><option value="B">Shift B</option><option value="C">Shift C</option><option value="N">Night</option></select></label>
<label class="field"><svg width="16" height="16"><use href="#i-alert"/></svg><select id="f-status" aria-label="Status"><option value="">All statuses</option><option value="Unfinished">Unfinished</option><option>OK</option><option>NG</option></select></label>
<button class="gbtn" id="btn-reset">Reset</button>
</div>
<div class="fchips" id="fchips"></div>
<div class="seg" role="tablist"><button id="view-table" class="on"><svg width="15" height="15"><use href="#i-grid"/></svg>Table</button><button id="view-cards"><svg width="15" height="15"><use href="#i-inbox"/></svg>Cards</button></div>
</section>
<div class="meta" id="records-meta"><span id="meta-count" class="mono">—</span><span>·</span><span>Tap any row for full Telegram source</span><span class="spacer" style="flex:1"></span><span id="meta-page" class="mono"></span></div>
<section class="tablewrap reveal">
<div class="tscroll" id="tscroll"><table id="tbl"><thead><tr><th>Date</th><th>Job</th><th>Factory / Process</th><th>Machine</th><th>Model</th><th>Colour</th><th>QC</th><th>Result</th><th>Status</th><th>Remark</th><th>Qty insp/found/NG</th><th>Shift</th><th>Time</th><th>User</th><th>Sync</th></tr></thead><tbody id="rows"></tbody></table><div class="cards" id="mcards"></div><div class="skel" id="skel"><div class="sk"></div><div class="sk"></div><div class="sk"></div></div><div class="empty" id="empty" style="display:none"><svg width="42" height="42"><use href="#i-inbox"/></svg><div style="font-weight:800;color:var(--ink)">No inspections match</div><div>Try clearing filters or picking another date.</div></div></div>
<div class="pager"><button class="gbtn" id="prev">Prev</button><button class="gbtn" id="next">Next</button><span class="mono" id="pageinfo"></span><span style="flex:1"></span><button class="gbtn" id="btn-export2"><svg width="15" height="15"><use href="#i-dl"/></svg>Export filtered .xlsx</button></div>
</section>
<footer><span>QC Pulse · Telegram to Postgres to Sheets to Excel · <span id="foot-health">checking…</span></span><span class="mono" id="foot-time"></span></footer>
</main>
<div class="modal" id="modal" role="dialog" aria-modal="true"><div class="backdrop" id="mback"></div><div class="sheet"><div style="display:flex;gap:10px;align-items:center"><div class="logo" style="width:36px;height:36px"><svg width="18" height="18"><use href="#i-factory"/></svg></div><div><div id="m-title" style="font-weight:900">Inspection</div><div id="m-sub" style="font-size:12px;color:var(--muted)">—</div></div><div style="flex:1"></div><button class="iconbtn" id="mclose" aria-label="Close"><svg width="16" height="16"><use href="#i-x"/></svg></button></div><div id="m-body"></div></div></div>
<nav class="dock" id="dock" aria-label="App sections">
<button data-go="sec-overview" class="on"><svg width="20" height="20"><use href="#i-grid"/></svg>Overview</button>
<button data-go="sec-summary"><svg width="20" height="20"><use href="#i-doc"/></svg>Summary</button>
<button data-go="sec-records"><svg width="20" height="20"><use href="#i-rows"/></svg>Records</button>
<button id="dock-export"><svg width="20" height="20"><use href="#i-dl"/></svg>Export</button>
</nav>
<div class="toast" id="toast"></div>
<script>
var S={page:0,limit:50,total:0,rows:[],all:[],view:"auto",night:false};
function $(id){return document.getElementById(id)}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function fmtDate(iso){try{return String(iso).slice(0,10).split("-").reverse().join("/")}catch(e){return iso}}
function fmtDT(iso){try{var d=new Date(iso);var p=function(n){return String(n).padStart(2,"0")};return p(d.getDate())+"/"+p(d.getMonth()+1)+"/"+d.getFullYear()+", "+p(d.getHours())+":"+p(d.getMinutes())}catch(e){return iso}}
function toast(m){var t=$("toast");t.textContent=m;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("show")},2600)}
function bkkNow(){try{return new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Bangkok",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(new Date())}catch(e){return new Date().toLocaleString()}}
setInterval(function(){$("pill-clock").textContent=bkkNow()+" (BKK)";$("foot-time").textContent=bkkNow()},1000);
(function theme(){var k="qc-theme";try{var v=localStorage.getItem(k);if(v)document.documentElement.setAttribute("data-theme",v)}catch(e){}syncIc();$("btn-theme").onclick=function(){var c=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",c);try{localStorage.setItem(k,c)}catch(e){}syncIc()};function syncIc(){var d=document.documentElement.getAttribute("data-theme")==="dark";$("theme-ic").setAttribute("href",d?"#i-sun":"#i-moon")}})();
function countUp(el,to){try{el.textContent=to}catch(e){}var t0=null,dur=900;function f(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/dur);var e=1-Math.pow(1-p,3);el.textContent=Math.round(to*e);if(p<1)requestAnimationFrame(f)}requestAnimationFrame(f)}
function me(){try{return (localStorage.getItem("qc-user")||"").replace(/^@/,"").trim()}catch(e){return ""}}
function isMgr(){try{return localStorage.getItem("qc-mgr")==="1"}catch(e){return false}}
function effUser(){return isMgr()?"":me()}
function qs(page){var p=new URLSearchParams();if($("f-date").value)p.set("date",$("f-date").value);if($("f-factory").value.trim())p.set("factory",$("f-factory").value.trim());if($("f-job").value.trim())p.set("jobNumber",$("f-job").value.trim());if($("f-machine").value.trim())p.set("machineNumber",$("f-machine").value.trim());if($("f-user").value.trim())p.set("user",$("f-user").value.trim().replace(/^@/,""));if($("f-shift").value)p.set("shift",$("f-shift").value);if($("f-status").value)p.set("status",$("f-status").value);if(effUser())p.set("user",effUser());p.set("limit",String(S.limit));p.set("offset",String(page*S.limit));return p.toString()}
function qsexp(){var p=new URLSearchParams();if($("f-date").value)p.set("date",$("f-date").value);if($("f-factory").value.trim())p.set("factory",$("f-factory").value.trim());if($("f-job").value.trim())p.set("jobNumber",$("f-job").value.trim());if($("f-machine").value.trim())p.set("machineNumber",$("f-machine").value.trim());if($("f-user").value.trim())p.set("user",$("f-user").value.trim().replace(/^@/,""));if($("f-shift").value)p.set("shift",$("f-shift").value);if($("f-status").value)p.set("status",$("f-status").value);if(effUser())p.set("user",effUser());return p.toString()}
function kpiCard(ic,bg,label,val,sub,c){return '<div class="kpi" style="--c:'+c+'"><div class="kpi-top"><span class="kpi-ic" style="background:'+bg+'"><svg width="17" height="17"><use href="#'+ic+'"/></svg></span><h3>'+label+'</h3></div><p class="val" data-v="'+val+'">0</p><p class="sub">'+sub+'</p></div>'}
async function loadAll(){
  try{
    var h=await fetch("/health").then(function(r){return r.json()});
    var ok=h.status==="ok"&&h.database==="connected";
    $("health-dot").className="dot "+(ok?"live":"bad");$("health-txt").textContent=ok?"Live · DB connected":"Degraded";$("foot-health").textContent="DB "+h.database+" · Telegram "+h.telegram+" · Sheets "+h.sheets;
  }catch(e){$("health-dot").className="dot bad";$("health-txt").textContent="Offline"}
  try{
    var s=await fetch("/api/admin/stats"+(effUser()?"?user="+encodeURIComponent(effUser()):"")).then(function(r){return r.json()});
    var t=s.today||{};
    $("hero-date").textContent="Bangkok · "+(t.date||"today");
    $("hero-sync").textContent="Sheets pending "+(s.pendingSync||0)+" · failed "+(s.failedSync||0);
    var cards=kpiCard("i-grid","linear-gradient(135deg,#3b82f6,#8b5cf6)","Today total",t.total||0,(t.byFactory||[]).map(function(f){return esc(f.factory)}).join(" · ")||"all factories","#3b82f6")+kpiCard("i-check","linear-gradient(135deg,#10b981,#34d399)","OK",t.ok||0,"passed inspections","#34d399")+kpiCard("i-x","linear-gradient(135deg,#f43f5e,#fb923c)","NG",t.ng||0,"needs action","#fb7185")+kpiCard("i-clock","linear-gradient(135deg,#f59e0b,#f97316)","Unfinished",t.unfinished||0,"still open","#fbbf24")+kpiCard("i-sync","linear-gradient(135deg,#3b82f6,#8b5cf6)","Pending sync",s.pendingSync||0,"sheets queue","#8b5cf6")+kpiCard("i-alert","linear-gradient(135deg,#64748b,#0f172a)","Failed",(s.failedSync||0)+(s.failedMessages||0),"sync + parse","#64748b");
    $("kpis").innerHTML=cards;
    var vals=document.querySelectorAll(".kpi .val");for(var i=0;i<vals.length;i++){countUp(vals[i],Number(vals[i].getAttribute("data-v")||0))}
    var kpis=document.querySelectorAll(".kpi");for(var j=0;j<kpis.length;j++){(function(el,d){setTimeout(function(){el.classList.add("in")},60*d)})(kpis[j],j)}
  }catch(e){}
  try{
    var a=await fetch("/api/qc?limit=500&offset=0"+(effUser()?"&user="+encodeURIComponent(effUser()):"")).then(function(r){return r.json()});
    S.all=a.data||[];$("hero-total").textContent=(a.total||S.all.length)+" records total";renderCharts(S.all);
  }catch(e){}
}
function renderCharts(rows){
  var byDate={};for(var i=0;i<rows.length;i++){var d=String(rows[i].inspectionDate||"").slice(0,10);byDate[d]=(byDate[d]||0)+1}
  var keys=Object.keys(byDate).sort().slice(-8);
  var max=1;for(var k=0;k<keys.length;k++){if(byDate[keys[k]]>max)max=byDate[keys[k]]}
  var html="";for(var j=0;j<keys.length;j++){var v=byDate[keys[j]];var h=Math.max(6,Math.round(v/max*128));html+='<div class="bar"><b class="mono">'+v+'</b><div class="bar-track"><div class="bar-fill" data-h="'+h+'"></div></div><span>'+keys[j].slice(5).replace("-","/")+'</span></div>'}
  $("bars").innerHTML=html||'<div class="empty">No data yet</div>';
  requestAnimationFrame(function(){requestAnimationFrame(function(){var f=document.querySelectorAll(".bar-fill");for(var q=0;q<f.length;q++){f[q].style.height=f[q].getAttribute("data-h")+"px"}})});setTimeout(function(){var f=document.querySelectorAll(".bar-fill");for(var q=0;q<f.length;q++){if(!f[q].style.height||f[q].style.height==="0px")f[q].style.height=f[q].getAttribute("data-h")+"px"}},1600);
  var ok=0,ng=0,na=0;for(var m=0;m<rows.length;m++){var r=String(rows[m].qcResult||"").toUpperCase();if(r==="OK")ok++;else if(r==="NG")ng++;else na++}
  var tot=Math.max(1,ok+ng+na);var p1=(ok/tot*100),p2=(ng/tot*100);
  $("donut").innerHTML='<circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--bg2)" stroke-width="6"/><circle cx="21" cy="21" r="15.9155" fill="none" stroke="#34d399" stroke-width="6" stroke-dasharray="'+p1+' '+(100-p1)+'" stroke-dashoffset="25" stroke-linecap="round"><animate attributeName="stroke-dasharray" from="0 100" to="'+p1+' '+(100-p1)+'" dur="1s" fill="freeze"/></circle><circle cx="21" cy="21" r="15.9155" fill="none" stroke="#fb7185" stroke-width="6" stroke-dasharray="'+p2+' '+(100-p2)+'" stroke-dashoffset="'+(25-p1)+'" stroke-linecap="round"/><text x="21" y="22" text-anchor="middle" font-size="7" font-weight="900" fill="var(--ink)">'+Math.round(p1)+'%</text><text x="21" y="27" text-anchor="middle" font-size="3.4" fill="var(--muted)">OK rate</text>';
  $("legend").innerHTML='<div><i style="background:#34d399;color:#34d399"></i><b class="mono">'+ok+'</b> OK</div><div><i style="background:#fb7185;color:#fb7185"></i><b class="mono">'+ng+'</b> NG</div><div><i style="background:var(--line2);color:transparent"></i><b class="mono">'+na+'</b> no result</div>';
}
function pillResult(r){if(r==="OK")return '<span class="badge b-ok"><svg width="12" height="12"><use href="#i-check"/></svg>OK</span>';if(r==="NG")return '<span class="badge b-ng"><svg width="12" height="12"><use href="#i-x"/></svg>NG</span>';return '<span class="badge b-na">—</span>'}
function pillStatus(s){if(!s)return '<span style="color:var(--muted)">—</span>';if(String(s).toLowerCase()==="unfinished")return '<span class="badge b-un"><svg width="12" height="12"><use href="#i-clock"/></svg>Unfinished</span>';return '<span class="badge b-na">'+esc(s)+'</span>'}
function qtyStr(x){if(x.inspectionQty==null&&x.foundQty==null&&x.totalNg==null)return "—";return (x.inspectionQty==null?"—":x.inspectionQty)+"/"+(x.foundQty==null?"—":x.foundQty)+"/"+(x.totalNg==null?"—":x.totalNg)}
function renderChips(){var defs=[["f-date",""],["f-factory",""],["f-job",""],["f-machine","M "],["f-user","@"],["f-shift",""],["f-status",""]];var h="";for(var i=0;i<defs.length;i++){var el=document.getElementById(defs[i][0]);if(!el||!el.value)continue;var v=(el.tagName==="SELECT")?el.options[el.selectedIndex].text:el.value;h+='<button data-f="'+defs[i][0]+'">'+esc(defs[i][1]+v)+'<span>\u00d7</span></button>'}document.getElementById("fchips").innerHTML=h;var bs=document.querySelectorAll("#fchips button");for(var k=0;k<bs.length;k++){bs[k].onclick=function(){var f=document.getElementById(this.getAttribute("data-f"));if(f){f.value="";S.page=0;loadRows()}}}}
async function loadRows(){
  $("skel").style.display="grid";$("empty").style.display="none";$("rows").innerHTML="";$("mcards").innerHTML="";
  try{
    var r=await fetch("/api/qc?"+qs(S.page)).then(function(x){return x.json()});
    S.total=r.total||0;S.rows=r.data||[];
    $("skel").style.display="none";
    if(!S.rows.length){$("empty").style.display="block"}
    var html="";
    for(var i=0;i<S.rows.length;i++){var x=S.rows[i];
      html+='<tr data-i="'+i+'"><td class="mono">'+fmtDate(x.inspectionDate)+'</td><td><span class="job">'+esc(x.jobNumber)+'</span><div style="font-size:11px;color:var(--muted)">'+esc(x.inspectionType||"")+'</div></td><td>'+esc(x.factory)+'<div style="font-size:11px;color:var(--muted)">'+esc(x.process||"")+'</div></td><td class="mono"><b>M'+esc(x.machineNumber||"—")+'</b><div style="font-size:11px;color:var(--muted)">No. '+esc(x.number||"—")+'</div></td><td class="mono">'+esc(x.modelNumber||"—")+'</td><td>'+(x.colour?esc(x.colour):"—")+'</td><td class="mono">'+esc(x.qcCheck||"—")+'</td><td>'+pillResult(x.qcResult)+'</td><td>'+pillStatus(x.status)+'</td><td>'+(x.defectRemark?'<span class="remark" title="'+esc(x.defectRemark)+'">'+esc(x.defectRemark)+'</span>':'<span style="color:var(--muted)">—</span>')+'</td><td class="mono">'+qtyStr(x)+'</td><td>'+(x.shift?esc(x.shift):"—")+'</td><td class="mono">'+esc(x.inspectionTime||"—")+'</td><td>'+(x.telegramUsername?"@"+esc(x.telegramUsername):"—")+'</td><td><span class="badge b-sync">'+esc(x.sheetSyncStatus||"")+'</span>'+(isMgr()?'<button class="iconbtn delbtn" data-del="'+x.id+'" title="Delete this record"><svg width="14" height="14"><use href="#i-trash"/></svg></button>':"")+'</td></tr>';
    }
    $("rows").innerHTML=html;
    var mh="";for(var j=0;j<S.rows.length;j++){var y=S.rows[j];
mh+='<div class="rcard" data-i="'+j+'"><div class="rcard-head"><span class="job">'+esc(y.jobNumber)+'</span>'+(isMgr()?'<button class="iconbtn delbtn" data-del="'+y.id+'" title="Delete"><svg width="14" height="14"><use href="#i-trash"/></svg></button>':"")+pillResult(y.qcResult)+pillStatus(y.status)+'<span class="mono rdate">'+fmtDate(y.inspectionDate)+'</span></div><div class="rcard-grid"><div><b>Factory</b>'+esc(y.factory)+' · '+esc(y.process||"")+'</div><div><b>Machine</b>M'+esc(y.machineNumber||"—")+' · No.'+esc(y.number||"—")+'</div><div><b>Model</b>'+esc(y.modelNumber||"—")+'</div><div><b>Colour</b>'+(y.colour?esc(y.colour):"—")+'</div><div><b>Time</b>'+esc(y.inspectionTime||"—")+(y.shift?" · "+esc(y.shift):"")+'</div><div><b>Qty</b>'+(((y.inspectionQty!=null||y.foundQty!=null||y.totalNg!=null)?qtyStr(y):"—"))+'</div><div><b>User</b>'+(y.telegramUsername?"@"+esc(y.telegramUsername):"—")+'</div><div><b>Sync</b>'+esc(y.sheetSyncStatus||"")+'</div></div>'+(y.defectRemark?'<div class="rcallout">'+esc(y.defectRemark)+'</div>':"")+'</div>'}
$("mcards").innerHTML=mh;
    var trs=document.querySelectorAll("tr[data-i],.rcard[data-i]");for(var k=0;k<trs.length;k++){trs[k].onclick=function(){openModal(Number(this.getAttribute("data-i")))}}
    var dels=document.querySelectorAll("[data-del]");for(var d=0;d<dels.length;d++){dels[d].onclick=function(e){if(e)e.stopPropagation();delOne(this.getAttribute("data-del"))}}
    var pages=Math.max(1,Math.ceil(S.total/S.limit));
    $("meta-count").textContent=S.total+" inspections · page "+(S.page+1)+" / "+pages;
    $("pageinfo").textContent=(S.page*S.limit+1)+"–"+Math.min(S.total,(S.page+1)*S.limit)+" of "+S.total;
    $("meta-page").textContent="limit "+S.limit+" / page";renderChips();
    applyView();
  }catch(e){$("skel").style.display="none";toast("Failed to load rows — is the DB up?")}
}
function applyView(){var w=window.innerWidth;var v=S.view;if(v==="auto"){if(w<=860){$("tbl").style.display="none";$("mcards").style.display="grid"}else{$("tbl").style.display="";$("mcards").style.display=""}}else if(v==="cards"){$("tbl").style.display="none";$("mcards").style.display="grid"}else{$("tbl").style.display="";$("mcards").style.display=""}}
window.addEventListener("resize",applyView);
function openModal(i){var x=S.rows[i];if(!x)return;$("m-title").textContent=x.jobNumber+" · M"+(x.machineNumber||"—");$("m-sub").textContent=fmtDate(x.inspectionDate)+" · "+(x.factory||"")+" · "+(x.process||"");$("m-body").innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">'+pillResult(x.qcResult)+pillStatus(x.status)+'<span class="badge b-sync">'+esc(x.sheetSyncStatus||"")+'</span></div><dl class="kv"><dt>Inspection</dt><dd>'+esc(x.inspectionType||"")+'</dd><dt>Job / Number</dt><dd class="mono">'+esc(x.jobNumber)+' / '+esc(x.number||"—")+'</dd><dt>Model / Colour</dt><dd class="mono">'+esc(x.modelNumber||"—")+' / '+esc(x.colour||"—")+'</dd><dt>Machine / Time</dt><dd class="mono">M'+esc(x.machineNumber||"—")+' · '+esc(x.inspectionTime||"—")+'</dd><dt>QC check</dt><dd>'+esc(x.qcCheck||"—")+'</dd><dt>Defect</dt><dd>'+esc(x.defectRemark||"—")+'</dd><dt>Shift / Qty</dt><dd class="mono">'+esc(x.shift||"—")+' · insp '+esc(x.inspectionQty==null?"—":x.inspectionQty)+' · found '+esc(x.foundQty==null?"—":x.foundQty)+' · NG '+esc(x.totalNg==null?"—":x.totalNg)+'</dd><dt>Telegram</dt><dd>'+(x.telegramUsername?"@"+esc(x.telegramUsername):"—")+' · '+fmtDT(x.receivedAt)+'</dd></dl><div class="orig">'+esc(x.originalMessage||"")+'</div>';$("modal").classList.add("open")}
$("mclose").onclick=function(){$("modal").classList.remove("open")};$("mback").onclick=function(){$("modal").classList.remove("open")};document.addEventListener("keydown",function(e){if(e.key==="Escape")$("modal").classList.remove("open")});
function admToken(){try{return sessionStorage.getItem("qc-adm")||""}catch(e){return ""}}
function needToken(){var t=admToken();if(t)return t;var v=prompt("Manager token (ADMIN_TOKEN from the server settings):");if(v){try{sessionStorage.setItem("qc-adm",v)}catch(e){}return v}return ""}
async function delOne(id){var x=null;for(var i=0;i<S.rows.length;i++){if(S.rows[i].id===id)x=S.rows[i]}var label=x?(x.jobNumber+" M"+(x.machineNumber||"-")+" "+fmtDate(x.inspectionDate)):"this record";if(!confirm("Delete "+label+"? Also removes its sheet row."))return;var tok=needToken();if(!tok)return;try{var r=await fetch("/api/qc/"+id,{method:"DELETE",headers:{"Authorization":"Bearer "+tok}}).then(function(a){return a.json()});if(!r.ok)throw new Error(r.error||"failed");toast("Deleted."+(r.sheetRemoved?" Sheet row removed.":" Sheet row not found."));loadAll();loadRows();loadSummary()}catch(e){toast("Delete failed: "+e.message)}}
async function delFiltered(){if(!S.total){toast("Nothing to delete");return}if(!confirm("Delete all "+S.total+" filtered records? This cannot be undone. Sheet rows are removed too."))return;var tok=needToken();if(!tok)return;try{var q=qsexp();var r=await fetch("/api/qc?"+q,{method:"DELETE",headers:{"Authorization":"Bearer "+tok}}).then(function(a){return a.json()});if(!r.ok)throw new Error(r.error||"failed");S.page=0;toast("Deleted "+r.deleted+". Sheet rows removed: "+r.sheetRemoved+".");loadAll();loadRows();loadSummary()}catch(e){toast("Delete failed: "+e.message)}}
function doExport(){var q=qsexp();toast("Building Excel…");window.location.href="/api/qc/export.xlsx?"+q}
$("btn-search").onclick=function(){S.page=0;loadRows()};
document.getElementById("btn-adv").onclick=function(){var a=document.getElementById("advfilters");var hide=a.classList.toggle("hide");this.classList.toggle("on",!hide)};
try{if(window.innerWidth<=860)document.getElementById("advfilters").classList.add("hide")}catch(e){};
$("btn-reset").onclick=function(){$("f-date").value="";$("f-factory").value="";$("f-job").value="";$("f-machine").value="";if(!effUser())$("f-user").value="";$("f-shift").value="";$("f-status").value="";S.page=0;loadRows()};
$("btn-export").onclick=doExport;$("btn-export2").onclick=doExport;
var bulkBtn=document.createElement("button");bulkBtn.className="gbtn danger";bulkBtn.id="btn-bulkdel";bulkBtn.innerHTML="Delete filtered";bulkBtn.style.display="none";bulkBtn.onclick=delFiltered;document.querySelector(".pager").appendChild(bulkBtn);$("btn-export-top").onclick=doExport;
$("btn-refresh").onclick=function(){loadAll();loadRows();toast("Refreshing live data…")};
$("prev").onclick=function(){if(S.page>0){S.page--;loadRows();$("tscroll").scrollTop=0}};
$("next").onclick=function(){S.page++;loadRows();$("tscroll").scrollTop=0};
$("view-table").onclick=function(){S.view="table";$("view-table").classList.add("on");$("view-cards").classList.remove("on");applyView()};
$("view-cards").onclick=function(){S.view="cards";$("view-cards").classList.add("on");$("view-table").classList.remove("on");applyView()};
var deb=null;["f-factory","f-job","f-machine","f-user"].forEach(function(id){$(id).addEventListener("input",function(){clearTimeout(deb);deb=setTimeout(function(){S.page=0;loadRows()},450)})});
$("f-date").addEventListener("change",function(){S.page=0;loadRows()});$("f-status").addEventListener("change",function(){S.page=0;loadRows()});$("f-shift").addEventListener("change",function(){S.page=0;loadRows()});
function bkkHour(){try{return Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Bangkok",hour:"2-digit",hour12:false}).format(new Date()))}catch(e){return new Date().getHours()}}
function sumToday(){try{return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Bangkok",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}catch(e){var d=new Date();var p=function(n){return String(n).padStart(2,"0")};return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())}}
function nightDefault(){var h=bkkHour();try{var parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Bangkok",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());if(h<20){var t=new Date(parts+"T12:00:00Z");t.setUTCDate(t.getUTCDate()-1);return t.toISOString().slice(0,10)}return parts}catch(e){return sumToday()}}
function sumPath(){return S.night?"/api/qc/summary/night?date=":"/api/qc/summary?date="}
async function loadSummary(){var d=document.getElementById("s-date").value||(S.night?nightDefault():sumToday());document.getElementById("sum-text").textContent="Building "+d+"...";try{var s=await fetch(sumPath()+d+(effUser()?"&user="+encodeURIComponent(effUser()):"")+(document.getElementById("s-shift").value?"&shift="+encodeURIComponent(document.getElementById("s-shift").value):"")).then(function(r){return r.json()});var D=s.data;if(!D){throw 0}document.getElementById("sum-text").textContent=D.text;var order=[["cutting","Cutting","#f472b6"],["border","Border","#fb923c"],["hole","Hole","#60a5fa"],["cleaning","Cleaning","#34d399"],["packing","Packing","#a78bfa"],["special","Special","#94a3b8"]];
var h="";
for(var i=0;i<order.length;i++){var k=order[i][0],title=order[i][1],col=order[i][2];var jobs=D.lines[k]||[];
h+='<div class="rep-line"><div class="rep-line-h"><i style="background:'+col+';box-shadow:0 0 10px '+col+'"></i>'+title+'<span class="rep-count">'+(D.lineCounts[k]||0)+'</span></div>';
if(!jobs.length){h+='<span class="rep-empty">—</span>'}else{h+='<div class="rep-jobs">';for(var j=0;j<jobs.length;j++){h+='<span class="jobchip"><b>'+esc(jobs[j].jobNumber)+'</b><small>('+jobs[j].numbers.map(esc).join(",")+')</small></span>'}h+='</div>'}
h+='</div>'}
if(D.problems.length){h+='<div class="prob-wrap">';for(var p=0;p<Math.min(6,D.problems.length);p++){var q=D.problems[p];h+='<div class="prob-card"><div class="prob-h">'+esc(q.jobNumber)+\' · No.'+esc(q.number||"-")+'</div>'+(q.defectRemark?'<div class="prob-defect">'+esc(q.defectRemark)+'</div>':"")+'<div class="prob-meta">'+esc(q.qcResult||"")+' · '+esc(q.inspectionTime||"")+'</div></div>'}if(D.problems.length>6){h+='<div class="rep-empty">+'+(D.problems.length-6)+' more in message below</div>'}h+='</div>'}
h+='<div class="tot-strip"><div><b>'+D.total+'</b><span>Total</span></div><div><b>'+D.lineCounts.hole+'</b><span>Hole</span></div><div><b>'+D.lineCounts.cutting+'</b><span>Cutting</span></div><div><b>'+D.lineCounts.border+'</b><span>Border</span></div><div class="'+(D.ng?"bad":"")+'"><b>'+D.ng+'</b><span>NG</span></div>'+(D.unfinished?'<div><b>'+D.unfinished+'</b><span>Unfin.</span></div>':"")+'</div>';
document.getElementById("sum-cards").innerHTML=h;if(S.night&&D.total===0)toast("Empty night - it starts 20:00 on the picked date; for last night pick yesterday")}catch(e){document.getElementById("sum-text").textContent="Failed."}}
document.getElementById("btn-sum").onclick=loadSummary;
document.getElementById("btn-night").onclick=function(){S.night=!S.night;this.className="gbtn "+(S.night?"primary":"");try{document.getElementById("s-date").value=S.night?nightDefault():sumToday()}catch(e){}loadSummary()};
document.getElementById("btn-copy").onclick=function(){var v=document.getElementById("sum-text").textContent||"";var btn=this;if(navigator.clipboard){navigator.clipboard.writeText(v).then(function(){toast("Summary copied - paste to Telegram");btn.innerHTML="Copied";setTimeout(function(){btn.innerHTML="Copy text"},1600)})}else{toast("Copy not supported")}};
document.getElementById("btn-sumtxt").onclick=function(){var d=document.getElementById("s-date").value||(S.night?nightDefault():sumToday());window.open(sumPath()+d+"&format=text"+(effUser()?"&user="+encodeURIComponent(effUser()):"")+(document.getElementById("s-shift").value?"&shift="+encodeURIComponent(document.getElementById("s-shift").value):""),"_blank")};
function applyLogin(){var u=effUser();var mgr=isMgr();var pill=document.getElementById("pill-user");if(mgr){pill.style.display="";pill.textContent="Manager - all QCs"}else if(u){pill.style.display="";pill.textContent="@"+u}else{pill.style.display="none"}document.getElementById("btn-logout").style.display="";var f=document.getElementById("f-user");if(f){if(u){f.value=u;f.setAttribute("disabled","disabled")}else{f.value="";f.removeAttribute("disabled")}}var bb=document.getElementById("btn-bulkdel");if(bb)bb.style.display=mgr?"":"none";if(u){document.getElementById("hero-title").textContent="@"+u+" - your QC work"}}
async function validUser(u){try{var r=await fetch("/api/qc?limit=1&user="+encodeURIComponent(u)).then(function(x){return x.json()});return (r.total||0)>0}catch(e){return false}}
async function doLogin(u,mgr){u=(u||"").replace(/^@/,"").trim();if(mgr){try{localStorage.setItem("qc-mgr","1");localStorage.removeItem("qc-user")}catch(e){}document.getElementById("login-veil").style.display="none";applyLogin();boot();return}if(!u){return}document.getElementById("login-err").style.display="none";var ok=await validUser(u);if(!ok){document.getElementById("login-err").style.display="block";var card=document.getElementById("login-card");card.classList.remove("shake");void card.offsetWidth;card.classList.add("shake");return}try{localStorage.setItem("qc-user",u);localStorage.removeItem("qc-mgr")}catch(e){}document.getElementById("login-veil").style.display="none";applyLogin();boot()}
function boot(){S.page=0;loadAll();loadRows();applyView();try{document.getElementById("s-date").value=sumToday()}catch(e){}loadSummary()}
document.getElementById("btn-login").onclick=function(){doLogin(document.getElementById("login-name").value,false)};
document.getElementById("login-name").addEventListener("keydown",function(e){if(e.key==="Enter")doLogin(document.getElementById("login-name").value,false)});
document.getElementById("btn-mgr").onclick=function(){doLogin("",true)};
document.getElementById("btn-logout").onclick=function(){try{localStorage.removeItem("qc-user");localStorage.removeItem("qc-mgr")}catch(e){}location.reload()};
function moveInd(){var a=document.querySelector(".nav a.on");var ind=document.getElementById("nav-ind");if(!a||!ind)return;ind.style.left=a.offsetLeft+"px";ind.style.width=a.offsetWidth+"px"}
document.querySelectorAll(".nav a").forEach(function(a){a.addEventListener("click",function(e){if(e)e.preventDefault();setView(a.getAttribute("data-sec").replace("sec-",""))})});
window.addEventListener("resize",moveInd);
if("IntersectionObserver" in window){
  var secIO=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){var id=en.target.id;document.querySelectorAll(".nav a").forEach(function(x){x.classList.toggle("on",x.getAttribute("data-sec")===id)});moveInd()}})},{rootMargin:"-40% 0px -55% 0px"});
  ["sec-overview","sec-summary","sec-records"].forEach(function(id){var el=document.getElementById(id);if(el)secIO.observe(el)});
  var revIO=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add("in");revIO.unobserve(en.target)}})},{threshold:.05,rootMargin:"0px 0px 320px 0px"});setTimeout(function(){document.querySelectorAll(".reveal:not(.in)").forEach(function(el){el.classList.add("in")})},1500);
  document.querySelectorAll(".reveal").forEach(function(el){revIO.observe(el)});
}
moveInd();
document.querySelectorAll("#dock button[data-go]").forEach(function(b){b.addEventListener("click",function(){setView(b.getAttribute("data-go").replace("sec-",""));if(navigator.vibrate){try{navigator.vibrate(8)}catch(e){}}})});
document.getElementById("dock-export").onclick=function(){doExport();if(navigator.vibrate){try{navigator.vibrate(8)}catch(e){}}};
function dockSync(){var v=document.body.getAttribute("data-view");if(v){document.querySelectorAll("#dock button[data-go]").forEach(function(x){x.classList.toggle("on",x.getAttribute("data-go")==="sec-"+v)});return}var id=null;var secs=["sec-overview","sec-summary","sec-records"];var best=1e9;for(var i=0;i<secs.length;i++){var el=document.getElementById(secs[i]);if(!el)continue;var d=Math.abs(el.getBoundingClientRect().top-120);if(d<best){best=d;id=secs[i]}}document.querySelectorAll("#dock button[data-go]").forEach(function(x){x.classList.toggle("on",x.getAttribute("data-go")===id)})}
var dockT=null;window.addEventListener("scroll",function(){if(dockT)return;dockT=setTimeout(function(){dockT=null;dockSync()},120)},{passive:true});
function setView(v){if(v!=="overview"&&v!=="summary"&&v!=="records")v="overview";document.body.setAttribute("data-view",v);document.querySelectorAll(".nav a").forEach(function(x){x.classList.toggle("on",x.getAttribute("data-sec")==="sec-"+v)});document.querySelectorAll("#dock button[data-go]").forEach(function(x){x.classList.toggle("on",x.getAttribute("data-go")==="sec-"+v)});moveInd();try{window.scrollTo({top:0,behavior:"smooth"})}catch(e){window.scrollTo(0,0)}if(v==="overview"&&S.all&&S.all.length)renderCharts(S.all);try{if((location.hash||"")!=="#sec-"+v)history.replaceState(null,"","#sec-"+v)}catch(e){}}
try{var hv=(location.hash||"").replace("#sec-","");setView(hv||"overview")}catch(e){}
try{document.getElementById("s-date").value=sumToday()}catch(e){}
if(me()||isMgr()){document.getElementById("login-veil").style.display="none";applyLogin();boot()}
setInterval(function(){if(me()||isMgr())loadAll()},60000);
</script>
</body>
</html>`;
}
