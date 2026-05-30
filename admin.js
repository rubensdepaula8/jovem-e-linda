// ============================================================
// ADMIN.JS — Admin panel logic
// ============================================================

// ============================================================
// ADMIN PANEL OPEN/CLOSE
// ============================================================

function openAdmin() {
  const panel = document.getElementById("admin-panel");
  panel.classList.remove("hidden");
  switchAdminTab("agenda");
  renderAdminAgenda();
  renderAdminProfessionals();
  renderAdminServices();
  populateAdminProFilter();
  loadConfig();
}

function closeAdmin() {
  document.getElementById("admin-panel").classList.add("hidden");
}

// ============================================================
// ADMIN TABS
// ============================================================

function switchAdminTab(tab) {
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".admin-content").forEach(c => c.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");
  document.getElementById(`admin-${tab}`).classList.add("active");
}

// ============================================================
// AGENDA TAB
// ============================================================

function populateAdminProFilter() {
  const sel = document.getElementById("admin-pro-filter");
  const pros = DB.professionals.filter(p => p.active);
  sel.innerHTML = '<option value="">Todos os profissionais</option>' +
    pros.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
}

function renderAdminAgenda() {
  const dateVal = document.getElementById("admin-date-filter")?.value || "";
  const proVal  = document.getElementById("admin-pro-filter")?.value  || "";

  let bookings = [...DB.bookings];
  if (dateVal) bookings = bookings.filter(b => b.date === dateVal);
  if (proVal)  bookings = bookings.filter(b => b.professionalId === proVal);

  // Sort by time
  bookings.sort((a, b) => a.time.localeCompare(b.time));

  const list = document.getElementById("admin-agenda-list");
  if (!list) return;

  if (!bookings.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <h4>Nenhum agendamento encontrado</h4>
        <p>Tente outro filtro ou data</p>
      </div>`;
    return;
  }

  list.innerHTML = bookings.map(b => {
    const statusClass = b.status === "done" ? "status-done" : b.status === "cancelled" ? "status-cancelled" : "";
    const statusBadge = b.status === "done"
      ? '<span class="status-badge status-done-badge">Concluído</span>'
      : b.status === "cancelled"
      ? '<span class="status-badge status-cancelled-badge">Cancelado</span>'
      : '';

    const h = Math.floor(b.duration / 60);
    const m = b.duration % 60;
    const durStr = h > 0 ? (m > 0 ? `${h}h${m}min` : `${h}h`) : `${m}min`;

    const dateObj = new Date(b.date + "T00:00:00");
    const dateStr = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

    return `
      <div class="admin-booking-card ${statusClass}" id="bk-card-${b.id}">
        <div class="admin-booking-time">${b.time}</div>
        <div class="admin-booking-info">
          <div class="admin-booking-client">
            ${b.clientName} ${statusBadge}
          </div>
          <div class="admin-booking-details">
            ${b.serviceName} · ${durStr} · <strong style="color:var(--gold);cursor:pointer" onclick="editBookingPrice('${b.id}')" title="Editar valor do agendamento">R$ ${b.price} ✏️</strong> · ${b.professionalName}
            ${!document.getElementById("admin-date-filter")?.value ? ` · ${dateStr}` : ''}
            ${b.clientPhone ? ` · <a href="https://wa.me/${b.clientPhone.replace(/\D/g,'')}" target="_blank" style="color:var(--gold);text-decoration:none">📱 ${b.clientPhone}</a>` : ''}
            ${b.notes ? `<br>📝 ${b.notes}` : ''}
          </div>
        </div>
        <div class="admin-booking-actions">
          ${b.status !== "done" && b.status !== "cancelled" ? `
            <button class="btn-done" title="Marcar como concluído" onclick="updateBookingStatus('${b.id}','done')">✓</button>
            <button class="btn-cancel-booking" title="Cancelar" onclick="updateBookingStatus('${b.id}','cancelled')">✕</button>
          ` : `
            <button class="btn-edit" onclick="updateBookingStatus('${b.id}','confirmed')">↩</button>
          `}
        </div>
      </div>`;
  }).join("");
}

function editBookingPrice(id) {
  const b = DB.bookings.find(x => x.id === id);
  if (!b) return;
  const newPrice = prompt(`Editar valor do agendamento de ${b.clientName}:\nServiço: ${b.serviceName}`, b.price);
  if (newPrice === null) return;
  const parsed = parseFloat(newPrice);
  if (isNaN(parsed) || parsed < 0) {
    showToast("Valor inválido!", "error");
    return;
  }
  b.price = parsed;
  saveData(DB);
  renderAdminAgenda();
  showToast("Valor do agendamento atualizado!", "success");
}

function updateBookingStatus(id, status) {
  const idx = DB.bookings.findIndex(b => b.id === id);
  if (idx < 0) return;
  DB.bookings[idx].status = status;
  saveData(DB);
  renderAdminAgenda();
  const labels = { done: "Marcado como concluído", cancelled: "Agendamento cancelado", confirmed: "Agendamento restaurado" };
  showToast(labels[status] || "Atualizado", "success");
}

// ============================================================
// PROFESSIONALS TAB
// ============================================================

let editingProId = null;

function renderAdminProfessionals() {
  const list = document.getElementById("admin-pro-list");
  if (!list) return;
  const pros = DB.professionals;

  if (!pros.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👥</div><h4>Nenhum profissional</h4><p>Adicione o primeiro profissional</p></div>`;
    return;
  }

  list.innerHTML = pros.map(p => `
    <div class="admin-item-card" id="pro-item-${p.id}">
      <div class="admin-item-icon" style="background:${p.color}22; border: 1px solid ${p.color}44">
        <span style="font-size:20px">${p.emoji}</span>
      </div>
      <div class="admin-item-info">
        <h4>${p.name} ${!p.active ? '<span style="color:var(--white-dim);font-size:11px">(Inativo)</span>' : ''}</h4>
        <p>${p.role}</p>
      </div>
      <div class="admin-item-actions">
        <button class="btn-edit" onclick="openProForm('${p.id}')">✏</button>
        <button class="btn-delete" onclick="deletePro('${p.id}')">🗑</button>
      </div>
    </div>`).join("");
}

function openProForm(id) {
  const box = document.getElementById("pro-form-box");
  box.classList.remove("hidden");
  editingProId = id || null;

  if (id) {
    const p = DB.professionals.find(pr => pr.id === id);
    document.getElementById("pro-form-title").textContent = "Editar Profissional";
    document.getElementById("pro-name").value   = p.name;
    document.getElementById("pro-role").value   = p.role;
    document.getElementById("pro-emoji").value  = p.emoji;
    document.getElementById("pro-color").value  = p.color;
  } else {
    document.getElementById("pro-form-title").textContent = "Novo Profissional";
    document.getElementById("pro-name").value   = "";
    document.getElementById("pro-role").value   = "";
    document.getElementById("pro-emoji").value  = "💇";
    document.getElementById("pro-color").value  = "#c9a96e";
  }

  box.scrollIntoView({ behavior: "smooth" });
}

function cancelProForm() {
  document.getElementById("pro-form-box").classList.add("hidden");
  editingProId = null;
}

function savePro() {
  const name  = document.getElementById("pro-name").value.trim();
  const role  = document.getElementById("pro-role").value.trim();
  const emoji = document.getElementById("pro-emoji").value.trim() || "💇";
  const color = document.getElementById("pro-color").value;

  if (!name) { showToast("Nome obrigatório", "error"); return; }

  if (editingProId) {
    const idx = DB.professionals.findIndex(p => p.id === editingProId);
    if (idx >= 0) {
      DB.professionals[idx] = { ...DB.professionals[idx], name, role, emoji, color };
    }
  } else {
    DB.professionals.push({
      id: "pro-" + Date.now(),
      name, role, emoji, color, active: true
    });
  }

  saveData(DB);
  renderAdminProfessionals();
  populateAdminProFilter();
  cancelProForm();
  showToast(editingProId ? "Profissional atualizado!" : "Profissional adicionado!", "success");
  editingProId = null;
  // Update public list too
  renderProfessionals();
}

function deletePro(id) {
  if (!confirm("Remover este profissional?")) return;
  DB.professionals = DB.professionals.filter(p => p.id !== id);
  saveData(DB);
  renderAdminProfessionals();
  renderProfessionals();
  showToast("Profissional removido", "info");
}

// ============================================================
// SERVICES TAB
// ============================================================

let editingSvcId = null;

function renderAdminServices() {
  const list = document.getElementById("admin-service-list");
  if (!list) return;
  const services = DB.services;

  if (!services.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💈</div><h4>Nenhum serviço</h4><p>Adicione o primeiro serviço</p></div>`;
    return;
  }

  const catColors = { feminino: "var(--pink)", masculino: "#6aaade", unissex: "var(--gold)", estetica: "#c87de8" };

  list.innerHTML = services.map(s => {
    const h = Math.floor(s.duration / 60);
    const m = s.duration % 60;
    const durStr = h > 0 ? (m > 0 ? `${h}h${m}min` : `${h}h`) : `${m}min`;
    return `
      <div class="admin-item-card" id="svc-item-${s.id}">
        <div class="admin-item-icon">
          <span style="font-size:20px">${s.emoji}</span>
        </div>
        <div class="admin-item-info">
          <h4>${s.name}</h4>
          <p style="color:${catColors[s.category]}">${s.category} · ${durStr} · R$ ${s.price}</p>
        </div>
        <div class="admin-item-actions">
          <button class="btn-edit" onclick="openServiceForm('${s.id}')">✏</button>
          <button class="btn-delete" onclick="deleteService('${s.id}')">🗑</button>
        </div>
      </div>`;
  }).join("");
}

function openServiceForm(id) {
  const box = document.getElementById("service-form-box");
  box.classList.remove("hidden");
  editingSvcId = id || null;

  if (id) {
    const s = DB.services.find(sv => sv.id === id);
    document.getElementById("service-form-title").textContent = "Editar Serviço";
    document.getElementById("svc-name").value     = s.name;
    document.getElementById("svc-emoji").value    = s.emoji;
    document.getElementById("svc-duration").value = s.duration;
    document.getElementById("svc-price").value    = s.price;
    document.getElementById("svc-category").value = s.category;
  } else {
    document.getElementById("service-form-title").textContent = "Novo Serviço";
    document.getElementById("svc-name").value     = "";
    document.getElementById("svc-emoji").value    = "✂️";
    document.getElementById("svc-duration").value = "60";
    document.getElementById("svc-price").value    = "";
    document.getElementById("svc-category").value = "unissex";
  }

  box.scrollIntoView({ behavior: "smooth" });
}

function cancelServiceForm() {
  document.getElementById("service-form-box").classList.add("hidden");
  editingSvcId = null;
}

function saveService() {
  const name     = document.getElementById("svc-name").value.trim();
  const emoji    = document.getElementById("svc-emoji").value.trim() || "✂️";
  const duration = parseInt(document.getElementById("svc-duration").value);
  const price    = parseFloat(document.getElementById("svc-price").value);
  const category = document.getElementById("svc-category").value;

  if (!name)           { showToast("Nome obrigatório", "error"); return; }
  if (isNaN(duration)) { showToast("Duração inválida", "error"); return; }
  if (isNaN(price))    { showToast("Preço inválido", "error"); return; }

  if (editingSvcId) {
    const idx = DB.services.findIndex(s => s.id === editingSvcId);
    if (idx >= 0) DB.services[idx] = { ...DB.services[idx], name, emoji, duration, price, category };
  } else {
    DB.services.push({
      id: "svc-" + Date.now(),
      name, emoji, duration, price, category
    });
  }

  saveData(DB);
  renderAdminServices();
  cancelServiceForm();
  showToast(editingSvcId ? "Serviço atualizado!" : "Serviço adicionado!", "success");
  editingSvcId = null;
}

function deleteService(id) {
  if (!confirm("Remover este serviço?")) return;
  DB.services = DB.services.filter(s => s.id !== id);
  saveData(DB);
  renderAdminServices();
  showToast("Serviço removido", "info");
}

// ============================================================
// CONFIG TAB
// ============================================================

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function loadConfig() {
  const cfg = DB.salon;
  document.getElementById("cfg-open").value  = cfg.openTime;
  document.getElementById("cfg-close").value = cfg.closeTime;
  document.getElementById("cfg-slot").value  = cfg.slotMinutes;
  document.getElementById("cfg-break-start").value = cfg.breakStart || "12:00";
  document.getElementById("cfg-break-end").value   = cfg.breakEnd   || "13:00";

  // Days
  const container = document.getElementById("days-check");
  if (!container) return;
  container.innerHTML = DAY_NAMES.map((d, i) => `
    <button type="button" class="day-btn ${cfg.workDays.includes(i) ? 'active' : ''}"
            id="day-btn-${i}" onclick="toggleDay(${i})">${d}</button>`).join("");
}

function toggleDay(i) {
  const btn = document.getElementById(`day-btn-${i}`);
  const idx = DB.salon.workDays.indexOf(i);
  if (idx >= 0) {
    DB.salon.workDays.splice(idx, 1);
    btn.classList.remove("active");
  } else {
    DB.salon.workDays.push(i);
    DB.salon.workDays.sort();
    btn.classList.add("active");
  }
}

function saveConfig() {
  DB.salon.openTime   = document.getElementById("cfg-open").value;
  DB.salon.closeTime  = document.getElementById("cfg-close").value;
  DB.salon.slotMinutes = parseInt(document.getElementById("cfg-slot").value) || 30;
  DB.salon.breakStart = document.getElementById("cfg-break-start").value;
  DB.salon.breakEnd   = document.getElementById("cfg-break-end").value;
  saveData(DB);
  showToast("Configurações salvas!", "success");
}
