/**
 * Normaliza texto a formato "Título de Oración"
 * Convierte la primera letra de cada palabra en mayúscula y el resto en minúsculas
 */
export function toTitleCase(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Manejar palabras vacías o solo espacios
      if (!word) return word;
      
      // Manejar palabras con guiones (ej: "santa-maria")
      if (word.includes('-')) {
        return word
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join('-');
      }
      
      // Manejar palabras con apóstrofes (ej: "o'connor")
      if (word.includes("'")) {
        return word
          .split("'")
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join("'");
      }
      
      // Palabra normal
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Normaliza nombres propios (nombres y apellidos)
 * Maneja casos especiales como "MC", "De", "La", etc.
 */
export function normalizeName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  
  const lowercased = name.toLowerCase().trim();
  
  // Lista de palabras que deben permanecer en minúsculas cuando no son la primera palabra
  const lowercaseWords = ['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'o', 'u'];
  
  // Lista de prefijos que deben mantenerse en mayúsculas
  const uppercasePrefixes = ['mc', 'mac', 'o\'', 'd\'', 'von', 'van', 'le', 'du'];
  
  return lowercased
    .split(' ')
    .map((word, index) => {
      if (!word) return word;
      
      // Primera palabra siempre en mayúscula
      if (index === 0) {
        // Verificar si tiene prefijo especial
        const prefix = uppercasePrefixes.find(pref => 
          word.toLowerCase().startsWith(pref.toLowerCase())
        );
        
        if (prefix) {
          const rest = word.slice(prefix.length);
          return prefix.toUpperCase() + (rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : '');
        }
        
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      // Palabras que deben permanecer en minúsculas
      if (lowercaseWords.includes(word)) {
        return word;
      }
      
      // Resto de palabras en formato título
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Normaliza direcciones manteniendo abreviaciones comunes
 */
export function normalizeAddress(address: string): string {
  if (!address || typeof address !== 'string') return '';
  
  const lowercased = address.toLowerCase().trim();
  
  // Abreviaciones comunes que deben mantenerse
  const abbreviations: Record<string, string> = {
    'ave': 'Ave',
    'av': 'Av',
    'blvd': 'Blvd',
    'st': 'St',
    'calle': 'Calle',
    'avenida': 'Avenida',
    'boulevard': 'Boulevard',
    'no': 'No',
    'num': 'Num',
    'int': 'Int',
    'ext': 'Ext',
    'col': 'Col',
    'colonia': 'Colonia',
    'fracc': 'Fracc',
    'fraccionamiento': 'Fraccionamiento',
    'cd': 'CD',
    'ciudad': 'Ciudad',
    'cp': 'CP',
    'código postal': 'Código Postal'
  };
  
  return lowercased
    .split(' ')
    .map((word, index) => {
      if (!word) return word;
      
      // Primera palabra siempre en mayúscula
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      // Verificar si es una abreviación
      const cleanWord = word.replace(/[.,]/g, '');
      if (abbreviations[cleanWord]) {
        return abbreviations[cleanWord] + word.slice(cleanWord.length);
      }
      
      // Palabras que deben permanecer en minúsculas
      const lowercaseWords = ['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'o', 'u'];
      if (lowercaseWords.includes(cleanWord)) {
        return word;
      }
      
      // Resto de palabras en formato título
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Normaliza nombres de ciudades y estados
 */
export function normalizeLocation(location: string): string {
  if (!location || typeof location !== 'string') return '';
  
  const lowercased = location.toLowerCase().trim();
  
  // Casos especiales para México
  const specialCases: Record<string, string> = {
    'méxico': 'México',
    'méxico df': 'México DF',
    'ciudad de méxico': 'Ciudad de México',
    'cdmx': 'CDMX',
    'gto': 'GTO',
    'guanajuato': 'Guanajuato',
    'jal': 'JAL',
    'jalisco': 'Jalisco',
    'nuevo león': 'Nuevo León',
    'san luis potosí': 'San Luis Potosí',
    'quintana roo': 'Quintana Roo',
    'baja california': 'Baja California',
    'baja california sur': 'Baja California Sur'
  };
  
  // Verificar casos especiales primero
  if (specialCases[lowercased]) {
    return specialCases[lowercased];
  }
  
  return toTitleCase(location);
}

/**
 * Normaliza texto de profesión o especialización
 */
export function normalizeProfession(profession: string): string {
  if (!profession || typeof profession !== 'string') return '';
  
  const lowercased = profession.toLowerCase().trim();
  
  // Casos especiales para profesiones
  const specialCases: Record<string, string> = {
    'psicología': 'Psicología',
    'psicologia': 'Psicología',
    'terapia': 'Terapia',
    'nutrición': 'Nutrición',
    'nutricion': 'Nutrición',
    'medicina': 'Medicina',
    'enfermería': 'Enfermería',
    'enfermeria': 'Enfermería',
    'fisioterapia': 'Fisioterapia',
    'terapia física': 'Terapia Física',
    'terapia ocupacional': 'Terapia Ocupacional',
    'trabajo social': 'Trabajo Social',
    'psiquiatría': 'Psiquiatría',
    'psiquiatria': 'Psiquiatría'
  };
  
  // Verificar casos especiales primero
  if (specialCases[lowercased]) {
    return specialCases[lowercased];
  }
  
  return toTitleCase(profession);
}

/**
 * Hook personalizado para normalizar texto en inputs
 */
export function useTextNormalization() {
  const normalizeInput = (value: string, type: 'name' | 'address' | 'location' | 'profession' | 'general' = 'general') => {
    switch (type) {
      case 'name':
        return normalizeName(value);
      case 'address':
        return normalizeAddress(value);
      case 'location':
        return normalizeLocation(value);
      case 'profession':
        return normalizeProfession(value);
      default:
        return toTitleCase(value);
    }
  };

  return { normalizeInput };
}
