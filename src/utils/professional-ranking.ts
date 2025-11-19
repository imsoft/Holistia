/**
 * Algoritmo de ranking para profesionales
 * Combina múltiples factores para un ordenamiento justo y motivante
 */

export interface ProfessionalRankingData {
  admin_rating?: number; // 0-10 (calificación de administradores)
  average_rating?: number; // 1-5 (calificación promedio de pacientes)
  total_reviews?: number; // Número de reseñas
  completed_appointments?: number; // Citas completadas
  created_at: string; // Fecha de creación
  is_active?: boolean; // Si está activo
}

export interface ProfessionalRankingResult {
  score: number;
  breakdown: {
    adminRatingScore: number;
    patientRatingScore: number;
    reviewsScore: number;
    activityScore: number;
    newProfessionalBoost: number;
  };
}

/**
 * Calcula el score de ranking para un profesional
 * 
 * Factores considerados:
 * 1. Admin Rating (30%): Calificación de administradores (0-10) - calidad verificada
 * 2. Patient Rating (25%): Calificación promedio de pacientes (1-5) - satisfacción
 * 3. Reviews Count (20%): Número de reseñas - confianza social
 * 4. Activity (15%): Citas completadas - actividad en la plataforma
 * 5. New Professional Boost (10%): Boost para nuevos profesionales - motivación
 * 
 * @param data Datos del profesional
 * @returns Score y desglose de factores
 */
export function calculateProfessionalScore(
  data: ProfessionalRankingData
): ProfessionalRankingResult {
  // 1. Admin Rating Score (0-30 puntos)
  // Normalizar de 0-10 a 0-30
  const adminRatingScore = data.admin_rating
    ? (data.admin_rating / 10) * 30
    : 0;

  // 2. Patient Rating Score (0-25 puntos)
  // Normalizar de 1-5 a 0-25, con bonus por cantidad de reseñas
  let patientRatingScore = 0;
  if (data.average_rating && data.total_reviews) {
    // Base: rating normalizado (1-5 -> 0-20)
    const baseScore = ((data.average_rating - 1) / 4) * 20;
    
    // Bonus por cantidad de reseñas (hasta 5 puntos adicionales)
    // Más reseñas = más confiable
    const reviewsBonus = Math.min(data.total_reviews / 10, 5);
    
    patientRatingScore = baseScore + reviewsBonus;
  } else if (data.average_rating) {
    // Si tiene rating pero no reviews count, usar solo el rating
    patientRatingScore = ((data.average_rating - 1) / 4) * 20;
  }

  // 3. Reviews Count Score (0-20 puntos)
  // Más reseñas = más confianza social
  // Escala logarítmica: 0 reseñas = 0, 1-5 = 5, 6-10 = 10, 11-20 = 15, 21+ = 20
  let reviewsScore = 0;
  if (data.total_reviews) {
    if (data.total_reviews >= 21) {
      reviewsScore = 20;
    } else if (data.total_reviews >= 11) {
      reviewsScore = 15;
    } else if (data.total_reviews >= 6) {
      reviewsScore = 10;
    } else if (data.total_reviews >= 1) {
      reviewsScore = 5;
    }
  }

  // 4. Activity Score (0-15 puntos)
  // Basado en citas completadas
  // Escala: 0 citas = 0, 1-5 = 5, 6-15 = 10, 16+ = 15
  let activityScore = 0;
  if (data.completed_appointments) {
    if (data.completed_appointments >= 16) {
      activityScore = 15;
    } else if (data.completed_appointments >= 6) {
      activityScore = 10;
    } else if (data.completed_appointments >= 1) {
      activityScore = 5;
    }
  }

  // 5. New Professional Boost (0-10 puntos)
  // Boost para profesionales nuevos (últimos 30 días)
  // Motiva a nuevos profesionales a aparecer en los primeros resultados
  let newProfessionalBoost = 0;
  if (data.created_at) {
    const createdDate = new Date(data.created_at);
    const now = new Date();
    const daysSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation <= 30) {
      // Boost máximo para primeros 7 días, luego decrece
      if (daysSinceCreation <= 7) {
        newProfessionalBoost = 10;
      } else if (daysSinceCreation <= 14) {
        newProfessionalBoost = 7;
      } else if (daysSinceCreation <= 21) {
        newProfessionalBoost = 5;
      } else {
        newProfessionalBoost = 3;
      }
    }
  }

  // Penalización si está inactivo
  const isActiveMultiplier = data.is_active === false ? 0 : 1;

  // Score total (máximo 100 puntos)
  const totalScore =
    (adminRatingScore +
      patientRatingScore +
      reviewsScore +
      activityScore +
      newProfessionalBoost) *
    isActiveMultiplier;

  return {
    score: totalScore,
    breakdown: {
      adminRatingScore,
      patientRatingScore,
      reviewsScore,
      activityScore,
      newProfessionalBoost,
    },
  };
}

/**
 * Ordena profesionales por su score de ranking
 * 
 * @param professionals Array de profesionales con datos de ranking
 * @returns Array ordenado (mayor score primero)
 */
export function sortProfessionalsByRanking<T extends ProfessionalRankingData>(
  professionals: T[]
): T[] {
  return [...professionals].sort((a, b) => {
    const scoreA = calculateProfessionalScore(a).score;
    const scoreB = calculateProfessionalScore(b).score;

    // Ordenar por score descendente
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // En caso de empate, usar fecha de creación (más recientes primero)
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

