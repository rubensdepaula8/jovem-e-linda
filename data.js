// ============================================================
// DATA.JS — Dados padrão do Estúdio Jovem e Linda
// ============================================================

const DEFAULT_DATA = {
  salon: {
    name: "Estúdio Jovem e Linda",
    tagline: "UNISSEX",
    phone: "5511999999999",
    openTime: "09:00",
    closeTime: "19:00",
    slotMinutes: 30,
    breakStart: "12:00",
    breakEnd: "13:00",
    workDays: [1, 2, 3, 4, 5, 6], // seg-sab
    adminPassword: "jovem2024"
  },
  professionals: [
    {
      id: "pro-1",
      name: "Izabel",
      role: "Cabeleireira",
      emoji: "💇‍♀️",
      color: "#e8a0b0",
      active: true
    },
    {
      id: "pro-2",
      name: "Emanuel",
      role: "Barbeiro",
      emoji: "✂️",
      color: "#c9a96e",
      active: true
    }
  ],
  services: [
    // Feminino
    { id: "svc-1",  name: "Corte Feminino",         emoji: "✂️",  duration: 60,  price: 80,  category: "feminino" },
    { id: "svc-2",  name: "Escova Progressiva",      emoji: "🌿",  duration: 180, price: 250, category: "feminino" },
    { id: "svc-3",  name: "Coloração Completa",      emoji: "🎨",  duration: 120, price: 180, category: "feminino" },
    { id: "svc-4",  name: "Hidratação Profunda",     emoji: "💧",  duration: 60,  price: 90,  category: "feminino" },
    { id: "svc-5",  name: "Luzes / Mechas",          emoji: "✨",  duration: 180, price: 280, category: "feminino" },
    // Masculino
    { id: "svc-6",  name: "Corte Masculino",         emoji: "💈",  duration: 45,  price: 50,  category: "masculino" },
    { id: "svc-7",  name: "Barba Completa",          emoji: "🪒",  duration: 30,  price: 40,  category: "masculino" },
    { id: "svc-8",  name: "Corte + Barba",           emoji: "💈",  duration: 75,  price: 80,  category: "masculino" },
    { id: "svc-9",  name: "Pigmentação Barba",       emoji: "🎨",  duration: 45,  price: 60,  category: "masculino" },
    // Unissex
    { id: "svc-10", name: "Sobrancelha",             emoji: "👁️",  duration: 30,  price: 35,  category: "unissex" },
    { id: "svc-11", name: "Nutrição Capilar",        emoji: "🌿",  duration: 60,  price: 70,  category: "unissex" },
    // Estética
    { id: "svc-12", name: "Manicure + Pedicure",     emoji: "💅",  duration: 90,  price: 80,  category: "estetica" },
    { id: "svc-13", name: "Manicure",                emoji: "💅",  duration: 45,  price: 45,  category: "estetica" },
    { id: "svc-14", name: "Alongamento de Unhas",    emoji: "💎",  duration: 120, price: 150, category: "estetica" }
  ],
  bookings: []
};

// ============================================================
// Storage helpers
// ============================================================

const STORAGE_KEY = "jl_salon_v1";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function resetToDefaults() {
  if (!confirm("Tem certeza? Isso vai restaurar os dados padrão e APAGAR todos os agendamentos!")) return;
  localStorage.removeItem(STORAGE_KEY);
  DB = loadData();
  showToast("Dados restaurados com sucesso", "success");
  renderAdminAgenda();
  renderAdminProfessionals();
  renderAdminServices();
  loadConfig();
}

function clearAllBookings() {
  if (!confirm("Tem certeza? Isso vai APAGAR todos os agendamentos!")) return;
  DB.bookings = [];
  saveData(DB);
  showToast("Todos os agendamentos foram removidos", "info");
  renderAdminAgenda();
}

// ============================================================
// DB — global state
// ============================================================

let DB = loadData();
