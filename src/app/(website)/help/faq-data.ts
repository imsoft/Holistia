/**
 * Datos de FAQ del centro de ayuda. Compartido para UI y schema SEO.
 */

export const FAQ_PROFESSIONALS: { question: string; answer: string }[] = [
  {
    question: "¿Cuánto cobra Holistia de comisión por mis citas y servicios?",
    answer:
      "En consultas (citas): Holistia retiene un 15% del monto que cobras; el 85% es para ti. En eventos pagados la comisión es del 20%. En programas digitales y retos también es 15%. La inscripción como profesional se paga una vez y no tiene comisión por transacción. Sobre cada pago, Stripe (nuestro procesador) aplica además su tarifa (aprox. 3.6% + $3 MXN + IVA). El monto que ves en Finanzas ya está descontada la comisión de Holistia.",
  },
  {
    question: "¿Cómo funcionan las cancelaciones por parte del paciente?",
    answer:
      "El paciente debe cancelar con al menos 24 horas de anticipación. Si cancela después, puedes aplicar tu política (por ejemplo, no reembolso o cargo). Si el paciente no se presenta, puedes marcar la cita como «Paciente no asistió» desde el detalle de la cita en tu panel; en ese caso no aplica reembolso. Para cancelaciones con más de 24 h de anticipación, puedes acordar excepciones directamente con el paciente si lo consideras adecuado.",
  },
  {
    question: "¿Cómo y cuándo recibo el dinero de mis consultas?",
    answer:
      "Los pagos se procesan con Stripe Connect. El dinero del paciente se cobra en el momento de la reserva; Stripe envía a tu cuenta conectada según su calendario de transferencias (normalmente en 2–7 días hábiles, según tu país y configuración). En tu panel de Holistia, en Finanzas, puedes ver el detalle de cada transacción, la comisión de la plataforma y el monto neto que te corresponde. Para facturación, Stripe puede emitir comprobantes; para facturación fiscal en México debes usar tu propio régimen con los datos de tus ingresos.",
  },
  {
    question: "¿Puedo dar reembolsos a un paciente?",
    answer:
      "Sí. Si canceló con más de 24 h de anticipación o hay un acuerdo entre ustedes, puedes gestionar un reembolso desde tu cuenta de Stripe (o contactarnos para casos que requieran apoyo). Una vez confirmado el pago, no hay reembolsos automáticos; cualquier devolución se coordina entre tú, el paciente y, si aplica, soporte de Holistia.",
  },
];

export const FAQ_PATIENTS: { question: string; answer: string }[] = [
  {
    question: "¿Cómo agendo mi primera cita?",
    answer:
      "Entra a Explorar o busca al profesional que te interese. Elige el servicio, la fecha y el horario disponible. Completa el pago con tarjeta de crédito o débito de forma segura (Stripe). Recibirás un email de confirmación y el ticket con los datos de la cita. Si es en línea, el enlace de videollamada aparecerá en el email y en Mis citas.",
  },
  {
    question: "¿Cómo cancelo o reprogramo una cita?",
    answer:
      "En la app ve a Mis citas, localiza la cita y usa la opción «Cancelar» o «Reprogramar». Es importante que canceles o reprogrames con al menos 24 horas de anticipación para evitar cargos según la política del profesional. Si solo cancelas, la cita queda anulada; si reprogramas, podrás elegir otro horario disponible.",
  },
  {
    question: "¿Hay reembolsos si cancelo o no asisto?",
    answer:
      "No hay reembolsos una vez confirmado el pago. Si cancelas con más de 24 horas de anticipación, el profesional puede evaluar excepciones según su criterio. Si no te presentas a la cita, no aplica reembolso y el profesional puede marcar la cita como no asistencia. Para casos especiales (por ejemplo, el profesional no se presentó), puedes enviar una solicitud desde este centro de ayuda y la revisamos en 24–48 h hábiles.",
  },
  {
    question: "No me llegó el enlace de la videollamada, ¿qué hago?",
    answer:
      "Revisa tu bandeja de spam o correo no deseado. En la app, entra a Mis citas, abre la cita y revisa si aparece el enlace de reunión en los detalles. Si sigue sin aparecer, usa «Enviar solicitud» en este centro de ayuda e indica el nombre del profesional, fecha y hora de la cita para que podamos ayudarte.",
  },
];

/** Todas las FAQs en un solo array para schema FAQPage (SEO) */
export function getAllFaqsForSchema(): { question: string; answer: string }[] {
  return [...FAQ_PATIENTS, ...FAQ_PROFESSIONALS];
}
