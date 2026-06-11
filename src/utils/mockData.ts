import { Team, Match, Polla, Participant, Prediction, BracketPrediction, FunStats } from '../types';

// 1. Las 48 selecciones del Mundial de la FIFA 2026
export const mockTeams: Team[] = [
  // Grupo A
  { id: 'MEX', name: 'México', flag_url: 'https://flagcdn.com/w80/mx.png', group_letter: 'A' },
  { id: 'ZAF', name: 'Sudáfrica', flag_url: 'https://flagcdn.com/w80/za.png', group_letter: 'A' },
  { id: 'KOR', name: 'Corea del Sur', flag_url: 'https://flagcdn.com/w80/kr.png', group_letter: 'A' },
  { id: 'CZE', name: 'República Checa', flag_url: 'https://flagcdn.com/w80/cz.png', group_letter: 'A' },
  // Grupo B
  { id: 'CAN', name: 'Canadá', flag_url: 'https://flagcdn.com/w80/ca.png', group_letter: 'B' },
  { id: 'BIH', name: 'Bosnia y Herzegovina', flag_url: 'https://flagcdn.com/w80/ba.png', group_letter: 'B' },
  { id: 'QAT', name: 'Catar', flag_url: 'https://flagcdn.com/w80/qa.png', group_letter: 'B' },
  { id: 'SUI', name: 'Suiza', flag_url: 'https://flagcdn.com/w80/ch.png', group_letter: 'B' },
  // Grupo C
  { id: 'BRA', name: 'Brasil', flag_url: 'https://flagcdn.com/w80/br.png', group_letter: 'C' },
  { id: 'MAR', name: 'Marruecos', flag_url: 'https://flagcdn.com/w80/ma.png', group_letter: 'C' },
  { id: 'HAI', name: 'Haití', flag_url: 'https://flagcdn.com/w80/ht.png', group_letter: 'C' },
  { id: 'SCO', name: 'Escocia', flag_url: 'https://flagcdn.com/w80/gb-sct.png', group_letter: 'C' },
  // Grupo D
  { id: 'USA', name: 'Estados Unidos', flag_url: 'https://flagcdn.com/w80/us.png', group_letter: 'D' },
  { id: 'PAR', name: 'Paraguay', flag_url: 'https://flagcdn.com/w80/py.png', group_letter: 'D' },
  { id: 'AUS', name: 'Australia', flag_url: 'https://flagcdn.com/w80/au.png', group_letter: 'D' },
  { id: 'TUR', name: 'Turquía', flag_url: 'https://flagcdn.com/w80/tr.png', group_letter: 'D' },
  // Grupo E
  { id: 'GER', name: 'Alemania', flag_url: 'https://flagcdn.com/w80/de.png', group_letter: 'E' },
  { id: 'CUW', name: 'Curazao', flag_url: 'https://flagcdn.com/w80/cw.png', group_letter: 'E' },
  { id: 'CIV', name: 'Costa de Marfil', flag_url: 'https://flagcdn.com/w80/ci.png', group_letter: 'E' },
  { id: 'ECU', name: 'Ecuador', flag_url: 'https://flagcdn.com/w80/ec.png', group_letter: 'E' },
  // Grupo F
  { id: 'NED', name: 'Países Bajos', flag_url: 'https://flagcdn.com/w80/nl.png', group_letter: 'F' },
  { id: 'JPN', name: 'Japón', flag_url: 'https://flagcdn.com/w80/jp.png', group_letter: 'F' },
  { id: 'SWE', name: 'Suecia', flag_url: 'https://flagcdn.com/w80/se.png', group_letter: 'F' },
  { id: 'TUN', name: 'Túnez', flag_url: 'https://flagcdn.com/w80/tn.png', group_letter: 'F' },
  // Grupo G
  { id: 'BEL', name: 'Bélgica', flag_url: 'https://flagcdn.com/w80/be.png', group_letter: 'G' },
  { id: 'EGY', name: 'Egipto', flag_url: 'https://flagcdn.com/w80/eg.png', group_letter: 'G' },
  { id: 'IRN', name: 'Irán', flag_url: 'https://flagcdn.com/w80/ir.png', group_letter: 'G' },
  { id: 'NZL', name: 'Nueva Zelanda', flag_url: 'https://flagcdn.com/w80/nz.png', group_letter: 'G' },
  // Grupo H
  { id: 'ESP', name: 'España', flag_url: 'https://flagcdn.com/w80/es.png', group_letter: 'H' },
  { id: 'CPV', name: 'Cabo Verde', flag_url: 'https://flagcdn.com/w80/cv.png', group_letter: 'H' },
  { id: 'KSA', name: 'Arabia Saudita', flag_url: 'https://flagcdn.com/w80/sa.png', group_letter: 'H' },
  { id: 'URU', name: 'Uruguay', flag_url: 'https://flagcdn.com/w80/uy.png', group_letter: 'H' },
  // Grupo I
  { id: 'FRA', name: 'Francia', flag_url: 'https://flagcdn.com/w80/fr.png', group_letter: 'I' },
  { id: 'SEN', name: 'Senegal', flag_url: 'https://flagcdn.com/w80/sn.png', group_letter: 'I' },
  { id: 'IRQ', name: 'Irak', flag_url: 'https://flagcdn.com/w80/iq.png', group_letter: 'I' },
  { id: 'NOR', name: 'Noruega', flag_url: 'https://flagcdn.com/w80/no.png', group_letter: 'I' },
  // Grupo J
  { id: 'ARG', name: 'Argentina', flag_url: 'https://flagcdn.com/w80/ar.png', group_letter: 'J' },
  { id: 'DZA', name: 'Argelia', flag_url: 'https://flagcdn.com/w80/dz.png', group_letter: 'J' },
  { id: 'AUT', name: 'Austria', flag_url: 'https://flagcdn.com/w80/at.png', group_letter: 'J' },
  { id: 'JOR', name: 'Jordania', flag_url: 'https://flagcdn.com/w80/jo.png', group_letter: 'J' },
  // Grupo K
  { id: 'POR', name: 'Portugal', flag_url: 'https://flagcdn.com/w80/pt.png', group_letter: 'K' },
  { id: 'COD', name: 'República Democrática del Congo', flag_url: 'https://flagcdn.com/w80/cd.png', group_letter: 'K' },
  { id: 'UZB', name: 'Uzbekistán', flag_url: 'https://flagcdn.com/w80/uz.png', group_letter: 'K' },
  { id: 'COL', name: 'Colombia', flag_url: 'https://flagcdn.com/w80/co.png', group_letter: 'K' },
  // Grupo L
  { id: 'ENG', name: 'Inglaterra', flag_url: 'https://flagcdn.com/w80/gb-eng.png', group_letter: 'L' },
  { id: 'CRO', name: 'Croacia', flag_url: 'https://flagcdn.com/w80/hr.png', group_letter: 'L' },
  { id: 'GHA', name: 'Ghana', flag_url: 'https://flagcdn.com/w80/gh.png', group_letter: 'L' },
  { id: 'PAN', name: 'Panamá', flag_url: 'https://flagcdn.com/w80/pa.png', group_letter: 'L' },
];

// 2. Generador de Partidos (104 partidos)
export const generateMockMatches = (): Match[] => {
  const matches: Match[] = [];
  let mId = 1;
  const startDate = new Date('2026-06-11T17:00:00-05:00'); // Hora de México
  
  // A. FASE DE GRUPOS (72 partidos, 6 partidos por grupo A-L)
  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  
  for (const grp of groups) {
    const grpTeams = mockTeams.filter(t => t.group_letter === grp).sort((a, b) => {
      const getOrder = (id: string) => {
        if (['MEX', 'CAN', 'BRA', 'USA', 'GER', 'NED', 'BEL', 'ESP', 'FRA', 'ARG', 'POR', 'ENG'].includes(id)) return 1;
        if (['ZAF', 'BIH', 'MAR', 'PAR', 'CUW', 'JPN', 'EGY', 'CPV', 'SEN', 'DZA', 'COD', 'CRO'].includes(id)) return 2;
        if (['KOR', 'QAT', 'HAI', 'AUS', 'CIV', 'SWE', 'IRN', 'KSA', 'IRQ', 'AUT', 'UZB', 'GHA'].includes(id)) return 3;
        return 4;
      };
      return getOrder(a.id) - getOrder(b.id);
    });
    
    // Distribución del fixture en la fase de grupos (6 fechas internas)
    const dates = [
      new Date(startDate.getTime() + (mId - 1) * 8 * 60 * 60 * 1000),
      new Date(startDate.getTime() + mId * 8 * 60 * 60 * 1000),
      new Date(startDate.getTime() + (mId + 1) * 8 * 60 * 60 * 1000),
      new Date(startDate.getTime() + (mId + 2) * 8 * 60 * 60 * 1000),
      new Date(startDate.getTime() + (mId + 3) * 8 * 60 * 60 * 1000),
      new Date(startDate.getTime() + (mId + 4) * 8 * 60 * 60 * 1000),
    ];
    
    // Emparejamientos estándar de grupo (1vs2, 3vs4, 1vs3, 2vs4, 4vs1, 2vs3)
    const order = [
      [0, 1], [2, 3], [0, 2], [1, 3], [3, 0], [1, 2]
    ];
    
    for (let k = 0; k < 6; k++) {
      const homeT = grpTeams[order[k][0]];
      const awayT = grpTeams[order[k][1]];
      
      matches.push({
        id: mId,
        home_team_id: homeT.id,
        away_team_id: awayT.id,
        home_score: null,
        away_score: null,
        stage: 'GROUPS',
        match_date: dates[k].toISOString(),
        status: 'SCHEDULED',
        home_team: homeT,
        away_team: awayT,
      });
      mId++;
    }
  }
  
  // B. RONDA DE 32 (16 partidos, del ID 73 al 88)
  let playoffDate = new Date('2026-06-28T12:00:00-05:00');
  for (let i = 73; i <= 88; i++) {
    matches.push({
      id: i,
      home_team_id: null,
      away_team_id: null,
      home_score: null,
      away_score: null,
      stage: 'ROUND_32',
      match_date: playoffDate.toISOString(),
      status: 'SCHEDULED',
    });
    playoffDate = new Date(playoffDate.getTime() + 6 * 60 * 60 * 1000);
  }
  
  // C. OCTAVOS DE FINAL (8 partidos, del ID 89 al 96)
  playoffDate = new Date('2026-07-04T12:00:00-05:00');
  for (let i = 89; i <= 96; i++) {
    matches.push({
      id: i,
      home_team_id: null,
      away_team_id: null,
      home_score: null,
      away_score: null,
      stage: 'ROUND_16',
      match_date: playoffDate.toISOString(),
      status: 'SCHEDULED',
    });
    playoffDate = new Date(playoffDate.getTime() + 8 * 60 * 60 * 1000);
  }
  
  // D. CUARTOS DE FINAL (4 partidos, del ID 97 al 100)
  playoffDate = new Date('2026-07-09T13:00:00-05:00');
  for (let i = 97; i <= 100; i++) {
    matches.push({
      id: i,
      home_team_id: null,
      away_team_id: null,
      home_score: null,
      away_score: null,
      stage: 'QUARTERS',
      match_date: playoffDate.toISOString(),
      status: 'SCHEDULED',
    });
    playoffDate = new Date(playoffDate.getTime() + 12 * 60 * 60 * 1000);
  }
  
  // E. SEMIFINALES (2 partidos, IDs 101 y 102)
  matches.push({
    id: 101,
    home_team_id: null,
    away_team_id: null,
    home_score: null,
    away_score: null,
    stage: 'SEMIS',
    match_date: new Date('2026-07-14T15:00:00-05:00').toISOString(),
    status: 'SCHEDULED',
  });
  matches.push({
    id: 102,
    home_team_id: null,
    away_team_id: null,
    home_score: null,
    away_score: null,
    stage: 'SEMIS',
    match_date: new Date('2026-07-15T15:00:00-05:00').toISOString(),
    status: 'SCHEDULED',
  });
  
  // F. TERCER PUESTO (ID 103)
  matches.push({
    id: 103,
    home_team_id: null,
    away_team_id: null,
    home_score: null,
    away_score: null,
    stage: 'THIRD_PLACE',
    match_date: new Date('2026-07-18T15:00:00-05:00').toISOString(),
    status: 'SCHEDULED',
  });
  
  // G. GRAN FINAL (ID 104)
  matches.push({
    id: 104,
    home_team_id: null,
    away_team_id: null,
    home_score: null,
    away_score: null,
    stage: 'FINAL',
    match_date: new Date('2026-07-19T15:00:00-05:00').toISOString(),
    status: 'SCHEDULED',
  });
  
  return matches;
};

// 3. Estructura de Simulación de Base de Datos Local (localStorage helper)
export const getLocalDb = () => {
  if (typeof window === 'undefined') return { pollas: [], participants: [], predictions: [], bracketPredictions: [], matches: [] };
  
  const pollas = JSON.parse(localStorage.getItem('m26_pollas') || '[]');
  const participants = JSON.parse(localStorage.getItem('m26_participants') || '[]');
  const predictions = JSON.parse(localStorage.getItem('m26_predictions') || '[]');
  const bracketPredictions = JSON.parse(localStorage.getItem('m26_brackets') || '[]');
  
  // Cargar partidos, si no existen en localStorage se generan por primera vez
  let matches = JSON.parse(localStorage.getItem('m26_matches') || '[]');
  if (matches.length === 0) {
    matches = generateMockMatches();
    localStorage.setItem('m26_matches', JSON.stringify(matches));
  }
  
  return { pollas, participants, predictions, bracketPredictions, matches };
};

export const saveLocalDb = (data: {
  pollas?: Polla[];
  participants?: Participant[];
  predictions?: Prediction[];
  bracketPredictions?: BracketPrediction[];
  matches?: Match[];
}) => {
  if (typeof window === 'undefined') return;
  if (data.pollas) localStorage.setItem('m26_pollas', JSON.stringify(data.pollas));
  if (data.participants) localStorage.setItem('m26_participants', JSON.stringify(data.participants));
  if (data.predictions) localStorage.setItem('m26_predictions', JSON.stringify(data.predictions));
  if (data.bracketPredictions) localStorage.setItem('m26_brackets', JSON.stringify(data.bracketPredictions));
  if (data.matches) localStorage.setItem('m26_matches', JSON.stringify(data.matches));
};
