/* ============================================================
   ETHOS Alumni Network — Main JS
   ============================================================ */

// ─── Helpers ─────────────────────────────────────────────

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

// ─── Members ─────────────────────────────────────────────

async function loadMembers() {
  const res = await fetch('members.json', { cache: 'no-store' });
  const data = await res.json();
  return data.members || [];
}

function renderCards(list) {
  const cards = document.getElementById('cards');
  if (!cards) return;
  cards.innerHTML = '';

  const counter = document.getElementById('memberCount');
  if (counter) counter.textContent = list.length + ' member' + (list.length !== 1 ? 's' : '');

  if (list.length === 0) {
    cards.innerHTML = `
      <div class="empty-state">
        <h3>No members found</h3>
        <p>Try adjusting your search or filter.</p>
      </div>`;
    return;
  }

  list.forEach(m => {
    const el = document.createElement('div');
    el.className = 'card fade-in';

    const roles = Array.isArray(m.roles) ? m.roles : (m.role ? [m.role] : []);
    const affiliations = Array.isArray(m.affiliations) ? m.affiliations : [];
    const expertise = Array.isArray(m.expertise) ? m.expertise : [];
    const interests = Array.isArray(m.interests) ? m.interests : (Array.isArray(m.areas) ? m.areas : []);
    const education = Array.isArray(m.education) ? m.education : [];
    const works = Array.isArray(m.works) ? m.works : [];
    const emails = Array.isArray(m.emails) ? m.emails : (m.email ? [m.email] : []);
    const phones = Array.isArray(m.phones) ? m.phones : [];
    const linkedinProfiles = Array.isArray(m.linkedin_profiles) ? m.linkedin_profiles : (m.linkedin ? [m.linkedin] : []);
    const otherLinks = Array.isArray(m.links) ? m.links : [];

    // Badges
    const expertBadges = expertise.map(e => `<span class="badge badge-expert">${e}</span>`).join('');
    const interestBadges = interests.map(e => `<span class="badge">${e}</span>`).join('');
    let badgesHtml = '';
    if (expertBadges) badgesHtml += `<div class="badge-group"><span class="badge-label">Expertise</span>${expertBadges}</div>`;
    if (interestBadges) badgesHtml += `<div class="badge-group"><span class="badge-label">Interests</span>${interestBadges}</div>`;

    // Education
    const eduHtml = education.length
      ? `<div class="card-edu">${education.map(e => `<div class="card-edu-item">${e}</div>`).join('')}</div>`
      : '';

    // Works
    let worksHtml = '';
    if (works.length) {
      const items = works.map(w => {
        if (typeof w === 'string') return `<li>${w}</li>`;
        const title = w.title ? `<strong>${w.title}</strong>` : '';
        const meta = [w.type, w.year].filter(Boolean).join(', ');
        let content = `${title}${meta ? ` (${meta})` : ''}`;
        if (w.link) content = `<a href="${w.link}" target="_blank" rel="noopener">${content}</a>`;
        if (w.note) content += ` — ${w.note}`;
        return `<li>${content}</li>`;
      }).join('');
      worksHtml = `<div class="works-section"><div class="works-title">Works & Publications</div><ul class="works-list">${items}</ul></div>`;
    }

    // Contacts
    const contacts = [];
    linkedinProfiles.forEach((url, i) => {
      contacts.push(`<a class="contact-link" href="${url}" target="_blank" rel="noopener">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        LinkedIn${linkedinProfiles.length > 1 ? ` ${i+1}` : ''}
      </a>`);
    });
    emails.forEach((mail, i) => {
      contacts.push(`<a class="contact-link" href="mailto:${mail}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>
        ${emails.length > 1 ? `Email ${i+1}` : 'Email'}
      </a>`);
    });
    phones.forEach((phone, i) => {
      const clean = phone.replace(/\s+/g, '');
      contacts.push(`<a class="contact-link" href="tel:${clean}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.3a16 16 0 0 0 5.5 5.5l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 17l.92-.08z"/></svg>
        ${phones.length > 1 ? `Tel ${i+1}` : phone}
      </a>`);
    });
    otherLinks.forEach(link => {
      if (link?.url) {
        contacts.push(`<a class="contact-link" href="${link.url}" target="_blank" rel="noopener">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          ${link.label || 'Link'}
        </a>`);
      }
    });

    el.innerHTML = `
      <div class="card-header">
        <div class="card-avatar">${initials(m.name)}</div>
        <div>
          <div class="card-name">${m.name}</div>
          ${roles.length ? `<div class="card-role">${roles.join(' · ')}</div>` : ''}
          ${affiliations.length ? `<div class="card-affil">${affiliations.join(' · ')}</div>` : ''}
        </div>
      </div>
      ${m.location ? `<div class="card-location"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${m.location}</div>` : ''}
      ${eduHtml}
      ${badgesHtml ? `<div class="badges">${badgesHtml}</div>` : ''}
      ${worksHtml}
      ${contacts.length ? `<div class="card-contacts">${contacts.join('')}</div>` : ''}
    `;

    cards.appendChild(el);
  });
}

function applyFilters(members) {
  const q = document.getElementById('search')?.value.toLowerCase().trim() || '';
  const area = document.getElementById('areaFilter')?.value || '';

  const filtered = members.filter(m => {
    const roles = Array.isArray(m.roles) ? m.roles : (m.role ? [m.role] : []);
    const affiliations = Array.isArray(m.affiliations) ? m.affiliations : [];
    const expertise = Array.isArray(m.expertise) ? m.expertise : [];
    const interests = Array.isArray(m.interests) ? m.interests : [];
    const legacyAreas = Array.isArray(m.areas) ? m.areas : [];
    const allAreas = [...expertise, ...interests, ...legacyAreas];
    const education = Array.isArray(m.education) ? m.education : [];

    const haystack = [m.name || '', ...roles, ...affiliations, ...allAreas, ...education].join(' ').toLowerCase();
    const okSearch = !q || haystack.includes(q);
    const okArea = !area || allAreas.includes(area);
    return okSearch && okArea;
  });

  renderCards(filtered);
}

// ─── Posts (homepage preview) ─────────────────────────────

async function loadPosts() {
  try {
    const res = await fetch('posts.json', { cache: 'no-store' });
    const data = await res.json();
    return (data.posts || []).filter(p => p.published !== false);
  } catch { return []; }
}

function renderHomePostsPreview(posts) {
  const container = document.getElementById('homePosts');
  if (!container) return;

  const recent = posts.slice(0, 3);
  if (recent.length === 0) {
    container.innerHTML = `<p class="note" style="grid-column:1/-1;color:var(--text-3)">No articles published yet. Check back soon.</p>`;
    return;
  }

  container.innerHTML = recent.map(p => `
    <article class="post-card" onclick="openPost('${p.id}')">
      <div class="post-category">${p.category || 'Article'}</div>
      <h3>${p.title}</h3>
      <p class="post-excerpt">${p.excerpt || ''}</p>
      <div class="post-meta">
        <div class="post-author-line">
          <div class="post-avatar-mini">${initials(p.author || 'ET')}</div>
          <span>${p.author || 'ETHOS'}</span>
        </div>
        <span>${formatDate(p.date)}</span>
      </div>
    </article>
  `).join('');
}

// ─── Post Modal ───────────────────────────────────────────

let _allPosts = [];

function openPost(id) {
  const post = _allPosts.find(p => p.id === id);
  if (!post) return;

  const overlay = document.getElementById('postModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const meta = document.getElementById('modalMeta');

  if (!overlay) return;

  title.textContent = post.title;
  meta.innerHTML = `
    <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:4px">
      <span class="post-category">${post.category || 'Article'}</span>
      <span style="color:var(--text-3);font-size:.82rem">${formatDate(post.date)}</span>
      ${post.author ? `<span style="color:var(--text-3);font-size:.82rem">by ${post.author}</span>` : ''}
    </div>
  `;
  body.innerHTML = `<div class="post-content">${markdownToHtml(post.content || '')}</div>`;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closePost() {
  const overlay = document.getElementById('postModal');
  if (overlay) overlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// ─── Minimal Markdown renderer ───────────────────────────

function markdownToHtml(md) {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^#{6}\s(.+)/gm, '<h6>$1</h6>')
    .replace(/^#{5}\s(.+)/gm, '<h5>$1</h5>')
    .replace(/^#{4}\s(.+)/gm, '<h4>$1</h4>')
    .replace(/^#{3}\s(.+)/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s(.+)/gm, '<h2>$1</h2>')
    .replace(/^#{1}\s(.+)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^-{3,}$/gm, '<hr>')
    .replace(/^>\s(.+)/gm, '<blockquote>$1</blockquote>')
    .replace(/^[-*]\s(.+)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  return `<p>${html}</p>`.replace(/<p>(<h[1-6]>)/g, '$1').replace(/(<\/h[1-6]>)<\/p>/g, '$1')
    .replace(/<p>(<ul>)/g, '$1').replace(/(<\/ul>)<\/p>/g, '$1')
    .replace(/<p>(<blockquote>)/g, '$1').replace(/(<\/blockquote>)<\/p>/g, '$1')
    .replace(/<p>(<hr>)<\/p>/g, '$1').replace(/<p><\/p>/g, '');
}

// ─── Init ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  // Nav toggle
  const toggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  // Members
  const members = await loadMembers();
  renderCards(members);

  const statEl = document.getElementById('statMembers');
  if (statEl) statEl.textContent = members.length;

  document.getElementById('search')?.addEventListener('input', () => applyFilters(members));
  document.getElementById('areaFilter')?.addEventListener('change', () => applyFilters(members));

  // Posts
  _allPosts = await loadPosts();
  renderHomePostsPreview(_allPosts);

  // Modal close
  document.getElementById('postModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closePost();
  });
  document.getElementById('modalClose')?.addEventListener('click', closePost);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePost(); });
});
