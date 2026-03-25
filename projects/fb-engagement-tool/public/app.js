// ─── State ────────────────────────────────────────────────────────────────────
let scenarios = [];
let currentRunId = null;
let sseSource = null;
let editingScenarioId = null;

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  loadScenarios();
  bindTabs();
  bindCommentTab();
  bindDMTab();
  bindScenariosTab();
  bindHistoryTab();
});

// ─── Session ──────────────────────────────────────────────────────────────────
async function checkSession() {
  try {
    const r = await fetch('/api/session/status').then(r => r.json());
    const dot = document.getElementById('session-dot');
    const text = document.getElementById('session-text');
    if (r.hasSession) {
      dot.className = 'w-2 h-2 rounded-full bg-green-400';
      text.textContent = 'Session Facebook: OK';
      text.className = 'text-sm text-green-400';
    } else {
      dot.className = 'w-2 h-2 rounded-full bg-red-400';
      text.innerHTML = 'Chưa login — chạy: <code class="bg-gray-800 px-1.5 py-0.5 rounded text-xs">npm run setup-session</code>';
      text.className = 'text-sm text-red-400';
    }
  } catch {}
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function bindTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active', 'bg-blue-600', 'text-white');
        b.classList.add('text-gray-400');
      });
      btn.classList.add('active');
      btn.classList.remove('text-gray-400');

      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
      document.getElementById(`tab-${tab}`).classList.remove('hidden');

      if (tab === 'history') loadHistory();
      if (tab === 'scenarios') renderScenarioList();
    });
  });
}

// ─── Scenarios API ────────────────────────────────────────────────────────────
async function loadScenarios() {
  const data = await fetch('/api/scenarios').then(r => r.json());
  scenarios = data;
  updateScenarioSelect();
  renderScenarioList();
}

function updateScenarioSelect() {
  const sel = document.getElementById('comment-scenario');
  const current = sel.value;
  sel.innerHTML = '<option value="">-- Không dùng kịch bản --</option>';
  scenarios.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    sel.appendChild(opt);
  });
  sel.value = current;
}

// ─── Comment Tab ──────────────────────────────────────────────────────────────
function bindCommentTab() {
  const sel = document.getElementById('comment-scenario');
  sel.addEventListener('change', () => {
    const id = sel.value;
    const preview = document.getElementById('scenario-preview');
    if (!id) { preview.classList.add('hidden'); return; }

    const s = scenarios.find(x => x.id === id);
    if (!s) return;

    preview.classList.remove('hidden');
    const container = document.getElementById('scenario-steps-preview');
    container.innerHTML = s.steps.map((step, i) => `
      <div class="flex items-start gap-3 text-xs">
        <span class="bg-blue-600 text-white rounded px-1.5 py-0.5 font-medium shrink-0">B${i+1}</span>
        <div class="flex-1">
          <span class="text-gray-300">${step.description || 'Comment'}</span>
          ${step.delay_seconds > 0 ? `<span class="text-gray-600 ml-2">+${step.delay_seconds}s</span>` : ''}
          ${step.use_ai ? '<span class="ml-2 text-blue-400 text-xs">AI</span>' : ''}
          ${step.image_filename ? '<span class="ml-2 text-green-400 text-xs">📷</span>' : ''}
          <p class="text-gray-500 mt-0.5 truncate">${step.text}</p>
        </div>
      </div>
    `).join('');
  });

  document.getElementById('btn-run-comment').addEventListener('click', runComment);
  document.getElementById('btn-clear-log').addEventListener('click', () => {
    document.getElementById('log-container').innerHTML = '';
  });
}

async function runComment() {
  const postUrl = document.getElementById('comment-post-url').value.trim();
  const scenarioId = document.getElementById('comment-scenario').value;

  if (!postUrl) { alert('Vui lòng nhập link bài viết!'); return; }

  const btn = document.getElementById('btn-run-comment');
  btn.disabled = true;
  btn.textContent = '⏳ Đang chạy...';

  clearLog('log-container');

  try {
    const r = await fetch('/api/run/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_url: postUrl, scenario_id: scenarioId || undefined }),
    }).then(r => r.json());

    if (r.error) throw new Error(r.error);

    currentRunId = r.runId;
    showRunStatus(r.runId);
    listenSSE(r.runId, 'log-container', () => {
      btn.disabled = false;
      btn.textContent = '▶ Chạy kịch bản';
    });
  } catch (err) {
    appendLog('log-container', `❌ ${err.message}`, 'error');
    btn.disabled = false;
    btn.textContent = '▶ Chạy kịch bản';
  }
}

function showRunStatus(runId) {
  const card = document.getElementById('run-status-card');
  card.classList.remove('hidden');
  document.getElementById('run-id-display').textContent = runId;
}

// ─── DM Tab ───────────────────────────────────────────────────────────────────
function bindDMTab() {
  document.getElementById('btn-run-dm').addEventListener('click', runDM);
}

async function runDM() {
  const postUrl = document.getElementById('dm-post-url').value.trim();
  const groupUrl = document.getElementById('dm-group-url').value.trim();
  const template = document.getElementById('dm-template').value.trim();
  const max = parseInt(document.getElementById('dm-max').value) || 10;

  if (!postUrl || !groupUrl) { alert('Vui lòng nhập đủ link bài viết và link group!'); return; }

  const btn = document.getElementById('btn-run-dm');
  btn.disabled = true;
  btn.textContent = '⏳ Đang chạy...';
  clearLog('dm-log-container');

  try {
    const r = await fetch('/api/run/dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_url: postUrl, group_url: groupUrl, message_template: template, max_members: max }),
    }).then(r => r.json());

    if (r.error) throw new Error(r.error);

    listenSSE(r.runId, 'dm-log-container', () => {
      btn.disabled = false;
      btn.textContent = '▶ Gửi tin nhắn';
    });
  } catch (err) {
    appendLog('dm-log-container', `❌ ${err.message}`, 'error');
    btn.disabled = false;
    btn.textContent = '▶ Gửi tin nhắn';
  }
}

// ─── Scenarios Tab ────────────────────────────────────────────────────────────
function bindScenariosTab() {
  document.getElementById('btn-new-scenario').addEventListener('click', () => openEditor(null));
  document.getElementById('btn-add-step').addEventListener('click', addStep);
  document.getElementById('btn-save-scenario').addEventListener('click', saveScenario);
  document.getElementById('btn-delete-scenario').addEventListener('click', deleteScenario);
}

function renderScenarioList() {
  const container = document.getElementById('scenario-list');
  if (!scenarios.length) {
    container.innerHTML = '<p class="text-gray-600 text-sm p-2">Chưa có kịch bản nào.</p>';
    return;
  }
  container.innerHTML = scenarios.map(s => `
    <div class="flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors group"
         onclick="openEditor('${s.id}')">
      <div>
        <p class="text-sm font-medium text-gray-200">${s.name}</p>
        <p class="text-xs text-gray-500">${s.steps.length} bước · ${s.description || ''}</p>
      </div>
      <svg class="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </div>
  `).join('');
}

function openEditor(id) {
  editingScenarioId = id;
  const s = id ? scenarios.find(x => x.id === id) : null;

  document.getElementById('edit-scenario-id').value = id || '';
  document.getElementById('editor-title').textContent = s ? `Sửa: ${s.name}` : 'Kịch bản mới';
  document.getElementById('edit-name').value = s?.name || '';
  document.getElementById('edit-desc').value = s?.description || '';
  document.getElementById('btn-delete-scenario').classList.toggle('hidden', !id);

  // Render steps
  document.getElementById('steps-container').innerHTML = '';
  const steps = s?.steps || [];
  steps.forEach(() => addStep());
  steps.forEach((step, i) => fillStep(i, step));
}

function addStep() {
  const container = document.getElementById('steps-container');
  const tmpl = document.getElementById('step-template').content.cloneNode(true);
  const div = tmpl.querySelector('.step-card');
  const idx = container.children.length;

  div.querySelector('.step-num').textContent = idx + 1;

  // Remove button
  div.querySelector('.btn-remove-step').addEventListener('click', () => {
    div.remove();
    renumberSteps();
  });

  // Image upload
  const fileInput = div.querySelector('.step-image-input');
  div.querySelector('.btn-choose-image').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('image', file);
    const r = await fetch('/api/upload', { method: 'POST', body: fd }).then(r => r.json());
    if (r.filename) {
      div.querySelector('.step-image-name').textContent = file.name;
      div.querySelector('.step-image-filename').value = r.filename;
    }
  });

  container.appendChild(div);
}

function fillStep(idx, step) {
  const div = document.getElementById('steps-container').children[idx];
  if (!div) return;
  div.querySelector('.step-text').value = step.text || '';
  div.querySelector('.step-delay').value = step.delay_seconds || 0;
  div.querySelector('.step-use-ai').checked = step.use_ai || false;
  div.querySelector('.step-description').value = step.description || '';
  if (step.image_filename) {
    div.querySelector('.step-image-name').textContent = step.image_filename;
    div.querySelector('.step-image-filename').value = step.image_filename;
  }
}

function renumberSteps() {
  document.querySelectorAll('#steps-container .step-num').forEach((el, i) => {
    el.textContent = i + 1;
  });
}

function collectSteps() {
  const steps = [];
  document.querySelectorAll('#steps-container .step-card').forEach(div => {
    steps.push({
      text: div.querySelector('.step-text').value,
      delay_seconds: parseInt(div.querySelector('.step-delay').value) || 0,
      use_ai: div.querySelector('.step-use-ai').checked,
      image_filename: div.querySelector('.step-image-filename').value || null,
      description: div.querySelector('.step-description').value,
    });
  });
  return steps;
}

async function saveScenario() {
  const id = document.getElementById('edit-scenario-id').value;
  const name = document.getElementById('edit-name').value.trim();
  const description = document.getElementById('edit-desc').value.trim();
  const steps = collectSteps();

  if (!name) { alert('Vui lòng nhập tên kịch bản!'); return; }
  if (!steps.length) { alert('Vui lòng thêm ít nhất 1 bước!'); return; }

  const body = { name, description, steps };

  if (id) {
    await fetch(`/api/scenarios/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } else {
    await fetch('/api/scenarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }

  await loadScenarios();
  renderScenarioList();
  alert('✅ Đã lưu kịch bản!');
}

async function deleteScenario() {
  const id = document.getElementById('edit-scenario-id').value;
  if (!id || !confirm('Xóa kịch bản này?')) return;

  await fetch(`/api/scenarios/${id}`, { method: 'DELETE' });
  editingScenarioId = null;
  await loadScenarios();
  renderScenarioList();
  openEditor(null);
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function bindHistoryTab() {
  document.getElementById('btn-refresh-history').addEventListener('click', loadHistory);
}

async function loadHistory() {
  const runs = await fetch('/api/runs').then(r => r.json());
  const container = document.getElementById('history-list');

  if (!runs.length) {
    container.innerHTML = '<p class="text-gray-600 text-sm p-5">Chưa có lịch sử.</p>';
    return;
  }

  const statusClass = {
    pending: 'bg-gray-600',
    running: 'bg-yellow-500 animate-pulse',
    done: 'bg-green-500',
    error: 'bg-red-500',
  };

  container.innerHTML = runs.map(r => `
    <div class="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/50 transition-colors">
      <div class="w-2 h-2 rounded-full ${statusClass[r.status] || 'bg-gray-500'} shrink-0"></div>
      <div class="flex-1 min-w-0">
        <p class="text-sm text-gray-200 truncate">${r.post_url}</p>
        <p class="text-xs text-gray-500">${r.mode === 'comment' ? '💬 Comment' : '📨 DM'} · ${r.created_at}</p>
      </div>
      <span class="text-xs text-gray-400 shrink-0">${r.status}</span>
    </div>
  `).join('');
}

// ─── SSE Helper ───────────────────────────────────────────────────────────────
function listenSSE(runId, logContainerId, onDone) {
  if (sseSource) sseSource.close();

  sseSource = new EventSource(`/api/runs/${runId}/stream`);

  sseSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    appendLog(logContainerId, data.message, data.level);

    if (data.message.includes('Hoàn tất') || data.message.includes('🎉') || data.level === 'error' && data.message.includes('Lỗi nghiêm trọng')) {
      updateRunStatusUI(data.level === 'error' ? 'error' : 'done');
      if (onDone) setTimeout(onDone, 500);
    }
  };

  sseSource.onerror = () => {
    sseSource.close();
    updateRunStatusUI('done');
    if (onDone) onDone();
  };
}

function updateRunStatusUI(status) {
  const dot = document.getElementById('run-status-dot');
  const text = document.getElementById('run-status-text');
  if (!dot || !text) return;
  if (status === 'done') {
    dot.className = 'w-2 h-2 rounded-full bg-green-400';
    text.textContent = 'Hoàn tất';
  } else if (status === 'error') {
    dot.className = 'w-2 h-2 rounded-full bg-red-400';
    text.textContent = 'Có lỗi';
  }
}

// ─── Log Helpers ──────────────────────────────────────────────────────────────
function appendLog(containerId, message, level = 'info') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Xóa placeholder
  const placeholder = container.querySelector('p.text-gray-600');
  if (placeholder) placeholder.remove();

  const line = document.createElement('div');
  line.className = `log-${level} leading-relaxed`;
  const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  line.innerHTML = `<span class="text-gray-600">[${time}]</span> ${escapeHtml(message)}`;
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
}

function clearLog(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '';
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
