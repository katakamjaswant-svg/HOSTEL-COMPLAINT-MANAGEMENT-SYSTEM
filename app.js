/* ============================================
   HOSTEL COMPLAINT MANAGEMENT SYSTEM - JS
   ============================================ */

// ============ GLOBAL STATE ============
const STATE = {
  currentPage: 'home',
  complaints: [],
  staff: [],
  currentComplaint: null,
};

// ============ TOAST NOTIFICATIONS ============
function showToast(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '✅'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============ PAGE NAVIGATION ============
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.navbar-nav button').forEach(b => b.classList.remove('active'));
  const target = document.getElementById(`page-${pageId}`);
  if (target) target.classList.add('active');
  const navBtn = document.getElementById(`nav-${pageId}`);
  if (navBtn) navBtn.classList.add('active');
  STATE.currentPage = pageId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Close mobile menu
  document.querySelector('.navbar-nav').classList.remove('open');

  // Load data on page open
  if (pageId === 'warden') loadWardenComplaints();
  if (pageId === 'admin') loadAdminData();
  if (pageId === 'track') document.getElementById('track-result').classList.remove('active');
}

// Toggle mobile nav
document.querySelector('.hamburger').addEventListener('click', () => {
  document.querySelector('.navbar-nav').classList.toggle('open');
});

// ============ API HELPERS ============
async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json();
}

async function apiPost(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`);
  return res.json();
}

async function apiPatch(url, data) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`PATCH ${url} failed: ${res.status}`);
  return res.json();
}

// ============ GENERATE COMPLAINT ID ============
function generateComplaintId() {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `CMP-${year}-${num}`;
}

// ============ DATE FORMATTING ============
function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(parseInt(ts));
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(ts) {
  if (!ts) return '—';
  const d = new Date(parseInt(ts));
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ============ STATUS BADGE HTML ============
function statusBadge(status) {
  const map = {
    'Pending': ['badge-pending', '🕐'],
    'Assigned': ['badge-assigned', '👤'],
    'In Progress': ['badge-progress', '⚙️'],
    'Resolved': ['badge-resolved', '✅'],
  };
  const [cls, icon] = map[status] || ['badge-pending', '🕐'];
  return `<span class="badge ${cls}">${icon} ${status}</span>`;
}

function priorityBadge(priority) {
  const map = {
    'High': ['badge-high', '🔴'],
    'Medium': ['badge-medium', '🟡'],
    'Low': ['badge-low', '🟢'],
  };
  const [cls, icon] = map[priority] || ['badge-medium', '🟡'];
  return `<span class="badge ${cls}">${icon} ${priority}</span>`;
}

// ============ LOAD STAFF DATA ============
async function loadStaff() {
  try {
    const data = await apiGet('tables/staff?limit=100');
    STATE.staff = data.data || [];
    // Populate staff dropdowns
    const selects = document.querySelectorAll('.staff-select');
    selects.forEach(sel => {
      const current = sel.value;
      sel.innerHTML = '<option value="">-- Select Staff --</option>';
      STATE.staff.forEach(s => {
        sel.innerHTML += `<option value="${s.name}" ${s.name === current ? 'selected' : ''}>${s.name} (${s.role})</option>`;
      });
    });
  } catch (e) {
    console.error('Error loading staff:', e);
  }
}

// ============ HOME PAGE STATS ============
async function loadHomeStats() {
  try {
    const data = await apiGet('tables/complaints?limit=500');
    const complaints = data.data || [];
    document.getElementById('stat-total').textContent = complaints.length;
    document.getElementById('stat-pending').textContent = complaints.filter(c => c.status === 'Pending').length;
    document.getElementById('stat-progress').textContent = complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
    document.getElementById('stat-resolved').textContent = complaints.filter(c => c.status === 'Resolved').length;
  } catch (e) {
    console.error('Error loading stats:', e);
  }
}

// ============ STUDENT: SUBMIT COMPLAINT ============
document.getElementById('complaint-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  const originalText = btn.innerHTML;
  btn.innerHTML = `<span class="loading-spinner"></span> Submitting...`;
  btn.disabled = true;

  try {
    const complaintId = generateComplaintId();
    const data = {
      complaint_id: complaintId,
      student_name: document.getElementById('student-name').value.trim(),
      room_number: document.getElementById('room-number').value.trim(),
      mobile_number: document.getElementById('mobile-number').value.trim(),
      hostel_block: document.getElementById('hostel-block').value,
      complaint_type: document.getElementById('complaint-type').value,
      description: document.getElementById('description').value.trim(),
      priority: document.getElementById('priority').value,
      status: 'Pending',
      assigned_staff: '',
      remarks: '',
      image_url: document.getElementById('image-preview-img').src || ''
    };

    await apiPost('tables/complaints', data);

    // Show success
    document.getElementById('complaint-form-wrapper').style.display = 'none';
    const success = document.getElementById('success-screen');
    success.classList.add('show');
    document.getElementById('generated-id').textContent = complaintId;

    showToast(`Complaint submitted! ID: ${complaintId}`, 'success');
    loadHomeStats();

  } catch (err) {
    showToast('Failed to submit complaint. Please try again.', 'error');
    console.error(err);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// Reset form
document.getElementById('submit-new-btn').addEventListener('click', function () {
  document.getElementById('complaint-form').reset();
  document.getElementById('image-preview').style.display = 'none';
  document.getElementById('image-preview-img').src = '';
  document.getElementById('complaint-form-wrapper').style.display = 'block';
  document.getElementById('success-screen').classList.remove('show');
});

// ============ IMAGE UPLOAD ============
const imageInput = document.getElementById('image-input');
const uploadArea = document.getElementById('upload-area');

uploadArea.addEventListener('click', () => imageInput.click());
uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleImageFile(file);
});

imageInput.addEventListener('change', function () {
  if (this.files[0]) handleImageFile(this.files[0]);
});

function handleImageFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('image-preview');
    const img = document.getElementById('image-preview-img');
    img.src = e.target.result;
    preview.style.display = 'block';
    document.getElementById('upload-text').textContent = `✅ ${file.name} selected`;
    showToast('Image uploaded successfully', 'success');
  };
  reader.readAsDataURL(file);
}

// ============ TRACK COMPLAINT ============
async function trackComplaint() {
  const input = document.getElementById('track-input').value.trim().toUpperCase();
  if (!input) { showToast('Please enter a Complaint ID', 'warning'); return; }

  const btn = document.getElementById('track-btn');
  btn.innerHTML = `<span class="loading-spinner"></span>`;
  btn.disabled = true;

  try {
    const data = await apiGet(`tables/complaints?search=${encodeURIComponent(input)}&limit=100`);
    const found = (data.data || []).find(c =>
      c.complaint_id === input ||
      c.complaint_id === input.replace(/^CMP-?/i, 'CMP-')
    );

    const resultDiv = document.getElementById('track-result');
    if (!found) {
      resultDiv.innerHTML = `
        <div class="alert alert-danger" style="margin-top:16px;">
          <span>❌</span>
          <span>No complaint found with ID <strong>${input}</strong>. Please check the ID and try again.</span>
        </div>`;
      resultDiv.classList.add('active');
    } else {
      const steps = ['Pending', 'Assigned', 'In Progress', 'Resolved'];
      const currentIdx = steps.indexOf(found.status);
      const stepsHtml = steps.map((s, i) => {
        const completed = i < currentIdx;
        const active = i === currentIdx;
        const icons = ['🕐', '👤', '⚙️', '✅'];
        return `
          <div class="step ${completed ? 'completed' : active ? 'active' : ''}">
            <div class="step-icon">${completed ? '✅' : icons[i]}</div>
            <div class="step-label">${s}</div>
          </div>
          ${i < steps.length - 1 ? `<div class="step-line ${completed ? 'completed' : ''}"></div>` : ''}
        `;
      }).join('');

      resultDiv.innerHTML = `
        <div class="card" style="margin-top:20px;">
          <div class="tracker-header">
            <div>
              <div class="complaint-id-display" style="font-weight:700; font-size:18px; color:var(--primary);">${found.complaint_id}</div>
              <div style="color:var(--gray-500); font-size:13px; margin-top:4px;">📅 Submitted on ${formatDate(found.created_at)}</div>
            </div>
            <div>${statusBadge(found.status)}</div>
          </div>

          <div class="progress-steps">${stepsHtml}</div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:20px;">
            <div class="detail-row" style="flex-direction:column; gap:2px; padding:12px; background:var(--gray-50); border-radius:8px; border:none;">
              <span style="font-size:11px; font-weight:600; color:var(--gray-400); text-transform:uppercase;">Student Name</span>
              <span style="font-weight:600;">${found.student_name}</span>
            </div>
            <div class="detail-row" style="flex-direction:column; gap:2px; padding:12px; background:var(--gray-50); border-radius:8px; border:none;">
              <span style="font-size:11px; font-weight:600; color:var(--gray-400); text-transform:uppercase;">Room Number</span>
              <span style="font-weight:600;">${found.room_number} • ${found.hostel_block}</span>
            </div>
            <div class="detail-row" style="flex-direction:column; gap:2px; padding:12px; background:var(--gray-50); border-radius:8px; border:none;">
              <span style="font-size:11px; font-weight:600; color:var(--gray-400); text-transform:uppercase;">Complaint Type</span>
              <span style="font-weight:600;">${found.complaint_type}</span>
            </div>
            <div class="detail-row" style="flex-direction:column; gap:2px; padding:12px; background:var(--gray-50); border-radius:8px; border:none;">
              <span style="font-size:11px; font-weight:600; color:var(--gray-400); text-transform:uppercase;">Priority</span>
              <span>${priorityBadge(found.priority || 'Medium')}</span>
            </div>
          </div>

          <div style="margin-top:16px; padding:16px; background:var(--gray-50); border-radius:8px;">
            <div style="font-size:11px; font-weight:600; color:var(--gray-400); text-transform:uppercase; margin-bottom:6px;">Description</div>
            <div style="font-size:14px;">${found.description}</div>
          </div>

          ${found.assigned_staff ? `
          <div style="margin-top:12px; padding:14px; background:#f0fdf4; border-radius:8px; border-left:4px solid var(--success);">
            <div style="font-size:12px; font-weight:600; color:var(--success);">👷 Assigned Staff</div>
            <div style="font-size:14px; font-weight:600; margin-top:4px;">${found.assigned_staff}</div>
          </div>` : ''}

          ${found.remarks ? `
          <div style="margin-top:12px; padding:14px; background:var(--primary-light); border-radius:8px; border-left:4px solid var(--primary);">
            <div style="font-size:12px; font-weight:600; color:var(--primary);">💬 Warden Remarks</div>
            <div style="font-size:14px; margin-top:4px;">${found.remarks}</div>
          </div>` : ''}
        </div>`;
      resultDiv.classList.add('active');
    }
  } catch (err) {
    showToast('Error searching complaint. Please try again.', 'error');
    console.error(err);
  } finally {
    btn.innerHTML = '🔍 Search';
    btn.disabled = false;
  }
}

// Enter key on track input
document.getElementById('track-input').addEventListener('keypress', e => {
  if (e.key === 'Enter') trackComplaint();
});

// ============ WARDEN: LOAD COMPLAINTS ============
let wardenFilters = { status: '', type: '', search: '' };

async function loadWardenComplaints() {
  const tbody = document.getElementById('warden-tbody');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:40px; color:var(--gray-400);">
    <div class="loading-spinner" style="margin:0 auto; border-color:var(--gray-300); border-top-color:var(--primary); width:28px; height:28px;"></div>
    <div style="margin-top:8px;">Loading complaints...</div>
  </td></tr>`;

  try {
    let url = 'tables/complaints?limit=200&sort=created_at';
    if (wardenFilters.search) url += `&search=${encodeURIComponent(wardenFilters.search)}`;
    const data = await apiGet(url);
    let complaints = data.data || [];

    if (wardenFilters.status) complaints = complaints.filter(c => c.status === wardenFilters.status);
    if (wardenFilters.type) complaints = complaints.filter(c => c.complaint_type === wardenFilters.type);

    STATE.complaints = complaints;

    // Update counts
    document.getElementById('warden-total').textContent = complaints.length;
    document.getElementById('warden-pending').textContent = complaints.filter(c => c.status === 'Pending').length;
    document.getElementById('warden-progress').textContent = complaints.filter(c => c.status === 'Assigned' || c.status === 'In Progress').length;
    document.getElementById('warden-resolved').textContent = complaints.filter(c => c.status === 'Resolved').length;

    if (complaints.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8">
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3>No Complaints Found</h3>
          <p>No complaints match your current filters.</p>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = complaints.map(c => `
      <tr>
        <td><span style="font-weight:700; color:var(--primary); font-size:12px;">${c.complaint_id}</span></td>
        <td>
          <div style="font-weight:600; font-size:13px;">${c.student_name}</div>
          <div style="font-size:11px; color:var(--gray-400);">${c.room_number} • ${c.hostel_block || ''}</div>
        </td>
        <td>
          <span style="font-size:13px; font-weight:500;">
            ${getComplaintTypeIcon(c.complaint_type)} ${c.complaint_type}
          </span>
        </td>
        <td>${priorityBadge(c.priority || 'Medium')}</td>
        <td>${statusBadge(c.status)}</td>
        <td style="font-size:12px; color:var(--gray-500);">${c.assigned_staff || '<span style="color:var(--gray-300);">—</span>'}</td>
        <td style="font-size:12px; color:var(--gray-400);">${formatDate(c.created_at)}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-primary" onclick="openWardenModal('${c.id}')">⚙️ Manage</button>
            <button class="btn btn-sm btn-outline" onclick="viewComplaintDetail('${c.id}')">👁 View</button>
          </div>
        </td>
      </tr>
    `).join('');

    await loadStaff();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="alert alert-danger">❌ Error loading complaints. Please refresh.</div></td></tr>`;
    console.error(err);
  }
}

function getComplaintTypeIcon(type) {
  const icons = {
    'Electrical Issue': '⚡',
    'Plumbing Issue': '🚿',
    'Food Complaint': '🍽️',
    'Cleanliness Issue': '🧹',
    'Internet/Wi-Fi Issue': '📶',
    'Furniture Damage': '🪑',
    'Water Supply Issue': '💧',
    'Security Issue': '🔒',
    'Noise Complaint': '🔊',
    'Laundry Issue': '👕',
    'Other': '📋'
  };
  return icons[type] || '📋';
}

// ============ WARDEN MODAL ============
async function openWardenModal(complaintId) {
  const complaint = STATE.complaints.find(c => c.id === complaintId);
  if (!complaint) return;
  STATE.currentComplaint = complaint;

  document.getElementById('modal-complaint-id').textContent = complaint.complaint_id;
  document.getElementById('modal-student').textContent = `${complaint.student_name} | Room: ${complaint.room_number} | ${complaint.hostel_block || ''}`;
  document.getElementById('modal-type').textContent = `${getComplaintTypeIcon(complaint.complaint_type)} ${complaint.complaint_type}`;
  document.getElementById('modal-description').textContent = complaint.description;
  document.getElementById('modal-date').textContent = formatDateTime(complaint.created_at);
  document.getElementById('modal-status-select').value = complaint.status;

  // Populate staff select
  const staffSel = document.getElementById('modal-staff-select');
  staffSel.innerHTML = '<option value="">-- Select Staff --</option>';
  STATE.staff.forEach(s => {
    staffSel.innerHTML += `<option value="${s.name}" ${s.name === complaint.assigned_staff ? 'selected' : ''}>${s.name} (${s.role})</option>`;
  });

  document.getElementById('modal-remarks').value = complaint.remarks || '';

  document.getElementById('warden-modal').classList.add('active');
}

async function saveWardenUpdate() {
  const btn = document.getElementById('save-update-btn');
  if (!STATE.currentComplaint) return;

  btn.innerHTML = `<span class="loading-spinner"></span> Saving...`;
  btn.disabled = true;

  try {
    const updateData = {
      status: document.getElementById('modal-status-select').value,
      assigned_staff: document.getElementById('modal-staff-select').value,
      remarks: document.getElementById('modal-remarks').value
    };

    await apiPatch(`tables/complaints/${STATE.currentComplaint.id}`, updateData);
    closeModal('warden-modal');
    showToast('Complaint updated successfully!', 'success');
    loadWardenComplaints();

  } catch (err) {
    showToast('Error saving update.', 'error');
    console.error(err);
  } finally {
    btn.innerHTML = '💾 Save Update';
    btn.disabled = false;
  }
}

// ============ VIEW COMPLAINT DETAIL ============
function viewComplaintDetail(complaintId) {
  const c = STATE.complaints.find(x => x.id === complaintId);
  if (!c) return;

  const modal = document.getElementById('detail-modal');
  document.getElementById('detail-modal-title').textContent = c.complaint_id;
  document.getElementById('detail-body').innerHTML = `
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px;">
      ${statusBadge(c.status)}
      ${priorityBadge(c.priority || 'Medium')}
    </div>
    <div class="detail-row"><span class="detail-label">Student Name</span><span class="detail-value">${c.student_name}</span></div>
    <div class="detail-row"><span class="detail-label">Room Number</span><span class="detail-value">${c.room_number}</span></div>
    <div class="detail-row"><span class="detail-label">Hostel Block</span><span class="detail-value">${c.hostel_block || '—'}</span></div>
    <div class="detail-row"><span class="detail-label">Mobile</span><span class="detail-value">${c.mobile_number}</span></div>
    <div class="detail-row"><span class="detail-label">Complaint Type</span><span class="detail-value">${getComplaintTypeIcon(c.complaint_type)} ${c.complaint_type}</span></div>
    <div class="detail-row"><span class="detail-label">Submitted On</span><span class="detail-value">${formatDateTime(c.created_at)}</span></div>
    <div class="detail-row"><span class="detail-label">Last Updated</span><span class="detail-value">${formatDateTime(c.updated_at)}</span></div>
    <div class="detail-row"><span class="detail-label">Description</span><span class="detail-value">${c.description}</span></div>
    <div class="detail-row"><span class="detail-label">Assigned To</span><span class="detail-value">${c.assigned_staff || '—'}</span></div>
    <div class="detail-row"><span class="detail-label">Remarks</span><span class="detail-value">${c.remarks || '—'}</span></div>
    ${c.image_url ? `<div style="margin-top:16px;"><img src="${c.image_url}" style="max-width:100%; border-radius:8px; border:1px solid var(--gray-200);" alt="Complaint Image"></div>` : ''}
  `;
  modal.classList.add('active');
}

// ============ WARDEN FILTERS ============
document.getElementById('warden-status-filter').addEventListener('change', function () {
  wardenFilters.status = this.value;
  loadWardenComplaints();
});

document.getElementById('warden-type-filter').addEventListener('change', function () {
  wardenFilters.type = this.value;
  loadWardenComplaints();
});

let searchDebounce;
document.getElementById('warden-search').addEventListener('input', function () {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    wardenFilters.search = this.value.trim();
    loadWardenComplaints();
  }, 400);
});

// ============ MODAL HELPERS ============
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('active');
  });
});

// ============ ADMIN DATA ============
let adminCharts = {};

async function loadAdminData() {
  try {
    const data = await apiGet('tables/complaints?limit=500');
    const complaints = data.data || [];
    renderAdminStats(complaints);
    renderAdminCharts(complaints);
    renderAdminTable(complaints);
  } catch (err) {
    console.error('Error loading admin data:', err);
    showToast('Error loading admin data', 'error');
  }
}

function renderAdminStats(complaints) {
  const total = complaints.length;
  const pending = complaints.filter(c => c.status === 'Pending').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const highPriority = complaints.filter(c => c.priority === 'High').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  document.getElementById('admin-total').textContent = total;
  document.getElementById('admin-pending').textContent = pending;
  document.getElementById('admin-progress').textContent = inProgress;
  document.getElementById('admin-resolved').textContent = resolved;
  document.getElementById('admin-high').textContent = highPriority;
  document.getElementById('admin-rate').textContent = resolutionRate + '%';
}

function renderAdminCharts(complaints) {
  // Destroy existing charts
  Object.values(adminCharts).forEach(c => c.destroy());
  adminCharts = {};

  // --- Status Distribution Pie Chart ---
  const statusCounts = {
    'Pending': 0, 'Assigned': 0, 'In Progress': 0, 'Resolved': 0
  };
  complaints.forEach(c => { if (statusCounts[c.status] !== undefined) statusCounts[c.status]++; });

  const ctx1 = document.getElementById('status-chart').getContext('2d');
  adminCharts.status = new Chart(ctx1, {
    type: 'doughnut',
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: ['#f59e0b', '#06b6d4', '#8b5cf6', '#16a34a'],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Poppins', size: 12 }, padding: 12 } },
        title: { display: false }
      },
      cutout: '60%'
    }
  });

  // --- Complaint Type Bar Chart ---
  const typeCounts = {};
  complaints.forEach(c => { typeCounts[c.complaint_type] = (typeCounts[c.complaint_type] || 0) + 1; });
  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 7);

  const ctx2 = document.getElementById('type-chart').getContext('2d');
  adminCharts.type = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: sortedTypes.map(([k]) => k.replace(' Issue', '').replace(' Complaint', '')),
      datasets: [{
        label: 'Complaints',
        data: sortedTypes.map(([, v]) => v),
        backgroundColor: 'rgba(37,99,235,0.8)',
        borderColor: 'rgba(37,99,235,1)',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Poppins', size: 11 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { ticks: { font: { family: 'Poppins', size: 11 } }, grid: { display: false } }
      }
    }
  });

  // --- Priority Chart ---
  const priorityCounts = { 'High': 0, 'Medium': 0, 'Low': 0 };
  complaints.forEach(c => { if (priorityCounts[c.priority] !== undefined) priorityCounts[c.priority]++; });

  const ctx3 = document.getElementById('priority-chart').getContext('2d');
  adminCharts.priority = new Chart(ctx3, {
    type: 'pie',
    data: {
      labels: ['High', 'Medium', 'Low'],
      datasets: [{
        data: Object.values(priorityCounts),
        backgroundColor: ['#ef4444', '#f59e0b', '#6b7280'],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { family: 'Poppins', size: 12 }, padding: 12 } } }
    }
  });

  // --- Monthly Trend Chart ---
  const monthlyData = {};
  complaints.forEach(c => {
    const d = new Date(parseInt(c.created_at));
    const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    monthlyData[key] = (monthlyData[key] || 0) + 1;
  });
  const months = Object.keys(monthlyData).slice(-6);
  const monthValues = months.map(m => monthlyData[m]);

  const ctx4 = document.getElementById('trend-chart').getContext('2d');
  adminCharts.trend = new Chart(ctx4, {
    type: 'line',
    data: {
      labels: months.length ? months : ['Jan', 'Feb', 'Mar'],
      datasets: [{
        label: 'Complaints',
        data: monthValues.length ? monthValues : [0, 0, 0],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563eb',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Poppins', size: 11 } } },
        x: { ticks: { font: { family: 'Poppins', size: 11 } } }
      }
    }
  });
}

function renderAdminTable(complaints) {
  const tbody = document.getElementById('admin-complaints-tbody');
  if (complaints.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">📭</div><h3>No Data</h3></div></td></tr>`;
    return;
  }
  tbody.innerHTML = complaints.map(c => `
    <tr>
      <td><span style="font-weight:700; color:var(--primary); font-size:12px;">${c.complaint_id}</span></td>
      <td style="font-weight:600; font-size:13px;">${c.student_name}</td>
      <td style="font-size:12px;">${c.room_number} • ${c.hostel_block || ''}</td>
      <td style="font-size:13px;">${getComplaintTypeIcon(c.complaint_type)} ${c.complaint_type}</td>
      <td>${priorityBadge(c.priority || 'Medium')}</td>
      <td>${statusBadge(c.status)}</td>
      <td style="font-size:12px; color:var(--gray-400);">${formatDate(c.created_at)}</td>
    </tr>
  `).join('');
}

// ============ ADMIN TABS ============
function switchAdminTab(tabId) {
  document.querySelectorAll('#page-admin .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#page-admin .tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`admin-tab-${tabId}`).classList.add('active');
  document.getElementById(`admin-content-${tabId}`).classList.add('active');
}

// ============ EXCEL EXPORT ============
async function exportToExcel() {
  const btn = document.getElementById('export-btn');
  btn.innerHTML = `<span class="loading-spinner"></span> Generating...`;
  btn.disabled = true;

  try {
    const data = await apiGet('tables/complaints?limit=500');
    const complaints = data.data || [];

    if (complaints.length === 0) {
      showToast('No complaints to export!', 'warning');
      btn.innerHTML = '📥 Export to Excel';
      btn.disabled = false;
      return;
    }

    // Use SheetJS (xlsx) to create the Excel file
    const wb = XLSX.utils.book_new();

    // ---- Sheet 1: All Complaints ----
    const rows = [
      ['Hostel Complaint Management System - Report'],
      [`Generated on: ${new Date().toLocaleString('en-IN')}`],
      [],
      ['Complaint ID', 'Student Name', 'Room No', 'Hostel Block', 'Mobile No', 'Complaint Type', 'Priority', 'Status', 'Assigned Staff', 'Description', 'Remarks', 'Submitted Date']
    ];

    complaints.forEach(c => {
      rows.push([
        c.complaint_id,
        c.student_name,
        c.room_number,
        c.hostel_block || '',
        c.mobile_number,
        c.complaint_type,
        c.priority || 'Medium',
        c.status,
        c.assigned_staff || '',
        c.description,
        c.remarks || '',
        formatDate(c.created_at)
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [14, 18, 10, 12, 13, 20, 10, 12, 20, 40, 30, 14].map(w => ({ wch: w }));

    // Style header
    ws['A1'] = { v: 'Hostel Complaint Management System - Report', t: 's' };
    XLSX.utils.book_append_sheet(wb, ws, 'All Complaints');

    // ---- Sheet 2: Summary ----
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const assigned = complaints.filter(c => c.status === 'Assigned').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;

    const summaryRows = [
      ['COMPLAINT SUMMARY REPORT'],
      [`Date: ${new Date().toLocaleDateString('en-IN')}`],
      [],
      ['Status', 'Count', 'Percentage'],
      ['Total Complaints', total, '100%'],
      ['Pending', pending, `${Math.round(pending / total * 100) || 0}%`],
      ['Assigned', assigned, `${Math.round(assigned / total * 100) || 0}%`],
      ['In Progress', inProgress, `${Math.round(inProgress / total * 100) || 0}%`],
      ['Resolved', resolved, `${Math.round(resolved / total * 100) || 0}%`],
      [],
      ['Priority', 'Count'],
      ['High', complaints.filter(c => c.priority === 'High').length],
      ['Medium', complaints.filter(c => c.priority === 'Medium').length],
      ['Low', complaints.filter(c => c.priority === 'Low').length],
      [],
      ['Complaint Type', 'Count'],
      ...Object.entries(complaints.reduce((acc, c) => {
        acc[c.complaint_type] = (acc[c.complaint_type] || 0) + 1; return acc;
      }, {})).sort((a, b) => b[1] - a[1])
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws2['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

    // Download
    const fileName = `Hostel_Complaints_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);

    showToast(`✅ Excel exported: ${fileName}`, 'success', 4000);

  } catch (err) {
    showToast('Error generating Excel. Please try again.', 'error');
    console.error(err);
  } finally {
    btn.innerHTML = '📥 Export to Excel';
    btn.disabled = false;
  }
}

// ============ ADMIN SEARCH FILTER ============
document.getElementById('admin-search-input').addEventListener('input', function () {
  const q = this.value.toLowerCase();
  const rows = document.querySelectorAll('#admin-complaints-tbody tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(q) ? '' : 'none';
  });
});

document.getElementById('admin-status-filter').addEventListener('change', function () {
  const q = this.value.toLowerCase();
  const rows = document.querySelectorAll('#admin-complaints-tbody tr');
  rows.forEach(row => {
    row.style.display = (!q || row.textContent.toLowerCase().includes(q)) ? '' : 'none';
  });
});

// ============ REFRESH BUTTONS ============
document.getElementById('refresh-warden-btn').addEventListener('click', loadWardenComplaints);

// ============ INITIALIZE ============
document.addEventListener('DOMContentLoaded', () => {
  loadHomeStats();
  loadStaff();
});
