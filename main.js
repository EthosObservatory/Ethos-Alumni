async function loadMembers() {
  const res = await fetch('members.json', { cache: 'no-store' });
  const data = await res.json();
  return data.members || [];
}

function renderCards(list) {
  const cards = document.getElementById('cards');
  cards.innerHTML = '';

  list.forEach(m => {
    const el = document.createElement('div');
    el.className = 'card';

    // Affiliazioni multiple o singola
    const allAffiliations = (m.affiliations && m.affiliations.length > 0)
      ? m.affiliations
      : (m.affiliation ? [m.affiliation] : []);

    const affiliationsText = allAffiliations.join(' • ');

    // Expertise & Interests, con fallback sul vecchio "areas"
    let expertise = m.expertise || [];
    let interests = m.interests || [];

    if (expertise.length === 0 && interests.length === 0 && m.areas && m.areas.length > 0) {
      // Se il profilo è ancora vecchio stile, trattiamo "areas" come "interests"
      interests = m.areas;
    }

    const expertiseBadges = (expertise || []).map(a => `<span class="badge">${a}</span>`).join('');
    const interestsBadges = (interests || []).map(a => `<span class="badge">${a}</span>`).join('');

    let badgesHtml = '';
    if (expertiseBadges) {
      badgesHtml += `<div class="badge-group"><span class="badge-label">Expertise</span>${expertiseBadges}</div>`;
    }
    if (interestsBadges) {
      badgesHtml += `<div class="badge-group"><span class="badge-label">Interests</span>${interestsBadges}</div>`;
    }

    // Contatti (LinkedIn + email, eventualmente estendibili)
    let contactsHtml = '';
    if (m.linkedin) {
      contactsHtml += `<a href="${m.linkedin}" target="_blank" rel="noopener">LinkedIn</a>`;
    }
    if (m.email) {
      contactsHtml += `${contactsHtml ? ' • ' : ''}<a href="mailto:${m.email}">Email</a>`;
    }

    el.innerHTML = `
      <h3>${m.name}</h3>
      <p><strong>${m.role || ''}</strong>${affiliationsText ? ' • ' + affiliationsText : ''}</p>
      <p>${m.location || ''}</p>
      <div class="badges">
        ${badgesHtml}
      </div>
      <p>${contactsHtml}</p>
    `;

    cards.appendChild(el);
  });
}

function applyFilters(members) {
  const q = document.getElementById('search').value.toLowerCase().trim();
  const area = document.getElementById('areaFilter').value;

  const filtered = members.filter(m => {
    const expertise = m.expertise || [];
    const interests = m.interests || [];
    const legacyAreas = m.areas || [];

    const allAreas = [...expertise, ...interests, ...legacyAreas];

    const haystack = [
      m.name || '',
      m.role || '',
      m.affiliation || '',
      ...allAreas
    ].join(' ').toLowerCase();

    const okQ = !q || haystack.includes(q);
    const okA = !area || allAreas.includes(area);

    return okQ && okA;
  });

  renderCards(filtered);
}

document.addEventListener('DOMContentLoaded', async () => {
  const members = await loadMembers();
  renderCards(members);

  document.getElementById('search').addEventListener('input', () => applyFilters(members));
  document.getElementById('areaFilter').addEventListener('change', () => applyFilters(members));
});
