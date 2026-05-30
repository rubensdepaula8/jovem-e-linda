/* ============================================================
   CONFIGURAÇÕES RÁPIDAS
   1) Troque WHATSAPP_NUMBER pelo número do salão com DDI + DDD.
      Exemplo: 5583999999999
   2) A senha padrão do admin continua sendo: jovem2024
      Ela NÃO fica escrita em texto aberto no app; fica em hash SHA-256.
      Para trocar, gere um novo SHA-256 e substitua ADMIN_PIN_SHA256.
   ============================================================ */

window.APP_CONFIG = {
  SALON_NAME: "Estúdio Jovem e Linda",
  SALON_TAGLINE: "UNISSEX",
  WHATSAPP_NUMBER: "5511999999999", // TROQUE PELO WHATSAPP REAL DO SALÃO
  ADMIN_PIN_SHA256: "09403bc97d637dfb3152c0c236a0a0eaaaf8e1adc4f523d32da60e6703c55749",
  STORAGE_KEY: "jl_salon_v3_corrigido"
};
