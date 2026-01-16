/**
 * Formatea un número de teléfono a un formato consistente
 * Formato: "+52 33 3410 9866" o "33 3410 9866" (sin código de país si no lo tiene)
 * 
 * @param phone - Número de teléfono a formatear (puede incluir código de país, espacios, guiones, etc.)
 * @returns Número formateado o string vacío si no hay teléfono
 * 
 * @example
 * formatPhone("+523334109866") // "+52 33 3410 9866"
 * formatPhone("3334109866") // "33 3410 9866"
 * formatPhone("+52 33 3410 9866") // "+52 33 3410 9866"
 * formatPhone("33-3410-9866") // "33 3410 9866"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";

  // Limpiar el número: remover espacios, guiones, paréntesis, etc.
  const cleaned = phone.replace(/[\s\-()]/g, "");

  if (!cleaned) return "";

  // Detectar si tiene código de país (comienza con +)
  const hasCountryCode = cleaned.startsWith("+");
  
  // Separar código de país del número
  let countryCode = "";
  let number = cleaned;

  if (hasCountryCode) {
    // Buscar el código de país (puede ser +52, +1, etc.)
    // Para México, el código es +52 y tiene 10 dígitos después
    // Para otros países, intentar detectar el código
    if (cleaned.startsWith("+52")) {
      countryCode = "+52";
      number = cleaned.slice(3); // Remover "+52"
    } else if (cleaned.startsWith("+1")) {
      countryCode = "+1";
      number = cleaned.slice(2); // Remover "+1"
    } else {
      // Para otros códigos, intentar detectar (códigos de 1-3 dígitos)
      const countryCodeMatch = cleaned.match(/^\+(\d{1,3})/);
      if (countryCodeMatch) {
        countryCode = `+${countryCodeMatch[1]}`;
        number = cleaned.slice(countryCodeMatch[0].length);
      }
    }
  } else if (cleaned.length === 10 && cleaned.startsWith("33")) {
    // Si tiene 10 dígitos y empieza con 33 (código de área de Guadalajara),
    // probablemente es un número mexicano sin código de país
    // No agregamos +52 automáticamente, solo formateamos
  }

  // Remover cualquier carácter no numérico restante
  number = number.replace(/\D/g, "");

  if (!number) return "";

  // Formatear el número según su longitud
  let formattedNumber = "";

  if (number.length === 10) {
    // Formato mexicano: 33 3410 9866
    formattedNumber = `${number.slice(0, 2)} ${number.slice(2, 6)} ${number.slice(6)}`;
  } else if (number.length === 12 && countryCode === "+52") {
    // Si tiene 12 dígitos con código +52, puede ser que incluya el código de área dos veces
    // Formato: 52 33 3410 9866 -> 33 3410 9866 (remover el 52 duplicado)
    if (number.startsWith("52")) {
      number = number.slice(2);
      formattedNumber = `${number.slice(0, 2)} ${number.slice(2, 6)} ${number.slice(6)}`;
    } else {
      formattedNumber = `${number.slice(0, 2)} ${number.slice(2, 6)} ${number.slice(6)}`;
    }
  } else if (number.length > 10) {
    // Para números más largos, formatear en grupos de 3-4 dígitos
    const chunks = [];
    let remaining = number;
    
    // Primer grupo: 2 dígitos (código de área)
    if (remaining.length > 2) {
      chunks.push(remaining.slice(0, 2));
      remaining = remaining.slice(2);
    }
    
    // Grupos de 4 dígitos
    while (remaining.length > 4) {
      chunks.push(remaining.slice(0, 4));
      remaining = remaining.slice(4);
    }
    
    // Último grupo: lo que quede
    if (remaining.length > 0) {
      chunks.push(remaining);
    }
    
    formattedNumber = chunks.join(" ");
  } else {
    // Para números más cortos, formatear en grupos de 3
    const chunks = [];
    let remaining = number;
    
    while (remaining.length > 3) {
      chunks.push(remaining.slice(0, 3));
      remaining = remaining.slice(3);
    }
    
    if (remaining.length > 0) {
      chunks.push(remaining);
    }
    
    formattedNumber = chunks.join(" ");
  }

  // Combinar código de país con número formateado
  if (countryCode) {
    return `${countryCode} ${formattedNumber}`.trim();
  }

  return formattedNumber.trim();
}

/**
 * Formatea un número de teléfono para uso en enlaces tel:
 * Remueve espacios y caracteres especiales, mantiene el formato para llamadas
 * 
 * @param phone - Número de teléfono a formatear
 * @returns Número formateado para enlaces tel: (ej: "+523334109866")
 */
export function formatPhoneForTel(phone: string | null | undefined): string {
  if (!phone) return "";

  // Limpiar el número: remover espacios, guiones, paréntesis, etc.
  const cleaned = phone.replace(/[\s\-()]/g, "");

  return cleaned;
}
