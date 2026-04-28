/* ============================================================
   ETHOS Admin Panel — admin.js
   GitHub API integration for live content management.

   Default password: ethos-admin-2025
   To change: update ADMIN_HASH with sha256 of new password.
   ============================================================ */

'use strict';

// ─── Configuration ────────────────────────────────────────
const REPO_OWNER  = 'ethosobservatory';
const REPO_NAME   = 'ethos-alumni';
const REPO_BRANCH = 'main';
// SHA-256 of "ethos-admin-2025"
const ADMIN_HASH  = '29ca0d3b74b07e19d0a9557976d21d79b473723ddd8892e8a1adac9b9f60778b';

// ─── State ────────────────────────────────────────────────
const State = {
  members: [],
  posts:   [],
  token:   '',
  get isConnected() { return !!this.token; }
};

// ─── GitHub API ───────────────────────────────────────────
const GitHub = {
  base: 'https://api.github.com',

  headers() {
    const h = { 'Content-Type': 'application/json', 'Accept': 'application/vnd.github+json' };
    if (State.token) h['Authorization'] = `Bearer ${State.token}`;
    return h;
  },

  async getFile(path) {
    const r = await fetch(`${this.base}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${REPO_BRANCH}`, { headers: this.headers() });
    if (!r.ok) throw new Error(`GitHub API ${r.status}: ${path}`);
    const data = await r.json();
    const content = atob(data.content.replace(/\n/g, ''));
    return { content: JSON.parse(content), sha: data.sha };
  },

  async putFile(path, content, sha, message) {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
    const body = { message, content: encoded, branch: REPO_BRANCH };
    if (sha) body.sha = sha;
    const r = await fetch(`${this.base}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.message || `GitHub API ${r.status}`);
    }
    return r.json();
  },

  async validateToken() {
    const r = await fetch(`${this.base}/repos/${REPO_OWNER}/${REPO_NAME}`, { headers: this.headers() });
    return r.ok;
  }
};

// ─── Toast ────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icon = type === 'success'
    ? `<svg class="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg class="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  el.innerHTML = `${icon}<span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ─── Confirm dialog ───────────────────────────────────────
function confirm(title, msg) {
  return new Promise(resolve => {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = msg;
    document.getElementById('confirmOverlay').classList.remove('hidden');
    const ok  = document.getElementById('confirmOk');
    const can = document.getElementById('confirmCancel');
    const close = val => {
      document.getElementById('confirmOverlay').classList.add('hidden');
      ok.replaceWith(ok.cloneNode(true));
      can.replaceWith(can.cloneNode(true));
      resolve(val);
    };
    document.getElementById('confirmOk').addEventListener('click', () => close(true));
    document.getElementById('confirmCancel').addEventListener('click', () => close(false));
  });
}

// ─── Auth ─────────────────────────────────────────────────
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function login() {
  const pwd   = document.getElementById('loginPassword').value;
  const token = document.getElementById('loginToken').value.trim();
  const errEl = document.getElementById('loginError');
  errEl.classList.remove('visible');

  const hash = await sha256(pwd);
  if (hash !== ADMIN_HASH) {
    errEl.classList.add('visible');
    return;
  }

  State.token = token;
  if (token) localStorage.setItem('ethos_admin_token', token);

  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminShell').classList.add('visible');
  await Admin.init();
}

function logout() {
  State.token = '';
  State.members = [];
  State.posts = [];
  document.getElementById('loginPage').style.display = '';
  document.getElementById('adminShell').classList.remove('visible');
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginToken').value = '';
}

// ─── Helpers ─────────────────────────────────────────────
function formatDate(d) {
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d || ''; }
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function uid() {
  return 'post-' + Date.now().toString(36);
}

function getListValues(containerId) {
  return Array.from(document.querySelectorAll(`#${containerId} input`))
    .map(i => i.value.trim()).filter(Boolean);
}

function markdownToHtml(md) {
  if (!md) return '';
  let html = md
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^#{3}\s(.+)/gm,'<h3>$1</h3>').replace(/^#{2}\s(.+)/gm,'<h2>$1</h2>').replace(/^#{1}\s(.+)/gm,'<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`(.+?)`/g,'<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^-{3,}$/gm,'<hr>').replace(/^>\s(.+)/gm,'<blockquote>$1</blockquote>')
    .replace(/^[-*]\s(.+)/gm,'<li>$1</li>').replace(/(<li>.*<\/li>)/gs,'<ul>$1</ul>')
    .replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>');
  return `<p>${html}</p>`
    .replace(/<p>(<h[1-6]>)/g,'$1').replace(/(<\/h[1-6]>)<\/p>/g,'$1')
    .replace(/<p>(<ul>)/g,'$1').replace(/(<\/ul>)<\/p>/g,'$1')
    .replace(/<p>(<blockquote>)/g,'$1').replace(/(<\/blockquote>)<\/p>/g,'$1')
    .replace(/<p>(<hr>)<\/p>/g,'$1').replace(/<p><\/p>/g,'');
}

// ─── Admin namespace ──────────────────────────────────────
const Admin = {

  _postsSha:   null,
  _membersSha: null,

  // ── Init ──────────────────────────────────────────────
  async init() {
    await Promise.all([this.loadPosts(), this.loadMembers()]);
    this.updateDashboard();
    this.renderPostsTable();
    this.renderMembersTable();
    this.renderAreasTable();
    this.checkTokenStatus();
    document.getElementById('currentHashDisplay').textContent = ADMIN_HASH.slice(0, 20) + '…';
    const savedToken = localStorage.getItem('ethos_admin_token');
    if (savedToken) document.getElementById('settingsToken').value = savedToken;
  },

  // ── Data loading ──────────────────────────────────────
  async loadPosts() {
    try {
      const { content, sha } = await GitHub.getFile('posts.json');
      State.posts = content.posts || [];
      this._postsSha = sha;
    } catch {
      // fallback: fetch without auth
      try {
        const r = await fetch('posts.json', { cache: 'no-store' });
        const d = await r.json();
        State.posts = d.posts || [];
      } catch { State.posts = []; }
    }
  },

  async loadMembers() {
    try {
      const { content, sha } = await GitHub.getFile('members.json');
      State.members = content.members || [];
      this._membersSha = sha;
    } catch {
      try {
        const r = await fetch('members.json', { cache: 'no-store' });
        const d = await r.json();
        State.members = d.members || [];
      } catch { State.members = []; }
    }
  },

  // ── Save ──────────────────────────────────────────────
  async savePosts(successMsg = 'Articles saved and published') {
    if (!State.token) { toast('No GitHub token — changes saved locally only', 'error'); return false; }
    try {
      const res = await GitHub.putFile('posts.json', { posts: State.posts }, this._postsSha, 'admin: update posts.json');
      this._postsSha = res.content.sha;
      toast(successMsg);
      return true;
    } catch (e) {
      toast('Save failed: ' + e.message, 'error');
      return false;
    }
  },

  async saveMembers(successMsg = 'Members saved and published') {
    if (!State.token) { toast('No GitHub token — changes saved locally only', 'error'); return false; }
    try {
      const res = await GitHub.putFile('members.json', { members: State.members }, this._membersSha, 'admin: update members.json');
      this._membersSha = res.content.sha;
      toast(successMsg);
      return true;
    } catch (e) {
      toast('Save failed: ' + e.message, 'error');
      return false;
    }
  },

  // ── Dashboard ─────────────────────────────────────────
  updateDashboard() {
    const published = State.posts.filter(p => p.published !== false);
    const drafts    = State.posts.filter(p => p.published === false);
    const areas = new Set([
      ...State.members.flatMap(m => m.expertise || []),
      ...State.members.flatMap(m => m.interests || [])
    ]);
    document.getElementById('dashMembers').textContent = State.members.length;
    document.getElementById('dashPosts').textContent   = published.length;
    document.getElementById('dashDrafts').textContent  = drafts.length;
    document.getElementById('dashAreas').textContent   = areas.size;
    document.getElementById('sidebarPostCount').textContent   = State.posts.length;
    document.getElementById('sidebarMemberCount').textContent = State.members.length;
  },

  async checkTokenStatus() {
    const msgEl = document.getElementById('tokenStatusMsg');
    if (!State.token) {
      msgEl.innerHTML = `<span style="color:var(--yellow)">⚠ No GitHub token configured. The admin panel is in <strong>read-only mode</strong>. Add your token in Settings to enable publishing.</span>`;
      return;
    }
    try {
      const ok = await GitHub.validateToken();
      msgEl.innerHTML = ok
        ? `<span style="color:var(--accent)">✓ Connected to <strong>${REPO_OWNER}/${REPO_NAME}</strong>. Changes will be published automatically.</span>`
        : `<span style="color:var(--red)">✗ Token invalid or insufficient permissions. Check Settings.</span>`;
    } catch {
      msgEl.innerHTML = `<span style="color:var(--red)">✗ Could not reach GitHub API.</span>`;
    }
  },

  // ── Posts table ───────────────────────────────────────
  renderPostsTable() {
    const sorted = [...State.posts].sort((a, b) => new Date(b.date) - new Date(a.date));
    const tbody = document.getElementById('postsTableBody');
    if (!sorted.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:var(--text-3);padding:24px">No articles yet. Create your first one!</td></tr>`;
      return;
    }
    tbody.innerHTML = sorted.map(p => `
      <tr>
        <td>${p.title}</td>
        <td>${p.category || '—'}</td>
        <td>${p.author || '—'}</td>
        <td>${formatDate(p.date)}</td>
        <td><span class="status-badge ${p.published !== false ? 'status-published' : 'status-draft'}">${p.published !== false ? 'Published' : 'Draft'}</span></td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-sm" onclick="Admin.openEditPostModal('${p.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="Admin.deletePost('${p.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  // ── Members table ─────────────────────────────────────
  renderMembersTable() {
    const tbody = document.getElementById('membersTableBody');
    if (!State.members.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="color:var(--text-3);padding:24px">No members yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = State.members.map((m, i) => {
      const expertise = (m.expertise || []).slice(0, 3).join(', ') || '—';
      const role = (m.roles || [m.role]).filter(Boolean)[0] || '—';
      return `
        <tr>
          <td>${m.name}</td>
          <td style="max-width:220px;white-space:normal;line-height:1.4">${role}</td>
          <td>${m.location || '—'}</td>
          <td style="max-width:200px;white-space:normal;line-height:1.4">${expertise}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-ghost btn-sm" onclick="Admin.openEditMemberModal(${i})">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="Admin.deleteMember(${i})">Delete</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  },

  // ── Areas table ───────────────────────────────────────
  renderAreasTable() {
    const expertMap = {};
    const interestMap = {};
    State.members.forEach(m => {
      (m.expertise || []).forEach(a => { expertMap[a] = (expertMap[a] || 0) + 1; });
      (m.interests || []).forEach(a => { interestMap[a] = (interestMap[a] || 0) + 1; });
    });
    const all = {};
    Object.keys(expertMap).forEach(k => { all[k] = { exp: expertMap[k], int: 0 }; });
    Object.keys(interestMap).forEach(k => {
      if (!all[k]) all[k] = { exp: 0, int: 0 };
      all[k].int = interestMap[k];
    });
    const sorted = Object.entries(all).sort((a, b) => (b[1].exp + b[1].int) - (a[1].exp + a[1].int));
    const tbody = document.getElementById('areasTableBody');
    tbody.innerHTML = sorted.map(([area, counts]) => `
      <tr>
        <td>${area}</td>
        <td>${counts.exp + counts.int}</td>
        <td>${counts.exp > 0 && counts.int > 0 ? 'Both' : counts.exp > 0 ? 'Expertise' : 'Interest'}</td>
      </tr>`).join('') || `<tr><td colspan="3" style="color:var(--text-3);padding:16px">No areas found.</td></tr>`;
  },

  // ── Post Modal ────────────────────────────────────────
  openNewPostModal() {
    this._openPostModal(null);
    switchPanel('posts');
  },

  openEditPostModal(id) {
    const post = State.posts.find(p => p.id === id);
    if (!post) return;
    this._openPostModal(post);
  },

  _openPostModal(post) {
    const isNew = !post;
    document.getElementById('postModalTitle').textContent = isNew ? 'New Article' : 'Edit Article';
    document.getElementById('postId').value           = isNew ? '' : post.id;
    document.getElementById('postTitle').value        = isNew ? '' : (post.title || '');
    document.getElementById('postAuthor').value       = isNew ? '' : (post.author || '');
    document.getElementById('postDate').value         = isNew ? today() : (post.date || '');
    document.getElementById('postCategory').value     = isNew ? 'Insights' : (post.category || 'Insights');
    document.getElementById('postPublished').value    = isNew ? 'true' : String(post.published !== false);
    document.getElementById('postExcerpt').value      = isNew ? '' : (post.excerpt || '');
    document.getElementById('postTags').value         = isNew ? '' : (post.tags || []).join(', ');
    document.getElementById('postContentMd').value   = isNew ? '' : (post.content || '');
    document.getElementById('postContentPreview').innerHTML = markdownToHtml(isNew ? '' : post.content || '');

    // Reset to first tab
    document.querySelectorAll('#postModal .modal-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
    document.querySelectorAll('#postModal .modal-tab-panel').forEach((p, i) => p.classList.toggle('active', i === 0));

    document.getElementById('postModal').classList.remove('hidden');
  },

  async savePost() {
    const title = document.getElementById('postTitle').value.trim();
    if (!title) { toast('Title is required', 'error'); return; }

    const id        = document.getElementById('postId').value || uid();
    const tags      = document.getElementById('postTags').value.split(',').map(t => t.trim()).filter(Boolean);
    const published = document.getElementById('postPublished').value === 'true';

    const post = {
      id,
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      excerpt:   document.getElementById('postExcerpt').value.trim(),
      content:   document.getElementById('postContentMd').value,
      author:    document.getElementById('postAuthor').value.trim(),
      date:      document.getElementById('postDate').value || today(),
      category:  document.getElementById('postCategory').value,
      tags,
      published,
      featured:  false
    };

    const idx = State.posts.findIndex(p => p.id === id);
    if (idx >= 0) State.posts[idx] = post;
    else          State.posts.unshift(post);

    document.getElementById('postModal').classList.add('hidden');
    this.renderPostsTable();
    this.updateDashboard();
    await this.savePosts(published ? 'Article published!' : 'Draft saved!');
  },

  async deletePost(id) {
    const post = State.posts.find(p => p.id === id);
    if (!post) return;
    const ok = await confirm('Delete article?', `"${post.title}" will be permanently deleted.`);
    if (!ok) return;
    State.posts = State.posts.filter(p => p.id !== id);
    this.renderPostsTable();
    this.updateDashboard();
    await this.savePosts('Article deleted');
  },

  // ── Member Modal ──────────────────────────────────────
  openNewMemberModal() {
    this._openMemberModal(-1);
    switchPanel('members');
  },

  openEditMemberModal(index) {
    this._openMemberModal(index);
  },

  _openMemberModal(index) {
    const isNew = index < 0;
    const m = isNew ? {} : State.members[index];
    document.getElementById('memberModalTitle').textContent = isNew ? 'New Member' : 'Edit Member';
    document.getElementById('memberIndex').value = index;

    document.getElementById('memName').value     = m.name || '';
    document.getElementById('memLocation').value = m.location || '';

    this._fillDynList('rolesContainer',       'role-',    m.roles || []);
    this._fillDynList('affiliationsContainer','affil-',   m.affiliations || []);
    this._fillDynList('educationContainer',   'edu-',     m.education || []);
    this._fillDynList('expertiseContainer',   'exp-',     m.expertise || []);
    this._fillDynList('interestsContainer',   'int-',     m.interests || []);
    this._fillDynList('emailsContainer',      'email-',   m.emails || []);
    this._fillDynList('phonesContainer',      'phone-',   m.phones || []);
    this._fillDynList('linkedinContainer',    'li-',      m.linkedin_profiles || []);

    // Other links
    const linksC = document.getElementById('linksContainer');
    linksC.innerHTML = '';
    (m.links || []).forEach(link => this.addLinkItem(link.label, link.url));

    // Works
    const worksC = document.getElementById('worksContainer');
    worksC.innerHTML = '';
    (m.works || []).forEach(w => this.addWorkItem(w));

    document.querySelectorAll('#memberModal .modal-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
    document.querySelectorAll('#memberModal .modal-tab-panel').forEach((p, i) => p.classList.toggle('active', i === 0));

    document.getElementById('memberModal').classList.remove('hidden');
  },

  _fillDynList(containerId, prefix, values) {
    const c = document.getElementById(containerId);
    c.innerHTML = '';
    values.forEach(v => this.addListItem(containerId, prefix, '', v));
    if (!values.length) this.addListItem(containerId, prefix, '');
  },

  addListItem(containerId, prefix, placeholder, value = '') {
    const c = document.getElementById(containerId);
    const row = document.createElement('div');
    row.className = 'dynamic-list-item';
    row.innerHTML = `
      <input type="text" placeholder="${placeholder}" value="${value.replace(/"/g,'&quot;')}" />
      <button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>`;
    c.appendChild(row);
    row.querySelector('input').focus();
  },

  addLinkItem(label = '', url = '') {
    const c = document.getElementById('linksContainer');
    const row = document.createElement('div');
    row.className = 'dynamic-list-item';
    row.style.gap = '6px';
    row.innerHTML = `
      <input type="text" placeholder="Label" value="${label.replace(/"/g,'&quot;')}" style="flex:.8" data-link-label />
      <input type="url" placeholder="https://…" value="${url.replace(/"/g,'&quot;')}" style="flex:1.2" data-link-url />
      <button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>`;
    c.appendChild(row);
  },

  addWorkItem(w = {}) {
    const c = document.getElementById('worksContainer');
    const div = document.createElement('div');
    div.className = 'works-form-item';
    div.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.works-form-item').remove()">Remove</button>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Title</label><input type="text" data-work-title placeholder="Publication or project title" value="${(w.title||'').replace(/"/g,'&quot;')}" /></div>
        <div class="form-group"><label class="form-label">Type</label><select data-work-type><option ${w.type==='Paper'?'selected':''}>Paper</option><option ${w.type==='Book'?'selected':''}>Book</option><option ${w.type==='Chapter'?'selected':''}>Chapter</option><option ${w.type==='Project'?'selected':''}>Project</option><option ${w.type==='Report'?'selected':''}>Report</option><option ${w.type==='Other'?'selected':''}>Other</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Year</label><input type="text" data-work-year placeholder="2024" value="${(w.year||'').replace(/"/g,'&quot;')}" /></div>
        <div class="form-group"><label class="form-label">URL</label><input type="url" data-work-link placeholder="https://…" value="${(w.link||'').replace(/"/g,'&quot;')}" /></div>
      </div>
      <div class="form-group"><label class="form-label">Note</label><input type="text" data-work-note placeholder="Optional note or description" value="${(w.note||'').replace(/"/g,'&quot;')}" /></div>`;
    c.appendChild(div);
  },

  _buildMember() {
    const works = Array.from(document.querySelectorAll('.works-form-item')).map(el => ({
      title: el.querySelector('[data-work-title]').value.trim(),
      type:  el.querySelector('[data-work-type]').value,
      year:  el.querySelector('[data-work-year]').value.trim(),
      link:  el.querySelector('[data-work-link]').value.trim(),
      note:  el.querySelector('[data-work-note]').value.trim()
    })).filter(w => w.title);

    const links = Array.from(document.querySelectorAll('#linksContainer .dynamic-list-item')).map(row => ({
      label: row.querySelector('[data-link-label]')?.value.trim() || '',
      url:   row.querySelector('[data-link-url]')?.value.trim() || ''
    })).filter(l => l.url);

    return {
      name:             document.getElementById('memName').value.trim(),
      roles:            getListValues('rolesContainer'),
      affiliations:     getListValues('affiliationsContainer'),
      location:         document.getElementById('memLocation').value.trim(),
      education:        getListValues('educationContainer'),
      expertise:        getListValues('expertiseContainer'),
      interests:        getListValues('interestsContainer'),
      emails:           getListValues('emailsContainer'),
      phones:           getListValues('phonesContainer'),
      linkedin_profiles: getListValues('linkedinContainer'),
      links,
      works
    };
  },

  async saveMember() {
    const member = this._buildMember();
    if (!member.name) { toast('Name is required', 'error'); return; }

    const index = parseInt(document.getElementById('memberIndex').value, 10);
    if (index >= 0) State.members[index] = member;
    else            State.members.push(member);

    document.getElementById('memberModal').classList.add('hidden');
    this.renderMembersTable();
    this.renderAreasTable();
    this.updateDashboard();
    await this.saveMembers('Member saved and published!');
  },

  async deleteMember(index) {
    const m = State.members[index];
    if (!m) return;
    const ok = await confirm('Delete member?', `"${m.name}" will be permanently removed from the directory.`);
    if (!ok) return;
    State.members.splice(index, 1);
    this.renderMembersTable();
    this.renderAreasTable();
    this.updateDashboard();
    await this.saveMembers('Member deleted');
  }
};

// ─── Panel switching ──────────────────────────────────────
function switchPanel(name) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
  document.getElementById('panel' + name.charAt(0).toUpperCase() + name.slice(1))?.classList.add('active');
  document.querySelector(`.sidebar-item[data-panel="${name}"]`)?.classList.add('active');
}

// ─── Modal tab switching ──────────────────────────────────
function initModalTabs(modalId) {
  document.querySelectorAll(`#${modalId} .modal-tab`).forEach(tab => {
    tab.addEventListener('click', () => {
      const panelId = tab.dataset.tab;
      document.querySelectorAll(`#${modalId} .modal-tab`).forEach(t => t.classList.remove('active'));
      document.querySelectorAll(`#${modalId} .modal-tab-panel`).forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(panelId)?.classList.add('active');
    });
  });
}

// ─── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Login
  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('loginPassword').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Sidebar navigation
  document.querySelectorAll('.sidebar-item[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
  });

  // New post/member buttons
  document.getElementById('newPostBtn').addEventListener('click', () => Admin.openNewPostModal());
  document.getElementById('newMemberBtn').addEventListener('click', () => Admin.openNewMemberModal());

  // Post modal
  initModalTabs('postModal');
  document.getElementById('postModalClose').addEventListener('click', () => document.getElementById('postModal').classList.add('hidden'));
  document.getElementById('postModalCancel').addEventListener('click', () => document.getElementById('postModal').classList.add('hidden'));
  document.getElementById('postModalSave').addEventListener('click', () => Admin.savePost());

  // Live markdown preview
  document.getElementById('postContentMd').addEventListener('input', e => {
    document.getElementById('postContentPreview').innerHTML = markdownToHtml(e.target.value);
  });

  // Member modal
  initModalTabs('memberModal');
  document.getElementById('memberModalClose').addEventListener('click', () => document.getElementById('memberModal').classList.add('hidden'));
  document.getElementById('memberModalCancel').addEventListener('click', () => document.getElementById('memberModal').classList.add('hidden'));
  document.getElementById('memberModalSave').addEventListener('click', () => Admin.saveMember());

  // Close modals on overlay click
  ['postModal', 'memberModal'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target === e.currentTarget) document.getElementById(id).classList.add('hidden');
    });
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.getElementById('postModal').classList.add('hidden');
      document.getElementById('memberModal').classList.add('hidden');
    }
  });

  // Settings: token
  document.getElementById('saveTokenBtn').addEventListener('click', () => {
    const val = document.getElementById('settingsToken').value.trim();
    State.token = val;
    if (val) localStorage.setItem('ethos_admin_token', val);
    else     localStorage.removeItem('ethos_admin_token');
    Admin.checkTokenStatus();
    toast('Token updated');
  });

  document.getElementById('toggleTokenBtn').addEventListener('click', () => {
    const input = document.getElementById('settingsToken');
    const btn   = document.getElementById('toggleTokenBtn');
    if (input.type === 'password') { input.type = 'text';     btn.textContent = 'Hide'; }
    else                           { input.type = 'password'; btn.textContent = 'Show'; }
  });

  // Restore token
  const saved = localStorage.getItem('ethos_admin_token');
  if (saved) document.getElementById('loginToken').value = saved;
});
