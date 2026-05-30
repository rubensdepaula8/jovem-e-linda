/* ============================================================
   APP.JS — Estúdio Jovem e Linda corrigido
   - Sem imagens quebradas
   - WhatsApp configurável
   - Admin com senha em hash SHA-256
   - Agendamentos bloqueiam horários no mesmo navegador
   Observação: para agenda compartilhada entre celulares/computadores,
   conecte Supabase/Firebase/MySQL em uma próxima etapa.
   ============================================================ */

const CONFIG = window.APP_CONFIG || {};

const DEFAULT_DATA = {
  salon: {
    name: CONFIG.SALON_NAME || "Estúdio Jovem e Linda",
    tagline: CONFIG.SALON_TAGLINE || "UNISSEX",
    phone: CONFIG.WHATSAPP_NUMBER || "",
    openTime: "09:00",
    closeTime: "19:00",
    slotMinutes: 30,
    breakStart: "12:00",
    breakEnd: "13:00",
    workDays: [1, 2, 3, 4, 5, 6]
  },
  professionals: [
    { id: "pro-1", name: "Izabel", role: "Cabeleireira", emoji: "💇‍♀️", color: "#e8a0b0", active: true },
    { id: "pro-2", name: "Emanuel", role: "Barbeiro", emoji: "✂️", color: "#c9a96e", active: true }
  ],
  services: [
    { id: "svc-1", name: "Corte Feminino", emoji: "✂️", duration: 60, price: 80, category: "feminino" },
    { id: "svc-2", name: "Escova Progressiva", emoji: "💆‍♀️", duration: 180, price: 250, category: "feminino" },
    { id: "svc-3", name: "Coloração Completa", emoji: "🎨", duration: 120, price: 180, category: "feminino" },
    { id: "svc-4", name: "Hidratação Profunda", emoji: "✨", duration: 60, price: 90, category: "feminino" },
    { id: "svc-5", name: "Luzes / Mechas", emoji: "🌟", duration: 180, price: 280, category: "feminino" },
    { id: "svc-6", name: "Corte Masculino", emoji: "💈", duration: 45, price: 50, category: "masculino" },
    { id: "svc-7", name: "Barba Completa", emoji: "🧔", duration: 30, price: 40, category: "masculino" },
    { id: "svc-8", name: "Corte + Barba", emoji: "✂️", duration: 75, price: 80, category: "masculino" },
    { id: "svc-9", name: "Pigmentação Barba", emoji: "🎨", duration: 45, price: 60, category: "masculino" },
    { id: "svc-10", name: "Sobrancelha", emoji: "👁️", duration: 30, price: 35, category: "unissex" },
    { id: "svc-11", name: "Nutrição Capilar", emoji: "🌿", duration: 60, price: 70, category: "unissex" },
    { id: "svc-12", name: "Manicure + Pedicure", emoji: "💅", duration: 90, price: 80, category: "estetica" },
    { id: "svc-13", name: "Manicure", emoji: "💅", duration: 45, price: 45, category: "estetica" },
    { id: "svc-14", name: "Alongamento de Unhas", emoji: "✨", duration: 120, price: 150, category: "estetica" }
  ],
  bookings: []
};

const STORAGE_KEY = CONFIG.STORAGE_KEY || "jl_salon_v3_corrigido";
let DB = loadData();

const state = {
  step: 1,
  professional: null,
  service: null,
  date: null,
  time: null,
  calMonth: null
};

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("splash")?.classList.add("hidden");
    document.getElementById("app")?.classList.remove("hidden");
  }, 900);

  state.calMonth = new Date();
  state.calMonth.setDate(1);

  syncHeader();
  renderProfessionals();
  initAdminDateFilter();
});

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    return mergeDefaults(parsed);
  } catch (error) {
    console.warn("Erro ao carregar dados", error);
    return clone(DEFAULT_DATA);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
}

function mergeDefaults(saved) {
  return {
    salon: { ...DEFAULT_DATA.salon, ...(saved.salon || {}) },
    professionals: Array.isArray(saved.professionals) ? saved.professionals : clone(DEFAULT_DATA.professionals),
    services: Array.isArray(saved.services) ? saved.services : clone(DEFAULT_DATA.services),
    bookings: Array.isArray(saved.bookings) ? saved.bookings : []
  };
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;"
  }[char]));
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function durationLabel(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h${m}min`;
  if (h) return `${h}h`;
  return `${m}min`;
}

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function syncHeader(professional) {
  const sub = document.getElementById("header-subtitle");
  const title = document.getElementById("header-title");
  const extra = document.getElementById("header-extra");

  if (!professional) {
    if (sub) sub.textContent = "ESTÚDIO";
    if (title) title.textContent = "Jovem e Linda";
    if (extra) extra.textContent = "✂ UNISSEX";
    return;
  }

  if (professional.name.toLowerCase().includes("emanuel")) {
    if (sub) sub.textContent = "BARBEARIA";
    if (title) title.textContent = "Marverick";
    if (extra) extra.textContent = "BARBER SHOP";
  } else {
    if (sub) sub.textContent = "ESTÚDIO";
    if (title) title.textContent = "Jovem e Linda";
    if (extra) extra.textContent = "✂ UNISSEX";
  }
}

function goToStep(n) {
  if (n === 2 && !state.professional) return showToast("Escolha um profissional primeiro", "error");
  if (n === 3 && !state.service) return showToast("Escolha um serviço primeiro", "error");
  if (n === 4 && !state.time) return showToast("Escolha um horário primeiro", "error");

  document.querySelectorAll(".step-panel").forEach(panel => panel.classList.remove("active"));
  document.getElementById(`panel-${n}`)?.classList.add("active");

  document.querySelectorAll(".step").forEach(step => {
    const sn = Number(step.dataset.step);
    step.classList.toggle("active", sn === n);
    step.classList.toggle("done", sn < n);
    const number = step.querySelector("span");
    if (number) number.textContent = sn < n ? "✓" : String(sn);
  });
  document.querySelectorAll(".step-line").forEach((line, index) => line.classList.toggle("active", index < n - 1));

  state.step = n;
  if (n === 2) renderServices();
  if (n === 3) renderDateTimeSubtitle();
  if (n === 4) renderBookingSummaryMini();
}

function renderProfessionals() {
  const grid = document.getElementById("professionals-grid");
  if (!grid) return;
  const pros = DB.professionals.filter(pro => pro.active !== false);

  if (!pros.length) {
    grid.innerHTML = `<p class="muted">Nenhum profissional cadastrado.</p>`;
    return;
  }

  grid.innerHTML = pros.map(pro => `
    <button class="pro-card" id="pro-card-${escapeHTML(pro.id)}" type="button" onclick="selectProfessional('${escapeHTML(pro.id)}')">
      <div class="pro-avatar" style="background:${escapeHTML(pro.color || '#d8b46a')}">${escapeHTML(pro.emoji || initials(pro.name))}</div>
      <h3>${escapeHTML(pro.name)}</h3>
      <p>${escapeHTML(pro.role)}</p>
    </button>
  `).join("");
}

function initials(name = "JL") {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function selectProfessional(id) {
  state.professional = DB.professionals.find(pro => pro.id === id);
  state.service = null;
  state.date = null;
  state.time = null;
  syncHeader(state.professional);

  document.querySelectorAll(".pro-card").forEach(card => card.classList.remove("selected"));
  document.getElementById(`pro-card-${id}`)?.classList.add("selected");
  setTimeout(() => goToStep(2), 180);
}

function renderServices() {
  const proName = document.getElementById("selected-pro-name-s2");
  if (proName) proName.textContent = state.professional?.name || "";

  const list = document.getElementById("services-list");
  if (!list) return;

  const categories = ["feminino", "masculino", "unissex", "estetica"];
  const labels = { feminino: "Feminino", masculino: "Masculino", unissex: "Unissex", estetica: "Estética" };

  let html = "";
  categories.forEach(category => {
    const services = DB.services.filter(service => service.category === category);
    if (!services.length) return;

    html += `<div><div class="category-title">${labels[category]}</div><div class="services-grid">`;
    services.forEach(service => {
      html += `
        <button class="service-card" id="svc-card-${escapeHTML(service.id)}" type="button" onclick="selectService('${escapeHTML(service.id)}')">
          <div class="service-top">
            <span class="service-emoji">${escapeHTML(service.emoji || '✨')}</span>
            <span class="service-category">${labels[service.category] || service.category}</span>
          </div>
          <h4>${escapeHTML(service.name)}</h4>
          <div class="service-meta"><span>⏱ ${durationLabel(service.duration)}</span><span class="price">${money(service.price)}</span></div>
        </button>
      `;
    });
    html += `</div></div>`;
  });

  list.innerHTML = html || `<p class="muted">Nenhum serviço cadastrado.</p>`;
}

function selectService(id) {
  state.service = DB.services.find(service => service.id === id);
  state.date = null;
  state.time = null;
  document.querySelectorAll(".service-card").forEach(card => card.classList.remove("selected"));
  document.getElementById(`svc-card-${id}`)?.classList.add("selected");
  setTimeout(() => goToStep(3), 180);
}

function renderDateTimeSubtitle() {
  const el = document.getElementById("datetime-subtitle");
  if (el && state.professional && state.service) {
    el.textContent = `${state.professional.name} · ${state.service.name} · ${durationLabel(state.service.duration)}`;
  }
  renderCalendar();
  renderTimeSlots();
}

function changeMonth(delta) {
  state.calMonth.setMonth(state.calMonth.getMonth() + delta);
  renderCalendar();
}

function renderCalendar() {
  if (!state.calMonth) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const month = state.calMonth;
  const year = month.getFullYear();
  const mon = month.getMonth();

  const label = document.getElementById("cal-month-label");
  if (label) label.textContent = month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const grid = document.getElementById("calendar-grid");
  if (!grid) return;

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  let html = dayNames.map(day => `<div class="cal-head">${day}</div>`).join("");

  const firstDay = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) html += `<div class="cal-empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, mon, d);
    const isPast = date < today;
    const isWorkDay = DB.salon.workDays.includes(date.getDay());
    const isSelected = state.date && dateKey(date) === dateKey(state.date);
    const hasSlots = !isPast && isWorkDay && getAvailableSlots(date).length > 0;

    let cls = "cal-day";
    if (isPast || !isWorkDay || !hasSlots) cls += " disabled";
    if (hasSlots) cls += " has-slots";
    if (dateKey(date) === dateKey(today)) cls += " today";
    if (isSelected) cls += " selected";

    const onclick = (!isPast && isWorkDay && hasSlots) ? `onclick="selectDate(${year}, ${mon}, ${d})"` : "";
    html += `<button type="button" class="${cls}" ${onclick}>${d}</button>`;
  }

  grid.innerHTML = html;
}

function selectDate(year, month, day) {
  const selected = new Date(year, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selected < today) return;
  if (!DB.salon.workDays.includes(selected.getDay())) return;

  state.date = selected;
  state.time = null;
  renderCalendar();
  renderTimeSlots();
}

function getAvailableSlots(date) {
  const cfg = DB.salon;
  const slots = generateAllSlots(cfg.openTime, cfg.closeTime, cfg.slotMinutes);
  const selectedDate = dateKey(date);
  const serviceDuration = state.service ? Number(state.service.duration) : 30;

  const occupied = DB.bookings
    .filter(booking => booking.date === selectedDate && booking.professionalId === state.professional?.id && booking.status !== "cancelled")
    .map(booking => ({ start: timeToMin(booking.time), end: timeToMin(booking.time) + Number(booking.duration || 30) }));

  return slots.filter(slot => {
    const start = timeToMin(slot);
    const end = start + serviceDuration;
    if (end > timeToMin(cfg.closeTime)) return false;

    if (cfg.breakStart && cfg.breakEnd) {
      const bStart = timeToMin(cfg.breakStart);
      const bEnd = timeToMin(cfg.breakEnd);
      if (start < bEnd && end > bStart) return false;
    }

    return !occupied.some(range => start < range.end && end > range.start);
  });
}

function generateAllSlots(open, close, step) {
  const slots = [];
  let current = timeToMin(open);
  const end = timeToMin(close);
  while (current < end) {
    slots.push(minToTime(current));
    current += Number(step || 30);
  }
  return slots;
}

function timeToMin(time) {
  const [h, m] = String(time || "00:00").split(":").map(Number);
  return h * 60 + m;
}

function minToTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function renderTimeSlots() {
  const container = document.getElementById("time-slots-container");
  if (!container) return;

  if (!state.date) {
    container.innerHTML = `<p class="muted">← Selecione uma data para ver os horários</p>`;
    return;
  }

  const available = getAvailableSlots(state.date);
  const dateLabel = state.date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  if (!available.length) {
    container.innerHTML = `<p class="muted">Sem horários disponíveis em ${escapeHTML(dateLabel)}. Tente outra data.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="time-date-title">${escapeHTML(dateLabel)}</div>
    <div class="time-grid">
      ${available.map(slot => `<button class="time-btn ${state.time === slot ? 'selected' : ''}" type="button" onclick="selectTime('${slot}')">${slot}</button>`).join("")}
    </div>
  `;
}

function selectTime(time) {
  state.time = time;
  renderTimeSlots();
  setTimeout(() => goToStep(4), 180);
}

function renderBookingSummaryMini() {
  const el = document.getElementById("booking-summary-mini");
  if (!el || !state.date || !state.service || !state.professional) return;

  const dateStr = state.date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  el.innerHTML = `
    <div class="summary-line"><strong>Profissional</strong><span>${escapeHTML(state.professional.name)}</span></div>
    <div class="summary-line"><strong>Serviço</strong><span>${escapeHTML(state.service.name)} · ${durationLabel(state.service.duration)}</span></div>
    <div class="summary-line"><strong>Data</strong><span>${escapeHTML(dateStr)} às ${state.time}</span></div>
    <div class="summary-line"><strong>Valor</strong><span>${money(state.service.price)}</span></div>
  `;
}

function confirmBooking(event) {
  event.preventDefault();
  const name = document.getElementById("client-name").value.trim();
  const phone = document.getElementById("client-phone").value.trim();
  const notes = document.getElementById("client-notes").value.trim();

  if (!name || !phone) return showToast("Preencha seu nome e WhatsApp", "error");
  if (!state.professional || !state.service || !state.date || !state.time) return showToast("Selecione profissional, serviço, data e horário", "error");

  const stillAvailable = getAvailableSlots(state.date).includes(state.time);
  if (!stillAvailable) {
    state.time = null;
    renderCalendar();
    renderTimeSlots();
    return showToast("Esse horário acabou de ficar indisponível. Escolha outro horário.", "error");
  }

  const booking = {
    id: `bk-${Date.now()}`,
    professionalId: state.professional.id,
    professionalName: state.professional.name,
    serviceId: state.service.id,
    serviceName: state.service.name,
    duration: Number(state.service.duration),
    price: Number(state.service.price),
    date: dateKey(state.date),
    time: state.time,
    clientName: name,
    clientPhone: phone,
    notes,
    status: "confirmed",
    createdAt: new Date().toISOString()
  };

  DB.bookings.push(booking);
  saveData();
  showConfirmation(booking);
}

function showConfirmation(booking) {
  document.querySelectorAll(".step-panel").forEach(panel => panel.classList.remove("active"));
  document.getElementById("panel-confirm")?.classList.add("active");
  document.getElementById("step-indicator").style.display = "none";

  document.getElementById("confirm-client-name").textContent = booking.clientName;
  const dateObj = new Date(`${booking.date}T00:00:00`);
  const dateStr = dateObj.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  document.getElementById("confirm-details").innerHTML = `
    <div class="detail-line"><strong>Profissional</strong><span>${escapeHTML(booking.professionalName)}</span></div>
    <div class="detail-line"><strong>Serviço</strong><span>${escapeHTML(booking.serviceName)}</span></div>
    <div class="detail-line"><strong>Duração</strong><span>${durationLabel(booking.duration)}</span></div>
    <div class="detail-line"><strong>Valor</strong><span>${money(booking.price)}</span></div>
    <div class="detail-line"><strong>Data</strong><span>${escapeHTML(dateStr)}</span></div>
    <div class="detail-line"><strong>Horário</strong><span>${escapeHTML(booking.time)}</span></div>
  `;

  window._lastBooking = booking;
  const warning = document.getElementById("whatsapp-warning");
  if (warning) {
    warning.textContent = isValidWhatsapp(DB.salon.phone) ? "" : "Atenção: configure o WhatsApp real do salão no painel Admin > Config para o botão funcionar corretamente.";
  }
}

function sendWhatsapp() {
  const booking = window._lastBooking;
  if (!booking) return;

  const phone = normalizePhone(DB.salon.phone);
  if (!isValidWhatsapp(phone)) {
    showToast("Configure o WhatsApp real do salão no painel Admin > Config.", "error");
    return;
  }

  const dateObj = new Date(`${booking.date}T00:00:00`);
  const dateStr = dateObj.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const msg = `Olá! Fiz meu agendamento pelo sistema do ${DB.salon.name}:\n\n` +
    `Profissional: ${booking.professionalName}\n` +
    `Serviço: ${booking.serviceName}\n` +
    `Data: ${dateStr}\n` +
    `Horário: ${booking.time}\n` +
    `Valor: ${money(booking.price)}\n\n` +
    `Cliente: ${booking.clientName}\n` +
    `WhatsApp do cliente: ${booking.clientPhone}\n` +
    `${booking.notes ? `Observações: ${booking.notes}\n` : ""}\nPode confirmar?`;

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function isValidWhatsapp(phone) {
  const normalized = normalizePhone(phone);
  return normalized.length >= 12 && !/^5511999999999$/.test(normalized);
}

function startNewBooking() {
  state.step = 1;
  state.professional = null;
  state.service = null;
  state.date = null;
  state.time = null;
  syncHeader();

  document.getElementById("step-indicator").style.display = "";
  document.querySelectorAll(".step-panel").forEach(panel => panel.classList.remove("active"));
  document.getElementById("panel-1")?.classList.add("active");
  document.querySelectorAll(".step").forEach(step => {
    step.classList.remove("active", "done");
    step.querySelector("span").textContent = step.dataset.step;
  });
  document.querySelector(".step[data-step='1']")?.classList.add("active");
  document.querySelectorAll(".step-line").forEach(line => line.classList.remove("active"));
  document.getElementById("client-form")?.reset();
  renderProfessionals();
}

async function sha256(text) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buffer)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function openAdminLogin() {
  document.getElementById("admin-login-modal")?.classList.remove("hidden");
  setTimeout(() => document.getElementById("admin-password")?.focus(), 80);
}

function closeAdminLogin() {
  document.getElementById("admin-login-modal")?.classList.add("hidden");
  const input = document.getElementById("admin-password");
  if (input) input.value = "";
  document.getElementById("admin-error")?.classList.add("hidden");
}

async function loginAdmin() {
  const passwordInput = document.getElementById("admin-password");
  const password = passwordInput?.value || "";

  try {
    const hash = await sha256(password);
    if (hash === CONFIG.ADMIN_PIN_SHA256) {
      closeAdminLogin();
      openAdmin();
    } else {
      document.getElementById("admin-error")?.classList.remove("hidden");
      if (passwordInput) {
        passwordInput.value = "";
        passwordInput.focus();
      }
    }
  } catch (error) {
    showToast("Erro ao validar senha. Use a página publicada em HTTPS pelo GitHub Pages.", "error");
  }
}

function openAdmin() {
  document.getElementById("admin-panel")?.classList.remove("hidden");
  switchAdminTab("agenda");
  populateAdminProFilter();
  renderAdminAgenda();
  renderAdminProfessionals();
  renderAdminServices();
  loadSettings();
}

function closeAdmin() {
  document.getElementById("admin-panel")?.classList.add("hidden");
}

function switchAdminTab(tab) {
  document.querySelectorAll(".admin-tab").forEach(button => button.classList.remove("active"));
  document.querySelectorAll(".admin-content").forEach(content => content.classList.remove("active"));
  document.getElementById(`tab-${tab}`)?.classList.add("active");
  document.getElementById(`admin-${tab}`)?.classList.add("active");
}

function initAdminDateFilter() {
  const el = document.getElementById("admin-date-filter");
  if (el) el.value = dateKey(new Date());
}

function populateAdminProFilter() {
  const select = document.getElementById("admin-pro-filter");
  if (!select) return;
  const pros = DB.professionals.filter(pro => pro.active !== false);
  select.innerHTML = `<option value="">Todos os profissionais</option>` + pros.map(pro => `<option value="${escapeHTML(pro.id)}">${escapeHTML(pro.name)}</option>`).join("");
}

function renderAdminAgenda() {
  const dateVal = document.getElementById("admin-date-filter")?.value || "";
  const proVal = document.getElementById("admin-pro-filter")?.value || "";
  const list = document.getElementById("admin-agenda-list");
  if (!list) return;

  let bookings = [...DB.bookings];
  if (dateVal) bookings = bookings.filter(booking => booking.date === dateVal);
  if (proVal) bookings = bookings.filter(booking => booking.professionalId === proVal);
  bookings.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  if (!bookings.length) {
    list.innerHTML = `<div class="admin-item"><h4>Nenhum agendamento encontrado</h4><p class="muted">Tente outro filtro ou outra data.</p></div>`;
    return;
  }

  list.innerHTML = bookings.map(booking => {
    const statusClass = booking.status === "done" ? "status-done" : booking.status === "cancelled" ? "status-cancelled" : "";
    const badge = booking.status === "done" ? "Concluído" : booking.status === "cancelled" ? "Cancelado" : "Confirmado";
    const dateObj = new Date(`${booking.date}T00:00:00`);
    const dateStr = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const waClient = normalizePhone(booking.clientPhone);

    return `
      <article class="admin-item ${statusClass}">
        <div class="admin-item-top">
          <div>
            <strong>${escapeHTML(booking.time)} · ${escapeHTML(booking.clientName)}</strong>
            <span class="status-badge">${badge}</span>
            <p class="muted">${escapeHTML(dateStr)} · ${escapeHTML(booking.professionalName)} · ${escapeHTML(booking.serviceName)} · ${durationLabel(booking.duration)} · ${money(booking.price)}</p>
            <p class="muted">Cliente: ${escapeHTML(booking.clientPhone)} ${waClient ? `<a href="https://wa.me/55${waClient.replace(/^55/, '')}" target="_blank" rel="noopener">abrir WhatsApp</a>` : ""}</p>
            ${booking.notes ? `<p>${escapeHTML(booking.notes)}</p>` : ""}
          </div>
        </div>
        <div class="admin-actions">
          ${booking.status !== "done" ? `<button type="button" onclick="updateBookingStatus('${booking.id}', 'done')">✓ Concluir</button>` : ""}
          ${booking.status !== "cancelled" ? `<button type="button" onclick="updateBookingStatus('${booking.id}', 'cancelled')">✕ Cancelar</button>` : ""}
          ${booking.status !== "confirmed" ? `<button type="button" onclick="updateBookingStatus('${booking.id}', 'confirmed')">↩ Restaurar</button>` : ""}
          <button type="button" onclick="editBookingPrice('${booking.id}')">Editar valor</button>
          <button type="button" onclick="deleteBooking('${booking.id}')">Apagar</button>
        </div>
      </article>
    `;
  }).join("");
}

function updateBookingStatus(id, status) {
  const booking = DB.bookings.find(item => item.id === id);
  if (!booking) return;
  booking.status = status;
  saveData();
  renderAdminAgenda();
  renderCalendar();
  renderTimeSlots();
  showToast("Agendamento atualizado", "success");
}

function editBookingPrice(id) {
  const booking = DB.bookings.find(item => item.id === id);
  if (!booking) return;
  const newPrice = prompt(`Editar valor de ${booking.clientName}:`, booking.price);
  if (newPrice === null) return;
  const parsed = Number(String(newPrice).replace(",", "."));
  if (Number.isNaN(parsed) || parsed < 0) return showToast("Valor inválido", "error");
  booking.price = parsed;
  saveData();
  renderAdminAgenda();
  showToast("Valor atualizado", "success");
}

function deleteBooking(id) {
  if (!confirm("Apagar este agendamento?")) return;
  DB.bookings = DB.bookings.filter(item => item.id !== id);
  saveData();
  renderAdminAgenda();
  renderCalendar();
  renderTimeSlots();
  showToast("Agendamento apagado", "success");
}

function saveProfessional(event) {
  event.preventDefault();
  const id = document.getElementById("pro-id").value || `pro-${Date.now()}`;
  const data = {
    id,
    name: document.getElementById("pro-name").value.trim(),
    role: document.getElementById("pro-role").value.trim(),
    emoji: document.getElementById("pro-emoji").value.trim() || "JL",
    color: document.getElementById("pro-color").value,
    active: true
  };

  const index = DB.professionals.findIndex(pro => pro.id === id);
  if (index >= 0) DB.professionals[index] = data;
  else DB.professionals.push(data);

  saveData();
  clearProfessionalForm();
  renderProfessionals();
  renderAdminProfessionals();
  populateAdminProFilter();
  showToast("Profissional salvo", "success");
}

function renderAdminProfessionals() {
  const list = document.getElementById("admin-pro-list");
  if (!list) return;
  list.innerHTML = DB.professionals.map(pro => `
    <article class="admin-item">
      <div class="admin-item-top">
        <div><strong>${escapeHTML(pro.name)}</strong><p class="muted">${escapeHTML(pro.role)} · ${pro.active !== false ? "Ativo" : "Inativo"}</p></div>
        <div class="pro-avatar" style="background:${escapeHTML(pro.color)}; width:42px; height:42px; border-radius:14px; font-size:1rem;">${escapeHTML(pro.emoji || initials(pro.name))}</div>
      </div>
      <div class="admin-actions">
        <button type="button" onclick="editProfessional('${pro.id}')">Editar</button>
        <button type="button" onclick="toggleProfessional('${pro.id}')">${pro.active !== false ? "Desativar" : "Ativar"}</button>
      </div>
    </article>
  `).join("");
}

function editProfessional(id) {
  const pro = DB.professionals.find(item => item.id === id);
  if (!pro) return;
  document.getElementById("pro-id").value = pro.id;
  document.getElementById("pro-name").value = pro.name;
  document.getElementById("pro-role").value = pro.role;
  document.getElementById("pro-emoji").value = pro.emoji || "";
  document.getElementById("pro-color").value = pro.color || "#c9a96e";
}

function toggleProfessional(id) {
  const pro = DB.professionals.find(item => item.id === id);
  if (!pro) return;
  pro.active = pro.active === false;
  saveData();
  renderProfessionals();
  renderAdminProfessionals();
  populateAdminProFilter();
}

function clearProfessionalForm() {
  document.getElementById("pro-id").value = "";
  document.getElementById("pro-name").value = "";
  document.getElementById("pro-role").value = "";
  document.getElementById("pro-emoji").value = "";
  document.getElementById("pro-color").value = "#c9a96e";
}

function saveService(event) {
  event.preventDefault();
  const id = document.getElementById("svc-id").value || `svc-${Date.now()}`;
  const data = {
    id,
    name: document.getElementById("svc-name").value.trim(),
    emoji: document.getElementById("svc-emoji").value.trim() || "✨",
    duration: Number(document.getElementById("svc-duration").value),
    price: Number(document.getElementById("svc-price").value),
    category: document.getElementById("svc-category").value
  };

  const index = DB.services.findIndex(service => service.id === id);
  if (index >= 0) DB.services[index] = data;
  else DB.services.push(data);

  saveData();
  clearServiceForm();
  renderServicesIfNeeded();
  renderAdminServices();
  showToast("Serviço salvo", "success");
}

function renderServicesIfNeeded() {
  if (state.step === 2 && state.professional) renderServices();
}

function renderAdminServices() {
  const list = document.getElementById("admin-service-list");
  if (!list) return;
  list.innerHTML = DB.services.map(service => `
    <article class="admin-item">
      <div><strong>${escapeHTML(service.emoji || '✨')} ${escapeHTML(service.name)}</strong><p class="muted">${escapeHTML(service.category)} · ${durationLabel(service.duration)} · ${money(service.price)}</p></div>
      <div class="admin-actions">
        <button type="button" onclick="editService('${service.id}')">Editar</button>
        <button type="button" onclick="deleteService('${service.id}')">Apagar</button>
      </div>
    </article>
  `).join("");
}

function editService(id) {
  const service = DB.services.find(item => item.id === id);
  if (!service) return;
  document.getElementById("svc-id").value = service.id;
  document.getElementById("svc-name").value = service.name;
  document.getElementById("svc-emoji").value = service.emoji || "";
  document.getElementById("svc-duration").value = service.duration;
  document.getElementById("svc-price").value = service.price;
  document.getElementById("svc-category").value = service.category;
}

function deleteService(id) {
  if (!confirm("Apagar este serviço?")) return;
  DB.services = DB.services.filter(item => item.id !== id);
  saveData();
  renderAdminServices();
  renderServicesIfNeeded();
}

function clearServiceForm() {
  document.getElementById("svc-id").value = "";
  document.getElementById("svc-name").value = "";
  document.getElementById("svc-emoji").value = "";
  document.getElementById("svc-duration").value = "";
  document.getElementById("svc-price").value = "";
  document.getElementById("svc-category").value = "feminino";
}

function loadSettings() {
  document.getElementById("cfg-phone").value = DB.salon.phone || "";
  document.getElementById("cfg-open").value = DB.salon.openTime;
  document.getElementById("cfg-close").value = DB.salon.closeTime;
  document.getElementById("cfg-slot").value = DB.salon.slotMinutes;
  document.getElementById("cfg-break-start").value = DB.salon.breakStart || "";
  document.getElementById("cfg-break-end").value = DB.salon.breakEnd || "";
  document.querySelectorAll("input[name='workday']").forEach(input => input.checked = DB.salon.workDays.includes(Number(input.value)));
}

function saveSettings(event) {
  event.preventDefault();
  const workDays = Array.from(document.querySelectorAll("input[name='workday']:checked")).map(input => Number(input.value));
  if (!workDays.length) return showToast("Escolha pelo menos um dia de funcionamento", "error");

  DB.salon.phone = normalizePhone(document.getElementById("cfg-phone").value);
  DB.salon.openTime = document.getElementById("cfg-open").value;
  DB.salon.closeTime = document.getElementById("cfg-close").value;
  DB.salon.slotMinutes = Number(document.getElementById("cfg-slot").value);
  DB.salon.breakStart = document.getElementById("cfg-break-start").value;
  DB.salon.breakEnd = document.getElementById("cfg-break-end").value;
  DB.salon.workDays = workDays;
  saveData();
  renderCalendar();
  renderTimeSlots();
  showToast("Configurações salvas", "success");
}

function clearAllBookings() {
  if (!confirm("Tem certeza? Isso vai apagar todos os agendamentos salvos neste navegador.")) return;
  DB.bookings = [];
  saveData();
  renderAdminAgenda();
  renderCalendar();
  renderTimeSlots();
  showToast("Agendamentos removidos", "success");
}

function resetToDefaults() {
  if (!confirm("Restaurar dados padrão? Isso apaga alterações e agendamentos deste navegador.")) return;
  localStorage.removeItem(STORAGE_KEY);
  DB = loadData();
  state.professional = null;
  state.service = null;
  state.date = null;
  state.time = null;
  syncHeader();
  renderProfessionals();
  renderAdminAgenda();
  renderAdminProfessionals();
  renderAdminServices();
  populateAdminProFilter();
  loadSettings();
  showToast("Dados restaurados", "success");
}

function exportBookingsCSV() {
  if (!DB.bookings.length) return showToast("Nenhum agendamento para exportar", "error");
  const headers = ["data", "hora", "cliente", "whatsapp", "profissional", "servico", "duracao", "valor", "status", "observacoes"];
  const rows = DB.bookings.map(booking => [
    booking.date,
    booking.time,
    booking.clientName,
    booking.clientPhone,
    booking.professionalName,
    booking.serviceName,
    booking.duration,
    booking.price,
    booking.status,
    booking.notes || ""
  ]);
  const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `agendamentos-${dateKey(new Date())}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

let toastTimer = null;
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}
