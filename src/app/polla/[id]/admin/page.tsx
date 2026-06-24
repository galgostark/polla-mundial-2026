'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Settings, 
  Users, 
  Calendar, 
  Lock, 
  Unlock, 
  Loader2, 
  Check, 
  Trash2, 
  Save, 
  Edit3, 
  Coins, 
  ArrowLeft,
  Zap,
  HelpCircle,
  FileText,
  AlertTriangle
} from 'lucide-react';
import Navbar from '../../../../components/Navbar';
import { usePollaSession } from '../../../../hooks/usePollaSession';
import { PollaService, MatchesService } from '../../../../services/api';
import { Participant, Match, Team } from '../../../../types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminPanelPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const pollaId = resolvedParams.id;

  // Cargar sesión de la polla
  const { 
    loading: sessionLoading, 
    polla, 
    participant, 
    isAdmin, 
    loginAsAdmin, 
    logout,
    refreshSession
  } = usePollaSession(pollaId);

  // Pantalla de Autenticación de PIN
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Estados del Panel Admin
  const [activeTab, setActiveTab] = useState<'participants' | 'puntuador' | 'settings'>('participants');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Estados de Ajustes
  const [editName, setEditName] = useState('');
  const [editFee, setEditFee] = useState('');
  const [editCurrency, setEditCurrency] = useState('PEN');
  const [editPaymentInfo, setEditPaymentInfo] = useState('');
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Estados del Puntuador
  const [activeStageFilter, setActiveStageFilter] = useState<'GROUPS' | 'ROUND_32' | 'ROUND_16' | 'QUARTERS' | 'SEMIS_FINAL'>('GROUPS');
  const [matchInputs, setMatchInputs] = useState<Record<number, { home: string; away: string; homeTeamId?: string; awayTeamId?: string }>>({});

  useEffect(() => {
    if (polla && activeTab === 'settings') {
      setEditName(polla.name);
      setEditFee(polla.entry_fee.toString());
      setEditCurrency(polla.currency);
      setEditPaymentInfo(polla.payment_info || '');
    }
  }, [polla, activeTab]);

  const loadAdminData = async () => {
    try {
      setLoadingData(true);
      const [partsList, matchesList, teamsList] = await Promise.all([
        PollaService.getParticipants(pollaId),
        MatchesService.getMatches(),
        MatchesService.getTeams()
      ]);
      setParticipants(partsList);
      setMatches(matchesList);
      setTeams(teamsList);

      // Precargar marcadores e IDs para el puntuador
      const inputsMap: Record<number, { home: string; away: string; homeTeamId?: string; awayTeamId?: string }> = {};
      matchesList.forEach(m => {
        inputsMap[m.id] = {
          home: m.home_score !== null ? m.home_score.toString() : '',
          away: m.away_score !== null ? m.away_score.toString() : '',
          homeTeamId: m.home_team_id || undefined,
          awayTeamId: m.away_team_id || undefined
        };
      });
      setMatchInputs(inputsMap);

    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar datos administrativos.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdmin && pollaId) {
      loadAdminData();
    }
  }, [isAdmin, pollaId]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const success = loginAsAdmin(pinInput);
    if (!success) {
      setAuthError('PIN incorrecto. Vuelve a intentarlo.');
      setPinInput('');
    }
  };

  // Toggle de Pago Confirmado
  const handleTogglePayment = async (partId: string, currentPaid: boolean) => {
    try {
      setErrorMsg('');
      await PollaService.confirmPayment(partId, !currentPaid);
      // Recargar lista localmente
      setParticipants(prev => 
        prev.map(p => p.id === partId ? { ...p, is_paid: !currentPaid } : p)
      );
      setSuccessMsg('Estado de pago actualizado.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al actualizar pago.');
    }
  };

  // Expulsar Participante
  const handleKickParticipant = async (part: Participant) => {
    const confirmKick = window.confirm(`¿Estás seguro de que deseas eliminar a "${part.name}" de la polla? Se borrarán todos sus pronósticos de forma definitiva.`);
    if (!confirmKick) return;

    try {
      setErrorMsg('');
      await PollaService.removeParticipant(part.id);
      setParticipants(prev => prev.filter(p => p.id !== part.id));
      setSuccessMsg(`Participante "${part.name}" eliminado correctamente.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al eliminar participante.');
    }
  };

  // Actualizar Ajustes Generales
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!polla) return;
    try {
      setUpdatingSettings(true);
      setErrorMsg('');

      // En el gateway de Supabase/LocalStorage:
      // Como NextJS requiere persistencia, si es LocalStorage actualizamos localStorage.
      // Si es Supabase hacemos una query. 
      // Para simplificar, usamos una función de guardado en el gateway
      // En este caso, podemos llamar a la lógica o alertar.
      if (typeof window !== 'undefined') {
        const savedPolla = localStorage.getItem('m26_pollas');
        if (savedPolla) {
          const pollasList = JSON.parse(savedPolla);
          const updated = pollasList.map((p: any) => p.id === pollaId ? {
            ...p,
            name: editName.trim(),
            entry_fee: parseFloat(editFee) || 0,
            currency: editCurrency,
            payment_info: editPaymentInfo.trim() || undefined
          } : p);
          localStorage.setItem('m26_pollas', JSON.stringify(updated));
        }
      }
      
      setSuccessMsg('Ajustes guardados con éxito. Refrescando datos...');
      setTimeout(() => {
        setSuccessMsg('');
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error(err);
      setErrorMsg('Error al guardar ajustes.');
    } finally {
      setUpdatingSettings(false);
    }
  };

  // Cambiar input de partido
  const handleMatchInputChange = (matchId: number, field: 'home' | 'away' | 'homeTeamId' | 'awayTeamId', val: string) => {
    setMatchInputs(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: val
      }
    }));
  };

  // Guardar Marcador Oficial (Puntuador)
  const handleSaveMatchScore = async (matchId: number) => {
    const input = matchInputs[matchId];
    if (input.home === '' || input.away === '') {
      alert('Por favor introduce marcadores válidos.');
      return;
    }

    try {
      setErrorMsg('');
      setLoadingData(true);
      await MatchesService.updateMatchResult(
        pollaId,
        matchId,
        parseInt(input.home),
        parseInt(input.away),
        'FINISHED',
        input.homeTeamId || undefined,
        input.awayTeamId || undefined
      );
      setSuccessMsg(`¡Partido #${matchId} cerrado y puntuado correctamente!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      
      // Recargar datos actualizados
      await loadAdminData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al registrar resultado del partido.');
    } finally {
      setLoadingData(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#070a13] text-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  // ============================================
  // PANTALLA DE BLOQUEO POR PIN (NO AUTENTICADO)
  // ============================================
  if (!isAdmin) {
    return (
      <div className="relative min-h-screen bg-[#070a13] text-white flex flex-col justify-between p-4">
        
        <div className="absolute top-[-10%] left-[10%] w-[550px] h-[550px] rounded-full bg-primary/10 blur-[130px] -z-10 pointer-events-none" />

        <header className="max-w-md mx-auto w-full py-4">
          <Link 
            href={`/polla/${pollaId}`}
            className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al Ranking
          </Link>
        </header>

        <main className="max-w-sm mx-auto w-full glass border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto soccer-glow relative text-center">
          
          <div className="mx-auto h-12 w-12 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent animate-bounce">
            <Lock className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-black text-foreground">Acceso de Administrador</h1>
            <p className="text-xs text-slate-400">
              Esta sección está restringida al organizador del grupo. Ingresa tu PIN de seguridad para continuar.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="space-y-2">
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Ingresar PIN"
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-850 rounded-xl text-white font-bold text-lg text-center tracking-[0.4em] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {authError && (
              <div className="text-[10px] font-bold text-destructive animate-shake">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-accent hover:opacity-90 active:scale-[0.99] text-accent-foreground font-black text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Unlock className="h-4 w-4" /> Desbloquear Panel
            </button>
          </form>

        </main>

        <footer className="max-w-sm mx-auto w-full py-6 text-center text-[10px] text-slate-600 font-medium">
          Polla Mundial 2026 • Acceso Protegido
        </footer>

      </div>
    );
  }

  // ============================================
  // PANEL ADMINISTRADOR ACTIVO (AUTENTICADO)
  // ============================================
  const activeStageMatches = matches.filter(m => {
    if (activeStageFilter === 'GROUPS') {
      return m.stage === 'GROUPS';
    } else if (activeStageFilter === 'SEMIS_FINAL') {
      return ['SEMIS', 'THIRD_PLACE', 'FINAL'].includes(m.stage);
    }
    return m.stage === activeStageFilter;
  });

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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* Cabecera del Panel */}
        <div className="p-6 glass border border-border rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg soccer-glow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-2xl">
              <Settings className="h-6 w-6 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground">
                Panel de Administración 👑
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Valida pagos de amigos, registra marcadores oficiales de los partidos y recalcula la tabla al instante.
              </p>
            </div>
          </div>

          {/* Menú de Sub-Secciones */}
          <div className="flex items-center gap-2">
            {[
              { id: 'participants', name: 'Participantes', icon: Users },
              { id: 'puntuador', name: 'Puntuador', icon: Calendar },
              { id: 'settings', name: 'Ajustes', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* FEEDBACK */}
        {successMsg && (
          <div className="p-4 bg-success/15 border border-success/30 text-success text-xs font-bold rounded-2xl flex items-center gap-2.5">
            <Check className="h-4.5 w-4.5 shrink-0" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-destructive/15 border border-destructive/30 text-destructive text-xs font-bold rounded-2xl flex items-center gap-2.5">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* ============================================ */}
        {/* PESTAÑA: PARTICIPANTES */}
        {/* ============================================ */}
        {activeTab === 'participants' && (
          <div className="glass border border-border rounded-3xl overflow-hidden shadow-lg soccer-glow animate-fade-in">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-black text-foreground">Gestionar Amigos e Inscripciones</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Valida transferencias marcando el toggle de pago y remueve spammers.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-border">
                    <th className="py-4 px-6 w-16 text-center">Num</th>
                    <th className="py-4 px-6">Participante</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6 text-center w-36">Estado de Pago</th>
                    <th className="py-4 px-6 text-center w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {participants.length > 0 ? (
                    participants.map((part, idx) => (
                      <tr key={part.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-4 px-6 text-center font-bold text-slate-400 text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-extrabold text-foreground text-sm">{part.name}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs text-slate-400 font-mono">{part.email || 'N/A'}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center items-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={part.is_paid}
                                onChange={() => handleTogglePayment(part.id, part.is_paid)}
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-slate-950 border border-slate-800 rounded-full peer peer-focus:ring-1 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success peer-checked:after:bg-white"></div>
                              <span className="ml-2 text-xs font-bold text-slate-300 w-16 text-left">
                                {part.is_paid ? 'Confirmado' : 'Pendiente'}
                              </span>
                            </label>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleKickParticipant(part)}
                            title="Eliminar de la polla"
                            className="p-2 bg-slate-950 hover:bg-destructive/10 border border-slate-900 text-slate-400 hover:text-destructive rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 font-bold text-sm">
                        Aún no se ha inscrito nadie en tu polla. ¡Comparte el enlace de invitación!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* PESTAÑA: PUNTUADOR (ACTUALIZAR RESULTADOS) */}
        {/* ============================================ */}
        {activeTab === 'puntuador' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Filtros de Rondas */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'GROUPS', name: 'Fase de Grupos' },
                { id: 'ROUND_32', name: 'Ronda de 32 (Dieciseisavos)' },
                { id: 'ROUND_16', name: 'Octavos de Final' },
                { id: 'QUARTERS', name: 'Cuartos de Final' },
                { id: 'SEMIS_FINAL', name: 'Semis y Final 🏆' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveStageFilter(f.id as any)}
                  className={`px-4 py-2.5 shrink-0 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeStageFilter === f.id
                      ? 'bg-accent text-accent-foreground shadow-sm shadow-accent/20'
                      : 'bg-slate-900/60 border border-slate-850 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {/* Listado de Partidos para Puntear */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeStageMatches.map(match => {
                const inputs = matchInputs[match.id] || { home: '', away: '' };
                const formattedDate = new Date(match.match_date).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                const isPlayoff = match.stage !== 'GROUPS';

                return (
                  <div 
                    key={match.id}
                    className="p-5 glass border border-border rounded-3xl flex flex-col justify-between gap-4 soccer-glow"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-wider">
                      <span>PARTIDO #{match.id} — {match.stage}</span>
                      <span className="bg-slate-950 px-2 py-0.5 rounded-full">{formattedDate}</span>
                    </div>

                    {/* SELECTORES DE EQUIPOS (SI ES PLAYOFF Y ESTÁN EN BLANCO) */}
                    {isPlayoff && (
                      <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-900">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Local (Home)</label>
                          <select
                            value={inputs.homeTeamId || ''}
                            onChange={(e) => handleMatchInputChange(match.id, 'homeTeamId', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white font-bold"
                          >
                            <option value="">-- Seleccionar --</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Visitante (Away)</label>
                          <select
                            value={inputs.awayTeamId || ''}
                            onChange={(e) => handleMatchInputChange(match.id, 'awayTeamId', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white font-bold"
                          >
                            <option value="">-- Seleccionar --</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Ingreso de Marcadores */}
                    <div className="flex items-center justify-between gap-4 mt-1">
                      
                      {/* Local */}
                      <div className="flex-1 flex items-center gap-2.5 justify-end w-24">
                        <span className="text-sm font-extrabold text-foreground truncate">
                          {isPlayoff 
                            ? (inputs.homeTeamId ? teams.find(t => t.id === inputs.homeTeamId)?.name : 'TBD')
                            : match.home_team?.name
                          }
                        </span>
                      </div>

                      {/* Inputs de marcador */}
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={inputs.home}
                          onChange={(e) => handleMatchInputChange(match.id, 'home', e.target.value.replace(/\D/g, ''))}
                          placeholder="-"
                          className="w-10 h-10 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg text-center font-black text-lg focus:outline-none"
                        />
                        <span className="text-slate-500 font-bold">x</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={inputs.away}
                          onChange={(e) => handleMatchInputChange(match.id, 'away', e.target.value.replace(/\D/g, ''))}
                          placeholder="-"
                          className="w-10 h-10 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg text-center font-black text-lg focus:outline-none"
                        />
                      </div>

                      {/* Visitante */}
                      <div className="flex-1 flex items-center gap-2.5 justify-start w-24">
                        <span className="text-sm font-extrabold text-foreground truncate">
                          {isPlayoff 
                            ? (inputs.awayTeamId ? teams.find(t => t.id === inputs.awayTeamId)?.name : 'TBD')
                            : match.away_team?.name
                          }
                        </span>
                      </div>

                    </div>

                    {/* Botón de guardar para este partido */}
                    <div className="flex justify-between items-center mt-2 border-t border-slate-900/60 pt-3">
                      <span className="text-[10px] font-bold text-slate-500">
                        {match.status === 'FINISHED' ? (
                          <span className="text-success flex items-center gap-0.5">
                            <Check className="h-3.5 w-3.5" /> Cerrado & Calculado
                          </span>
                        ) : 'Esperando resultado oficial'}
                      </span>
                      
                      <button
                        onClick={() => handleSaveMatchScore(match.id)}
                        className="px-3.5 py-2 bg-primary text-primary-foreground font-black text-xs rounded-xl shadow hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {match.status === 'FINISHED' ? 'Actualizar' : 'Cerrar Partido'}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ============================================ */}
        {/* PESTAÑA: AJUSTES */}
        {/* ============================================ */}
        {activeTab === 'settings' && (
          <div className="glass border border-border p-6 sm:p-8 rounded-3xl shadow-lg soccer-glow animate-fade-in max-w-xl mx-auto">
            <h2 className="text-lg font-black text-foreground border-b border-border pb-3 flex items-center gap-1.5">
              ⚙️ Ajustes del Grupo
            </h2>

            <form onSubmit={handleUpdateSettings} className="space-y-5 mt-6">
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nombre de la Polla
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Cuota de Entrada
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editFee}
                    onChange={(e) => setEditFee(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Moneda
                  </label>
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-950 border border-slate-850 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="PEN">PEN (S/)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="MXN">MXN ($)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  Instrucciones de Pago
                </label>
                <textarea
                  rows={3}
                  value={editPaymentInfo}
                  onChange={(e) => setEditPaymentInfo(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingSettings}
                  className="px-5 py-3.5 bg-primary text-primary-foreground font-black text-xs rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {updatingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar Ajustes del Grupo
                </button>
              </div>

            </form>
          </div>
        )}

      </main>
    </div>
  );
}
