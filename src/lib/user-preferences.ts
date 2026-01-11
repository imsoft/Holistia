/**
 * Sistema de preferencias y tracking de intereses del usuario
 * 
 * Este módulo maneja el tracking de interacciones del usuario y genera
 * rankings personalizados basados en sus preferencias.
 */

import { getCookie, setTemporaryCookie, COOKIE_NAMES } from './cookies';

export type ContentType = 'professional' | 'event' | 'program' | 'restaurant' | 'shop' | 'holistic_center';
export type WellnessArea = 'Salud mental' | 'Espiritualidad' | 'Actividad física' | 'Social' | 'Alimentación';

export interface UserInteraction {
  contentType: ContentType;
  itemId: string;
  category?: string;
  wellnessAreas?: WellnessArea[];
  timestamp: number;
}

export interface UserPreferences {
  contentTypeScores: Record<ContentType, number>;
  categoryScores: Record<string, number>;
  wellnessAreaScores: Record<WellnessArea, number>;
  recentInteractions: UserInteraction[];
  lastUpdated: number;
}

const PREFERENCES_COOKIE_NAME = 'holistia_user_preferences';
const MAX_INTERACTIONS = 50; // Máximo de interacciones a guardar
const DECAY_FACTOR = 0.95; // Factor de decaimiento para interacciones antiguas
const MAX_AGE_DAYS = 30; // Días que se guardan las preferencias

/**
 * Obtiene las preferencias del usuario desde cookies
 */
export function getUserPreferences(): UserPreferences {
  const defaultPreferences: UserPreferences = {
    contentTypeScores: {
      professional: 0,
      event: 0,
      program: 0,
      restaurant: 0,
      shop: 0,
      holistic_center: 0,
    },
    categoryScores: {},
    wellnessAreaScores: {
      'Salud mental': 0,
      'Espiritualidad': 0,
      'Actividad física': 0,
      'Social': 0,
      'Alimentación': 0,
    },
    recentInteractions: [],
    lastUpdated: Date.now(),
  };

  if (typeof window === 'undefined') return defaultPreferences;

  try {
    const saved = getCookie(PREFERENCES_COOKIE_NAME);
    if (!saved) return defaultPreferences;

    const parsed = JSON.parse(saved) as UserPreferences;
    
    // Validar estructura
    if (!parsed.contentTypeScores || !parsed.recentInteractions) {
      return defaultPreferences;
    }

    // Limpiar interacciones muy antiguas (más de 30 días)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    parsed.recentInteractions = parsed.recentInteractions.filter(
      (interaction) => interaction.timestamp > thirtyDaysAgo
    );

    return parsed;
  } catch (error) {
    console.error('Error parsing user preferences:', error);
    return defaultPreferences;
  }
}

/**
 * Guarda las preferencias del usuario en cookies
 */
export function saveUserPreferences(preferences: UserPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    preferences.lastUpdated = Date.now();
    setTemporaryCookie(PREFERENCES_COOKIE_NAME, JSON.stringify(preferences), MAX_AGE_DAYS);
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
}

/**
 * Registra una interacción del usuario (click en una card)
 */
export function trackInteraction(
  contentType: ContentType,
  itemId: string,
  category?: string,
  wellnessAreas?: WellnessArea[]
): void {
  const preferences = getUserPreferences();

  // Agregar nueva interacción
  const newInteraction: UserInteraction = {
    contentType,
    itemId,
    category,
    wellnessAreas,
    timestamp: Date.now(),
  };

  preferences.recentInteractions.push(newInteraction);

  // Limitar número de interacciones
  if (preferences.recentInteractions.length > MAX_INTERACTIONS) {
    preferences.recentInteractions = preferences.recentInteractions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_INTERACTIONS);
  }

  // Actualizar scores con decaimiento temporal
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  // Aplicar decaimiento a scores existentes
  Object.keys(preferences.contentTypeScores).forEach((type) => {
    preferences.contentTypeScores[type as ContentType] *= DECAY_FACTOR;
  });

  Object.keys(preferences.categoryScores).forEach((cat) => {
    preferences.categoryScores[cat] *= DECAY_FACTOR;
  });

  Object.keys(preferences.wellnessAreaScores).forEach((area) => {
    preferences.wellnessAreaScores[area as WellnessArea] *= DECAY_FACTOR;
  });

  // Incrementar scores basados en la nueva interacción
  const baseScore = 1.0;
  preferences.contentTypeScores[contentType] = 
    (preferences.contentTypeScores[contentType] || 0) + baseScore;

  if (category) {
    preferences.categoryScores[category] = 
      (preferences.categoryScores[category] || 0) + baseScore;
  }

  if (wellnessAreas && wellnessAreas.length > 0) {
    wellnessAreas.forEach((area) => {
      preferences.wellnessAreaScores[area] = 
        (preferences.wellnessAreaScores[area] || 0) + (baseScore / wellnessAreas.length);
    });
  }

  // Calcular scores basados en interacciones recientes (últimas 7 días)
  const sevenDaysAgo = now - (7 * oneDay);
  const recentInteractions = preferences.recentInteractions.filter(
    (i) => i.timestamp > sevenDaysAgo
  );

  recentInteractions.forEach((interaction) => {
    const ageInDays = (now - interaction.timestamp) / oneDay;
    const recencyWeight = Math.max(0, 1 - ageInDays / 7); // Más peso a interacciones más recientes

    preferences.contentTypeScores[interaction.contentType] = 
      (preferences.contentTypeScores[interaction.contentType] || 0) + (0.5 * recencyWeight);

    if (interaction.category) {
      preferences.categoryScores[interaction.category] = 
        (preferences.categoryScores[interaction.category] || 0) + (0.5 * recencyWeight);
    }

    if (interaction.wellnessAreas && interaction.wellnessAreas.length > 0) {
      const areasLength = interaction.wellnessAreas.length;
      interaction.wellnessAreas.forEach((area) => {
        preferences.wellnessAreaScores[area] = 
          (preferences.wellnessAreaScores[area] || 0) + (0.3 * recencyWeight / areasLength);
      });
    }
  });

  saveUserPreferences(preferences);
}

/**
 * Calcula un score de relevancia para un item basado en las preferencias del usuario
 */
export function calculateRelevanceScore(
  contentType: ContentType,
  category?: string,
  wellnessAreas?: WellnessArea[]
): number {
  const preferences = getUserPreferences();
  let score = 0;

  // Score base del tipo de contenido
  score += preferences.contentTypeScores[contentType] || 0;

  // Score de categoría
  if (category) {
    score += preferences.categoryScores[category] || 0;
  }

  // Score de áreas de bienestar
  if (wellnessAreas && wellnessAreas.length > 0) {
    const areaScore = wellnessAreas.reduce((sum, area) => {
      return sum + (preferences.wellnessAreaScores[area] || 0);
    }, 0);
    score += areaScore / wellnessAreas.length; // Promedio de áreas
  }

  return score;
}

/**
 * Ordena un array de items basándose en las preferencias del usuario
 */
export function sortByUserPreferences<T extends {
  id: string;
  contentType: ContentType;
  category?: string;
  wellnessAreas?: WellnessArea[];
}>(
  items: T[]
): T[] {
  if (items.length === 0) return items;

  // Calcular scores para cada item
  const itemsWithScores = items.map((item) => ({
    item,
    score: calculateRelevanceScore(
      item.contentType,
      item.category,
      item.wellnessAreas
    ),
  }));

  // Ordenar por score descendente
  itemsWithScores.sort((a, b) => b.score - a.score);

  // Si hay items con score 0, mantener su orden original relativo
  // pero ponerlos después de los items con score > 0
  const withScore = itemsWithScores.filter((i) => i.score > 0);
  const withoutScore = itemsWithScores.filter((i) => i.score === 0);

  return [...withScore, ...withoutScore].map((i) => i.item);
}

/**
 * Obtiene las categorías más populares para el usuario
 */
export function getTopCategories(limit: number = 3): string[] {
  const preferences = getUserPreferences();
  
  return Object.entries(preferences.categoryScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([category]) => category);
}

/**
 * Obtiene los tipos de contenido más populares para el usuario
 */
export function getTopContentTypes(limit: number = 3): ContentType[] {
  const preferences = getUserPreferences();
  
  return Object.entries(preferences.contentTypeScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([type]) => type as ContentType);
}

/**
 * Limpia todas las preferencias del usuario
 */
export function clearUserPreferences(): void {
  if (typeof window === 'undefined') return;
  
  const defaultPreferences: UserPreferences = {
    contentTypeScores: {
      professional: 0,
      event: 0,
      program: 0,
      restaurant: 0,
      shop: 0,
      holistic_center: 0,
    },
    categoryScores: {},
    wellnessAreaScores: {
      'Salud mental': 0,
      'Espiritualidad': 0,
      'Actividad física': 0,
      'Social': 0,
      'Alimentación': 0,
    },
    recentInteractions: [],
    lastUpdated: Date.now(),
  };

  saveUserPreferences(defaultPreferences);
}
