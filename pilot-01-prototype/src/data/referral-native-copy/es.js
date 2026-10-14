const dateFormatter = new Intl.DateTimeFormat("es", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const formatDate = (date) => {
  if (!date) return "";
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return dateFormatter.format(parsed);
};

export default {
  query: (name) => `código de referido ${name}`,
  labels: {
    code: "Código",
    benefit: "Beneficio",
    entry: "Al registrarse",
    later: "Después del registro",
    payout: "Calendario de pago",
    verified: "Verificado",
    check: "Comprobar",
    source: "Fuente",
    log: "Registro",
    calculator: "Calculadora",
  },
  verifiedTitle: (name, code, benefit, date) =>
    `código de referido ${name}: ${code} — ${benefit} (verificado el ${formatDate(date)})`,
  share: (percent) => `Hasta el ${percent}% de las comisiones devuelto`,
  noBenefit: "No hay beneficio de usuario verificado",
  pending: "No verificado",
  cadence: {
    hourly: "cada hora",
    daily: "diario",
  },
  entryText:
    "Introduce el código de referido en el campo de referido antes de completar el registro.",
  laterUnknown:
    "La ayuda oficial no confirma que se pueda añadir un código después del registro; no asumas que puede añadirse.",
  laterBybit:
    "El código de afiliado solo puede añadirse a cuentas principales dentro de los 14 días si no existe una asociación actual de afiliado/referrer. Los códigos de referido ordinarios no son compatibles; se aplican requisitos regulatorios, las cuentas de market-maker e institucionales quedan excluidas, y el código no puede cambiarse ni cancelarse después de añadirlo.",
  laterBinance:
    "Binance admite una revinculación condicional de afiliado, no el reemplazo arbitrario de códigos. Requiere una cuenta principal con KYC completado, sin referrer, volumen de los últimos 90 días inferior a $5.000, y controles de región y riesgo. La solicitud de afiliado requiere $150.000 de volumen elegible en 30 días; los pares sin comisiones y las subcuentas quedan excluidos. La revinculación propia sin historial de trading es un proceso separado. Esta página no confirma que este código sea elegible; no operes solo para revincular.",
  faqEntry: (name) => `¿Dónde se introduce el código de referido ${name}?`,
  faqLater: (name) =>
    `¿Se puede añadir el código de referido ${name} después del registro?`,
  faqPayout: (name) => `¿Cuándo paga ${name} el rebate de referido?`,
  payoutText: (name, cadence) =>
    `Los datos del partner indican que ${name} paga ${cadence}; se aplican requisitos de elegibilidad.`,
  noPayout: "No hay calendario de pago verificado",
};

// Venue-specific entry steps from the reviewed official help records.
// These supplement the shared interface copy without changing locale policy.
export const entryByVenue = {
  "bitget": "En el formulario web, introduce el código opcional después del correo o teléfono, antes de pulsar Next.",
  "okx": "Comprueba el código rellenado antes de terminar el registro. OKX indica que un enlace anterior puede quedar asociado al dispositivo durante 30 días.",
  "binance": "En la app Binance, comprueba el código en el paso posterior a crear la cuenta, antes del KYC. Un código vinculado no puede modificarse.",
  "bybit": "Introduce el código de referido o afiliado antes de pulsar Sign Up Now.",
  "coinw": "Introduce el código durante el registro para establecer la relación de referido.",
  "kraken": "Introduce el código al crear la cuenta en la app Kraken. Las condiciones de la app no verifican el beneficio de este código de socio."
};
