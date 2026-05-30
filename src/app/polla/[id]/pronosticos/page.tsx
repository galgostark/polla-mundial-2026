'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  Trophy, 
  Lock, 
  Loader2, 
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Navbar from '../../../../components/Navbar';
import { usePollaSession } from '../../../../hooks/usePollaSession';
import { MatchesService, PredictionsService } from '../../../../services/api';
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

  // Navegación de Fases e Inputs
  const [activeMainTab, setActiveMainTab] = useState<'groups' | 'bracket'>('groups');
  const [activeGroupTab, setActiveGroupTab] = useState('A');
  const [groupPredictions, setGroupPredictions] = useState<Record<number, { home: string; away: string }>>({});
  
  // Estados para Bracket Prediction
  const [champion, setChampion] = useState<string>('');
  const [runnerUp, setRunnerUp] = useState<string>('');
  const [semis, setSemis] = useState<string[]>([]);
  const [quarters, setQuarters] = useState<string[]>([]);
  const [r16, setR16] = useState<string[]>([]);

  // 12 Grupos oficiales
  const groupsList = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  useEffect(() => {
    // Redirigir a unirse si no se encuentra sesión activa (excepto si es admin simulando)
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
        const predsMap: Record<number, { home: string; away: string }> = {};
        
        // Poblar con las predicciones guardadas
        savedPreds.forEach(pr => {
          predsMap[pr.match_id] = {
            home: pr.home_score.toString(),
            away: pr.away_score.toString()
          };
        });

        // Poblar por defecto con vacíos para los partidos que falten
        loadedMatches.forEach(m => {
          if (!predsMap[m.id]) {
            predsMap[m.id] = { home: '', away: '' };
          }
        });

        setGroupPredictions(predsMap);

        // Cargar bracket prediction guardada
        const savedBracket = await PredictionsService.getBracketPrediction(participant.id);
        if (savedBracket) {
          setChampion(savedBracket.champion_team_id || '');
          setRunnerUp(savedBracket.runner_up_team_id || '');
          setSemis(savedBracket.semifinalists || []);
          setQuarters(savedBracket.quarterfinalists || []);
          setR16(savedBracket.round_of_16 || []);
        }

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
    // Si somos administrador simulando resultados reales, nada está cerrado
    // Pero en el formulario de predicciones de participante común:
    const matchTime = new Date(matchDateStr).getTime();
    const nowTime = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    return nowTime >= (matchTime - fiveMinutes);
  };

  const handleScoreChange = (matchId: number, side: 'home' | 'away', val: string) => {
    // Solo permitir números
    const cleanVal = val.replace(/\D/g, '');
    
    setGroupPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [side]: cleanVal
      }
    }));
    setErrorMsg('');
  };

  // Guardar cartilla de partidos
  const handleSavePredictions = async () => {
    if (!participant) return;
    
    // Validar que hayan completado todos los pronósticos del grupo activo para dar feedback
    const activeGroupMatches = matches.filter(m => m.stage === 'GROUPS' && m.home_team?.group_letter === activeGroupTab);
    const incomplete = activeGroupMatches.some(m => {
      const pred = groupPredictions[m.id];
      return !pred || pred.home === '' || pred.away === '';
    });

    if (incomplete) {
      // Dejamos guardar incompleto (muy útil si quieren ir por partes), pero les advertimos amigablemente
      setSuccessMsg('Guardado parcial realizado. Recuerda completar todos los marcadores antes de que inicie el mundial.');
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      
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
          
          return {
            match_id: matchId,
            home_score: parseInt(pred.home),
            away_score: parseInt(pred.away)
          };
        })
        .filter(Boolean) as { match_id: number; home_score: number; away_score: number }[];

      if (predictionsPayload.length > 0) {
        await PredictionsService.savePredictions(participant.id, predictionsPayload);
      }

      // Disparar confeti en el éxito 🎉
      confetti({
        particleCount: 80,
        spread: 50,
        origin: { y: 0.8 }
      });

      if (!incomplete) {
        setSuccessMsg('¡Tus pronósticos de la fase de grupos se han guardado con éxito! ⚽🏆');
      }
      
      setTimeout(() => setSuccessMsg(''), 4000);
      
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al guardar predicciones.');
    } finally {
      setSubmitting(false);
    }
  };

  // Guardar predicción de Brackets
  const handleSaveBracket = async () => {
    if (!participant) return;
    try {
      setSubmitting(true);
      setErrorMsg('');

      await PredictionsService.saveBracketPrediction(participant.id, {
        champion_team_id: champion || null,
        runner_up_team_id: runnerUp || null,
        semifinalists: semis,
        quarterfinalists: quarters,
        round_of_16: r16
      });

      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.7 }
      });

      setSuccessMsg('¡Tus predicciones del cuadro de eliminatorias y Campeón se guardaron con éxito! 🏆🌟');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al guardar el cuadro.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper para manejar selecciones múltiples (semis, quarters, r16)
  const toggleTeamInList = (teamId: string, list: string[], setList: (l: string[]) => void, max: number) => {
    if (list.includes(teamId)) {
      setList(list.filter(id => id !== teamId));
    } else {
      if (list.length >= max) {
        // Reemplazar el primero si está lleno
        setList([...list.slice(1), teamId]);
      } else {
        setList([...list, teamId]);
      }
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

  // Filtrar los partidos de grupos para el grupo activo
  const activeGroupMatches = matches.filter(
    m => m.stage === 'GROUPS' && m.home_team?.group_letter === activeGroupTab
  );

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
              Pronostica marcadores y define tu campeón. Puedes modificarlos en cualquier momento hasta 5 minutos antes de cada partido.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveMainTab('groups')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                activeMainTab === 'groups'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              1. Fase de Grupos
            </button>
            <button
              onClick={() => setActiveMainTab('bracket')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                activeMainTab === 'bracket'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              2. Brackets y Campeón
            </button>
          </div>
        </div>

        {/* FEEDBACK MENSAJES */}
        {successMsg && (
          <div className="mt-4 p-4 bg-success/15 border border-success/30 text-success text-sm font-bold rounded-2xl flex items-center gap-2.5 animate-bounce">
            <CheckCircle className="h-5 w-5 shrink-0" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-4 bg-destructive/15 border border-destructive/30 text-destructive text-sm font-bold rounded-2xl flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* ======================================= */}
        {/* PESTAÑA: FASE DE GRUPOS */}
        {/* ======================================= */}
        {activeMainTab === 'groups' && (
          <div className="mt-6 space-y-6 animate-fade-in">
            
            {/* Sub-Pestañas de Grupos A-L */}
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
                      ? 'bg-accent text-accent-foreground shadow-sm shadow-accent/20'
                      : 'bg-slate-900/60 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Grupo {grp}
                </button>
              ))}
            </div>

            {/* Listado de Partidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGroupMatches.map(match => {
                const isClosed = isMatchClosed(match.match_date);
                const pred = groupPredictions[match.id] || { home: '', away: '' };
                const formattedDate = new Date(match.match_date).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div 
                    key={match.id} 
                    className={`relative p-5 glass border rounded-2xl flex flex-col justify-between gap-4 transition-all soccer-glow ${
                      isClosed ? 'opacity-85 border-slate-900 bg-slate-950/20' : 'border-border'
                    }`}
                  >
                    
                    {/* Header del Partido */}
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-wider">
                      <span>PARTIDO #{match.id}</span>
                      <span className="bg-slate-900 px-2 py-0.5 rounded-full">{formattedDate}</span>
                    </div>

                    {/* Inputs de Marcador */}
                    <div className="flex items-center justify-between gap-4 mt-2">
                      
                      {/* Local */}
                      <div className="flex-1 flex items-center gap-2.5 justify-end">
                        <span className="text-sm font-extrabold text-foreground truncate">{match.home_team?.name}</span>
                        {match.home_team?.flag_url && (
                          <img 
                            src={match.home_team.flag_url} 
                            alt={match.home_team.name}
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
                      <div className="flex-1 flex items-center gap-2.5 justify-start">
                        {match.away_team?.flag_url && (
                          <img 
                            src={match.away_team.flag_url} 
                            alt={match.away_team.name}
                            className="h-5 w-7 object-cover rounded shadow-sm shrink-0 border border-slate-800"
                          />
                        )}
                        <span className="text-sm font-extrabold text-foreground truncate">{match.away_team?.name}</span>
                      </div>

                    </div>

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
                Guardar Fase de Grupos
              </button>
            </div>

          </div>
        )}

        {/* ======================================= */}
        {/* PESTAÑA: BRACKETS (CUADRO Y CAMPEÓN) */}
        {/* ======================================= */}
        {activeMainTab === 'bracket' && (
          <div className="mt-6 space-y-8 animate-fade-in">
            
            <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 text-xs font-bold text-slate-200 flex gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-accent shrink-0" />
              <span>
                Para acumular puntos adicionales, selecciona qué equipos crees que pasarán a cada una de las fases finales del mundial. ¡Puedes elegir a cualquiera de las 48 selecciones participantes!
              </span>
            </div>

            {/* SECCIÓN 1: CAMPEÓN Y SUBCAMPEÓN */}
            <div className="glass border border-border p-6 rounded-3xl space-y-6 soccer-glow">
              <h2 className="text-lg font-black text-foreground border-b border-border pb-3 flex items-center gap-1.5">
                👑 El Podio del Mundial
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Campeón */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-accent uppercase tracking-wider">
                    Mi Campeón del Mundo 🏆
                  </label>
                  <select
                    value={champion}
                    onChange={(e) => setChampion(e.target.value)}
                    className="w-full px-3 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    <option value="">-- Seleccionar Campeón --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subcampeón */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Subcampeón del Mundo 🥈
                  </label>
                  <select
                    value={runnerUp}
                    onChange={(e) => setRunnerUp(e.target.value)}
                    className="w-full px-3 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    <option value="">-- Seleccionar Subcampeón --</option>
                    {teams.filter(t => t.id !== champion).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* SECCIÓN 2: SEMIFINALISTAS (4) */}
            <div className="glass border border-border p-6 rounded-3xl space-y-4 soccer-glow">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h2 className="text-lg font-black text-foreground">
                  🔥 Semifinalistas (4 Equipos)
                </h2>
                <span className="text-xs bg-slate-900 text-slate-300 font-extrabold px-2.5 py-1 rounded-full">
                  Elegidos: {semis.length}/4
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {teams.map(t => {
                  const selected = semis.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTeamInList(t.id, semis, setSemis, 4)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                        selected
                          ? 'bg-primary/20 border-primary text-primary shadow-sm shadow-primary/10 scale-105'
                          : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t.flag_url && (
                        <img src={t.flag_url} alt={t.name} className="h-5 w-7 object-cover rounded shadow-sm border border-slate-800" />
                      )}
                      <span className="truncate w-full">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 3: CUARTOS DE FINAL (8) */}
            <div className="glass border border-border p-6 rounded-3xl space-y-4 soccer-glow">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h2 className="text-lg font-black text-foreground">
                  ⭐ Cuartos de Final (8 Equipos)
                </h2>
                <span className="text-xs bg-slate-900 text-slate-300 font-extrabold px-2.5 py-1 rounded-full">
                  Elegidos: {quarters.length}/8
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {teams.map(t => {
                  const selected = quarters.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTeamInList(t.id, quarters, setQuarters, 8)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                        selected
                          ? 'bg-primary/20 border-primary text-primary shadow-sm shadow-primary/10 scale-105'
                          : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t.flag_url && (
                        <img src={t.flag_url} alt={t.name} className="h-5 w-7 object-cover rounded shadow-sm border border-slate-800" />
                      )}
                      <span className="truncate w-full">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 4: OCTAVOS DE FINAL (16) */}
            <div className="glass border border-border p-6 rounded-3xl space-y-4 soccer-glow">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h2 className="text-lg font-black text-foreground">
                  🌌 Octavos de Final (16 Equipos)
                </h2>
                <span className="text-xs bg-slate-900 text-slate-300 font-extrabold px-2.5 py-1 rounded-full">
                  Elegidos: {r16.length}/16
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {teams.map(t => {
                  const selected = r16.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTeamInList(t.id, r16, setR16, 16)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                        selected
                          ? 'bg-primary/20 border-primary text-primary shadow-sm shadow-primary/10 scale-105'
                          : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t.flag_url && (
                        <img src={t.flag_url} alt={t.name} className="h-5 w-7 object-cover rounded shadow-sm border border-slate-800" />
                      )}
                      <span className="truncate w-full">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botón de Guardado */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveBracket}
                disabled={submitting}
                className="px-6 py-4 bg-accent text-accent-foreground font-black text-base rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5 animate-bounce" />
                )}
                Guardar Cuadro y Campeón
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
