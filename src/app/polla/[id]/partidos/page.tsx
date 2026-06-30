'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Trophy, 
  Lock, 
  Loader2, 
  Eye, 
  X, 
  Users,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import Navbar from '../../../../components/Navbar';
import { usePollaSession } from '../../../../hooks/usePollaSession';
import { MatchesService, PollaService, PredictionsService } from '../../../../services/api';
import { Match, Participant, Prediction, Team } from '../../../../types';
import { mockTeams } from '../../../../utils/mockData';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PartidosFixturePage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const pollaId = resolvedParams.id;

  // Cargar sesión de polla
  const { 
    loading: sessionLoading, 
    polla, 
    participant, 
    isAdmin, 
    logout 
  } = usePollaSession(pollaId);

  // Estados de Datos
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados de Filtros
  const [activeStageTab, setActiveStageTab] = useState<'GROUPS' | 'PLAYOFFS'>('GROUPS');
  const [activeGroupFilter, setActiveGroupFilter] = useState('A');
  const [activePlayoffFilter, setActivePlayoffFilter] = useState<'ROUND_32' | 'ROUND_16' | 'QUARTERS' | 'SEMIS_FINAL'>('ROUND_32');

  // Modal "¿Quién apostó qué?"
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchPredictions, setMatchPredictions] = useState<Array<{ participantName: string; prediction: Prediction | null; isPaid: boolean }>>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !participant && !isAdmin) {
      router.push(`/polla/${pollaId}/unirse`);
    }
  }, [sessionLoading, participant, isAdmin, pollaId, router]);

  const loadFixture = async () => {
    try {
      setLoadingData(true);
      const [matchesList, partsList] = await Promise.all([
        MatchesService.getMatches(),
        PollaService.getParticipants(pollaId)
      ]);
      setMatches(matchesList);
      setParticipants(partsList);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar partidos.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (pollaId) {
      loadFixture();
    }
  }, [pollaId]);

  const isMatchClosed = (matchDateStr: string): boolean => {
    const matchTime = new Date(matchDateStr).getTime();
    const nowTime = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000;
    return nowTime >= (matchTime - fiveMinutes);
  };

  // Cargar predicciones del partido seleccionado
  const handleViewMatchPredictions = async (match: Match) => {
    try {
      setSelectedMatch(match);
      setLoadingPredictions(true);
      
      const closed = isMatchClosed(match.match_date);
      
      // En una polla real, si el partido NO está cerrado (aún no empieza),
      // ocultamos las apuestas de otros para evitar copias.
      // Pero si somos el administrador, o si el partido ya inició, podemos verlas.
      
      const updatedList = await Promise.all(
        participants.map(async (part) => {
          const isSelf = part.id === participant?.id;
          
          // Solo cargar si el partido ya cerró, o si es la cartilla propia
          if (closed || isSelf || isAdmin) {
            const preds = await PredictionsService.getPredictions(part.id);
            const found = preds.find(pr => pr.match_id === match.id) || null;
            return {
              participantName: part.name,
              prediction: found,
              isPaid: part.is_paid
            };
          } else {
            // Retornar objeto con predicción oculta
            return {
              participantName: part.name,
              prediction: null, // Oculto
              isPaid: part.is_paid,
              isSecret: true
            };
          }
        })
      );
      
      setMatchPredictions(updatedList as any);
    } catch (err) {
      console.error('Error al cargar predicciones de partido:', err);
    } finally {
      setLoadingPredictions(false);
    }
  };

  if (sessionLoading || loadingData) {
    return (
      <div className="min-h-screen bg-[#070a13] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <span className="text-sm font-bold text-slate-400">Cargando fixture del mundial...</span>
        </div>
      </div>
    );
  }

  // Filtrar partidos
  const filteredMatches = matches.filter(m => {
    if (activeStageTab === 'GROUPS') {
      return m.stage === 'GROUPS' && m.home_team?.group_letter === activeGroupFilter;
    } else {
      if (activePlayoffFilter === 'SEMIS_FINAL') {
        return ['SEMIS', 'THIRD_PLACE', 'FINAL'].includes(m.stage);
      }
      return m.stage === activePlayoffFilter;
    }
  });

  const getStageTitle = (stage: string) => {
    switch (stage) {
      case 'GROUPS': return 'Fase de Grupos';
      case 'ROUND_32': return 'Dieciseisavos (R32)';
      case 'ROUND_16': return 'Octavos de Final (R16)';
      case 'QUARTERS': return 'Cuartos de Final';
      case 'SEMIS': return 'Semifinal';
      case 'THIRD_PLACE': return 'Tercer Puesto';
      case 'FINAL': return 'Gran Final 🏆';
      default: return stage;
    }
  };

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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 glass border border-border rounded-3xl shadow-lg soccer-glow">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary animate-pulse" />
              Fixture y Resultados
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Consulta el fixture oficial del Mundial 2026 y descubre qué marcadores pronosticaron tus amigos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStageTab('GROUPS')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                activeStageTab === 'GROUPS'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Fase de Grupos
            </button>
            <button
              onClick={() => setActiveStageTab('PLAYOFFS')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                activeStageTab === 'PLAYOFFS'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Rondas de Eliminación
            </button>
          </div>
        </div>

        {/* SUB FILTROS HORIZONTALES */}
        {activeStageTab === 'GROUPS' ? (
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {['A','B','C','D','E','F','G','H','I','J','K','L'].map(grp => (
              <button
                key={grp}
                onClick={() => setActiveGroupFilter(grp)}
                className={`px-3.5 py-2.5 shrink-0 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeGroupFilter === grp
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-slate-900/60 border border-slate-850 hover:bg-slate-800 text-slate-400'
                }`}
              >
                Grupo {grp}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-2">
            {[
              { id: 'ROUND_32', name: 'Ronda de 32' },
              { id: 'ROUND_16', name: 'Octavos de Final' },
              { id: 'QUARTERS', name: 'Cuartos de Final' },
              { id: 'SEMIS_FINAL', name: 'Semis y Final 🏆' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePlayoffFilter(tab.id as any)}
                className={`flex-1 px-3 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePlayoffFilter === tab.id
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-slate-900/60 border border-slate-850 hover:bg-slate-800 text-slate-400'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        )}

        {/* LISTADO DE PARTIDOS */}
        <div className="space-y-4">
          {filteredMatches.length > 0 ? (
            filteredMatches.map(match => {
              const closed = isMatchClosed(match.match_date);
              const formattedDate = new Date(match.match_date).toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={match.id}
                  className={`p-5 glass border rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all soccer-glow ${
                    match.status === 'FINISHED' 
                      ? 'border-slate-900 bg-slate-950/20 opacity-90' 
                      : 'border-border'
                  }`}
                >
                  
                  {/* Izquierda: Info de Partido */}
                  <div className="flex flex-col gap-1.5 md:w-56 shrink-0">
                    <span className="text-[9px] font-black text-primary tracking-wider uppercase">
                      {getStageTitle(match.stage)} — PARTIDO #{match.id}
                    </span>
                    <span className="text-xs font-medium text-slate-400 capitalize">
                      {formattedDate}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      {match.status === 'FINISHED' && (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          Finalizado
                        </span>
                      )}
                      {match.status === 'LIVE' && (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-destructive/20 text-destructive animate-pulse flex items-center gap-1">
                          <span className="h-1.5 w-1.5 bg-destructive rounded-full animate-ping" /> EN VIVO
                        </span>
                      )}
                      {match.status === 'SCHEDULED' && (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-900 text-slate-500">
                          Programado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Centro: Marcadores y Equipos */}
                  <div className="flex-1 flex items-center justify-center gap-4 sm:gap-6 bg-slate-950/30 py-3.5 px-4 rounded-2xl border border-slate-900/50">
                    
                    {/* Local */}
                    <div className="flex-1 flex items-center justify-end gap-3 w-28">
                      <span className="text-sm font-black text-slate-200 truncate text-right">
                        {match.home_team?.name || 'Por definir'}
                      </span>
                      {match.home_team?.flag_url ? (
                        <img 
                          src={match.home_team.flag_url} 
                          alt={match.home_team.name}
                          className="h-5.5 w-8 object-cover rounded shadow-md border border-slate-800 shrink-0"
                        />
                      ) : (
                        <div className="h-5.5 w-8 bg-slate-900 border border-slate-800 rounded flex items-center justify-center text-[10px] text-slate-500 font-bold shrink-0">?</div>
                      )}
                    </div>

                    {/* Marcador Real */}
                    <div className="flex flex-col items-center justify-center bg-slate-950 px-4 py-2 rounded-xl border border-slate-850 shrink-0">
                      {match.status === 'FINISHED' || match.status === 'LIVE' ? (
                        <>
                          <span className="text-lg font-black tracking-widest text-accent">
                            {match.home_score} - {match.away_score}
                          </span>
                          {match.stage !== 'GROUPS' && match.home_score === match.away_score && match.penalties_home !== null && match.penalties_away !== null && (
                            <span className="text-[10px] font-extrabold text-emerald-400 mt-0.5">
                              ({match.penalties_home} - {match.penalties_away} pen)
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs font-bold text-slate-500">
                          VS
                        </span>
                      )}
                    </div>

                    {/* Visitante */}
                    <div className="flex-1 flex items-center justify-start gap-3 w-28">
                      {match.away_team?.flag_url ? (
                        <img 
                          src={match.away_team.flag_url} 
                          alt={match.away_team.name}
                          className="h-5.5 w-8 object-cover rounded shadow-md border border-slate-800 shrink-0"
                        />
                      ) : (
                        <div className="h-5.5 w-8 bg-slate-900 border border-slate-800 rounded flex items-center justify-center text-[10px] text-slate-500 font-bold shrink-0">?</div>
                      )}
                      <span className="text-sm font-black text-slate-200 truncate text-left">
                        {match.away_team?.name || 'Por definir'}
                      </span>
                    </div>

                  </div>

                  {/* Derecha: Botón Espiar Apuestas */}
                  <div className="md:w-36 flex items-center justify-end shrink-0">
                    <button
                      onClick={() => handleViewMatchPredictions(match)}
                      className="w-full md:w-auto px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      Espiar Apuestas
                    </button>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="text-center py-12 glass border border-border rounded-3xl text-slate-500 font-bold text-sm">
              No hay partidos disponibles para este filtro.
            </div>
          )}
        </div>

      </main>

      {/* ======================================= */}
      {/* MODAL: VER APUESTAS DEL PARTIDO (ESPIAR PARTIDO) */}
      {/* ======================================= */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg max-h-[80vh] glass border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Apuestas del Partido #{selectedMatch.id}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                  {selectedMatch.home_team_id || 'TBD'} vs {selectedMatch.away_team_id || 'TBD'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedMatch(null)}
                className="p-1 rounded-full hover:bg-secondary text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cuerpo del Modal (Listado de Participantes y Predicciones) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {!isMatchClosed(selectedMatch.match_date) && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 rounded-xl flex gap-2">
                  <Info className="h-4.5 w-4.5 shrink-0" />
                  <span>
                    El partido aún no ha iniciado. Por seguridad y transparencia, las predicciones de los demás se mantienen ocultas (🔒) hasta 5 minutos antes del silbatazo inicial.
                  </span>
                </div>
              )}

              {loadingPredictions ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="text-xs text-slate-400 font-bold">Cargando pronósticos...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {matchPredictions.map((row, idx) => {
                    const hasPred = !!row.prediction;
                    const isSecret = (row as any).isSecret;
                    
                    // Puntos obtenidos
                    let ptsBadge = null;
                    if (hasPred && row.prediction?.points_won !== null) {
                      const pts = row.prediction?.points_won;
                      if (pts === 4) ptsBadge = <span className="text-[9px] font-bold px-1.5 py-0.5 bg-accent/20 text-accent rounded">4 pts (Marcador Exacto! 🎯)</span>;
                      else if (pts === 3) ptsBadge = <span className="text-[9px] font-bold px-1.5 py-0.5 bg-primary/20 text-primary rounded">3 pts</span>;
                      else ptsBadge = <span className="text-[9px] font-bold px-1.5 py-0.5 bg-destructive/10 text-destructive rounded">0 pts</span>;
                    }

                    return (
                      <div 
                        key={idx}
                        className="p-3.5 bg-slate-950/40 border border-slate-900 rounded-xl flex items-center justify-between gap-4 text-sm"
                      >
                        {/* Nombre del Amigo */}
                        <div className="flex flex-col gap-0.5">
                          <span className="font-extrabold text-foreground">{row.participantName}</span>
                          {!row.isPaid && (
                            <span className="text-[8px] font-black text-destructive tracking-wider uppercase animate-pulse">Pago Pendiente</span>
                          )}
                        </div>

                        {/* Predicción */}
                        <div className="flex items-center gap-3">
                          {isSecret ? (
                            <span className="text-slate-500 font-bold text-xs flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-900">
                              <Lock className="h-3 w-3" /> Oculto
                            </span>
                          ) : hasPred ? (
                            <div className="flex items-center gap-2">
                              <span className="font-black text-accent bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-900 tracking-wider">
                                {row.prediction?.home_score} - {row.prediction?.away_score}
                              </span>
                              {ptsBadge}
                            </div>
                          ) : (
                            <span className="text-slate-600 font-semibold text-xs italic">
                              Sin pronóstico
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/80 border-t border-border/80 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedMatch(null)}
                className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
              >
                Cerrar Lista
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
