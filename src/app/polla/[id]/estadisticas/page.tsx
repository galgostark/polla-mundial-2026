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
  Calendar
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
    stats.pulpoPaul !== null || 
    stats.elPina !== null || 
    stats.nostradamus !== null || 
    stats.reyDeLaFase !== null
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. EL PULPO PAUL */}
            <div className="glass border border-border p-6 rounded-3xl flex flex-col justify-between gap-6 soccer-glow relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute top-[-20%] right-[-10%] w-[120px] h-[120px] rounded-full bg-accent/5 blur-[30px] -z-10 group-hover:bg-accent/10 transition-colors" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-3xl">🏆</span>
                  <span className="text-[10px] font-black tracking-wider uppercase bg-accent/15 text-accent px-2.5 py-1 rounded-full border border-accent/25">
                    Máximo Acierto Exacto
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-foreground group-hover:text-accent transition-colors">
                    El Pulpo Paul de la Polla
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Distinción honorífica para el participante con mayor número de plenos (marcador exacto) adivinados. ¡Tiene un ojo del futuro!
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-850 flex items-center justify-between mt-4">
                {stats.pulpoPaul ? (
                  <>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Líder</span>
                      <span className="text-base font-extrabold text-foreground">{stats.pulpoPaul.participantName}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Plenos</span>
                      <span className="text-xl font-black text-accent">{stats.pulpoPaul.count} aciertos</span>
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
                    Premio de consolación para quien ha acumulado la mayor cantidad de pronósticos fallados por completo (cero puntos) en partidos finalizados. ¡La suerte le dio la espalda!
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-850 flex items-center justify-between mt-4">
                {stats.elPina ? (
                  <>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Participante</span>
                      <span className="text-base font-extrabold text-foreground">{stats.elPina.participantName}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Partidos en Blanco</span>
                      <span className="text-xl font-black text-yellow-400">{stats.elPina.count} errados</span>
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
                    El Místico Nostradamus
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Otorgado a quien acertó la mayor cantidad de empates exactos. Los empates son los pronósticos estadísticamente más complejos de clavar.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-850 flex items-center justify-between mt-4">
                {stats.nostradamus ? (
                  <>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Profeta</span>
                      <span className="text-base font-extrabold text-foreground">{stats.nostradamus.participantName}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Empates Clavados</span>
                      <span className="text-xl font-black text-primary">{stats.nostradamus.count} empates</span>
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

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-850 flex items-center justify-between mt-4">
                {stats.reyDeLaFase ? (
                  <>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Líder Absoluto</span>
                      <span className="text-base font-extrabold text-foreground">{stats.reyDeLaFase.participantName}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">En: {stats.reyDeLaFase.phase}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Puntos de Fase</span>
                      <span className="text-xl font-black text-emerald-400">{stats.reyDeLaFase.points} pts</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold italic text-center w-full">Aún sin ganadores</span>
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
                Las estadísticas divertidas de la polla y los trofeos (como el afamado 🍍 **El Piña** o el galardonado 🏆 **Pulpo Paul**) se habilitarán automáticamente tan pronto como comience el mundial y finalice el primer partido real.
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
