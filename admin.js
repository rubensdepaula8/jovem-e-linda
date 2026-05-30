// ============================================================
//  admin.js – Painel administrativo
// ============================================================

function openAdmin() {
  const panel = document.getElementById("admin-panel");
  if (panel) panel.classList.remove("hidden");
  switchAdminTab("agenda");
}

function closeAdmin() {
  const panel = document.getElementById("admin-panel");
  if (panel) panel.classList.add("hidden");
}

// ── Tabs ──────────────────────────────────────────────────────
function switchAdminTab(tab) {
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".admin-content").forEach(c => c.classList.remove("active"));

  const btn = document.getElementById(`tab-${tab}`);
  if (btn) btn.classList.add("active");
  const content = document.getElementById(`admin-${tab}`);
  if (content) content.classList.add("active");

  if (tab === "agenda")       renderAdminAgenda();
  if (tab === "profissionais") renderAdminPros();
  if (tab === "servicos")      renderAdminServices();
  if (tab === "config")        renderAdminConfig();
}

// ── Agenda ────────────────────────────────────────────────────
function renderAdminAgenda() {
  const list   = document.getElementById("admin-agenda-list");
  const filter = document.getElementById("admin-date-filter");
  const proSel = document.getElementById("admin-pro-filter");
  if (!list) return;

  const bookings = getBookings();
  const pros     = getProfessionals();

  // Popula filtro de profissional
  if (proSel && proSel.options.length === 0) {
    proSel.innerHTML = '<option value="">Todos os profissionais</option>' +
      pros.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
  }

  let filtered = bookings.filter(b => b.status !== "deleted");
  if (filter && filter.value) filtered = filtered.filter(b => b.date === filter.value);
  if (proSel && proSel.value) filtered = filtered.filter(b => b.professionalId === proSel.value);

  filtered.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  if (!filtered.length) { list.innerHTML = '<p class="muted" style="padding:16px">Nenhum agendamento encontrado.</p>'; return; }

  list.innerHTML = filtered.map(b => `
    <div class="agenda-item ${b.status === 'cancelled' ? 'cancelled' : ''}">
      <div class="agenda-main">
        <span class="agenda-time">${b.time} · ${formatDateBR2(b.date)}</span>
        <strong>${escapeHtml(b.clientName)}</strong>
        <span>${escapeHtml(b.serviceName)} · ${escapeHtml(b.professionalName)}</span>
        ${b.notes ? `<span class="agenda-notes">📝 ${escapeHtml(b.notes)}</span>` : ""}
      </div>
      <div class="agenda-actions">
        <span class="badge badge-${b.status}">${statusLabel(b.status)}</span>
        ${b.status !== "cancelled"
          ? `<button class="btn-sm btn-danger" type="button" onclick="cancelBooking('${b.id}')">Cancelar</button>`
          : `<button class="btn-sm btn-secondary" type="button" onclick="restoreBooking('${b.id}')">Restaurar</button>`}
        <button class="btn-sm btn-danger ghost" type="button" onclick="deleteBooking('${b.id}')">🗑</button>
      </div>
    </div>`).join("");
}

function statusLabel(s) {
  return s === "confirmed" ? "Confirmado" : s === "cancelled" ? "Cancelado" : s;
}

function formatDateBR2(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${String(d).padStart(2,"0")}/${String(m).padStart(2,"0")}/${y}`;
}

function cancelBooking(id) {
  const bks = getBookings();
  const i   = bks.findIndex(b => b.id === id);
  if (i >= 0) { bks[i].status = "cancelled"; saveBookingsData(bks); }
  renderAdminAgenda();
  showToast("Agendamento cancelado.");
}

function restoreBooking(id) {
  const bks = getBookings();
  const i   = bks.findIndex(b => b.id === id);
  if (i >= 0) { bks[i].status = "confirmed"; saveBookingsData(bks); }
  renderAdminAgenda();
  showToast("Agendamento restaurado.");
}

function deleteBooking(id) {
  if (!confirm("Excluir permanentemente este agendamento?")) return;
  const bks = getBookings().filter(b => b.id !== id);
  saveBookingsData(bks);
  renderAdminAgenda();
  showToast("Agendamento excluído.");
}

function exportBookingsCSV() {
  const bks = getBookings();
  const rows = [["ID","Data","Hora","Cliente","Telefone","Serviço","Profissional","Duração","Preço","Obs","Status","Criado em"]];
  bks.forEach(b => rows.push([
    b.id, b.date, b.time, b.clientName, b.clientPhone,
    b.serviceName, b.professionalName, b.duration, b.price,
    b.notes || "", b.status, b.createdAt || ""
  ]));
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "agendamentos.csv"; a.click();
  URL.revokeObjectURL(url);
}

function clearAllBookings() {
  if (!confirm("Limpar TODOS os agendamentos? Esta ação não pode ser desfeita.")) return;
  saveBookingsData([]);
  renderAdminAgenda();
  showToast("Todos os agendamentos foram removidos.");
}

// ── Profissionais ─────────────────────────────────────────────
function renderAdminPros() {
  const list = document.getElementById("admin-pro-list");
  if (!list) return;
  const pros = getProfessionals();
  if (!pros.length) { list.innerHTML = '<p class="muted" style="padding:16px">Nenhum profissional cadastrado.</p>'; return; }
  list.innerHTML = pros.map(p => `
    <div class="admin-item">
      <span class="pro-dot" style="background:${p.color || '#c9a96e'}">${p.emoji || "✂"}</span>
      <div><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.role)}</span></div>
      <div class="admin-item-actions">
        <button class="btn-sm btn-secondary" type="button" onclick="editProfessional('${p.id}')">Editar</button>
        <button class="btn-sm btn-danger ghost" type="button" onclick="deleteProfessional('${p.id}')">🗑</button>
      </div>
    </div>`).join("");
}

function editProfessional(id) {
  const p = getProfessionals().find(p => p.id === id);
  if (!p) return;
  setValue("pro-id", p.id); setValue("pro-name", p.name);
  setValue("pro-role", p.role); setValue("pro-emoji", p.emoji || "");
  setValue("pro-color", p.color || "#c9a96e");
  document.getElementById("pro-name")?.focus();
}

function saveProfessional() {
  const id    = getValue("pro-id");
  const name  = getValue("pro-name").trim();
  const role  = getValue("pro-role").trim();
  const emoji = getValue("pro-emoji").trim();
  const color = getValue("pro-color");
  if (!name || !role) { showToast("Nome e especialidade são obrigatórios."); return; }

  const pros = getProfessionals();
  if (id) {
    const i = pros.findIndex(p => p.id === id);
    if (i >= 0) Object.assign(pros[i], { name, role, emoji, color });
  } else {
    pros.push({ id: "pro_" + Date.now(), name, role, emoji, color });
  }
  saveProfessionalsData(pros);
  clearProfessionalForm();
  renderAdminPros();
  showToast("Profissional salvo!");
}

function deleteProfessional(id) {
  if (!confirm("Excluir este profissional?")) return;
  saveProfessionalsData(getProfessionals().filter(p => p.id !== id));
  renderAdminPros();
  showToast("Profissional removido.");
}

function clearProfessionalForm() {
  ["pro-id","pro-name","pro-role","pro-emoji"].forEach(id => setValue(id, ""));
  setValue("pro-color", "#c9a96e");
}

// ── Serviços ──────────────────────────────────────────────────
function renderAdminServices() {
  const list = document.getElementById("admin-service-list");
  if (!list) return;
  const svcs = getServices();
  if (!svcs.length) { list.innerHTML = '<p class="muted" style="padding:16px">Nenhum serviço cadastrado.</p>'; return; }
  list.innerHTML = svcs.map(s => `
    <div class="admin-item">
      <span style="font-size:1.4rem">${s.emoji || "✂️"}</span>
      <div>
        <strong>${escapeHtml(s.name)}</strong>
        <span>${s.duration} min · R$ ${Number(s.price).toFixed(2).replace(".",",")} · ${s.category}</span>
      </div>
      <div class="admin-item-actions">
        <button class="btn-sm btn-secondary" type="button" onclick="editService('${s.id}')">Editar</button>
        <button class="btn-sm btn-danger ghost" type="button" onclick="deleteService('${s.id}')">🗑</button>
      </div>
    </div>`).join("");
}

function editService(id) {
  const s = getServices().find(s => s.id === id);
  if (!s) return;
  setValue("svc-id", s.id); setValue("svc-name", s.name);
  setValue("svc-emoji", s.emoji || ""); setValue("svc-duration", s.duration);
  setValue("svc-price", s.price); setValue("svc-category", s.category);
  document.getElementById("svc-name")?.focus();
}

function saveService() {
  const id       = getValue("svc-id");
  const name     = getValue("svc-name").trim();
  const emoji    = getValue("svc-emoji").trim();
  const duration = parseInt(getValue("svc-duration"));
  const price    = parseFloat(getValue("svc-price"));
  const category = getValue("svc-category");
  if (!name || isNaN(duration) || isNaN(price)) { showToast("Preencha todos os campos obrigatórios."); return; }

  const svcs = getServices();
  if (id) {
    const i = svcs.findIndex(s => s.id === id);
    if (i >= 0) Object.assign(svcs[i], { name, emoji, duration, price, category });
  } else {
    svcs.push({ id: "svc_" + Date.now(), name, emoji, duration, price, category });
  }
  saveServicesData(svcs);
  clearServiceForm();
  renderAdminServices();
  showToast("Serviço salvo!");
}

function deleteService(id) {
  if (!confirm("Excluir este serviço?")) return;
  saveServicesData(getServices().filter(s => s.id !== id));
  renderAdminServices();
  showToast("Serviço removido.");
}

function clearServiceForm() {
  ["svc-id","svc-name","svc-emoji","svc-duration","svc-price"].forEach(id => setValue(id, ""));
  setValue("svc-category", "feminino");
}

// ── Config ────────────────────────────────────────────────────
function renderAdminConfig() {
  const cfg = getConfig();
  setValue("cfg-phone",       cfg.WHATSAPP_NUMBER || "");
  setValue("cfg-open",        cfg.OPEN_TIME        || "08:00");
  setValue("cfg-close",       cfg.CLOSE_TIME       || "19:00");
  setValue("cfg-slot",        cfg.SLOT_MINUTES     || 30);
  setValue("cfg-break-start", cfg.BREAK_START      || "");
  setValue("cfg-break-end",   cfg.BREAK_END        || "");
  document.querySelectorAll("input[name='workday']").forEach(cb => {
    cb.checked = (cfg.WORK_DAYS || []).includes(parseInt(cb.value));
  });
}

function saveSettings() {
  const workDays = Array.from(document.querySelectorAll("input[name='workday']:checked"))
    .map(cb => parseInt(cb.value));

  const cfg = Object.assign(getConfig(), {
    WHATSAPP_NUMBER: getValue("cfg-phone").replace(/\D/g, ""),
    OPEN_TIME:       getValue("cfg-open"),
    CLOSE_TIME:      getValue("cfg-close"),
    SLOT_MINUTES:    parseInt(getValue("cfg-slot")) || 30,
    BREAK_START:     getValue("cfg-break-start") || "",
    BREAK_END:       getValue("cfg-break-end")   || "",
    WORK_DAYS:       workDays,
  });
  saveConfig(cfg);
  showToast("Configurações salvas!");
}

function resetToDefaults() {
  if (!confirm("Restaurar profissionais e serviços padrão? Os agendamentos serão mantidos.")) return;
  localStorage.removeItem("jel_professionals");
  localStorage.removeItem("jel_services");
  localStorage.removeItem("jel_config");
  renderAdminPros();
  renderAdminServices();
  renderAdminConfig();
  showToast("Dados padrão restaurados.");
}

// ── Utilitários ───────────────────────────────────────────────
function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}
function setValue(id, v) {
  const el = document.getElementById(id);
  if (el) el.value = v;
}
