const token = localStorage.getItem('token');
const profileBtn = document.getElementById('profileBtn');
const profileMenu = document.getElementById('profileMenu');
const logoutBtn = document.getElementById('logoutBtn');

if (!token) {
  window.location.href = '/';
}

const roleNames = {
  judge: 'Judge Dashboard',
  court_sc: 'Supreme Court Dashboard',
  court_hc: 'High Court Dashboard',
  court_dc: 'District Court Dashboard',
  police_station: 'Police Station Dashboard',
  advocate: 'Advocate Dashboard'
};

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}

function badge(text) {
  return `<span class="badge">${text}</span>`;
}

function renderAuthorityPanel(profile, cases) {
  const panel = document.getElementById('authorityPanel');
  const role = profile.role;
  const total = cases.length;
  const topPriority = cases[0]?.priorityScore ?? 0;
  const upcoming = cases.filter((c) => c.status === 'hearing_scheduled').length;

  let roleSpecific = '';

  if (role === 'advocate') {
    const cert = profile.profile?.certificateStatus || 'pending';
    const certId = profile.profile?.certificateId || 'N/A';
    roleSpecific = `
      <h3>Advocate Certificate Verification</h3>
      <p>${badge('Certificate ID: ' + certId)} ${badge('Status: ' + cert.toUpperCase())}</p>
      <p class="muted">Only verified advocates can access e-filing and urgent listing workflows.</p>
    `;
  } else if (role === 'judge') {
    roleSpecific = '<p class="muted">AI-assisted priority board helps allocate hearing slots for the most urgent pending matters.</p>';
  } else if (role.startsWith('court_')) {
    roleSpecific = '<p class="muted">Registry workflow shows scheduling readiness, missing documents, and court-level backlog insights.</p>';
  } else if (role === 'police_station') {
    roleSpecific = '<p class="muted">Track FIR-linked matters requiring charge-sheet updates before the next hearing date.</p>';
  }

  panel.innerHTML = `
    <h3>${roleNames[role]}</h3>
    <div class="metrics">
      <div class="metric"><strong>${total}</strong><br/>Pending Cases</div>
      <div class="metric"><strong>${topPriority}</strong><br/>Top Priority</div>
      <div class="metric"><strong>${upcoming}</strong><br/>Scheduled</div>
    </div>
    ${roleSpecific}
  `;
}

function renderCases(cases) {
  const list = document.getElementById('caseList');
  if (!cases.length) {
    list.innerHTML = '<p class="muted">No pending cases for selected category.</p>';
    return;
  }

  list.innerHTML = cases
    .map(
      (c) => `
      <article class="case-card">
        <h4>${c.caseNo} — ${c.title}</h4>
        <p>${badge(c.category)} ${badge('Priority: ' + c.priorityScore)} ${badge(c.courtLevel)}</p>
        <p class="muted">Status: ${c.status} | Next Hearing: ${new Date(c.nextHearingDate).toLocaleDateString()}</p>
        <p>${c.summary}</p>
      </article>
    `
    )
    .join('');
}

function renderCategoryFilters(cases, onFilter) {
  const filters = document.getElementById('categoryFilters');
  const categories = ['all', ...new Set(cases.map((c) => c.category))];
  filters.innerHTML = categories
    .map((cat) => `<button class="filter-btn" data-cat="${cat}">${cat.toUpperCase()}</button>`)
    .join('');

  filters.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-cat');
      onFilter(cat);
    });
  });
}

async function loadDashboard() {
  try {
    const [profileResp, casesResp] = await Promise.all([
      fetch('/api/profile', { headers: getAuthHeaders() }),
      fetch('/api/cases', { headers: getAuthHeaders() })
    ]);

    if (profileResp.status === 401 || casesResp.status === 401) {
      localStorage.clear();
      window.location.href = '/';
      return;
    }

    const profile = await profileResp.json();
    const casePayload = await casesResp.json();
    const cases = casePayload.cases || [];

    document.getElementById('dashTitle').textContent = roleNames[profile.role] || 'Role Dashboard';
    document.getElementById('profileName').textContent = profile.name;
    document.getElementById('profileRole').textContent = `Role: ${profile.role}`;
    document.getElementById('profileEmail').textContent = profile.email;

    renderAuthorityPanel(profile, cases);
    renderCategoryFilters(cases, (cat) => {
      const filtered = cat === 'all' ? cases : cases.filter((c) => c.category === cat);
      renderCases(filtered);
    });
    renderCases(cases);
  } catch (e) {
    document.getElementById('caseList').innerHTML = '<p class="error">Unable to load dashboard data.</p>';
  }
}

profileBtn.addEventListener('click', () => profileMenu.classList.toggle('open'));
logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/';
});

loadDashboard();
