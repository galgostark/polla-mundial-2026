'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart2, 
  Trophy, 
  Sparkles, 
  HelpCircle,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Award,
  Zap,
  Calendar,
  Shield,
  Rocket
} from 'lucide-react';
import Navbar from '../../../../components/Navbar';
import { usePollaSession } from '../../../../hooks/usePollaSession';
import { StatsService } from '../../../../services/api';
import { FunStats } from '../../../../types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EstadisticasGradaPage({ params }: PageProps) {
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

  // Estados
  const [stats, setStats] = useState<FunStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!sessionLoading && !participant && !isAdmin) {
      router.push(`/polla/${pollaId}/unirse`);
    }
  }, [sessionLoading, participant, isAdmin, pollaId, router]);

  const loadStats = async () => {
    try {
      setLoadingData(true);
      const data = await StatsService.getFunStats(pollaId);
      setStats(data);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (pollaId) {
      loadStats();
    }
  }, [pollaId]);

  const formatWinners = (names: string[]) => {
    if (!names || names.length === 0) return 'Aún sin ganadores';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} y ${names[1]}`;
    return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
  };

  if (sessionLoading || loadingData) {
    return (
      <div className="min-h-screen bg-[#070a13] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <span className="text-sm font-bold text-slate-400">Analizando estadísticas de la grada...</span>
        </div>
      </div>
    );
  }

  // Verificar si hay alguna estadística válida (si ya terminaron partidos)
  const hasActiveStats = stats && (
    stats.oraculoDelGol !== null || 
    stats.elPina !== null || 
    stats.nostradamus !== null || 
    stats.reyDeLaFase !== null ||
    stats.elAmarrete !== null ||
    stats.elOptimista !== null ||
    stats.alineacionPlanetaria !== null ||
    stats.laEstafaColectiva !== null
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6 animate-fade-in">
        
        {/* Cabecera */}
        <div className="p-6 glass border border-border rounded-3xl shadow-lg flex items-center gap-3 soccer-glow">
          <div className="p-2.5 bg-accent/10 border border-accent/20 text-accent rounded-2xl">
            <BarChart2 className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">
              Estadísticas de "La Grada" 📣
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Los trofeos y distinciones más divertidas de la comunidad de amigos. ¡Mira quién se corona y quién paga la piña!
            </p>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        {hasActiveStats && stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. EL ORÁCULO DEL GOL */}
            <div className="glass border border-border p-6 rounded-3xl flex flex-col justify-between gap-6 soccer-glow relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute top-[-20%] right-[-10%] w-[120px] h-[120px] rounded-full bg-accent/5 blur-[30px] -z-10 group-hover:bg-accent/10 transition-colors" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">🔮</span>
                  <span className="text-[10px] font-black tracking-wider uppercase bg-accent/15 text-accent px-2.5 py-1 rounded-full border border-accent/25">
                    Máximo Acierto Exacto
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-foreground group-hover:text-accent transition-colors">
                    El Oráculo del Gol 🔮
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Distinción honorífica para el o los participantes con mayor número de plenos (marcador exacto) adivinados. ¡Tienen un ojo en el futuro!
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-850 flex items-center justify-between mt-4 gap-4">
                {stats.oraculoDelGol ? (
                  <>
                    <div className="flex flex-col flex-1 min-w-0 text-left">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {stats.oraculoDelGol.participantNames.length > 1 ? 'Líderes' : 'Líder'}
                      </span>
                      <span className="text-sm font-extrabold text-foreground break-words leading-tight">{formatWinners(stats.oraculoDelGol.participantNames)}</span>
                    </div>
                    <div className="flex flex-col text-right flex-shrink-0">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Plenos</span>
                      <span className="text-base font-black text-accent">{stats.oraculoDelGol.count} {stats.oraculoDelGol.count === 1 ? 'acierto' : 'aciertos'}</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold italic text-center w-full">Aún sin ganadores</span>
                )}
              </div>
            </div>

            {/* 2. EL PIÑA (🍍) */}
            <div className="glass border border-border p-6 rounded-3xl flex flex-col justify-between gap-6 soccer-glow relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute top-[-20%] right-[-10%] w-[120px] h-[120px] rounded-full bg-yellow-500/5 blur-[30px] -z-10 group-hover:bg-yellow-500/10 transition-colors" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-3xl animate-bounce">🍍</span>
                  <span className="text-[10px] font-black tracking-wider uppercase bg-yellow-500/15 text-yellow-500 px-2.5 py-1 rounded-full border border-yellow-500/25">
                    El Más Salado / Mala Suerte
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-foreground group-hover:text-yellow-400 transition-colors">
                    El Piña del Grupo 🍍
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Premio de consolación para quien ha acumulado la mayor cantidad de pronósticos fallados por completo (cero puntos) en partidos finalizados. ¡La suerte les dio la espalda!
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-850 flex items-center justify-between mt-4 gap-4">
                {stats.elPina ? (
                  <>
                    <div className="flex flex-col flex-1 min-w-0 text-left">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {stats.elPina.participantNames.length > 1 ? 'Participantes' : 'Participante'}
                      </span>
                      <span className="text-sm font-extrabold text-foreground break-words leading-tight">{formatWinners(stats.elPina.participantNames)}</span>
                    </div>
                    <div className="flex flex-col text-right flex-shrink-0">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Partidos en Blanco</span>
                      <span className="text-base font-black text-yellow-400">{stats.elPina.count} {stats.elPina.count === 1 ? 'errado' : 'errados'}</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold italic text-center w-full">Aún sin ganadores</span>
                )}
              </div>
            </div>

            {/* 3. EL NOSTRADAMUS */}
            <div className="glass border border-border p-6 rounded-3xl flex flex-col justify-between gap-6 soccer-glow relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute top-[-20%] right-[-10%] w-[120px] h-[120px] rounded-full bg-primary/5 blur-[30px] -z-10 group-hover:bg-primary/10 transition-colors" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">🔮</span>
                  <span className="text-[10px] font-black tracking-wider uppercase bg-primary/15 text-primary px-2.5 py-1 rounded-full border border-primary/25">
                    Rey del Empate
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">
                    El Místico Nostradamus 🔮
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Otorgado a quien acertó la mayor cantidad de empates exactos. Los empates son los pronósticos estadísticamente más complejos de clavar.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-850 flex items-center justify-between mt-4 gap-4">
                {stats.nostradamus ? (
                  <>
                    <div className="flex flex-col flex-1 min-w-0 text-left">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {stats.nostradamus.participantNames.length > 1 ? 'Profetas' : 'Profeta'}
                      </span>
                      <span className="text-sm font-extrabold text-foreground break-words leading-tight">{formatWinners(stats.nostradamus.participantNames)}</span>
                    </div>
                    <div className="flex flex-col text-right flex-shrink-0">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Empates Clavados</span>
                      <span className="text-base font-black text-primary">{stats.nostradamus.count} {stats.nostradamus.count === 1 ? 'empate' : 'empates'}</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold italic text-center w-full">Aún sin ganadores</span>
                )}
              </div>
            </div>

            {/* 4. EL REY DE LA FASE */}
            <div className="glass border border-border p-6 rounded-3xl flex flex-col justify-between gap-6 soccer-glow relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute top-[-20%] right-[-10%] w-[120px] h-[120px] rounded-full bg-emerald-500/5 blur-[30px] -z-10 group-hover:bg-emerald-500/10 transition-colors" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">🔥</span>
                  <span className="text-[10px] font-black tracking-wider uppercase bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/25">
                    Hito de Fase Única
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-foreground group-hover:text-emerald-400 transition-colors">
                    El Rey de la Fase
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Para el competidor que ha acumulado la puntuación más alta en una fase específica del torneo (ya sea Fase de Grupos o Brackets de Eliminatorias).
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-850 flex items-center justify-between mt-4 gap-4">
                {stats.reyDeLaFase ? (
                  <>
                    <div className="flex flex-col flex-1 min-w-0 text-left">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {stats.reyDeLaFase.participantNames.length > 1 ? 'Líderes Absolutos' : 'Líder Absoluto'}
                      </span>
                      <span className="text-sm font-extrabold text-foreground break-words leading-tight">{formatWinners(stats.reyDeLaFase.participantNames)}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">En: {stats.reyDeLaFase.phase}</span>
                    </div>
                    <div className="flex flex-col text-right flex-shrink-0">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Puntos de Fase</span>
                      <span className="text-base font-black text-emerald-400">{stats.reyDeLaFase.points} pts</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold italic text-center w-full">Aún sin ganadores</span>
                )}
              </div>
            </div>

            {/* 5. EL AMARRETE DEL GRUPO (🛡️) */}
            <div className="glass border border-border p-6 rounded-3xl flex flex-col justify-between gap-6 soccer-glow relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute top-[-20%] right-[-10%] w-[120px] h-[120px] rounded-full bg-cyan-500/5 blur-[30px] -z-10 group-hover:bg-cyan-500/10 transition-colors" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">🛡️</span>
                  <span className="text-[10px] font-black tracking-wider uppercase bg-cyan-500/15 text-cyan-450 px-2.5 py-1 rounded-full border border-cyan-500/25">
                    Rey del Antifútbol
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-foreground group-hover:text-cyan-400 transition-colors">
                    El Amarrete del Grupo 🛡️
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Para quien predijo la mayor cantidad de partidos con marcadores ultra-defensivos (0-0, 1-0, 0-1). ¡Asegurando el arco en cero antes del espectáculo!
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-850 flex items-center justify-between mt-4 gap-4">
                {stats.elAmarrete ? (
                  <>
                    <div className="flex flex-col flex-1 min-w-0 text-left">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {stats.elAmarrete.participantNames.length > 1 ? 'Especuladores' : 'Especulador'}
                      </span>
                      <span className="text-sm font-extrabold text-foreground break-words leading-tight">{formatWinners(stats.elAmarrete.participantNames)}</span>
                    </div>
                    <div className="flex flex-col text-right flex-shrink-0">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Preds Tacañas</span>
                      <span className="text-base font-black text-cyan-450">{stats.elAmarrete.count} marcadores</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold italic text-center w-full">Aún sin ganadores</span>
                )}
              </div>
            </div>

            {/* 6. EL OPTIMISTA DEL GOL (🚀) */}
            <div className="glass border border-border p-6 rounded-3xl flex flex-col justify-between gap-6 soccer-glow relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute top-[-20%] right-[-10%] w-[120px] h-[120px] rounded-full bg-pink-500/5 blur-[30px] -z-10 group-hover:bg-pink-500/10 transition-colors" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">🚀</span>
                  <span className="text-[10px] font-black tracking-wider uppercase bg-pink-500/15 text-pink-400 px-2.5 py-1 rounded-full border border-pink-500/25">
                    Rey del Show
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-foreground group-hover:text-pink-400 transition-colors">
                    El Optimista del Gol 🚀
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Premio al participante que colocó la mayor cantidad total de goles predichos en su cartilla completa. ¡Quieren ver redes infladas!
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-850 flex items-center justify-between mt-4 gap-4">
                {stats.elOptimista ? (
                  <>
                    <div className="flex flex-col flex-1 min-w-0 text-left">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {stats.elOptimista.participantNames.length > 1 ? 'Optimistas' : 'Optimista'}
                      </span>
                      <span className="text-sm font-extrabold text-foreground break-words leading-tight">{formatWinners(stats.elOptimista.participantNames)}</span>
                    </div>
                    <div className="flex flex-col text-right flex-shrink-0">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Goles Totales</span>
                      <span className="text-base font-black text-pink-400">{stats.elOptimista.count} goles</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold italic text-center w-full">Aún sin ganadores</span>
                )}
              </div>
            </div>

            {/* 7. ALINEACIÓN PLANETARIA (🪐) */}
            <div className="glass border border-border p-6 rounded-3xl flex flex-col justify-between gap-6 soccer-glow relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute top-[-20%] right-[-10%] w-[120px] h-[120px] rounded-full bg-emerald-500/5 blur-[30px] -z-10 group-hover:bg-emerald-500/10 transition-colors" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">🪐</span>
                  <span className="text-[10px] font-black tracking-wider uppercase bg-emerald-500/15 text-emerald-450 px-2.5 py-1 rounded-full border border-emerald-500/25">
                    Milagro Colectivo
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-foreground group-hover:text-emerald-450 transition-colors">
                    Alineación Planetaria 🪐
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Partidos mágicos donde absolutamente todos los participantes sumaron puntos. ¡La grada estuvo de fiesta!
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-850 flex flex-col mt-4 gap-2">
                {stats.alineacionPlanetaria ? (
                  <>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-left">
                      Partidos Clave
                    </span>
                    <div className="max-h-[120px] overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
                      {stats.alineacionPlanetaria.map((m) => (
                        <div key={m.id} className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-900 text-xs">
                          <span className="truncate font-semibold text-slate-200">
                            {m.home_team?.name} vs {m.away_team?.name}
                          </span>
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/20 font-black">
                            {m.home_score} - {m.away_score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold italic text-center py-2 w-full">Aún sin partidos</span>
                )}
              </div>
            </div>

            {/* 8. LA ESTAFA COLECTIVA (🤡) */}
            <div className="glass border border-border p-6 rounded-3xl flex flex-col justify-between gap-6 soccer-glow relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute top-[-20%] right-[-10%] w-[120px] h-[120px] rounded-full bg-rose-500/5 blur-[30px] -z-10 group-hover:bg-rose-500/10 transition-colors" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">🤡</span>
                  <span className="text-[10px] font-black tracking-wider uppercase bg-rose-500/15 text-rose-450 px-2.5 py-1 rounded-full border border-rose-500/25">
                    Cero Absoluto
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-foreground group-hover:text-rose-400 transition-colors">
                    La Estafa Colectiva 🤡
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Partidos fatídicos en los que absolutamente nadie del grupo sumó un solo punto. ¡O jugaron horrible o nos estafaron!
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-850 flex flex-col mt-4 gap-2">
                {stats.laEstafaColectiva ? (
                  <>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-left">
                      Partidos Fatídicos
                    </span>
                    <div className="max-h-[120px] overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
                      {stats.laEstafaColectiva.map((m) => (
                        <div key={m.id} className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-900 text-xs">
                          <span className="truncate font-semibold text-slate-200">
                            {m.home_team?.name} vs {m.away_team?.name}
                          </span>
                          <span className="text-[10px] bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded-lg border border-rose-500/20 font-black">
                            {m.home_score} - {m.away_score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold italic text-center py-2 w-full">Aún sin partidos</span>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* ESTADO VACÍO (FASE DE CALENTAMIENTO) */
          <div className="p-8 sm:p-12 glass border border-border rounded-3xl text-center space-y-6 soccer-glow">
            
            <div className="mx-auto h-20 w-20 rounded-full bg-slate-900/60 border border-border flex items-center justify-center text-4xl animate-pulse">
              🏟️
            </div>
            
            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-2xl font-black text-foreground">
                ¡La Grada está calentando motores! 📣⚽
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Las estadísticas de la polla y los trofeos (como el afamado 🍍 **El Piña** o el galardonado 🔮 **El Oráculo del Gol**) se habilitarán automáticamente tan pronto como comience el mundial y finalice el primer partido real.
              </p>
            </div>

            <div className="pt-4 flex justify-center gap-4 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-900">
                <Zap className="h-3.5 w-3.5 text-accent animate-pulse" />
                Cálculos en caliente
              </span>
              <span className="flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-900">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Inicia Junio 11
              </span>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
