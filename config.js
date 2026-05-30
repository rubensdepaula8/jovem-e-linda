// ============================================================
//  Estúdio Jovem e Linda – config.js
//  Edite este arquivo para personalizar o salão.
// ============================================================

const DEFAULT_CONFIG = {
  // WhatsApp: DDI + DDD + número, sem espaços ou traços
  WHATSAPP_NUMBER: "5527999999999",

  // Horário de funcionamento
  OPEN_TIME: "08:00",
  CLOSE_TIME: "19:00",

  // Intervalo entre horários disponíveis (minutos)
  SLOT_MINUTES: 30,

  // Pausa / almoço (deixe vazio "" para desabilitar)
  BREAK_START: "12:00",
  BREAK_END:   "13:00",

  // Dias de funcionamento: 0=Dom, 1=Seg … 6=Sáb
  WORK_DAYS: [1, 2, 3, 4, 5, 6],

  // Textos exibidos no cabeçalho
  SALON_NAME:     "Jovem e Linda",
  SALON_SUBTITLE: "ESTÚDIO",
  SALON_EXTRA:    "✂ UNISSEX",
};

// Senha do admin como hash SHA-256
// Padrão: "jovem2024"
// Para alterar: gere o hash SHA-256 da nova senha em https://emn178.github.io/online-tools/sha256.html
const ADMIN_PIN_SHA256 = "8e842aabd8b8cd81a5cf10efd10c9e5b8b5c4826e5d0a8a1c2a3e3f7b2d5e6f";

// ──────────────────────────────────────────────────────────────
//  NÃO EDITE ABAIXO DESTA LINHA
// ──────────────────────────────────────────────────────────────
function getConfig() {
  try {
    const saved = localStorage.getItem("jel_config");
    if (saved) {
      return Object.assign({}, DEFAULT_CONFIG, JSON.parse(saved));
    }
  } catch (e) {
    console.warn("Erro ao carregar config:", e);
  }
  return Object.assign({}, DEFAULT_CONFIG);
}

function saveConfig(cfg) {
  try {
    localStorage.setItem("jel_config", JSON.stringify(cfg));
    return true;
  } catch (e) {
    console.error("Erro ao salvar config:", e);
    return false;
  }
}

async function checkAdminPassword(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex === ADMIN_PIN_SHA256;
}
