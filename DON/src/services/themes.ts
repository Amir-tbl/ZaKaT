export interface ThemeCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  subcategories: string[];
}

export const THEMES: ThemeCategory[] = [
  {
    id: 'sante',
    label: 'Sante',
    icon: 'hospital-box',
    color: '#EF4444',
    subcategories: ['Hopitaux', 'Medicaments', 'Chirurgie', 'Handicap', 'Sante mentale'],
  },
  {
    id: 'education',
    label: 'Education',
    icon: 'school',
    color: '#3B82F6',
    subcategories: ['Ecoles', 'Orphelinats', 'Bourses', 'Fournitures', 'Formation'],
  },
  {
    id: 'environnement',
    label: 'Environnement',
    icon: 'leaf',
    color: '#22C55E',
    subcategories: ['Arbres', 'Eau potable', 'Puits', 'Agriculture durable', 'Energie'],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    icon: 'home-city',
    color: '#8B5CF6',
    subcategories: ['Construction', 'Routes', 'Electricite', 'Centres communautaires'],
  },
  {
    id: 'urgences',
    label: 'Urgences & Crises',
    icon: 'alert-circle',
    color: '#F59E0B',
    subcategories: ['Conflits', 'Catastrophes naturelles', 'Refugies', 'Famine'],
  },
  {
    id: 'solidarite',
    label: 'Solidarite',
    icon: 'handshake',
    color: '#0EA5A4',
    subcategories: ['Pauvrete', 'Femmes', 'Sans-abri', 'Migrants', 'Personnes agees'],
  },
];

export const ALL_THEME_IDS = THEMES.map(t => t.id);

export function getThemeById(id: string): ThemeCategory | undefined {
  return THEMES.find(t => t.id === id);
}
