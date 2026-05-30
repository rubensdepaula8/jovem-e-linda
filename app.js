// ============================================================
//  app.js – Lógica principal do agendamento
// ============================================================

// ── Estado global ────────────────────────────────────────────
let state = {
  step: 1,
  professional: null,
  service: null,
  date: null,
  time: null,
  calMonth: null,  // Date objeto apontando para o 1º dia do mês exibido
};

// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa mês do calendário com hoje
  const now = new Date();
  state.calMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Aplica textos do config no cabeçalho
  const cfg = getConfig();
  const el = (id) => document.getElementById(id);
  el("header-title").textContent    = cfg.SALON_NAME     || "Jovem e Linda";
  el("header-subtitle").textContent = cfg.SALON_SUBTITLE || "ESTÚDIO";
  el("header-extra").textContent    = cfg.SALON_EXTRA    || "✂ UNISSEX";

  // Renderiza profissionais
  renderProfessionals();

  // Esconde splash e mostra app
  setTimeout(() => {
    const splash = el("splash");
    if (splash) {
      splash.style.opacity = "0";
      splash.style.transition = "opacity .4s";
      setTimeout(() => { splash.style.display = "none"; }, 400);
    }
    const app = el("app");
    if (app) app.classList.remove("hidden");
  }, 900);
});

// ── Profissionais ────────────────────────────────────────────
function renderProfessionals() {
  const grid = document.getElementById("professionals-grid");
  if (!grid) return;
  const pros = getProfessionals();
  grid.innerHTML = pros.map(p => `
    <button class="pro-card" type="button" onclick="selectProfessional('${p.id}')"
      style="--pro-color:${p.color || '#c9a96e'}">
      <div class="pro-avatar" style="background:${p.color || '#c9a96e'}22;border-color:${p.color || '#c9a96e'}">
        <span>${p.emoji || p.name.charAt(0)}</span>
      </div>
      <strong>${escapeHtml(p.name)}</strong>
      <span>${escapeHtml(p.role)}</span>
    </button>`).join("");
}

function selectProfessional(id) {
  const pros = getProfessionals();
  state.professional = pros.find(p => p.id === id) || null;
  if (!state.professional) return;
  // Limpa seleção anterior de serviço/data/hora
  state.service = null;
  state.date = null;
  state.time = null;
  goToStep(2);
}

// ── Serviços ─────────────────────────────────────────────────
function renderServices() {
  const list = document.getElementById("services-list");
  const nameEl = document.getElementById("selected-pro-name-s2");
  if (!list || !state.professional) return;
  if (nameEl) nameEl.textContent = state.professional.name;

  const svcs = getServices();
  const categories = { feminino: "🌸 Feminino", masculino: "💈 Masculino", unissex: "✨ Unissex", estetica: "💄 Estética" };
  const grouped = {};
  svcs.forEach(s => { (grouped[s.category] = grouped[s.category] || []).push(s); });

  list.innerHTML = Object.keys(categories).filter(k => grouped[k]).map(cat => `
    <div class="service-category">
      <p class="eyebrow">${categories[cat]}</p>
      ${grouped[cat].map(s => `
        <button class="service-item ${state.service && state.service.id === s.id ? 'selected' : ''}"
          type="button" onclick="selectService('${s.id}')">
          <span class="svc-emoji">${s.emoji || "✂️"}</span>
          <span class="svc-info">
            <strong>${escapeHtml(s.name)}</strong>
            <span>${s.duration} min · R$ ${Number(s.price).toFixed(2).replace(".", ",")}</span>
          </span>
          <span class="svc-check">✓</span>
        </button>`).join("")}
    </div>`).join("");
}

function selectService(id) {
  const svcs = getServices();
  state.service = svcs.find(s => s.id === id) || null;
  if (!state.service) return;
  state.date = null;
  state.time = null;
  goToStep(3);
}

// ── Calendário ───────────────────────────────────────────────
function renderCalendar() {
  const label  = document.getElementById("cal-month-label");
  const grid   = document.getElementById("calendar-grid");
  if (!label || !grid) return;

  const cfg    = getConfig();
  const year   = state.calMonth.getFullYear();
  const month  = state.calMonth.getMonth();
  const today  = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  label.textContent = `${monthNames[month]} ${year}`;

  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const workDays  = cfg.WORK_DAYS || [1,2,3,4,5,6];

  let html = '<div class="cal-weekdays"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div><div class="cal-days">';
  for (let i = 0; i < firstDay; i++) html += '<span class="cal-empty"></span>';
  for (let d = 1; d <= daysInMon; d++) {
    const dt      = new Date(year, month, d);
    const isPast  = dt < today;
    const isWork  = workDays.includes(dt.getDay());
    const selStr  = state.date ? formatDate(state.date) : null;
    const thisStr = formatDate(dt);
    const isSel   = selStr === thisStr;
    const cls     = ["cal-day", isPast || !isWork ? "disabled" : "", isSel ? "selected" : ""].join(" ").trim();
    const onclick = !isPast && isWork ? `onclick="selectDate('${thisStr}')"` : "";
    html += `<button type="button" class="${cls}" ${onclick}>${d}</button>`;
  }
  html += '</div>';
  grid.innerHTML = html;

  // Atualiza subtítulo
  const sub = document.getElementById("datetime-subtitle");
  if (sub && state.professional && state.service) {
    sub.textContent = `${state.professional.name} · ${state.service.name}`;
  }
}

function changeMonth(delta) {
  const m = state.calMonth;
  state.calMonth = new Date(m.getFullYear(), m.getMonth() + delta, 1);
  state.date = null;
  state.time = null;
  renderCalendar();
  document.getElementById("time-slots-container").innerHTML =
    '<p class="muted">← Selecione uma data para ver os horários</p>';
}

function selectDate(dateStr) {
  state.date = parseDate(dateStr);
  state.time = null;
  renderCalendar();
  renderTimeSlots();
}

// ── Horários ─────────────────────────────────────────────────
function renderTimeSlots() {
  const container = document.getElementById("time-slots-container");
  if (!container || !state.date || !state.service) return;

  const cfg        = getConfig();
  const slots      = generateSlots(cfg, state.service.duration);
  const bookings   = getBookings();
  const dateStr    = formatDate(state.date);
  const proId      = state.professional ? state.professional.id : null;

  // Horários já reservados para este profissional nesta data
  const busyEnds = [];
  bookings.forEach(b => {
    if (b.professionalId === proId && b.date === dateStr && b.status !== "cancelled") {
      busyEnds.push({ start: timeToMin(b.time), end: timeToMin(b.time) + (b.duration || 30) });
    }
  });

  const now         = new Date();
  const isToday     = formatDate(now) === dateStr;
  const currentMin  = isToday ? now.getHours() * 60 + now.getMinutes() : 0;

  const available = slots.filter(t => {
    const m = timeToMin(t);
    if (isToday && m <= currentMin) return false;
    return !busyEnds.some(b => m < b.end && m + state.service.duration > b.start);
  });

  if (!available.length) {
    container.innerHTML = '<p class="muted">Nenhum horário disponível nesta data.</p>';
    return;
  }

  container.innerHTML = `
    <p class="eyebrow" style="margin-bottom:8px">Horários disponíveis</p>
    <div class="time-slots">${available.map(t =>
      `<button type="button" class="time-slot${state.time === t ? " selected" : ""}"
        onclick="selectTime('${t}')">${t}</button>`
    ).join("")}</div>`;
}

function selectTime(t) {
  state.time = t;
  renderTimeSlots();
  goToStep(4);
}

// ── Confirmação ──────────────────────────────────────────────
function renderBookingSummary() {
  const el = document.getElementById("booking-summary-mini");
  if (!el || !state.professional || !state.service || !state.date || !state.time) return;
  el.innerHTML = `
    <div class="summary-line"><span>Profissional</span><strong>${escapeHtml(state.professional.name)}</strong></div>
    <div class="summary-line"><span>Serviço</span><strong>${escapeHtml(state.service.name)}</strong></div>
    <div class="summary-line"><span>Data</span><strong>${formatDateBR(state.date)}</strong></div>
    <div class="summary-line"><span>Horário</span><strong>${state.time}</strong></div>
    <div class="summary-line"><span>Valor</span><strong>R$ ${Number(state.service.price).toFixed(2).replace(".", ",")}</strong></div>`;
}

function confirmBooking() {
  const nameInput  = document.getElementById("client-name");
  const phoneInput = document.getElementById("client-phone");
  const notesInput = document.getElementById("client-notes");

  const name  = nameInput  ? nameInput.value.trim()  : "";
  const phone = phoneInput ? phoneInput.value.trim() : "";

  if (!name)  { showToast("Por favor, informe seu nome."); nameInput && nameInput.focus(); return; }
  if (!phone) { showToast("Por favor, informe seu WhatsApp."); phoneInput && phoneInput.focus(); return; }
  if (!state.professional || !state.service || !state.date || !state.time) {
    showToast("Dados incompletos. Recomece o agendamento."); return;
  }

  const booking = {
    id: "bk_" + Date.now(),
    professionalId: state.professional.id,
    professionalName: state.professional.name,
    serviceId: state.service.id,
    serviceName: state.service.name,
    duration: state.service.duration,
    price: state.service.price,
    date: formatDate(state.date),
    time: state.time,
    clientName: name,
    clientPhone: phone,
    notes: notesInput ? notesInput.value.trim() : "",
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  const bookings = getBookings();
  bookings.push(booking);
  saveBookingsData(bookings);

  // Exibe painel de confirmação
  document.getElementById("confirm-client-name").textContent = name;
  document.getElementById("confirm-details").innerHTML = `
    <div class="summary-line"><span>Profissional</span><strong>${escapeHtml(state.professional.name)}</strong></div>
    <div class="summary-line"><span>Serviço</span><strong>${escapeHtml(state.service.name)}</strong></div>
    <div class="summary-line"><span>Data</span><strong>${formatDateBR(state.date)}</strong></div>
    <div class="summary-line"><span>Horário</span><strong>${state.time}</strong></div>
    <div class="summary-line"><span>Valor</span><strong>R$ ${Number(state.service.price).toFixed(2).replace(".", ",")}</strong></div>`;

  // Guarda booking no estado para o WhatsApp
  state.lastBooking = booking;

  // Mostra painel de confirmação
  document.querySelectorAll(".step-panel").forEach(p => p.classList.remove("active"));
  document.getElementById("panel-confirm").classList.add("active");

  // Atualiza indicadores de step
  document.querySelectorAll(".step").forEach(s => { s.classList.remove("active","done"); s.classList.add("done"); });
}

function sendWhatsapp() {
  const cfg = getConfig();
  const b   = state.lastBooking;
  if (!b) return;

  const msg = encodeURIComponent(
    `Olá! Gostaria de confirmar meu agendamento:\n\n` +
    `👤 *${b.clientName}*\n` +
    `✂️ Serviço: ${b.serviceName}\n` +
    `💇 Profissional: ${b.professionalName}\n` +
    `📅 Data: ${formatDateBR(parseDate(b.date))}\n` +
    `⏰ Horário: ${b.time}\n` +
    `💰 Valor: R$ ${Number(b.price).toFixed(2).replace(".", ",")}\n\n` +
    (b.notes ? `📝 Obs: ${b.notes}\n\n` : "") +
    `Obrigado(a)! 😊`
  );

  const phone = (cfg.WHATSAPP_NUMBER || "").replace(/\D/g, "");
  if (!phone) {
    document.getElementById("whatsapp-warning").textContent =
      "WhatsApp do salão não configurado. Contacte diretamente.";
    return;
  }
  window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
}

function startNewBooking() {
  state = {
    step: 1,
    professional: null,
    service: null,
    date: null,
    time: null,
    calMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  };
  // Limpa formulário
  ["client-name","client-phone","client-notes"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  goToStep(1);
}

// ── Navegação de steps ────────────────────────────────────────
function goToStep(n) {
  // Validação: não avança sem dados obrigatórios
  if (n > 1 && !state.professional) { showToast("Escolha um profissional primeiro."); return; }
  if (n > 2 && !state.service)      { showToast("Escolha um serviço primeiro."); return; }
  if (n > 3 && (!state.date || !state.time)) { showToast("Escolha data e horário primeiro."); return; }

  state.step = n;

  // Painéis
  document.querySelectorAll(".step-panel").forEach(p => p.classList.remove("active"));
  const panel = document.getElementById(`panel-${n}`);
  if (panel) { panel.classList.add("active"); panel.scrollIntoView({ behavior: "smooth", block: "start" }); }

  // Indicadores
  document.querySelectorAll(".step[data-step]").forEach(btn => {
    const s = parseInt(btn.dataset.step);
    btn.classList.toggle("active", s === n);
    btn.classList.toggle("done",   s < n);
  });

  // Renderização por step
  if (n === 2) renderServices();
  if (n === 3) renderCalendar();
  if (n === 4) renderBookingSummary();
}

// ── Helpers ──────────────────────────────────────────────────
function generateSlots(cfg, durationMin) {
  const slots = [];
  let cur = timeToMin(cfg.OPEN_TIME  || "08:00");
  const end = timeToMin(cfg.CLOSE_TIME || "19:00");
  const bs  = cfg.BREAK_START ? timeToMin(cfg.BREAK_START) : null;
  const be  = cfg.BREAK_END   ? timeToMin(cfg.BREAK_END)   : null;
  const step = cfg.SLOT_MINUTES || 30;

  while (cur + durationMin <= end) {
    if (bs !== null && be !== null && cur >= bs && cur < be) { cur += step; continue; }
    slots.push(minToTime(cur));
    cur += step;
  }
  return slots;
}

function timeToMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minToTime(min) {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function formatDate(d) {
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function parseDate(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateBR(d) {
  if (!d) return "";
  const days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}

// ── Admin Modal ───────────────────────────────────────────────
function openAdminLogin() {
  document.getElementById("admin-login-modal").classList.remove("hidden");
  setTimeout(() => document.getElementById("admin-password")?.focus(), 100);
}

function closeAdminLogin() {
  document.getElementById("admin-login-modal").classList.add("hidden");
  const err = document.getElementById("admin-error");
  if (err) err.classList.add("hidden");
  const pw = document.getElementById("admin-password");
  if (pw) pw.value = "";
}

async function loginAdmin() {
  const pw  = document.getElementById("admin-password");
  const err = document.getElementById("admin-error");
  if (!pw) return;

  const ok = await checkAdminPassword(pw.value);
  if (ok) {
    closeAdminLogin();
    openAdmin();
  } else {
    if (err) err.classList.remove("hidden");
    pw.value = "";
    pw.focus();
  }
}
