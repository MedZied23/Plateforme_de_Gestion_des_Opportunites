export enum NiveauLangue {
  Debutant = 0,
  Intermediaire = 1,
  Avance = 2,
  Courant = 3,
  Natif = 4
}

// Helper function to normalize language level value
export function normalizeLanguageLevel(level: string | number): NiveauLangue {
  if (typeof level === 'number' && level in NiveauLangue) {
    return level;
  }
  
  // Convert to lowercase for case-insensitive comparison
  const normalizedLevel = String(level).toLowerCase();
  
  // Map from normalized form to enum value
  const mappings: {[key: string]: NiveauLangue} = {
    'debutant': NiveauLangue.Debutant,
    'débutant': NiveauLangue.Debutant,
    'intermediaire': NiveauLangue.Intermediaire,
    'intermédiaire': NiveauLangue.Intermediaire,
    'avance': NiveauLangue.Avance,
    'avancé': NiveauLangue.Avance,
    'courant': NiveauLangue.Courant,
    'natif': NiveauLangue.Natif
  };
  
  return mappings[normalizedLevel] ?? NiveauLangue.Intermediaire;
}