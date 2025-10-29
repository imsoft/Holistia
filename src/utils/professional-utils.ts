/**
 * Utilidades para determinar la modalidad de servicios de los profesionales
 */

export type ServiceModality = 'presencial' | 'online' | 'both';

export interface Service {
  name: string;
  description?: string;
  presencialCost?: string | number;
  onlineCost?: string | number;
  modality?: 'presencial' | 'online' | 'both';
}

/**
 * Determina la modalidad de servicios de un profesional basándose en sus servicios
 * @param services Array de servicios del profesional
 * @returns La modalidad del profesional: 'presencial', 'online', o 'both'
 */
export function determineProfessionalModality(services: Service[]): ServiceModality {
  if (!services || services.length === 0) {
    return 'presencial'; // Fallback por defecto
  }

  // Verificar si hay servicios presenciales
  const hasPresencial = services.some(service => {
    // Si el servicio tiene modality definida, usarla
    if (service.modality) {
      return service.modality === 'presencial' || service.modality === 'both';
    }
    // Fallback: verificar si tiene costo presencial
    return service.presencialCost && 
           service.presencialCost !== '' && 
           service.presencialCost !== '0' &&
           parseInt(service.presencialCost.toString()) > 0;
  });

  // Verificar si hay servicios en línea
  const hasOnline = services.some(service => {
    // Si el servicio tiene modality definida, usarla
    if (service.modality) {
      return service.modality === 'online' || service.modality === 'both';
    }
    // Fallback: verificar si tiene costo en línea
    return service.onlineCost && 
           service.onlineCost !== '' && 
           service.onlineCost !== '0' &&
           parseInt(service.onlineCost.toString()) > 0;
  });

  // Determinar la modalidad final
  if (hasPresencial && hasOnline) {
    return 'both';
  } else if (hasOnline) {
    return 'online';
  } else if (hasPresencial) {
    return 'presencial';
  }

  // Si no se puede determinar, asumir presencial
  return 'presencial';
}

/**
 * Obtiene el texto descriptivo para la modalidad
 * @param modality La modalidad del profesional
 * @returns Texto descriptivo en español
 */
export function getModalityText(modality: ServiceModality): string {
  switch (modality) {
    case 'presencial':
      return 'Presencial';
    case 'online':
      return 'En línea';
    case 'both':
      return 'Presencial y en línea';
    default:
      return 'Presencial';
  }
}

/**
 * Obtiene el ícono correspondiente para la modalidad
 * @param modality La modalidad del profesional
 * @returns Array de componentes de íconos
 */
export function getModalityIcon(modality: ServiceModality) {
  // Esta función retorna un string que puede ser usado para determinar qué ícono mostrar
  switch (modality) {
    case 'presencial':
      return 'presencial';
    case 'online':
      return 'online';
    case 'both':
      return 'both';
    default:
      return 'presencial';
  }
}

/**
 * Interfaz para servicios de la base de datos
 */
interface DatabaseService {
  name: string;
  description?: string;
  modality: 'presencial' | 'online' | 'both';
  cost: number;
  address?: string;
}

/**
 * Transforma servicios de la base de datos a la estructura esperada
 * @param services Servicios de la base de datos
 * @returns Servicios transformados con modalidad
 */
export function transformServicesFromDB(services: DatabaseService[]): Service[] {
  if (!services || services.length === 0) {
    return [];
  }

  // Agrupar servicios por nombre para combinar modalidades
  const servicesMap = new Map<string, Service>();
  
  services.forEach(service => {
    const existing = servicesMap.get(service.name);
    
    if (existing) {
      // Si ya existe, actualizar costos según la modalidad
      if (service.modality === 'presencial') {
        existing.presencialCost = service.cost.toString();
      } else if (service.modality === 'online') {
        existing.onlineCost = service.cost.toString();
      } else if (service.modality === 'both') {
        existing.presencialCost = service.cost.toString();
        existing.onlineCost = service.cost.toString();
      }
    } else {
      // Crear nuevo servicio
      const newService: Service = {
        name: service.name,
        description: service.description || '',
        modality: service.modality
      };
      
      if (service.modality === 'presencial') {
        newService.presencialCost = service.cost.toString();
      } else if (service.modality === 'online') {
        newService.onlineCost = service.cost.toString();
      } else if (service.modality === 'both') {
        newService.presencialCost = service.cost.toString();
        newService.onlineCost = service.cost.toString();
      }
      
      servicesMap.set(service.name, newService);
    }
  });
  
  return Array.from(servicesMap.values());
}
