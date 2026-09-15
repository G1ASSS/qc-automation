export function dashboardHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>QC Reports Dashboard</title>
<style>
  :root { color-scheme: light; }
  body { font-family: -apple-system, system-ui, Segoe UI, Roboto, sans-serif; margin: 0; background: #f4f6f9; color: #1a2233; }
  header { background: #1f4e79; color: #fff; padding: 16px 24px; }
  main { padding: 20px 24px; max-width: 1200px; margin: 0 auto; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 16px 0; }
  .card { background: #fff; border-radius: 10px; padding: 14px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
  .card h3 { margin: 0 0 6px; font-size: 13px; color: #5b6b82; text-transform: uppercase; letter-spacing: .04em; }
  .card p { margin: 0; font-size: 26px; font-weight: 700; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
  input, select, button { padding: 8px 10px; border-radius: 8px; border: 1px solid #c9d3e0; font-size: 14px; }
  button { background: #1f4e79; color: #fff; cursor: pointer; border: none; }
  button.secondary { background: #fff; color: #1f4e79; border: 1px solid #1f4e79; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; }
  th, td { padding: 8px 10px; border-bottom: 1px solid #e8edf3; text-align: left; font-size: 13px; }
  th { background: #eaf0f7; }
  #err { color: #b00020; }
</style>
</head>
<body>
<header><h1 style="margin:0">QC Reports Dashboard</h1><div id="sub">Today's inspections, filters &amp; Excel export</div></header>
<main>
  <div class="cards" id="cards"></div>
  <div class="toolbar">
    <input id="f-date" type="date" />
    <input id="f-factory" placeholder="Factory e.g. Factory 2" />
    <input id="f-job" placeholder="Job Number" />
    <input id="f-machine" placeholder="Machine No" />
    <input id="f-status" placeholder="Status" />
    <button id="btn-search">Search</button>
    <button id="btn-export" class="secondary">Export .xlsx</button>
  </div>
  <div id="err"></div>
  <table><thead><tr>
    <th>Date</th><th>Type</th><th>Factory</th><th>Process</th><th>Job</th><th>No</th><th>Machine</th><th>Time</th><th>QC Check</th><th>Result</th><th>Status</th><th>Sync</th>
  </tr></thead><tbody id="rows"></tbody></table>
</main>
<script>
const $ = (id) => document.getElementById(id);
function qs() {
  const p = new URLSearchParams();
  if ($('f-date').value) p.set('date', $('f-date').value);
  if ($('f-factory').value) p.set('factory', $('f-factory').value);
  if ($('f-job').value) p.set('jobNumber', $('f-job').value);
  if ($('f-machine').value) p.set('machineNumber', $('f-machine').value);
  if ($('f-status').value) p.set('status', $('f-status').value);
  p.set('limit', '100');
  return p.toString();
}
async function loadStats() {
  const r = await fetch('/api/admin/stats').then(r => r.json());
  const t = r.today || {};
  $('cards').innerHTML = [
    ['Today total', t.total ?? '-'], ['OK', t.ok ?? '-'], ['NG', t.ng ?? '-'],
    ['Unfinished', t.unfinished ?? '-'], ['Pending sync', r.pendingSync ?? '-'], ['Failed sync', r.failedSync ?? '-'],
  ].map(([k,v]) => '<div class="card"><h3>'+k+'</h3><p>'+v+'</p></div>').join('');
}
async function loadRows() {
  $('err').textContent = '';
  try {
    const r = await fetch('/api/qc?' + qs()).then(r => r.json());
    $('rows').innerHTML = (r.data || []).map(x =>
      '<tr><td>'+esc(fmtDate(x.inspectionDate))+'</td><td>'+esc(x.inspectionType)+'</td><td>'+esc(x.factory)+'</td><td>'+esc(x.process||'')+'</td><td>'+esc(x.jobNumber)+'</td><td>'+esc(x.number??'')+'</td><td>'+esc(x.machineNumber||'')+'</td><td>'+esc(x.inspectionTime||'')+'</td><td>'+esc(x.qcCheck||'')+'</td><td>'+esc(x.qcResult||'')+'</td><td>'+esc(x.status||'')+'</td><td>'+esc(x.sheetSyncStatus||'')+'</td></tr>'
    ).join('');
  } catch (e) { $('err').textContent = 'Failed to load rows'; }
}
function fmtDate(iso) { try { return iso.slice(0,10).split('-').reverse().join('/'); } catch { return iso; } }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
$('btn-search').onclick = loadRows;
$('btn-export').onclick = () => { window.location.href = '/api/qc/export.xlsx?' + qs(); };
loadStats(); loadRows();
</script>
</body>
</html>`;
}
