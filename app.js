// ============================================================
// APP.JS — Booking flow logic
// ============================================================

// ---- State ----
const state = {
  step: 1,
  professional: null,
  service: null,
  date: null,      // Date object
  time: null,      // "HH:MM"
  calMonth: null,  // Date (first day of visible month)
};

// ---- Init ----
window.addEventListener("DOMContentLoaded", () => {
  // Hide splash after animation
  setTimeout(() => {
    document.getElementById("splash").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
  }, 2800);

  state.calMonth = new Date();
  state.calMonth.setDate(1);

  renderProfessionals();
  initAdminDateFilter();
});

// ============================================================
// STEP NAVIGATION
// ============================================================

function goToStep(n) {
  // Validate before advancing
  if (n === 2 && !state.professional) { showToast("Escolha um profissional primeiro", "error"); return; }
  if (n === 3 && !state.service)      { showToast("Escolha um serviço primeiro", "error"); return; }
  if (n === 4 && !state.time)         { showToast("Escolha um horário primeiro", "error"); return; }

  // Hide all panels
  document.querySelectorAll(".step-panel").forEach(p => p.classList.remove("active"));
  document.getElementById(`panel-${n}`).classList.add("active");

  // Update step indicator
  document.querySelectorAll(".step").forEach(s => {
    const sn = parseInt(s.dataset.step);
    s.classList.toggle("active", sn === n);
    s.classList.toggle("done",   sn < n);
    if (sn < n) s.querySelector("span").textContent = "✓";
    else s.querySelector("span").textContent = s.dataset.step;
  });

  // Update step-lines
  document.querySelectorAll(".step-line").forEach((l, i) => {
    l.classList.toggle("active", i < n - 1);
  });

  state.step = n;

  // Panel-specific setup
  if (n === 2) renderServices();
  if (n === 3) renderDateTimeSubtitle();
  if (n === 4) renderBookingSummaryMini();
}

// ============================================================
// STEP 1 — PROFESSIONALS
// ============================================================

function renderProfessionals() {
  const grid = document.getElementById("professionals-grid");
  const pros = DB.professionals.filter(p => p.active);

  if (!pros.length) {
    grid.innerHTML = '<p style="color:var(--white-dim);text-align:center;padding:40px">Nenhum profissional cadastrado.</p>';
    return;
  }

  grid.innerHTML = pros.map(p => `
    <div class="pro-card" id="pro-card-${p.id}" onclick="selectProfessional('${p.id}')"
         style="--pro-color: ${p.color}">
      <div class="pro-avatar" style="background: radial-gradient(circle, ${p.color}33, ${p.color}11)">
        <span style="font-size:26px">${p.emoji}</span>
      </div>
      <div class="pro-info">
        <h3>${p.name}</h3>
        <p>${p.role}</p>
      </div>
    </div>
  `).join("");
}

function selectProfessional(id) {
  state.professional = DB.professionals.find(p => p.id === id);
  state.service = null;
  state.date = null;
  state.time = null;

  document.querySelectorAll(".pro-card").forEach(c => c.classList.remove("selected"));
  document.getElementById(`pro-card-${id}`).classList.add("selected");

  // Dynamic Header Update based on selection
  const headerImg = document.getElementById("header-logo-img");
  const headerSub = document.getElementById("header-logo-sub");
  const headerTitle = document.getElementById("header-logo-title");
  const headerExtra = document.getElementById("header-logo-extra");

  if (id === "pro-1") {
    if (headerImg) headerImg.src = "logo-izabel.png";
    if (headerSub) headerSub.textContent = "ESTÚDIO";
    if (headerTitle) headerTitle.textContent = "Jovem e Linda";
    if (headerExtra) headerExtra.textContent = "✂ UNISSEX";
  } else if (id === "pro-2") {
    if (headerImg) headerImg.src = "logo-emanuel.png";
    if (headerSub) headerSub.textContent = "BARBEARIA";
    if (headerTitle) headerTitle.textContent = "Marverick";
    if (headerExtra) headerExtra.textContent = "💈 BARBER SHOP";
  }

  setTimeout(() => goToStep(2), 280);
}

// ============================================================
// STEP 2 — SERVICES
// ============================================================

function renderServices() {
  document.getElementById("selected-pro-name-s2").textContent = state.professional.name;
  const list = document.getElementById("services-list");

  const services = DB.services;
  const categories = ["feminino", "masculino", "unissex", "estetica"];
  const catLabels = {
    feminino:  "✨ Feminino",
    masculino: "💈 Masculino",
    unissex:   "🌟 Unissex",
    estetica:  "💅 Estética"
  };

  let html = "";
  categories.forEach(cat => {
    const svcs = services.filter(s => s.category === cat);
    if (!svcs.length) return;
    html += `<div class="services-category">
      <p style="font-size:11px;font-weight:700;letter-spacing:2px;color:var(--white-dim);
                text-transform:uppercase;padding:12px 4px 8px;">${catLabels[cat]}</p>`;
    svcs.forEach(s => {
      const h = Math.floor(s.duration / 60);
      const m = s.duration % 60;
      const durStr = h > 0 ? (m > 0 ? `${h}h${m}min` : `${h}h`) : `${m}min`;
      html += `
        <div class="service-card" id="svc-card-${s.id}" onclick="selectService('${s.id}')">
          <div class="service-emoji">${s.emoji}</div>
          <div class="service-info">
            <span class="service-category-badge cat-${s.category}">${cat}</span>
            <h4>${s.name}</h4>
            <div class="service-meta">
              <span>⏱ ${durStr}</span>
            </div>
          </div>
          <div class="service-price">R$&nbsp;${s.price}</div>
        </div>`;
    });
    html += "</div>";
  });

  list.innerHTML = html || '<p style="color:var(--white-dim);text-align:center;padding:40px">Nenhum serviço cadastrado.</p>';
}

function selectService(id) {
  state.service = DB.services.find(s => s.id === id);
  state.date = null;
  state.time = null;

  document.querySelectorAll(".service-card").forEach(c => c.classList.remove("selected"));
  document.getElementById(`svc-card-${id}`).classList.add("selected");

  setTimeout(() => goToStep(3), 280);
}

// ============================================================
// STEP 3 — DATE & TIME
// ============================================================

function renderDateTimeSubtitle() {
  const el = document.getElementById("datetime-subtitle");
  const p = state.professional;
  const s = state.service;
  const h = Math.floor(s.duration / 60);
  const m = s.duration % 60;
  const durStr = h > 0 ? (m > 0 ? `${h}h${m}min` : `${h}h`) : `${m}min`;
  el.innerHTML = `${p.name} · ${s.name} · <strong style="color:var(--gold)">${durStr}</strong>`;
  renderCalendar();
}

function changeMonth(delta) {
  state.calMonth.setMonth(state.calMonth.getMonth() + delta);
  renderCalendar();
}

function renderCalendar() {
  const cfg = DB.salon;
  const today = new Date(); today.setHours(0,0,0,0);
  const month = state.calMonth;
  const year  = month.getFullYear();
  const mon   = month.getMonth();

  // Month label
  document.getElementById("cal-month-label").textContent =
    month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const grid = document.getElementById("calendar-grid");
  const dayNames = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  let html = dayNames.map(d => `<div class="cal-header-day">${d}</div>`).join("");

  // First day of month
  const firstDay = new Date(year, mon, 1);
  const startDow  = firstDay.getDay(); // 0=Dom
  const daysInMonth = new Date(year, mon + 1, 0).getDate();

  // Empty cells
  for (let i = 0; i < startDow; i++) html += `<div class="cal-day empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, mon, d);
    const isToday   = date.getTime() === today.getTime();
    const isPast    = date < today;
    const isWorkDay = cfg.workDays.includes(date.getDay());
    const hasSlots  = !isPast && isWorkDay && getAvailableSlots(date).length > 0;
    const isSelected = state.date && date.toDateString() === state.date.toDateString();

    let cls = "cal-day";
    if (isPast || !isWorkDay) cls += " disabled";
    else if (hasSlots)         cls += " has-slots";
    if (isToday)               cls += " today";
    if (isSelected)            cls += " selected";

    const clickable = !isPast && isWorkDay;
    html += `<div class="${cls}" ${clickable ? `onclick="selectDate(${year},${mon},${d})"` : ""}>${d}</div>`;
  }

  grid.innerHTML = html;
}

function selectDate(y, m, d) {
  const date = new Date(y, m, d);
  const today = new Date(); today.setHours(0,0,0,0);
  if (date < today) return;
  if (!DB.salon.workDays.includes(date.getDay())) return;

  state.date = date;
  state.time = null;
  renderCalendar();
  renderTimeSlots();
}

function getAvailableSlots(date) {
  const cfg = DB.salon;
  const slots = generateAllSlots(cfg.openTime, cfg.closeTime, cfg.slotMinutes, cfg.breakStart, cfg.breakEnd);
  const dateStr = date.toISOString().split("T")[0];
  const serviceDuration = state.service ? state.service.duration : 30;

  // Occupied slots for this pro on this date
  const occupiedRanges = DB.bookings
    .filter(b => b.date === dateStr && b.professionalId === state.professional?.id
                 && b.status !== "cancelled")
    .map(b => ({ start: timeToMin(b.time), end: timeToMin(b.time) + b.duration }));

  return slots.filter(slot => {
    const slotStart = timeToMin(slot);
    const slotEnd   = slotStart + serviceDuration;
    if (slotEnd > timeToMin(cfg.closeTime)) return false;

    // Check break overlap
    if (cfg.breakStart && cfg.breakEnd) {
      const bStart = timeToMin(cfg.breakStart);
      const bEnd   = timeToMin(cfg.breakEnd);
      if (slotStart < bEnd && slotEnd > bStart) return false;
    }

    // Check booking overlap
    return !occupiedRanges.some(r => slotStart < r.end && slotEnd > r.start);
  });
}

function generateAllSlots(open, close, step, breakStart, breakEnd) {
  const slots = [];
  let cur = timeToMin(open);
  const end = timeToMin(close);
  while (cur < end) {
    slots.push(minToTime(cur));
    cur += step;
  }
  return slots;
}

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minToTime(m) {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const mn = (m % 60).toString().padStart(2, "0");
  return `${h}:${mn}`;
}

function renderTimeSlots() {
  const container = document.getElementById("time-slots-container");
  if (!state.date) {
    container.innerHTML = '<p class="time-slots-hint">← Selecione uma data para ver os horários</p>';
    return;
  }

  const available = getAvailableSlots(state.date);
  const dateLabel = state.date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  if (!available.length) {
    container.innerHTML = `
      <div class="no-slots-msg">
        <p style="font-size:24px;margin-bottom:8px">😔</p>
        <p>Sem horários disponíveis em <strong>${dateLabel}</strong>.</p>
        <p style="margin-top:6px;font-size:13px;color:var(--white-dim)">Tente outra data.</p>
      </div>`;
    return;
  }

  let html = `<p class="time-slots-title">${dateLabel}</p>
    <div class="time-slots-grid">`;

  available.forEach(slot => {
    const sel = state.time === slot ? " selected" : "";
    html += `<div class="time-slot${sel}" onclick="selectTime('${slot}')">${slot}</div>`;
  });

  html += "</div>";
  container.innerHTML = html;
}

function selectTime(t) {
  state.time = t;
  renderTimeSlots(); // re-render to show selection
  setTimeout(() => goToStep(4), 280);
}

// ============================================================
// STEP 4 — CLIENT FORM
// ============================================================

function renderBookingSummaryMini() {
  const el = document.getElementById("booking-summary-mini");
  const dateStr = state.date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const h = Math.floor(state.service.duration / 60);
  const m = state.service.duration % 60;
  const durStr = h > 0 ? (m > 0 ? `${h}h${m}min` : `${h}h`) : `${m}min`;

  el.innerHTML = `
    👤 <strong>${state.professional.name}</strong><br>
    💈 <strong>${state.service.name}</strong> · ${durStr} · <strong>R$ ${state.service.price}</strong><br>
    📅 <strong>${dateStr}</strong> às <strong>${state.time}</strong>
  `;
}

function confirmBooking(e) {
  e.preventDefault();
  const name  = document.getElementById("client-name").value.trim();
  const phone = document.getElementById("client-phone").value.trim();
  const notes = document.getElementById("client-notes").value.trim();

  if (!name || !phone) { showToast("Preencha seu nome e WhatsApp", "error"); return; }

  const booking = {
    id:             "bk-" + Date.now(),
    professionalId: state.professional.id,
    professionalName: state.professional.name,
    serviceId:      state.service.id,
    serviceName:    state.service.name,
    duration:       state.service.duration,
    price:          state.service.price,
    date:           state.date.toISOString().split("T")[0],
    time:           state.time,
    clientName:     name,
    clientPhone:    phone,
    notes:          notes,
    status:         "confirmed",
    createdAt:      new Date().toISOString()
  };

  DB.bookings.push(booking);
  saveData(DB);

  showConfirmation(booking);
}

// ============================================================
// CONFIRMATION SCREEN
// ============================================================

function showConfirmation(b) {
  // Hide all panels
  document.querySelectorAll(".step-panel").forEach(p => p.classList.remove("active"));
  document.getElementById("panel-confirm").classList.add("active");

  // Hide step indicator
  document.getElementById("step-indicator").style.display = "none";

  // Fill details
  document.getElementById("confirm-client-name").textContent = b.clientName;

  const dateObj = new Date(b.date + "T00:00:00");
  const dateStr = dateObj.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const h = Math.floor(b.duration / 60);
  const m = b.duration % 60;
  const durStr = h > 0 ? (m > 0 ? `${h}h${m}min` : `${h}h`) : `${m}min`;

  document.getElementById("confirm-details").innerHTML = `
    <div class="confirm-row"><span class="confirm-row-icon">👤</span><span class="confirm-row-label">Profissional</span><span class="confirm-row-value">${b.professionalName}</span></div>
    <div class="confirm-row"><span class="confirm-row-icon">💈</span><span class="confirm-row-label">Serviço</span><span class="confirm-row-value">${b.serviceName}</span></div>
    <div class="confirm-row"><span class="confirm-row-icon">⏱</span><span class="confirm-row-label">Duração</span><span class="confirm-row-value">${durStr}</span></div>
    <div class="confirm-row"><span class="confirm-row-icon">💰</span><span class="confirm-row-label">Valor</span><span class="confirm-row-value" style="color:var(--gold)">R$ ${b.price}</span></div>
    <div class="confirm-row"><span class="confirm-row-icon">📅</span><span class="confirm-row-label">Data</span><span class="confirm-row-value">${dateStr}</span></div>
    <div class="confirm-row"><span class="confirm-row-icon">🕐</span><span class="confirm-row-label">Horário</span><span class="confirm-row-value">${b.time}</span></div>
  `;

  // Store booking for WhatsApp
  window._lastBooking = b;

  // Simple QR code (draw URL on canvas)
  drawQR();
}

function sendWhatsapp() {
  const b = window._lastBooking;
  if (!b) return;

  const dateObj = new Date(b.date + "T00:00:00");
  const dateStr = dateObj.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const msg = `Olá, ${b.professionalName}! 👋\n\nFiz meu agendamento pelo sistema do Estúdio Jovem e Linda:\n\n` +
    `💈 *${b.serviceName}*\n` +
    `📅 *${dateStr}* às *${b.time}*\n` +
    `💰 *R$ ${b.price}*\n\n` +
    `Meu nome: *${b.clientName}*\n` +
    `${b.notes ? `📝 Obs: ${b.notes}\n\n` : '\n'}` +
    `Confirma?`;

  const phone = DB.salon.phone;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
}

function startNewBooking() {
  state.professional = null;
  state.service = null;
  state.date = null;
  state.time = null;
  state.step = 1;

  // Reset header to default Jovem e Linda
  const headerImg = document.getElementById("header-logo-img");
  const headerSub = document.getElementById("header-logo-sub");
  const headerTitle = document.getElementById("header-logo-title");
  const headerExtra = document.getElementById("header-logo-extra");
  if (headerImg) headerImg.src = "logo-izabel.png";
  if (headerSub) headerSub.textContent = "ESTÚDIO";
  if (headerTitle) headerTitle.textContent = "Jovem e Linda";
  if (headerExtra) headerExtra.textContent = "✂ UNISSEX";

  document.getElementById("step-indicator").style.display = "";
  document.querySelectorAll(".step-panel").forEach(p => p.classList.remove("active"));
  document.getElementById("panel-1").classList.add("active");

  // Reset step indicator
  document.querySelectorAll(".step").forEach(s => {
    s.classList.remove("active", "done");
    s.querySelector("span").textContent = s.dataset.step;
  });
  document.querySelectorAll(".step-line").forEach(l => l.classList.remove("active"));
  document.querySelector(".step[data-step='1']").classList.add("active");

  document.getElementById("client-form").reset();
  renderProfessionals();
}

// ============================================================
// QR CODE (simple canvas draw)
// ============================================================

function drawQR() {
  const url = window.location.href.split("?")[0];
  document.getElementById("share-url").textContent = url;

  const canvas = document.getElementById("qr-canvas");
  const ctx = canvas.getContext("2d");
  const size = 120;

  // Simple placeholder QR visual (since no library)
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, size, size);

  // Draw a decorative pattern that looks like QR corner markers
  ctx.fillStyle = "#0a0a0a";
  const drawSquare = (x, y, s) => ctx.fillRect(x, y, s, s);

  // Corner markers
  [[8,8],[8,88],[88,8]].forEach(([x,y]) => {
    drawSquare(x, y, 24);
    ctx.fillStyle = "#fff";
    drawSquare(x+4, y+4, 16);
    ctx.fillStyle = "#0a0a0a";
    drawSquare(x+8, y+8, 8);
  });

  // Center pattern (JL initials in QR)
  ctx.fillStyle = "#c9a96e";
  ctx.font = "bold 18px 'Cormorant Garamond', serif";
  ctx.textAlign = "center";
  ctx.fillText("JL", 60, 68);

  // Border dots
  for(let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#0a0a0a" : "#c9a96e";
    ctx.fillRect(8 + i*14, 40, 10, 10);
    ctx.fillRect(8 + i*14, 76, 10, 10);
  }
}

// ============================================================
// ADMIN LOGIN
// ============================================================

function openAdminLogin() {
  document.getElementById("admin-login-modal").classList.remove("hidden");
  setTimeout(() => document.getElementById("admin-password").focus(), 100);
}

function closeAdminLogin() {
  document.getElementById("admin-login-modal").classList.add("hidden");
  document.getElementById("admin-password").value = "";
  document.getElementById("admin-error").classList.add("hidden");
}

function loginAdmin() {
  const pwd = document.getElementById("admin-password").value;
  if (pwd === DB.salon.adminPassword) {
    closeAdminLogin();
    openAdmin();
  } else {
    document.getElementById("admin-error").classList.remove("hidden");
    document.getElementById("admin-password").value = "";
    document.getElementById("admin-password").focus();
  }
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================

let toastTimer = null;
function showToast(msg, type = "info") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${type} show`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove("show"); }, 3000);
}

// ============================================================
// MISC
// ============================================================

function initAdminDateFilter() {
  const today = new Date().toISOString().split("T")[0];
  const el = document.getElementById("admin-date-filter");
  if (el) el.value = today;
}
