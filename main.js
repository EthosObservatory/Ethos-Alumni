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

    // --- ROLES (merged ETHOS + external) ---
    let roles = [];
    if (Array.isArray(m.roles) && m.roles.length > 0) {
      roles = m.roles;
    } else if (m.role) {
      roles = [m.role]; // fallback
    }
    const rolesText = roles.join(" • ");

    // --- AFFILIATIONS ---
    const affiliations = Array.isArray(m.affiliations) ? m.affiliations : [];
    const affiliationsText = affiliations.join(" • ");

    // --- EXPERTISE / INTERESTS (+ fallback to areas legacy) ---
    let expertise = Array.isArray(m.expertise) ? m.expertise : [];
    let interests = Array.isArray(m.interests) ? m.interests : [];

    if (expertise.length === 0 && interests.length === 0 && Array.isArray(m.areas)) {
      interests = m.areas; // legacy compatibility
    }

    const expertiseBadges = expertise.map(e => `<span class="badge">${e}</span>`).join("");
    const interestsBadges = interests.map(e => `<span class="badge">${e}</span>`).join("");

    let badgesHtml = "";
    if (expertiseBadges) {
      badgesHtml += `<div class="badge-group"><span class="badge-label">Expertise</span>${expertiseBadges}</div>`;
    }
    if (interestsBadges) {
      badgesHtml += `<div class="badge-group"><span class="badge-label">Interests</span>${interestsBadges}</div>`;
    }

    // --- DEGREES ---
    const degrees = Array.isArray(m.degrees) ? m.degrees : [];
    const degreesRow = degrees.length
      ? `<p class="meta-line"><strong>Degrees:</strong> ${degrees.join(" • ")}</p>`
      : "";

    // --- WORKS (papers, books, projects) ---
    const works = Array.isArray(m.works) ? m.works : [];
    let worksHtml = "";

    if (works.length > 0) {
      const items = works.map(w => {
        if (typeof w === "string") return `<li>${w}</li>`;

        const title = w.title ? `<strong>${w.title}</strong>` : "";
        const meta = [w.type, w.year].filter(Boolean).join(", ");
        const metaText = meta ? ` (${meta})` : "";
        let content = `${title}${metaText}`;

        if (w.link) {
          content = `<a href="${w.link}" target="_blank" rel="noopener">${content}</a>`;
        }
        if (w.note) content += ` – ${w.note}`;

        return `<li>${content}</li>`;
      }).join("");

      worksHtml = `
        <div class="works">
          <p class="meta-line"><strong>Works:</strong></p>
          <ul class="works-list">
            ${items}
          </ul>
        </div>
      `;
    }

    // --- CONTACTS (multiple emails, phones, links) ---
    const emails = Array.isArray(m.emails) ? m.emails : (m.email ? [m.email] : []);
    const phones = Array.isArray(m.phones) ? m.phones : [];
    const linkedinProfiles = Array.isArray(m.linkedin_profiles)
      ? m.linkedin_profiles
      : (m.linkedin ? [m.linkedin] : []);
    const otherLinks = Array.isArray(m.links) ? m.links : [];

    const contacts = [];

    linkedinProfiles.forEach((url, i) => {
      const label = linkedinProfiles.length > 1 ? `LinkedIn ${i+1}` : "LinkedIn";
      contacts.push(`<a href="${url}" target="_blank">${label}</a>`);
    });

    emails.forEach((mail, i) => {
      const label = emails.length > 1 ? `Email ${i+1}` : "Email";
      contacts.push(`<a href="mailto:${mail}">${label}</a>`);
    });

    phones.forEach((phone, i) => {
      const clean = phone.replace(/\s+/g, "");
      const label = phones.length > 1 ? `Tel ${i+1}` : "Tel";
      contacts.push(`<a href="tel:${clean}">${label}: ${phone}</a>`);
    });

    otherLinks.forEach(link => {
      if (link && link.url) {
        contacts.push(`<a href="${link.url}" target="_blank">${link.label || "Link"}</a>`);
      }
    });

    const contactsHtml = contacts.join(" • ");

    // --- CARD OUTPUT ---
    el.innerHTML = `
      <h3>${m.name}</h3>
      <p><strong>${rolesText}</strong>${affiliationsText ? " • " + affiliationsText : ""}</p>
      <p>${m.location || ""}</p>

      ${degreesRow}

      <div class="badges">${badgesHtml}</div>

      ${worksHtml}

      <p>${contactsHtml}</p>
    `;

    cards.appendChild(el);
  });
}

function applyFilters(members) {
  const q = document.getElementById("search").value.toLowerCase().trim();
  const area = document.getElementById("areaFilter").value;

  const filtered = members.filter(m => {
    const roles = Array.isArray(m.roles) ? m.roles : (m.role ? [m.role] : []);
    const affiliations = Array.isArray(m.affiliations) ? m.affiliations : [];
    const expertise = Array.isArray(m.expertise) ? m.expertise : [];
    const interests = Array.isArray(m.interests) ? m.interests : [];
    const legacyAreas = Array.isArray(m.areas) ? m.areas : [];

    const allAreas = [...expertise, ...interests, ...legacyAreas];

    const haystack = [
      m.name || "",
      ...roles,
      ...affiliations,
      ...allAreas
    ].join(" ").toLowerCase();

    const okSearch = !q || haystack.includes(q);
    const okArea = !area || allAreas.includes(area);

    return okSearch && okArea;
  });

  renderCards(filtered);
}

document.addEventListener("DOMContentLoaded", async () => {
  const members = await loadMembers();
  renderCards(members);

  document.getElementById("search").addEventListener("input", () => applyFilters(members));
  document.getElementById("areaFilter").addEventListener("change", () => applyFilters(members));
});
