// ============================================================
//  data.js – Dados padrão de profissionais e serviços
// ============================================================

const DEFAULT_PROFESSIONALS = [
  { id: "pro_1", name: "Izabel",  role: "Cabeleireira & Maquiadora", emoji: "💇‍♀️", color: "#e8b4bc" },
  { id: "pro_2", name: "Emanuel", role: "Barbeiro & Cabelereiro",     emoji: "✂️",   color: "#c9a96e" },
];

const DEFAULT_SERVICES = [
  { id: "svc_1",  name: "Corte Feminino",         emoji: "✂️",  duration: 60,  price: 50,  category: "feminino"  },
  { id: "svc_2",  name: "Corte Masculino",         emoji: "💈",  duration: 30,  price: 30,  category: "masculino" },
  { id: "svc_3",  name: "Escova",                  emoji: "💨",  duration: 60,  price: 60,  category: "feminino"  },
  { id: "svc_4",  name: "Hidratação",              emoji: "💧",  duration: 60,  price: 70,  category: "feminino"  },
  { id: "svc_5",  name: "Coloração",               emoji: "🎨",  duration: 120, price: 120, category: "feminino"  },
  { id: "svc_6",  name: "Barba",                   emoji: "🪒",  duration: 30,  price: 25,  category: "masculino" },
  { id: "svc_7",  name: "Corte + Barba",           emoji: "💈",  duration: 50,  price: 50,  category: "masculino" },
  { id: "svc_8",  name: "Manicure",                emoji: "💅",  duration: 45,  price: 35,  category: "unissex"   },
  { id: "svc_9",  name: "Pedicure",                emoji: "🦶",  duration: 60,  price: 40,  category: "unissex"   },
  { id: "svc_10", name: "Design de Sobrancelha",   emoji: "✨",  duration: 30,  price: 20,  category: "unissex"   },
];

function getProfessionals() {
  try {
    const saved = localStorage.getItem("jel_professionals");
    if (saved) return JSON.parse(saved);
  } catch (e) { /* ignore */ }
  return DEFAULT_PROFESSIONALS.map(p => Object.assign({}, p));
}

function saveProfessionalsData(list) {
  try { localStorage.setItem("jel_professionals", JSON.stringify(list)); } catch (e) { /* ignore */ }
}

function getServices() {
  try {
    const saved = localStorage.getItem("jel_services");
    if (saved) return JSON.parse(saved);
  } catch (e) { /* ignore */ }
  return DEFAULT_SERVICES.map(s => Object.assign({}, s));
}

function saveServicesData(list) {
  try { localStorage.setItem("jel_services", JSON.stringify(list)); } catch (e) { /* ignore */ }
}

function getBookings() {
  try {
    const saved = localStorage.getItem("jel_bookings");
    if (saved) return JSON.parse(saved);
  } catch (e) { /* ignore */ }
  return [];
}

function saveBookingsData(list) {
  try { localStorage.setItem("jel_bookings", JSON.stringify(list)); } catch (e) { /* ignore */ }
}
