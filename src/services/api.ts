import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Polla, Team, Match, Participant, Prediction, BracketPrediction, FunStats } from '../types';
import { getLocalDb, saveLocalDb, mockTeams } from '../utils/mockData';

// Helper para generar UUIDs en LocalStorage
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Algoritmo en TypeScript de cálculo de puntos para el motor local (idéntico al trigger SQL)
const recalculateLocalPoints = (matchId: number, homeScore: number, awayScore: number, status: string) => {
  if (status !== 'FINISHED') return;
  const db = getLocalDb();
  
  // 1. Puntuar predicciones individuales
  const updatedPredictions = db.predictions.map((pred: Prediction) => {
    if (pred.match_id !== matchId) return pred;
    
    let points = 0;
    const realDiff = homeScore - awayScore;
    const predDiff = pred.home_score - pred.away_score;
    
    // Acierto de resultado simple (Ganador o Empate)
    if (
      (realDiff > 0 && predDiff > 0) || 
      (realDiff < 0 && predDiff < 0) || 
      (realDiff === 0 && predDiff === 0)
    ) {
      points = 3;
      
      // Acierto de marcador exacto (Pleno)
      if (pred.home_score === homeScore && pred.away_score === awayScore) {
        points = 4;
      }
    }
    
    return { ...pred, points_won: points };
  });
  
  // 2. Guardar predicciones actualizadas
  db.predictions = updatedPredictions;
  saveLocalDb({ predictions: updatedPredictions });
  
  // 3. Recalcular rankings de los participantes
  const updatedParticipants = db.participants.map((part: Participant) => {
    // Filtrar predicciones de este participante
    const userPreds = db.predictions.filter((pr: Prediction) => pr.participant_id === part.id);
    const matchPoints = userPreds.reduce((sum: number, pr: Prediction) => sum + (pr.points_won || 0), 0);
    
    // Puntos de Brackets
    const bracket = db.bracketPredictions.find((b: BracketPrediction) => b.participant_id === part.id);
    const bracketPoints = bracket ? bracket.points_won : 0;
    
    const exactCount = userPreds.filter((pr: Prediction) => pr.points_won === 4).length;
    const simpleCount = userPreds.filter((pr: Prediction) => pr.points_won === 3).length;
    
    const groupsMatchPoints = userPreds
      .filter((pr: Prediction) => {
        const m = db.matches.find((match: Match) => match.id === pr.match_id);
        return m?.stage === 'GROUPS';
      })
      .reduce((sum: number, pr: Prediction) => sum + (pr.points_won || 0), 0);

    const r32MatchPoints = userPreds
      .filter((pr: Prediction) => {
        const m = db.matches.find((match: Match) => match.id === pr.match_id);
        return m?.stage === 'ROUND_32';
      })
      .reduce((sum: number, pr: Prediction) => sum + (pr.points_won || 0), 0);

    return {
      ...part,
      total_points: matchPoints + bracketPoints,
      exact_matches: exactCount,
      correct_results: simpleCount,
      groups_match_points: groupsMatchPoints,
      r32_match_points: r32MatchPoints,
      bracket_points: bracketPoints
    };
  });
  
  db.participants = updatedParticipants;
  saveLocalDb({ participants: updatedParticipants });
};

// Algoritmo local para recalcular puntos de Brackets
const recalculateLocalBrackets = (pollaId: string) => {
  const db = getLocalDb();
  
  // Recopilar datos oficiales del fixture local
  const finalMatch = db.matches.find((m: Match) => m.id === 104);
  const champTeamId = finalMatch?.status === 'FINISHED' 
    ? (finalMatch.home_score! > finalMatch.away_score! ? finalMatch.home_team_id : finalMatch.away_team_id)
    : null;
  const runnerTeamId = finalMatch?.status === 'FINISHED'
    ? (finalMatch.home_score! > finalMatch.away_score! ? finalMatch.away_team_id : finalMatch.home_team_id)
    : null;

  const r32Teams = Array.from(new Set(db.matches.filter((m: Match) => m.stage === 'ROUND_32').flatMap((m: Match) => [m.home_team_id, m.away_team_id]).filter(Boolean)));
  const r16Teams = Array.from(new Set(db.matches.filter((m: Match) => m.stage === 'ROUND_16').flatMap((m: Match) => [m.home_team_id, m.away_team_id]).filter(Boolean)));
  const quartersTeams = Array.from(new Set(db.matches.filter((m: Match) => m.stage === 'QUARTERS').flatMap((m: Match) => [m.home_team_id, m.away_team_id]).filter(Boolean)));
  const semisTeams = Array.from(new Set(db.matches.filter((m: Match) => m.stage === 'SEMIS').flatMap((m: Match) => [m.home_team_id, m.away_team_id]).filter(Boolean)));

  const updatedBrackets = db.bracketPredictions.map((bp: BracketPrediction) => {
    // Validar si el participante pertenece a esta polla
    const part = db.participants.find((p: Participant) => p.id === bp.participant_id && p.polla_id === pollaId);
    if (!part) return bp;
    
    let pts = 0;

    // Dieciseisavos (R32): 1 pt por equipo acertado
    if (bp.round_of_32 && r32Teams.length > 0) {
      bp.round_of_32.forEach((t: string) => {
        if (r32Teams.includes(t)) pts += 1;
      });
    }
    
    // Octavos (R16): 2 pts por equipo acertado
    if (bp.round_of_16 && r16Teams.length > 0) {
      bp.round_of_16.forEach((t: string) => {
        if (r16Teams.includes(t)) pts += 2;
      });
    }
    
    // Cuartos: 3 pts por equipo
    if (bp.quarterfinalists && quartersTeams.length > 0) {
      bp.quarterfinalists.forEach((t: string) => {
        if (quartersTeams.includes(t)) pts += 3;
      });
    }
    
    // Semifinales: 4 pts por equipo
    if (bp.semifinalists && semisTeams.length > 0) {
      bp.semifinalists.forEach((t: string) => {
        if (semisTeams.includes(t)) pts += 4;
      });
    }
    
    // Subcampeón: 5 pts
    if (bp.runner_up_team_id && runnerTeamId && bp.runner_up_team_id === runnerTeamId) {
      pts += 5;
    }
    
    // Campeón: 10 pts
    if (bp.champion_team_id && champTeamId && bp.champion_team_id === champTeamId) {
      pts += 10;
    }
    
    return { ...bp, points_won: pts };
  });
  
  db.bracketPredictions = updatedBrackets;
  saveLocalDb({ bracketPredictions: updatedBrackets });
  
  // Recargar en cascada los puntos totales en los participantes
  const updatedParticipants = db.participants.map((part: Participant) => {
    if (part.polla_id !== pollaId) return part;
    
    const userPreds = db.predictions.filter((pr: Prediction) => pr.participant_id === part.id);
    const matchPoints = userPreds.reduce((sum: number, pr: Prediction) => sum + (pr.points_won || 0), 0);
    const bracket = db.bracketPredictions.find((b: BracketPrediction) => b.participant_id === part.id);
    const bracketPoints = bracket ? bracket.points_won : 0;
    
    const groupsMatchPoints = userPreds
      .filter((pr: Prediction) => {
        const m = db.matches.find((match: Match) => match.id === pr.match_id);
        return m?.stage === 'GROUPS';
      })
      .reduce((sum: number, pr: Prediction) => sum + (pr.points_won || 0), 0);

    const r32MatchPoints = userPreds
      .filter((pr: Prediction) => {
        const m = db.matches.find((match: Match) => match.id === pr.match_id);
        return m?.stage === 'ROUND_32';
      })
      .reduce((sum: number, pr: Prediction) => sum + (pr.points_won || 0), 0);

    return {
      ...part,
      total_points: matchPoints + bracketPoints,
      groups_match_points: groupsMatchPoints,
      r32_match_points: r32MatchPoints,
      bracket_points: bracketPoints
    };
  });
  
  db.participants = updatedParticipants;
  saveLocalDb({ participants: updatedParticipants });
};

// Algoritmo para derivar el cuadro (brackets) a partir de los pronósticos de marcadores
export const calculateDerivedBracket = (
  allPreds: Prediction[],
  matches: Match[],
  teams: Team[]
): Partial<BracketPrediction> => {
  // 1. Obtener predicciones de fase de grupos
  const groupMatches = matches.filter(m => m.stage === 'GROUPS');
  
  // Agrupar equipos por su letra de grupo
  const groups: Record<string, Team[]> = {};
  teams.forEach(t => {
    if (!groups[t.group_letter]) groups[t.group_letter] = [];
    groups[t.group_letter].push(t);
  });
  
  const groupStandings: Record<string, { teamId: string; pts: number; gd: number; gs: number }[]> = {};
  
  Object.keys(groups).forEach(letter => {
    const groupTeams = groups[letter];
    const groupMatchIds = groupMatches
      .filter(m => m.home_team_id && groupTeams.some(gt => gt.id === m.home_team_id))
      .map(m => m.id);
      
    // Inicializar standings para este grupo
    const standings = groupTeams.map(t => ({
      teamId: t.id,
      pts: 0,
      gd: 0,
      gs: 0
    }));
    
    // Procesar predicciones de este participante para este grupo
    allPreds.forEach(pred => {
      if (groupMatchIds.includes(pred.match_id)) {
        const match = groupMatches.find(m => m.id === pred.match_id);
        if (!match) return;
        
        const homeId = match.home_team_id!;
        const awayId = match.away_team_id!;
        
        const homeS = pred.home_score;
        const awayS = pred.away_score;
        
        const homeRow = standings.find(r => r.teamId === homeId);
        const awayRow = standings.find(r => r.teamId === awayId);
        
        if (homeRow && awayRow) {
          homeRow.gs += homeS;
          awayRow.gs += awayS;
          homeRow.gd += (homeS - awayS);
          awayRow.gd += (awayS - homeS);
          
          if (homeS > awayS) {
            homeRow.pts += 3;
          } else if (homeS < awayS) {
            awayRow.pts += 3;
          } else {
            homeRow.pts += 1;
            awayRow.pts += 1;
          }
        }
      }
    });
    
    // Ordenar standings
    standings.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gs !== a.gs) return b.gs - a.gs;
      return a.teamId.localeCompare(b.teamId);
    });
    
    groupStandings[letter] = standings;
  });
  
  // 2. Clasificados a dieciseisavos (Round of 32)
  const firsts: string[] = [];
  const seconds: string[] = [];
  const thirds: { teamId: string; pts: number; gd: number; gs: number }[] = [];
  
  Object.keys(groupStandings).forEach(letter => {
    const standings = groupStandings[letter];
    if (standings.length >= 1) firsts.push(standings[0].teamId);
    if (standings.length >= 2) seconds.push(standings[1].teamId);
    if (standings.length >= 3) thirds.push(standings[2]);
  });
  
  // Ordenar los terceros lugares
  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gs !== a.gs) return b.gs - a.gs;
    return a.teamId.localeCompare(b.teamId);
  });
  
  const bestThirds = thirds.slice(0, 8).map(t => t.teamId);
  const roundOf32 = [...firsts, ...seconds, ...bestThirds];
  
  // 3. Resolver ganadores de playoffs
  
  // Helper para resolver ganador de un partido por su ID
  const getPredictedWinner = (matchId: number): string | null => {
    const match = matches.find(m => m.id === matchId);
    if (!match || !match.home_team_id || !match.away_team_id) return null;
    
    const pred = allPreds.find(p => p.match_id === matchId);
    if (!pred) return null;
    
    if (pred.home_score > pred.away_score) {
      return match.home_team_id;
    } else if (pred.home_score < pred.away_score) {
      return match.away_team_id;
    } else {
      // Si hay empate, usamos el ganador de penales predicho o el local por defecto
      return pred.penalty_winner_id || match.home_team_id;
    }
  };
  
  // Ronda de 16: ganadores de los partidos 73 al 88
  const roundOf16: string[] = [];
  for (let id = 73; id <= 88; id++) {
    const winner = getPredictedWinner(id);
    if (winner) roundOf16.push(winner);
  }
  
  // Cuartos: ganadores de los partidos 89 al 96
  const quarterfinalists: string[] = [];
  for (let id = 89; id <= 96; id++) {
    const winner = getPredictedWinner(id);
    if (winner) quarterfinalists.push(winner);
  }
  
  // Semis: ganadores de los partidos 97 al 100
  const semifinalists: string[] = [];
  for (let id = 97; id <= 100; id++) {
    const winner = getPredictedWinner(id);
    if (winner) semifinalists.push(winner);
  }
  
  // Campeón y Subcampeón: del partido 104 (Final)
  let champion_team_id: string | null = null;
  let runner_up_team_id: string | null = null;
  
  const finalMatch = matches.find(m => m.id === 104);
  if (finalMatch && finalMatch.home_team_id && finalMatch.away_team_id) {
    const finalPred = allPreds.find(p => p.match_id === 104);
    if (finalPred) {
      if (finalPred.home_score >= finalPred.away_score) {
        champion_team_id = finalMatch.home_team_id;
        runner_up_team_id = finalMatch.away_team_id;
      } else {
        champion_team_id = finalMatch.away_team_id;
        runner_up_team_id = finalMatch.home_team_id;
      }
    }
  }
  
  return {
    round_of_32: roundOf32,
    round_of_16: roundOf16,
    quarterfinalists: quarterfinalists,
    semifinalists: semifinalists,
    champion_team_id,
    runner_up_team_id
  };
};

// Recalcular y guardar el bracket derivado del participante
export const recalculateParticipantDerivedBracket = async (participantId: string, pollaId: string): Promise<void> => {
  // 1. Obtener todas las predicciones del participante
  const preds = await PredictionsService.getPredictions(participantId);
  // 2. Obtener fixture completo y equipos
  const matches = await MatchesService.getMatches();
  const teams = await MatchesService.getTeams();
  
  // 3. Calcular bracket derivado
  const derived = calculateDerivedBracket(preds, matches, teams);
  
  // 4. Guardar bracket derivado
  await PredictionsService.saveBracketPrediction(participantId, derived);
  
  // 5. Recalcular puntos
  if (isSupabaseConfigured()) {
    const { error } = await supabase.rpc('recalculate_bracket_predictions_points', { polla_uuid: pollaId });
    if (error) {
      console.error('Error recalculando puntos en Supabase:', error);
    }
  } else {
    recalculateLocalBrackets(pollaId);
  }
};

// ============================================
// SERVICIOS UNIFICADOS DE LA APLICACIÓN
// ============================================

export const PollaService = {
  // 1. Crear Polla
  createPolla: async (name: string, entryFee: number, currency: string, adminPin: string, paymentInfo?: string): Promise<Polla> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('pollas')
        .insert([{ name, entry_fee: entryFee, currency, admin_pin: adminPin, payment_info: paymentInfo }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const db = getLocalDb();
      const newPolla: Polla = {
        id: generateUUID(),
        name,
        entry_fee: entryFee,
        currency,
        admin_pin: adminPin,
        payment_info: paymentInfo,
        created_at: new Date().toISOString(),
      };
      db.pollas.push(newPolla);
      saveLocalDb({ pollas: db.pollas });
      return newPolla;
    }
  },

  // 2. Obtener Polla
  getPolla: async (id: string): Promise<Polla> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('pollas').select().eq('id', id).single();
      if (error) throw error;
      return data;
    } else {
      const db = getLocalDb();
      const polla = db.pollas.find((p: Polla) => p.id === id);
      if (!polla) throw new Error('Polla no encontrada');
      return polla;
    }
  },

  // 3. Unirse a una Polla
  joinPolla: async (pollaId: string, name: string, email?: string): Promise<Participant> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('participants')
        .insert([{ polla_id: pollaId, name, email }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const db = getLocalDb();
      const newPart: Participant = {
        id: generateUUID(),
        polla_id: pollaId,
        name,
        email,
        is_paid: false,
        total_points: 0,
        exact_matches: 0,
        correct_results: 0,
        groups_match_points: 0,
        r32_match_points: 0,
        bracket_points: 0,
        created_at: new Date().toISOString(),
      };
      db.participants.push(newPart);
      saveLocalDb({ participants: db.participants });
      return newPart;
    }
  },

  // 4. Obtener participantes de una Polla (Ranking)
  getParticipants: async (pollaId: string): Promise<Participant[]> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('participants')
        .select()
        .eq('polla_id', pollaId)
        .order('total_points', { ascending: false })
        .order('exact_matches', { ascending: false })
        .order('correct_results', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      const db = getLocalDb();
      return db.participants
        .filter((p: Participant) => p.polla_id === pollaId)
        .sort((a: Participant, b: Participant) => {
          if (b.total_points !== a.total_points) return b.total_points - a.total_points;
          if (b.exact_matches !== a.exact_matches) return b.exact_matches - a.exact_matches;
          return b.correct_results - a.correct_results;
        });
    }
  },

  // 5. Confirmar pago de un participante
  confirmPayment: async (participantId: string, isPaid: boolean): Promise<void> => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('participants').update({ is_paid: isPaid }).eq('id', participantId);
      if (error) throw error;
    } else {
      const db = getLocalDb();
      const updated = db.participants.map((p: Participant) => p.id === participantId ? { ...p, is_paid: isPaid } : p);
      saveLocalDb({ participants: updated });
    }
  },
  
  // 6. Eliminar participante (sólo local/admin)
  removeParticipant: async (participantId: string): Promise<void> => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('participants').delete().eq('id', participantId);
      if (error) throw error;
    } else {
      const db = getLocalDb();
      const updated = db.participants.filter((p: Participant) => p.id !== participantId);
      saveLocalDb({ participants: updated });
    }
  }
};

export const PredictionsService = {
  // 1. Obtener predicciones de un participante
  getPredictions: async (participantId: string): Promise<Prediction[]> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('predictions').select().eq('participant_id', participantId);
      if (error) throw error;
      return data;
    } else {
      const db = getLocalDb();
      return db.predictions.filter((p: Prediction) => p.participant_id === participantId);
    }
  },

  // 2. Guardar cartilla de predicciones
  savePredictions: async (participantId: string, list: { match_id: number; home_score: number; away_score: number; penalty_winner_id?: string | null }[]): Promise<void> => {
    let pollaId = '';
    if (isSupabaseConfigured()) {
      const rows = list.map((item) => ({
        participant_id: participantId,
        match_id: item.match_id,
        home_score: item.home_score,
        away_score: item.away_score,
        penalty_winner_id: item.penalty_winner_id || null
      }));
      // UPSERT en Supabase
      const { error } = await supabase.from('predictions').upsert(rows, { onConflict: 'participant_id,match_id' });
      if (error) throw error;
      
      const { data } = await supabase.from('participants').select('polla_id').eq('id', participantId).single();
      if (data) pollaId = data.polla_id;
    } else {
      const db = getLocalDb();
      
      // Filtrar predicciones antiguas
      let filtered = db.predictions.filter((p: Prediction) => p.participant_id !== participantId);
      
      const newPreds: Prediction[] = list.map((item) => ({
        id: generateUUID(),
        participant_id: participantId,
        match_id: item.match_id,
        home_score: item.home_score,
        away_score: item.away_score,
        points_won: null,
        penalty_winner_id: item.penalty_winner_id || null,
        created_at: new Date().toISOString()
      }));
      
      db.predictions = [...filtered, ...newPreds];
      saveLocalDb({ predictions: db.predictions });
      
      // Si hay partidos que ya terminaron (para pruebas o carga tardía), puntuarlos
      db.matches.forEach((m: Match) => {
        if (m.status === 'FINISHED') {
          recalculateLocalPoints(m.id, m.home_score!, m.away_score!, 'FINISHED');
        }
      });
      
      const part = db.participants.find((p: Participant) => p.id === participantId);
      if (part) pollaId = part.polla_id;
    }
    
    if (pollaId) {
      await recalculateParticipantDerivedBracket(participantId, pollaId);
    }
  },
  // 3. Obtener predicción del Bracket
  getBracketPrediction: async (participantId: string): Promise<BracketPrediction | null> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('bracket_predictions').select().eq('participant_id', participantId).maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const db = getLocalDb();
      return db.bracketPredictions.find((b: BracketPrediction) => b.participant_id === participantId) || null;
    }
  },

  // 4. Guardar predicción de Brackets
  saveBracketPrediction: async (participantId: string, data: Partial<BracketPrediction>): Promise<void> => {
    if (isSupabaseConfigured()) {
      const payload = {
        participant_id: participantId,
        champion_team_id: data.champion_team_id,
        runner_up_team_id: data.runner_up_team_id,
        semifinalists: data.semifinalists || [],
        quarterfinalists: data.quarterfinalists || [],
        round_of_16: data.round_of_16 || [],
        round_of_32: data.round_of_32 || [],
      };
      const { error } = await supabase.from('bracket_predictions').upsert(payload, { onConflict: 'participant_id' });
      if (error) throw error;
    } else {
      const db = getLocalDb();
      let existIdx = db.bracketPredictions.findIndex((b: BracketPrediction) => b.participant_id === participantId);
      
      const newBp: BracketPrediction = {
        id: existIdx >= 0 ? db.bracketPredictions[existIdx].id : generateUUID(),
        participant_id: participantId,
        champion_team_id: data.champion_team_id || null,
        runner_up_team_id: data.runner_up_team_id || null,
        semifinalists: data.semifinalists || [],
        quarterfinalists: data.quarterfinalists || [],
        round_of_16: data.round_of_16 || [],
        round_of_32: data.round_of_32 || [],
        points_won: existIdx >= 0 ? db.bracketPredictions[existIdx].points_won : 0,
        created_at: existIdx >= 0 ? db.bracketPredictions[existIdx].created_at : new Date().toISOString()
      };

      if (existIdx >= 0) {
        db.bracketPredictions[existIdx] = newBp;
      } else {
        db.bracketPredictions.push(newBp);
      }
      
      saveLocalDb({ bracketPredictions: db.bracketPredictions });
      
      // Recalcular puntos
      const part = db.participants.find((p: Participant) => p.id === participantId);
      if (part) recalculateLocalBrackets(part.polla_id);
    }
  }
};

export const MatchesService = {
  // 1. Obtener todos los partidos y selecciones (Fixture)
  getMatches: async (): Promise<Match[]> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id, home_team_id, away_team_id, home_score, away_score, stage, match_date, status,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*)
        `)
        .order('match_date', { ascending: true });
      if (error) throw error;
      return (data as any) as Match[];
    } else {
      const db = getLocalDb();
      return db.matches.map((m: Match) => ({
        ...m,
        home_team: m.home_team_id ? mockTeams.find((t: Team) => t.id === m.home_team_id) : undefined,
        away_team: m.away_team_id ? mockTeams.find((t: Team) => t.id === m.away_team_id) : undefined
      }));
    }
  },

  // 2. Obtener la lista completa de selecciones
  getTeams: async (): Promise<Team[]> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('teams').select().order('name', { ascending: true });
      if (error) throw error;
      return data;
    } else {
      return mockTeams;
    }
  },

  // 3. Registrar el resultado real de un partido (Admin)
  updateMatchResult: async (
    pollaId: string,
    matchId: number, 
    homeScore: number, 
    awayScore: number, 
    status: 'SCHEDULED' | 'LIVE' | 'FINISHED',
    homeTeamId?: string,
    awayTeamId?: string,
    penaltyWinnerId?: string | null
  ): Promise<void> => {
    // 1. Actualizar el partido en la DB
    if (isSupabaseConfigured()) {
      const updateData: any = { home_score: homeScore, away_score: awayScore, status };
      if (homeTeamId) updateData.home_team_id = homeTeamId;
      if (awayTeamId) updateData.away_team_id = awayTeamId;
      if (penaltyWinnerId !== undefined) updateData.penalty_winner_id = penaltyWinnerId;
      
      const { error } = await supabase.from('matches').update(updateData).eq('id', matchId);
      if (error) throw error;
    } else {
      const db = getLocalDb();
      const updated = db.matches.map((m: Match) => {
        if (m.id !== matchId) return m;
        return {
          ...m,
          home_score: homeScore,
          away_score: awayScore,
          status,
          home_team_id: homeTeamId || m.home_team_id,
          away_team_id: awayTeamId || m.away_team_id,
          penalty_winner_id: penaltyWinnerId !== undefined ? penaltyWinnerId : m.penalty_winner_id
        };
      });
      
      saveLocalDb({ matches: updated });
      
      // Ejecutar motor de puntos local
      recalculateLocalPoints(matchId, homeScore, awayScore, status);
    }

    // 2. Obtener fixture completo y equipos actualizados para re-calcular los brackets de todos
    const participants = await PollaService.getParticipants(pollaId);
    const allMatches = await MatchesService.getMatches();
    const allTeams = await MatchesService.getTeams();
    
    // 3. Recalcular y guardar el bracket derivado de cada participante
    for (const p of participants) {
      const pPreds = await PredictionsService.getPredictions(p.id);
      const derived = calculateDerivedBracket(pPreds, allMatches, allTeams);
      await PredictionsService.saveBracketPrediction(p.id, derived);
    }

    // 4. Recalcular los puntos de brackets de toda la polla
    if (isSupabaseConfigured()) {
      const { error } = await supabase.rpc('recalculate_bracket_predictions_points', { polla_uuid: pollaId });
      if (error) {
        console.error('Error al recalcular puntos de brackets en Supabase:', error);
      }
    } else {
      recalculateLocalBrackets(pollaId);
    }
  }};

export const StatsService = {
  // Obtener las estadísticas divertidas para "La Grada"
  getFunStats: async (pollaId: string): Promise<FunStats> => {
    // 1. Obtener participantes de la polla
    const participants = await PollaService.getParticipants(pollaId);
    if (participants.length === 0) {
      return { 
        oraculoDelGol: null, 
        elPina: null, 
        nostradamus: null, 
        reyDeLaFase: null, 
        elAmarrete: null, 
        elOptimista: null,
        alineacionPlanetaria: null,
        laEstafaColectiva: null
      };
    }
    
    // Obtener predicciones y brackets
    let allPreds: Prediction[] = [];
    let allBrackets: BracketPrediction[] = [];
    let matches: Match[] = [];
    
    if (isSupabaseConfigured()) {
      const { data: preds } = await supabase
        .from('predictions')
        .select('*, participants!inner(polla_id)')
        .eq('participants.polla_id', pollaId);
      allPreds = (preds as any) || [];
      
      const { data: brackets } = await supabase
        .from('bracket_predictions')
        .select('*, participants!inner(polla_id)')
        .eq('participants.polla_id', pollaId);
      allBrackets = (brackets as any) || [];
      
      matches = await MatchesService.getMatches();
    } else {
      const db = getLocalDb();
      const partIds = participants.map((p: Participant) => p.id);
      allPreds = db.predictions.filter((pr: Prediction) => partIds.includes(pr.participant_id));
      allBrackets = db.bracketPredictions.filter((b: BracketPrediction) => partIds.includes(b.participant_id));
      matches = db.matches;
    }
    
    // A. 🏆 El Oráculo del Gol (Más aciertos exactos) - Soporta empates
    let oraculo: { participantNames: string[]; count: number } | null = null;
    const oraculoCounts = participants.map((p: Participant) => ({
      name: p.name,
      count: p.exact_matches
    }));
    const maxExact = oraculoCounts.length > 0 ? Math.max(...oraculoCounts.map(c => c.count)) : 0;
    if (maxExact > 0) {
      const winners = oraculoCounts.filter(c => c.count === maxExact).map(c => c.name);
      oraculo = { participantNames: winners, count: maxExact };
    }
    
    // B. 🍍 El Piña (Más partidos errados por completo - partidos finalizados donde predijo y sacó 0 puntos) - Soporta empates
    let pina: { participantNames: string[]; count: number } | null = null;
    const finishedMatchIds = matches.filter((m: Match) => m.status === 'FINISHED').map((m: Match) => m.id);
    if (finishedMatchIds.length > 0) {
      const pinaCounts = participants.map((p: Participant) => {
        const userPreds = allPreds.filter((pr: Prediction) => pr.participant_id === p.id && finishedMatchIds.includes(pr.match_id));
        const zeroPointsCount = userPreds.filter((pr: Prediction) => pr.points_won === 0).length;
        return { name: p.name, count: zeroPointsCount };
      });
      const maxZero = pinaCounts.length > 0 ? Math.max(...pinaCounts.map(c => c.count)) : 0;
      if (maxZero > 0) {
        const winners = pinaCounts.filter(c => c.count === maxZero).map(c => c.name);
        pina = { participantNames: winners, count: maxZero };
      }
    }
    
    // C. 🔮 El Nostradamus (Mayor cantidad de predicciones de empates acertadas) - Soporta empates
    let nostradamus: { participantNames: string[]; count: number } | null = null;
    const nostradamusCounts = participants.map((p: Participant) => {
      const exactDraws = allPreds.filter((pr: Prediction) => 
        pr.participant_id === p.id && 
        pr.points_won !== null && 
        pr.points_won > 0 && 
        pr.home_score === pr.away_score
      ).length;
      return { name: p.name, count: exactDraws };
    });
    const maxDraws = nostradamusCounts.length > 0 ? Math.max(...nostradamusCounts.map(c => c.count)) : 0;
    if (maxDraws > 0) {
      const winners = nostradamusCounts.filter(c => c.count === maxDraws).map(c => c.name);
      nostradamus = { participantNames: winners, count: maxDraws };
    }
    
    // D. 🔥 El Rey de la Fase (Mayor cantidad de puntos en Fase de Grupos vs Eliminatorias) - Soporta empates
    let rey: { participantNames: string[]; phase: string; points: number } | null = null;
    const finishedGroupMatchIds = matches.filter((m: Match) => m.status === 'FINISHED' && m.stage === 'GROUPS').map((m: Match) => m.id);
    
    const reyCandidates = participants.map((p: Participant) => {
      const groupPoints = allPreds
        .filter((pr: Prediction) => pr.participant_id === p.id && finishedGroupMatchIds.includes(pr.match_id))
        .reduce((sum: number, pr: Prediction) => sum + (pr.points_won || 0), 0);
        
      const bracketPoints = allBrackets.find((b: BracketPrediction) => b.participant_id === p.id)?.points_won || 0;
      
      // Puntos de partidos eliminatorios terminados
      const elimMatchIds = matches.filter((m: Match) => m.status === 'FINISHED' && m.stage !== 'GROUPS').map((m: Match) => m.id);
      const elimPoints = allPreds
        .filter((pr: Prediction) => pr.participant_id === p.id && elimMatchIds.includes(pr.match_id))
        .reduce((sum: number, pr: Prediction) => sum + (pr.points_won || 0), 0);
      
      const totalElimPoints = elimPoints + bracketPoints;
      
      return {
        name: p.name,
        groupPoints,
        elimPoints: totalElimPoints
      };
    });
    
    const maxGroupPoints = reyCandidates.length > 0 ? Math.max(...reyCandidates.map(c => c.groupPoints)) : 0;
    const maxElimPoints = reyCandidates.length > 0 ? Math.max(...reyCandidates.map(c => c.elimPoints)) : 0;
    
    if (maxGroupPoints >= maxElimPoints && maxGroupPoints > 0) {
      const winners = reyCandidates.filter(c => c.groupPoints === maxGroupPoints).map(c => c.name);
      rey = { participantNames: winners, phase: 'Fase de Grupos', points: maxGroupPoints };
    } else if (maxElimPoints > 0) {
      const winners = reyCandidates.filter(c => c.elimPoints === maxElimPoints).map(c => c.name);
      rey = { participantNames: winners, phase: 'Fases Eliminatorias', points: maxElimPoints };
    }
    
    // E. 🛡️ El Amarrete (Quien predijo más veces marcadores defensivos: 0-0, 1-0, 0-1) - Soporta empates
    let amarrete: { participantNames: string[]; count: number } | null = null;
    const amarreteCounts = participants.map((p: Participant) => {
      const count = allPreds.filter((pr: Prediction) => 
        pr.participant_id === p.id && 
        ((pr.home_score === 0 && pr.away_score === 0) || 
         (pr.home_score === 1 && pr.away_score === 0) || 
         (pr.home_score === 0 && pr.away_score === 1))
      ).length;
      return { name: p.name, count };
    });
    const maxAmarrete = amarreteCounts.length > 0 ? Math.max(...amarreteCounts.map(c => c.count)) : 0;
    if (maxAmarrete > 0) {
      const winners = amarreteCounts.filter(c => c.count === maxAmarrete).map(c => c.name);
      amarrete = { participantNames: winners, count: maxAmarrete };
    }

    // F. 🚀 El Optimista del Gol (Quien predijo la mayor suma total de goles) - Soporta empates
    let optimista: { participantNames: string[]; count: number } | null = null;
    const optimistaCounts = participants.map((p: Participant) => {
      const totalGoles = allPreds
        .filter((pr: Prediction) => pr.participant_id === p.id)
        .reduce((sum, pr) => sum + pr.home_score + pr.away_score, 0);
      return { name: p.name, count: totalGoles };
    });
    const maxOptimista = optimistaCounts.length > 0 ? Math.max(...optimistaCounts.map(c => c.count)) : 0;
    if (maxOptimista > 0) {
      const winners = optimistaCounts.filter(c => c.count === maxOptimista).map(c => c.name);
      optimista = { participantNames: winners, count: maxOptimista };
    }
    
    // G. 🪐 Alineación Planetaria (Partidos donde todos los usuarios sumaron puntos > 0)
    // H. 🤡 La Estafa Colectiva (Partidos donde nadie sumó puntos)
    const alineacionPlanetariaMatches: Match[] = [];
    const laEstafaColectivaMatches: Match[] = [];

    if (finishedMatchIds.length > 0 && participants.length > 0) {
      finishedMatchIds.forEach((matchId) => {
        const matchPreds = allPreds.filter((pr: Prediction) => pr.match_id === matchId);
        
        if (matchPreds.length > 0) {
          let scorersCount = 0;
          let zeroPointsCount = 0;
          
          participants.forEach((p: Participant) => {
            const pred = matchPreds.find((pr: Prediction) => pr.participant_id === p.id);
            if (pred && pred.points_won !== null && pred.points_won > 0) {
              scorersCount++;
            } else {
              zeroPointsCount++;
            }
          });
          
          const matchObj = matches.find((m: Match) => m.id === matchId);
          if (matchObj) {
            if (scorersCount === participants.length) {
              alineacionPlanetariaMatches.push(matchObj);
            }
            if (zeroPointsCount === participants.length) {
              laEstafaColectivaMatches.push(matchObj);
            }
          }
        }
      });
    }

    return {
      oraculoDelGol: oraculo,
      elPina: pina,
      nostradamus: nostradamus,
      reyDeLaFase: rey,
      elAmarrete: amarrete,
      elOptimista: optimista,
      alineacionPlanetaria: alineacionPlanetariaMatches.length > 0 ? alineacionPlanetariaMatches : null,
      laEstafaColectiva: laEstafaColectivaMatches.length > 0 ? laEstafaColectivaMatches : null
    };
  }
};
