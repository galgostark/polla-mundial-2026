// Tipos y Modelos de Datos de Polla Mundial 2026

export type StageType = 'GROUPS' | 'ROUND_32' | 'ROUND_16' | 'QUARTERS' | 'SEMIS' | 'THIRD_PLACE' | 'FINAL';
export type MatchStatusType = 'SCHEDULED' | 'LIVE' | 'FINISHED';

export interface Polla {
  id: string;
  name: string;
  admin_pin: string;
  entry_fee: number;
  currency: string;
  payment_info?: string;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  flag_url?: string;
  group_letter: string;
}

export interface Match {
  id: number;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  stage: StageType;
  match_date: string;
  status: MatchStatusType;
  penalty_winner_id?: string | null;
  penalties_home?: number | null;
  penalties_away?: number | null;
  // Propiedades unidas en joins
  home_team?: Team;
  away_team?: Team;
}

export interface Participant {
  id: string;
  polla_id: string;
  name: string;
  email?: string;
  is_paid: boolean;
  total_points: number;
  exact_matches: number;
  correct_results: number;
  groups_match_points: number;
  r32_match_points: number;
  bracket_points: number;
  created_at: string;
}

export interface Prediction {
  id: string;
  participant_id: string;
  match_id: number;
  home_score: number;
  away_score: number;
  points_won: number | null; // null si no ha terminado
  penalty_winner_id?: string | null;
  created_at: string;
}

export interface BracketPrediction {
  id: string;
  participant_id: string;
  champion_team_id: string | null;
  runner_up_team_id: string | null;
  semifinalists: string[]; // Lista de 4 IDs de equipos
  quarterfinalists: string[]; // Lista de 8 IDs de equipos
  round_of_16: string[]; // Lista de 16 IDs de equipos
  round_of_32: string[]; // Lista de 32 IDs de equipos
  points_won: number;
  created_at: string;
}

// Interfaz para las estadísticas de "La Grada"
export interface FunStats {
  oraculoDelGol: { participantNames: string[]; count: number } | null; // Más plenos (marcador exacto)
  elPina: { participantNames: string[]; count: number } | null; // Más partidos errados por completo (mala suerte) 🍍
  nostradamus: { participantNames: string[]; count: number } | null; // Mayor cantidad de empates clavados
  reyDeLaFase: { participantNames: string[]; phase: string; points: number } | null; // Mejor puntaje en fase de grupos vs eliminación
  elAmarrete: { participantNames: string[]; count: number } | null; // Más partidos con marcadores defensivos (0-0, 1-0, 0-1)
  elOptimista: { participantNames: string[]; count: number } | null; // Mayor suma de goles pronosticados en total
  alineacionPlanetaria: Match[] | null; // Partidos donde todos sumaron puntos
  laEstafaColectiva: Match[] | null; // Partidos donde nadie sumó puntos
}
