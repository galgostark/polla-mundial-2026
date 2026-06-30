'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  Trophy, 
  Lock, 
  Loader2, 
  CheckCircle,
  AlertTriangle,
  Award,
  Sparkles,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Navbar from '../../../../components/Navbar';
import { usePollaSession } from '../../../../hooks/usePollaSession';
import { MatchesService, PredictionsService, calculateDerivedBracket } from '../../../../services/api';
import { Match, Team, Prediction, BracketPrediction } from '../../../../types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PronosticosPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const pollaId = resolvedParams.id;

  // Sesión de la Polla
  const { 
    loading: sessionLoading, 
    polla, 
    participant, 
    isAdmin, 
    logout,
    refreshSession 
  } = usePollaSession(pollaId);

  // Estados de Datos
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Navegación de Fases
  const [activeMainTab, setActiveMainTab] = useState<'predict' | 'summary'>('predict');
  const [activeStageTab, setActiveStageTab] = useState<'groups' | 'ROUND_32' | 'ROUND_16' | 'QUARTERS' | 'SEMIS_FINAL'>('groups');
  const [activeGroupTab, setActiveGroupTab] = useState('A');
  const [groupPredictions, setGroupPredictions] = useState<Record<number, { home: string; away: string; penalty_winner_id?: string | null }>>({});

  // 12 Grupos oficiales
  const groupsList = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  useEffect(() => {
    if (!sessionLoading && !participant && !isAdmin) {
      router.push(`/polla/${pollaId}/unirse`);
    }
  }, [sessionLoading, participant, isAdmin, pollaId, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!participant) return;
      try {
        setLoadingData(true);
        // Cargar fixture y selecciones
        const [loadedMatches, loadedTeams] = await Promise.all([
          MatchesService.getMatches(),
          MatchesService.getTeams()
        ]);
        
        setMatches(loadedMatches);
        setTeams(loadedTeams);

        // Cargar predicciones guardadas de marcadores
        const savedPreds = await PredictionsService.getPredictions(participant.id);
        const predsMap: Record<number, { home: string; away: string; penalty_winner_id?: string | null }> = {};
        
        // Poblar con las predicciones guardadas
        savedPreds.forEach(pr => {
          predsMap[pr.match_id] = {
            home: pr.home_score.toString(),
            away: pr.away_score.toString(),
            penalty_winner_id: pr.penalty_winner_id || null
          };
        });

        // Poblar por defecto con vacíos para los partidos que falten
        loadedMatches.forEach(m => {
          if (!predsMap[m.id]) {
            predsMap[m.id] = { home: '', away: '', penalty_winner_id: null };
          }
        });

        setGroupPredictions(predsMap);

      } catch (err) {
        console.error('Error al cargar fixture y cartillas:', err);
        setErrorMsg('Error al conectar con la base de datos.');
      } finally {
        setLoadingData(false);
      }
    };

    if (participant) {
      loadData();
    }
  }, [participant]);

  // Verificar si un partido está cerrado por tiempo (5 minutos antes de jugar)
  const isMatchClosed = (matchDateStr: string): boolean => {
    const matchTime = new Date(matchDateStr).getTime();
    const nowTime = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    return nowTime >= (matchTime - fiveMinutes);
  };

  const handleScoreChange = (matchId: number, side: 'home' | 'away', val: string) => {
    // Solo permitir números
    const cleanVal = val.replace(/\D/g, '');
    
    setGroupPredictions(prev => {
      const updated = {
        ...prev[matchId],
        [side]: cleanVal
      };
      
      // Si ya no es un empate, remover el penalty_winner_id
      if (updated.home !== updated.away) {
        updated.penalty_winner_id = null;
      }
      
      return {
        ...prev,
        [matchId]: updated
      };
    });
    setErrorMsg('');
  };

  // Guardar cartilla de partidos
  const handleSavePredictions = async () => {
    if (!participant) return;
    
    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');
      
      let missingPenalties = false;
      // Filtrar predicciones estructuradas e ignorar vacíos
      const predictionsPayload = Object.keys(groupPredictions)
        .map(id => {
          const matchId = parseInt(id);
          const match = matches.find(m => m.id === matchId);
          
          // No permitir re-guardar partidos ya cerrados por tiempo
          if (match && isMatchClosed(match.match_date)) {
            return null;
          }
          
          const pred = groupPredictions[matchId];
          if (pred.home === '' || pred.away === '') return null;
          
          // Si es playoff y el resultado es empate, debe tener un ganador de penales
          if (match && match.stage !== 'GROUPS' && pred.home === pred.away && !pred.penalty_winner_id) {
            missingPenalties = true;
          }
          
          return {
            match_id: matchId,
            home_score: parseInt(pred.home),
            away_score: parseInt(pred.away),
            penalty_winner_id: pred.penalty_winner_id || null
          };
        })
        .filter(Boolean) as { match_id: number; home_score: number; away_score: number; penalty_winner_id?: string | null }[];

      if (missingPenalties) {
        setErrorMsg('Por favor define quién clasifica por penales en todos los partidos con predicción de empate.');
        setSubmitting(false);
        return;
      }

      if (predictionsPayload.length > 0) {
        await PredictionsService.savePredictions(participant.id, predictionsPayload);
        
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.8 }
        });

        setSuccessMsg('¡Tus pronósticos se han guardado y tu cuadro se ha actualizado automáticamente! 🏆⚽');
        
        // Recargar datos actualizados
        const [loadedMatches, loadedTeams] = await Promise.all([
          MatchesService.getMatches(),
          MatchesService.getTeams()
        ]);
        setMatches(loadedMatches);
        setTeams(loadedTeams);
      } else {
        setErrorMsg('Por favor completa al menos un marcador nuevo antes de guardar.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al guardar predicciones.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionLoading || loadingData) {
    return (
      <div className="min-h-screen bg-[#070a13] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <span className="text-sm font-bold text-slate-400">Cargando cartilla deportiva...</span>
        </div>
      </div>
    );
  }

  // Convertir groupPredictions en Prediction[] para calcular en caliente el bracket derivado
  const currentPredsList: Prediction[] = Object.keys(groupPredictions)
    .map(id => {
      const matchId = parseInt(id);
      const pred = groupPredictions[matchId];
      if (!pred || pred.home === '' || pred.away === '') return null;
      return {
        id: '',
        participant_id: participant?.id || '',
        match_id: matchId,
        home_score: parseInt(pred.home),
        away_score: parseInt(pred.away),
        points_won: null,
        penalty_winner_id: pred.penalty_winner_id || null,
        created_at: ''
      };
    })
    .filter(Boolean) as Prediction[];

  const derivedBracket = calculateDerivedBracket(currentPredsList, matches, teams);

  // Filtrar los partidos según la fase activa
  let filteredMatches: Match[] = [];
  if (activeStageTab === 'groups') {
    filteredMatches = matches.filter(m => m.stage === 'GROUPS' && m.home_team?.group_letter === activeGroupTab);
  } else if (activeStageTab === 'ROUND_32') {
    filteredMatches = matches.filter(m => m.stage === 'ROUND_32');
  } else if (activeStageTab === 'ROUND_16') {
    filteredMatches = matches.filter(m => m.stage === 'ROUND_16');
  } else if (activeStageTab === 'QUARTERS') {
    filteredMatches = matches.filter(m => m.stage === 'QUARTERS');
  } else if (activeStageTab === 'SEMIS_FINAL') {
    filteredMatches = matches.filter(m => ['SEMIS', 'THIRD_PLACE', 'FINAL'].includes(m.stage));
  }

  // Listas oficiales para validaciones de aciertos en resumen
  const officialR32 = Array.from(new Set(matches.filter(m => m.stage === 'ROUND_32').flatMap(m => [m.home_team_id, m.away_team_id]).filter(Boolean)));
  const officialR16 = Array.from(new Set(matches.filter(m => m.stage === 'ROUND_16').flatMap(m => [m.home_team_id, m.away_team_id]).filter(Boolean)));
  const officialQuarters = Array.from(new Set(matches.filter(m => m.stage === 'QUARTERS').flatMap(m => [m.home_team_id, m.away_team_id]).filter(Boolean)));
  const officialSemis = Array.from(new Set(matches.filter(m => m.stage === 'SEMIS').flatMap(m => [m.home_team_id, m.away_team_id]).filter(Boolean)));
  
  const finalMatch = matches.find(m => m.id === 104);
  const officialChamp = finalMatch?.status === 'FINISHED' 
    ? (finalMatch.home_score! > finalMatch.away_score! ? finalMatch.home_team_id : finalMatch.away_team_id)
    : null;
  const officialRunner = finalMatch?.status === 'FINISHED'
    ? (finalMatch.home_score! > finalMatch.away_score! ? finalMatch.away_team_id : finalMatch.home_team_id)
    : null;

  return (
    <div className="min-h-screen bg-[#070a13] text-white pb-12">
      {polla && (
        <Navbar 
          polla={polla} 
          participant={participant} 
          isAdmin={isAdmin} 
          logout={logout} 
        />
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Cabecera de Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass rounded-3xl border border-border shadow-lg">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Trophy className="h-6 w-6 text-accent animate-pulse" />
              Completa tu Cartilla ⚽
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Pronostica marcadores de partidos de grupos y eliminatorias. Tu cuadro y clasificados se calculan de manera automática.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveMainTab('predict')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                activeMainTab === 'predict'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              1. Pronosticar Marcadores
            </button>
            <button
              onClick={() => setActiveMainTab('summary')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                activeMainTab === 'summary'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              2. Mi Cuadro (Resumen)
            </button>
          </div>
        </div>

        {/* FEEDBACK MENSAJES */}
        {successMsg && (
          <div className="mt-4 p-4 bg-success/15 border border-success/30 text-success text-sm font-bold rounded-2xl flex items-center gap-2.5">
            <CheckCircle className="h-5 w-5 shrink-0 text-success" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-4 bg-destructive/15 border border-destructive/30 text-destructive text-sm font-bold rounded-2xl flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ======================================= */}
        {/* PESTAÑA: PRONOSTICAR PARTIDOS */}
        {/* ======================================= */}
        {activeMainTab === 'predict' && (
          <div className="mt-6 space-y-6 animate-fade-in">
            
            {/* Navegación por Fases (Grupos y Eliminatorias) */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border">
              {[
                { id: 'groups', name: 'Fase de Grupos' },
                { id: 'ROUND_32', name: 'Dieciseisavos (R32)' },
                { id: 'ROUND_16', name: 'Octavos de Final' },
                { id: 'QUARTERS', name: 'Cuartos de Final' },
                { id: 'SEMIS_FINAL', name: 'Semis y Finales 🏆' }
              ].map(stage => (
                <button
                  key={stage.id}
                  onClick={() => {
                    setActiveStageTab(stage.id as any);
                    setErrorMsg('');
                  }}
                  className={`px-4 py-2.5 shrink-0 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeStageTab === stage.id
                      ? 'bg-accent text-accent-foreground shadow-sm shadow-accent/20'
                      : 'bg-slate-900/60 border border-slate-850 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {stage.name}
                </button>
              ))}
            </div>

            {/* Sub-Pestañas de Grupos A-L (Solo si estamos en fase de grupos) */}
            {activeStageTab === 'groups' && (
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {groupsList.map(grp => (
                  <button
                    key={grp}
                    onClick={() => {
                      setActiveGroupTab(grp);
                      setErrorMsg('');
                    }}
                    className={`px-4 py-3 shrink-0 rounded-xl text-sm font-black transition-all cursor-pointer ${
                      activeGroupTab === grp
                        ? 'bg-primary/20 border border-primary/45 text-primary'
                        : 'bg-slate-900/40 border border-slate-900 hover:bg-slate-800/50 text-slate-400'
                    }`}
                  >
                    Grupo {grp}
                  </button>
                ))}
              </div>
            )}

            {/* Listado de Partidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMatches.map(match => {
                const isClosed = isMatchClosed(match.match_date);
                const isPending = !match.home_team_id || !match.away_team_id;
                const pred = groupPredictions[match.id] || { home: '', away: '' };
                const formattedDate = new Date(match.match_date).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                if (isPending) {
                  return (
                    <div 
                      key={match.id} 
                      className="p-5 glass border border-slate-900 bg-slate-950/10 rounded-2xl flex flex-col justify-between gap-4 opacity-60 border-dashed"
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-505 tracking-wider text-left">
                        <span>PARTIDO #{match.id} — {match.stage}</span>
                        <span className="bg-slate-950 px-2 py-0.5 rounded-full">{formattedDate}</span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-4 py-2">
                        <span className="text-xs text-slate-400 font-semibold italic">Esperando clasificación...</span>
                      </div>
                    </div>
                  );
                }

                // Obtener datos del equipo si están definidos localmente
                const homeTeam = match.home_team || teams.find(t => t.id === match.home_team_id);
                const awayTeam = match.away_team || teams.find(t => t.id === match.away_team_id);

                return (
                  <div 
                    key={match.id} 
                    className={`relative p-5 glass border rounded-2xl flex flex-col justify-between gap-4 transition-all soccer-glow ${
                      isClosed ? 'opacity-85 border-slate-900 bg-slate-950/20' : 'border-border'
                    }`}
                  >
                    
                    {/* Header del Partido */}
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-wider">
                      <span>PARTIDO #{match.id} — {match.stage === 'GROUPS' ? `Grupo ${homeTeam?.group_letter}` : match.stage}</span>
                      <span className="bg-slate-900 px-2 py-0.5 rounded-full">{formattedDate}</span>
                    </div>

                    {/* Inputs de Marcador */}
                    <div className="flex items-center justify-between gap-4 mt-2">
                      
                      {/* Local */}
                      <div className="flex-1 flex items-center gap-2.5 justify-end text-right min-w-0">
                        <span className="text-sm font-extrabold text-foreground truncate">{homeTeam?.name}</span>
                        {homeTeam?.flag_url && (
                          <img 
                            src={homeTeam.flag_url} 
                            alt={homeTeam.name}
                            className="h-5 w-7 object-cover rounded shadow-sm shrink-0 border border-slate-800"
                          />
                        )}
                      </div>

                      {/* Inputs */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          disabled={isClosed}
                          value={pred.home}
                          onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                          placeholder="-"
                          className={`w-10 h-10 rounded-lg text-center font-black text-lg focus:outline-none focus:border-primary transition-all border ${
                            isClosed 
                              ? 'bg-slate-950/60 border-slate-900 text-slate-500' 
                              : 'bg-slate-950 border-slate-800 focus:ring-1 focus:ring-primary'
                          }`}
                        />
                        <span className="text-slate-500 font-bold">x</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          disabled={isClosed}
                          value={pred.away}
                          onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                          placeholder="-"
                          className={`w-10 h-10 rounded-lg text-center font-black text-lg focus:outline-none focus:border-primary transition-all border ${
                            isClosed 
                              ? 'bg-slate-950/60 border-slate-900 text-slate-500' 
                              : 'bg-slate-950 border-slate-800 focus:ring-1 focus:ring-primary'
                          }`}
                        />
                      </div>

                      {/* Visitante */}
                      <div className="flex-1 flex items-center gap-2.5 justify-start text-left min-w-0">
                        {awayTeam?.flag_url && (
                          <img 
                            src={awayTeam.flag_url} 
                            alt={awayTeam.name}
                            className="h-5 w-7 object-cover rounded shadow-sm shrink-0 border border-slate-800"
                          />
                        )}
                        <span className="text-sm font-extrabold text-foreground truncate">{awayTeam?.name}</span>
                      </div>

                    </div>

                    {/* Marcador Oficial en Pronósticos */}
                    {match.status === 'FINISHED' && (
                      <div className="text-[10px] text-center text-slate-500 font-extrabold mt-2 bg-slate-950/20 py-1.5 rounded-lg border border-slate-900/40">
                        Resultado Oficial: {match.home_score} - {match.away_score}
                        {match.stage !== 'GROUPS' && match.home_score === match.away_score && match.penalties_home !== null && match.penalties_away !== null && (
                          <span className="text-emerald-400 ml-1">
                            ({match.penalties_home} - {match.penalties_away} pen)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Selector de Penales (Playoffs con empate) */}
                    {match.stage !== 'GROUPS' && pred.home !== '' && pred.away !== '' && pred.home === pred.away && (
                      <div className="mt-3 p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex flex-col items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          🏆 ¿Quién clasifica por penales?
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isClosed}
                            onClick={() => {
                              setGroupPredictions(prev => ({
                                ...prev,
                                [match.id]: {
                                  ...prev[match.id],
                                  penalty_winner_id: homeTeam?.id || null
                                }
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              pred.penalty_winner_id === homeTeam?.id
                                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                            }`}
                          >
                            👑 {homeTeam?.name}
                          </button>
                          <button
                            type="button"
                            disabled={isClosed}
                            onClick={() => {
                              setGroupPredictions(prev => ({
                                ...prev,
                                [match.id]: {
                                  ...prev[match.id],
                                  penalty_winner_id: awayTeam?.id || null
                                }
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              pred.penalty_winner_id === awayTeam?.id
                                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                            }`}
                          >
                            👑 {awayTeam?.name}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Footer / Estado Cerrado */}
                    {isClosed && (
                      <div className="absolute top-2.5 right-2.5 text-[9px] font-black text-destructive/80 flex items-center gap-0.5">
                        <Lock className="h-3 w-3" /> CERRADO
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Botón de Guardado */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSavePredictions}
                disabled={submitting}
                className="px-6 py-4 bg-primary text-primary-foreground font-black text-base rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                Guardar Pronósticos
              </button>
            </div>

          </div>
        )}

        {/* ======================================= */}
        {/* PESTAÑA: MI CUADRO (RESUMEN DERIVADO) */}
        {/* ======================================= */}
        {activeMainTab === 'summary' && (
          <div className="mt-6 space-y-8 animate-fade-in">
            
            <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 text-xs font-bold text-slate-200 flex gap-2">
              <Info className="h-4.5 w-4.5 text-accent shrink-0" />
              <span>
                Este cuadro se genera en tiempo real a partir de tus marcadores pronosticados. Si cambias algún marcador en la pestaña anterior, verás la actualización instantáneamente aquí.
              </span>
            </div>

            {/* SECCIÓN 1: EL CAMPEÓN Y SUBCAMPEÓN */}
            <div className="glass border border-border p-6 rounded-3xl space-y-6 soccer-glow relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-[150px] h-[150px] rounded-full bg-accent/5 blur-[40px] -z-10" />
              <h2 className="text-lg font-black text-foreground border-b border-border pb-3 flex items-center gap-2">
                👑 Podio Predictivo
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Campeón */}
                <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 flex flex-col items-center text-center gap-3">
                  <span className="text-xs font-extrabold text-accent uppercase tracking-wider">🏆 CAMPEÓN</span>
                  {derivedBracket.champion_team_id ? (() => {
                    const t = teams.find(team => team.id === derivedBracket.champion_team_id);
                    const isCorrect = officialChamp && derivedBracket.champion_team_id === officialChamp;
                    const isIncorrect = officialChamp && derivedBracket.champion_team_id !== officialChamp;
                    
                    return (
                      <div className="flex flex-col items-center gap-2">
                        {t?.flag_url && (
                          <img src={t.flag_url} alt={t.name} className={`h-10 w-14 object-cover rounded-xl border ${isCorrect ? 'border-success shadow-lg shadow-success/15' : isIncorrect ? 'border-destructive opacity-50' : 'border-slate-800'}`} />
                        )}
                        <span className="text-base font-black">{t?.name}</span>
                        {isCorrect && <span className="text-[10px] bg-success/15 text-success font-black px-2 py-0.5 rounded-full border border-success/20">+10 pts</span>}
                      </div>
                    );
                  })() : (
                    <span className="text-sm font-bold text-slate-505 italic py-4">Por definir</span>
                  )}
                </div>

                {/* Subcampeón */}
                <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 flex flex-col items-center text-center gap-3">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">🥈 SUBCAMPEÓN</span>
                  {derivedBracket.runner_up_team_id ? (() => {
                    const t = teams.find(team => team.id === derivedBracket.runner_up_team_id);
                    const isCorrect = officialRunner && derivedBracket.runner_up_team_id === officialRunner;
                    const isIncorrect = officialRunner && derivedBracket.runner_up_team_id !== officialRunner;
                    
                    return (
                      <div className="flex flex-col items-center gap-2">
                        {t?.flag_url && (
                          <img src={t.flag_url} alt={t.name} className={`h-10 w-14 object-cover rounded-xl border ${isCorrect ? 'border-success shadow-lg shadow-success/15' : isIncorrect ? 'border-destructive opacity-50' : 'border-slate-800'}`} />
                        )}
                        <span className="text-base font-black">{t?.name}</span>
                        {isCorrect && <span className="text-[10px] bg-success/15 text-success font-black px-2 py-0.5 rounded-full border border-success/20">+5 pts</span>}
                      </div>
                    );
                  })() : (
                    <span className="text-sm font-bold text-slate-505 italic py-4">Por definir</span>
                  )}
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: SEMIFINALISTAS (4) */}
            <div className="glass border border-border p-6 rounded-3xl space-y-4 soccer-glow">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  🔥 Semifinalistas (Fase de 4)
                </h2>
                <span className="text-xs bg-slate-950 border border-slate-900 text-slate-300 font-extrabold px-2.5 py-1 rounded-full">
                  Definidos: {derivedBracket.semifinalists?.length || 0}/4
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {derivedBracket.semifinalists && derivedBracket.semifinalists.length > 0 ? (
                  derivedBracket.semifinalists.map(teamId => {
                    const t = teams.find(team => team.id === teamId);
                    const isCorrect = officialSemis.includes(teamId);
                    const isIncorrect = officialSemis.length > 0 && !officialSemis.includes(teamId);

                    return (
                      <div 
                        key={teamId}
                        className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-2 bg-slate-950/30 ${
                          isCorrect 
                            ? 'border-success bg-success/5' 
                            : isIncorrect 
                              ? 'border-destructive/30 opacity-50' 
                              : 'border-slate-900'
                        }`}
                      >
                        {t?.flag_url && (
                          <img src={t.flag_url} alt={t.name} className="h-6 w-9 object-cover rounded shadow-sm border border-slate-800" />
                        )}
                        <span className="text-xs font-bold truncate w-full">{t?.name}</span>
                        {isCorrect && <span className="text-[9px] bg-success/15 text-success font-black px-1.5 py-0.5 rounded border border-success/25">+4 pts</span>}
                      </div>
                    );
                  })
                ) : (
                  <span className="col-span-full text-xs text-slate-500 font-bold italic text-center py-4">No se han definido semifinalistas en tus pronósticos de Cuartos.</span>
                )}
              </div>
            </div>

            {/* SECCIÓN 3: CUARTOFINALISTAS (8) */}
            <div className="glass border border-border p-6 rounded-3xl space-y-4 soccer-glow">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  ⭐ Cuartos de Final (Fase de 8)
                </h2>
                <span className="text-xs bg-slate-950 border border-slate-900 text-slate-300 font-extrabold px-2.5 py-1 rounded-full">
                  Definidos: {derivedBracket.quarterfinalists?.length || 0}/8
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {derivedBracket.quarterfinalists && derivedBracket.quarterfinalists.length > 0 ? (
                  derivedBracket.quarterfinalists.map(teamId => {
                    const t = teams.find(team => team.id === teamId);
                    const isCorrect = officialQuarters.includes(teamId);
                    const isIncorrect = officialQuarters.length > 0 && !officialQuarters.includes(teamId);

                    return (
                      <div 
                        key={teamId}
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 bg-slate-950/30 ${
                          isCorrect 
                            ? 'border-success bg-success/5' 
                            : isIncorrect 
                              ? 'border-destructive/30 opacity-50' 
                              : 'border-slate-900'
                        }`}
                      >
                        {t?.flag_url && (
                          <img src={t.flag_url} alt={t.name} className="h-5 w-7 object-cover rounded shadow-sm border border-slate-800" />
                        )}
                        <span className="text-[10px] font-bold truncate w-full">{t?.name}</span>
                        {isCorrect && <span className="text-[8px] bg-success/15 text-success font-black px-1.5 py-0.5 rounded border border-success/25">+3 pts</span>}
                      </div>
                    );
                  })
                ) : (
                  <span className="col-span-full text-xs text-slate-505 font-bold italic text-center py-4">No se han definido cuartofinalistas en tus pronósticos de Octavos.</span>
                )}
              </div>
            </div>

            {/* SECCIÓN 4: OCTAVOFINALISTAS (16) */}
            <div className="glass border border-border p-6 rounded-3xl space-y-4 soccer-glow">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  🌌 Octavos de Final (Fase de 16)
                </h2>
                <span className="text-xs bg-slate-950 border border-slate-900 text-slate-300 font-extrabold px-2.5 py-1 rounded-full">
                  Definidos: {derivedBracket.round_of_16?.length || 0}/16
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {derivedBracket.round_of_16 && derivedBracket.round_of_16.length > 0 ? (
                  derivedBracket.round_of_16.map(teamId => {
                    const t = teams.find(team => team.id === teamId);
                    const isCorrect = officialR16.includes(teamId);
                    const isIncorrect = officialR16.length > 0 && !officialR16.includes(teamId);

                    return (
                      <div 
                        key={teamId}
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 bg-slate-950/30 ${
                          isCorrect 
                            ? 'border-success bg-success/5' 
                            : isIncorrect 
                              ? 'border-destructive/30 opacity-50' 
                              : 'border-slate-900'
                        }`}
                      >
                        {t?.flag_url && (
                          <img src={t.flag_url} alt={t.name} className="h-5 w-7 object-cover rounded shadow-sm border border-slate-800" />
                        )}
                        <span className="text-[10px] font-bold truncate w-full">{t?.name}</span>
                        {isCorrect && <span className="text-[8px] bg-success/15 text-success font-black px-1.5 py-0.5 rounded border border-success/25">+2 pts</span>}
                      </div>
                    );
                  })
                ) : (
                  <span className="col-span-full text-xs text-slate-505 font-bold italic text-center py-4">No se han definido clasificados a Octavos en tus pronósticos de R32.</span>
                )}
              </div>
            </div>

            {/* SECCIÓN 5: DIECISEISAVOFINALISTAS (R32 - 32) */}
            <div className="glass border border-border p-6 rounded-3xl space-y-4 soccer-glow">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  🪐 Dieciseisavos de Final (Fase de 32)
                </h2>
                <span className="text-xs bg-slate-950 border border-slate-900 text-slate-300 font-extrabold px-2.5 py-1 rounded-full">
                  Definidos: {derivedBracket.round_of_32?.length || 0}/32
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {derivedBracket.round_of_32 && derivedBracket.round_of_32.length > 0 ? (
                  derivedBracket.round_of_32.map(teamId => {
                    const t = teams.find(team => team.id === teamId);
                    const isCorrect = officialR32.includes(teamId);
                    const isIncorrect = officialR32.length > 0 && !officialR32.includes(teamId);

                    return (
                      <div 
                        key={teamId}
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 bg-slate-950/30 ${
                          isCorrect 
                            ? 'border-success bg-success/5' 
                            : isIncorrect 
                              ? 'border-destructive/30 opacity-50' 
                              : 'border-slate-900'
                        }`}
                      >
                        {t?.flag_url && (
                          <img src={t.flag_url} alt={t.name} className="h-5 w-7 object-cover rounded shadow-sm border border-slate-800" />
                        )}
                        <span className="text-[10px] font-bold truncate w-full">{t?.name}</span>
                        {isCorrect && <span className="text-[8px] bg-success/15 text-success font-black px-1.5 py-0.5 rounded border border-success/25">+1 pt</span>}
                      </div>
                    );
                  })
                ) : (
                  <span className="col-span-full text-xs text-slate-505 font-bold italic text-center py-4">No se han definido clasificados a Dieciseisavos en tus pronósticos de grupos.</span>
                )}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
