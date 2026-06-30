'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  Share2, 
  Download, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Users,
  Coins,
  Copy,
  Check,
  Eye,
  X,
  TrendingUp,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import Navbar from '../../../components/Navbar';
import { usePollaSession } from '../../../hooks/usePollaSession';
import { PollaService, PredictionsService, MatchesService } from '../../../services/api';
import { Participant, Prediction, BracketPrediction, Match } from '../../../types';
import { mockTeams } from '../../../utils/mockData';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PollaDashboardPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const pollaId = resolvedParams.id;

  // Cargar sesión de polla
  const { 
    loading: sessionLoading, 
    polla, 
    participant, 
    isAdmin, 
    logout,
    refreshSession
  } = usePollaSession(pollaId);

  // Estados de Datos
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  // Modal para inspeccionar otro participante (Espiar)
  const [inspectParticipant, setInspectParticipant] = useState<Participant | null>(null);
  const [inspectPredictions, setInspectPredictions] = useState<Prediction[]>([]);
  const [inspectBracket, setInspectBracket] = useState<BracketPrediction | null>(null);
  const [inspectMatches, setInspectMatches] = useState<Match[]>([]);
  const [loadingInspection, setLoadingInspection] = useState(false);

  useEffect(() => {
    // Redirigir a registrarse si no hay participante y no es el administrador directo
    if (!sessionLoading && !participant && !isAdmin) {
      router.push(`/polla/${pollaId}/unirse`);
    }
  }, [sessionLoading, participant, isAdmin, pollaId, router]);

  const loadLeaderboard = async () => {
    try {
      setLoadingData(true);
      const data = await PollaService.getParticipants(pollaId);
      setParticipants(data);
    } catch (err) {
      console.error('Error al cargar la tabla de posiciones:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (pollaId) {
      loadLeaderboard();
    }
  }, [pollaId]);

  const getInviteLink = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/polla/${pollaId}`;
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(getInviteLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  // Función para abrir modal y espiar cartilla de un amigo
  const handleInspect = async (part: Participant) => {
    try {
      setInspectParticipant(part);
      setLoadingInspection(true);
      
      const [preds, bracket, matchesList] = await Promise.all([
        PredictionsService.getPredictions(part.id),
        PredictionsService.getBracketPrediction(part.id),
        MatchesService.getMatches()
      ]);
      
      // Ordenar predicciones cronológicamente conforme se juegan los partidos
      const sortedPreds = [...preds].sort((a, b) => {
        const matchA = matchesList.find(m => m.id === a.match_id);
        const matchB = matchesList.find(m => m.id === b.match_id);
        if (!matchA || !matchB) return a.match_id - b.match_id;
        return new Date(matchA.match_date).getTime() - new Date(matchB.match_date).getTime();
      });
      
      setInspectPredictions(sortedPreds);
      setInspectBracket(bracket);
      setInspectMatches(matchesList);
    } catch (err) {
      console.error('Error al inspeccionar participante:', err);
    } finally {
      setLoadingInspection(false);
    }
  };
  // Exportar a Excel
  const exportToExcel = () => {
    if (participants.length === 0) return;
    
    const excelData = participants.map((p, idx) => ({
      Posición: idx + 1,
      Participante: p.name,
      'Puntos Totales': p.total_points,
      'Pts Grupos (Partidos)': p.groups_match_points || 0,
      'Pts R32 (Partidos)': p.r32_match_points || 0,
      'Pts R32 (Equipos)': p.bracket_points || 0,
      'Marcadores Exactos (Plenos)': p.exact_matches,
      'Aciertos Simples': p.correct_results,
      Estado: p.is_paid ? 'Pago Confirmado' : 'Pago Pendiente'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clasificación');
    
    // Auto-ajustar anchos de columnas
    const maxLen = excelData.reduce((acc, row) => {
      Object.keys(row).forEach((key, colIdx) => {
        const val = row[key as keyof typeof row].toString();
        acc[colIdx] = Math.max(acc[colIdx] || 0, val.length, key.length);
      });
      return acc;
    }, [] as number[]);
    
    worksheet['!cols'] = maxLen.map(w => ({ wch: w + 2 }));

    XLSX.writeFile(workbook, `Ranking_Polla_${polla?.name.replace(/\s+/g, '_')}_2026.xlsx`);
  };

  // Exportar a PDF
  const exportToPdf = () => {
    if (participants.length === 0 || !polla) return;

    const doc = new jsPDF();
    const title = `Tabla de Posiciones - ${polla.name}`;
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Costo de Entrada: ${polla.entry_fee > 0 ? `${polla.currency} ${polla.entry_fee}` : 'Gratuito'}`, 14, 34);
    
    // Dibujar línea separadora
    doc.setDrawColor(16, 185, 129); // Color primario verde
    doc.setLineWidth(0.8);
    doc.line(14, 38, 196, 38);
    
    // Cabecera de Tabla
    let currentY = 46;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9); // reducir tamaño de letra un poco para encajar columnas
    doc.text('Pos', 14, currentY);
    doc.text('Participante', 24, currentY);
    doc.text('Pts Tot', 72, currentY);
    doc.text('Pts Grupos', 90, currentY);
    doc.text('Pts R32 (Part)', 112, currentY);
    doc.text('Pts R32 (Equi)', 138, currentY);
    doc.text('Plenos', 165, currentY);
    doc.text('Simples', 182, currentY);
    
    // Dibujar línea debajo de la cabecera
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, currentY + 3, 196, currentY + 3);
    
    currentY += 10;
    doc.setFont('Helvetica', 'normal');
    
    participants.forEach((p, idx) => {
      if (currentY > 275) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.text((idx + 1).toString(), 15, currentY);
      doc.text(p.name, 24, currentY);
      doc.text(p.total_points.toString(), 76, currentY);
      doc.text((p.groups_match_points || 0).toString(), 96, currentY);
      doc.text((p.r32_match_points || 0).toString(), 120, currentY);
      doc.text((p.bracket_points || 0).toString(), 146, currentY);
      doc.text(p.exact_matches.toString(), 170, currentY);
      doc.text(p.correct_results.toString(), 187, currentY);
      
      currentY += 8;
    });

    doc.save(`Ranking_Polla_${polla.name.replace(/\s+/g, '_')}_2026.pdf`);
  };

  if (sessionLoading || loadingData) {
    return (
      <div className="min-h-screen bg-[#070a13] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <span className="text-sm font-bold text-slate-400">Cargando ranking en vivo...</span>
        </div>
      </div>
    );
  }

  // Filtrar participantes según término de búsqueda
  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estadísticas del Pozo
  const paidParticipantsCount = participants.filter(p => p.is_paid).length;
  const entryFeeVal = polla?.entry_fee || 0;
  const totalPot = paidParticipantsCount * entryFeeVal;

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* ======================================= */}
        {/* RESUMEN DE LA POLLA (POZO Y COMPARTE) */}
        {/* ======================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Tarjeta 1: Pozo Acumulado */}
          <div className="glass border border-border p-6 rounded-3xl flex items-center gap-4 soccer-glow">
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl text-accent">
              <Coins className="h-8 w-8 shrink-0" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pozo Total Acumulado</span>
              <span className="text-3xl font-black text-accent block mt-0.5">
                {polla?.currency} {totalPot.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                ({paidParticipantsCount} de {participants.length} pagos confirmados)
              </span>
            </div>
          </div>

          {/* Tarjeta 2: Participantes Inscritos */}
          <div className="glass border border-border p-6 rounded-3xl flex items-center gap-4 soccer-glow">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-primary">
              <Users className="h-8 w-8 shrink-0" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Participantes Totales</span>
              <span className="text-3xl font-black text-primary block mt-0.5">
                {participants.length}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Jugando en este grupo de amigos
              </span>
            </div>
          </div>

          {/* Tarjeta 3: Copiar Invitación */}
          <div className="glass border border-border p-6 rounded-3xl flex flex-col justify-between gap-3 soccer-glow">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Invita a más amigos</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Comparte el enlace de tu polla por redes sociales</span>
            </div>

            <div className="flex gap-2 p-1 bg-slate-950/80 border border-slate-850 rounded-xl items-center">
              <span className="flex-1 truncate pl-3 text-xs font-mono text-slate-400">
                {getInviteLink()}
              </span>
              <button
                onClick={copyInviteLink}
                className="px-3.5 py-2.5 bg-secondary hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

        </div>

        {/* ======================================= */}
        {/* TABLA DE CLASIFICACIÓN (RANKING) */}
        {/* ======================================= */}
        <div className="glass border border-border rounded-3xl overflow-hidden shadow-xl soccer-glow">
          
          {/* Header de la Tabla (Buscador y Exportar) */}
          <div className="p-6 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-foreground flex items-center gap-1.5">
                <TrendingUp className="h-5 w-5 text-primary" />
                Tabla de Posiciones General
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Puntajes en vivo calculados automáticamente conforme terminan los partidos.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-3">
              
              {/* Buscador */}
              <div className="relative w-full sm:w-56">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar amigo..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-850 rounded-xl text-white placeholder-slate-500 font-medium text-xs focus:outline-none focus:border-primary transition-colors"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              </div>

              {/* Botones de Exportar */}
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={exportToExcel}
                  title="Exportar a Excel"
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                  Excel
                </button>
                <button
                  onClick={exportToPdf}
                  title="Exportar a PDF"
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FileText className="h-4 w-4 text-rose-500" />
                  PDF
                </button>
              </div>

            </div>
          </div>

          {/* Tabla Responsive */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-border">
                  <th className="py-4 px-6 text-center w-16">Puesto</th>
                  <th className="py-4 px-6">Participante</th>
                  <th className="py-4 px-6 text-center">Puntos Totales</th>
                  <th className="py-4 px-6 text-center">Pts Grupos</th>
                  <th className="py-4 px-6 text-center">Pts R32 (Partidos)</th>
                  <th className="py-4 px-6 text-center">Pts R32 (Equipos)</th>
                  <th className="py-4 px-6 text-center">Acierto Marcador (Plenos)</th>
                  <th className="py-4 px-6 text-center">Acierto Partido (Simples)</th>
                  <th className="py-4 px-6 text-center w-32">Estado</th>
                  <th className="py-4 px-6 text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredParticipants.length > 0 ? (
                  filteredParticipants.map((part, index) => {
                    const isCurrentUser = participant?.id === part.id;
                    const position = index + 1;
                    
                    // Iconos para el podio
                    let posBadge = <span>{position}</span>;
                    if (position === 1) posBadge = <span className="text-xl">🥇</span>;
                    if (position === 2) posBadge = <span className="text-xl">🥈</span>;
                    if (position === 3) posBadge = <span className="text-xl">🥉</span>;

                    return (
                      <tr 
                        key={part.id}
                        className={`transition-colors duration-150 ${
                          isCurrentUser 
                            ? 'bg-primary/10 hover:bg-primary/15 border-l-4 border-l-primary font-bold' 
                            : 'hover:bg-slate-900/30'
                        }`}
                      >
                        {/* Puesto */}
                        <td className="py-4 px-6 text-center font-extrabold text-sm text-slate-300">
                          {posBadge}
                        </td>
                        
                        {/* Participante */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">{part.name}</span>
                            {isCurrentUser && (
                              <span className="text-[9px] px-2 py-0.5 bg-primary/20 text-primary rounded-full font-bold uppercase shrink-0">
                                Tú
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Puntos Totales */}
                        <td className="py-4 px-6 text-center text-base font-black text-primary">
                          {part.total_points}
                        </td>

                        {/* Pts Grupos */}
                        <td className="py-4 px-6 text-center text-sm text-slate-300 font-semibold">
                          {part.groups_match_points || 0} <span className="text-[10px] text-slate-500 font-medium">pts</span>
                        </td>

                        {/* Pts R32 (Partidos) */}
                        <td className="py-4 px-6 text-center text-sm text-slate-300 font-semibold">
                          {part.r32_match_points || 0} <span className="text-[10px] text-slate-500 font-medium">pts</span>
                        </td>

                        {/* Pts R32 (Equipos) */}
                        <td className="py-4 px-6 text-center text-sm text-emerald-400 font-bold">
                          {part.bracket_points || 0} <span className="text-[10px] text-slate-500 font-medium">pts</span>
                        </td>

                        {/* Acierto Marcador (Plenos) */}
                        <td className="py-4 px-6 text-center text-sm font-extrabold text-accent">
                          {part.exact_matches} <span className="text-[10px] text-slate-500 font-medium ml-1">({part.exact_matches * 4} pts)</span>
                        </td>

                        {/* Acierto Partido (Simples) */}
                        <td className="py-4 px-6 text-center text-sm text-slate-300 font-semibold">
                          {part.correct_results} <span className="text-[10px] text-slate-500 font-medium ml-1">({part.correct_results * 3} pts)</span>
                        </td>

                        {/* Estado de Pago */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center">
                            {part.is_paid ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20">
                                <CheckCircle2 className="h-3 w-3 shrink-0" /> Pago Listo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
                                <AlertTriangle className="h-3 w-3 shrink-0" /> Pendiente
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Acciones (Espiar) */}
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleInspect(part)}
                            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Espiar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-bold text-sm">
                      {searchTerm ? 'No se encontraron participantes con ese nombre.' : 'Aún no se ha unido ningún participante a esta polla.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* ======================================= */}
      {/* MODAL DE INSPECCIÓN (ESPIAR CARTILLA DE AMIGO) */}
      {/* ======================================= */}
      {inspectParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] glass border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header del Modal */}
            <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Eye className="h-5 w-5 text-accent animate-pulse" />
                  Cartilla de {inspectParticipant.name}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Inspeccionando predicciones de fase de grupos y brackets.
                </p>
              </div>
              <button 
                onClick={() => setInspectParticipant(null)}
                className="p-1 rounded-full hover:bg-secondary text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cuerpo del Modal (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingInspection ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="text-xs text-slate-400 font-bold">Espiando cartilla...</span>
                </div>
              ) : (
                <>
                  {/* Puntos y Resumen */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-850 text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Puntos Acumulados</span>
                      <span className="text-2xl font-black text-primary block mt-0.5">{inspectParticipant.total_points}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-850 text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Plenos Acertados</span>
                      <span className="text-2xl font-black text-accent block mt-0.5">{inspectParticipant.exact_matches}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-850 text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Aciertos Simples</span>
                      <span className="text-2xl font-black text-slate-300 block mt-0.5">{inspectParticipant.correct_results}</span>
                    </div>
                  </div>

                  {/* Desglose de Puntos */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850 space-y-2 text-xs">
                    <h5 className="font-extrabold text-slate-300 border-b border-slate-850 pb-2 flex justify-between">
                      <span>📊 Desglose de Puntuación</span>
                      <span className="text-primary font-black">{inspectParticipant.total_points} pts totales</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                      <div className="flex justify-between sm:flex-col sm:justify-start gap-1">
                        <span className="text-slate-400 font-bold text-[10px] uppercase">Acierto Marcador (Plenos)</span>
                        <span className="font-mono text-accent font-black text-sm">{inspectParticipant.exact_matches} x 4 pts = {inspectParticipant.exact_matches * 4} pts</span>
                      </div>
                      <div className="flex justify-between sm:flex-col sm:justify-start gap-1 border-t sm:border-t-0 sm:border-l border-slate-850 pt-2 sm:pt-0 sm:pl-4">
                        <span className="text-slate-400 font-bold text-[10px] uppercase">Acierto Partido (Simples)</span>
                        <span className="font-mono text-slate-300 font-black text-sm">{inspectParticipant.correct_results} x 3 pts = {inspectParticipant.correct_results * 3} pts</span>
                      </div>
                      <div className="flex justify-between sm:flex-col sm:justify-start gap-1 border-t sm:border-t-0 sm:border-l border-slate-850 pt-2 sm:pt-0 sm:pl-4">
                        <span className="text-slate-400 font-bold text-[10px] uppercase">Equipos Clasificados R32</span>
                        <span className="font-mono text-emerald-400 font-black text-sm">{inspectParticipant.total_points - (inspectParticipant.exact_matches * 4 + inspectParticipant.correct_results * 3)} pts</span>
                      </div>
                    </div>
                  </div>

                  {/* El Podio Pronosticado */}
                  <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-850 space-y-4">
                    <h4 className="text-sm font-black text-foreground border-b border-border/60 pb-2">
                      🏆 Predicciones del Podio
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Campeón del Mundo 🏆</span>
                        <div className="text-sm font-extrabold text-accent flex items-center gap-1.5">
                          {inspectBracket?.champion_team_id ? (
                            <>
                              <span className="bg-accent/15 text-accent text-xs px-2 py-0.5 rounded">
                                {inspectBracket.champion_team_id}
                              </span>
                              <span>
                                {inspectMatches[0] ? mockTeams.find(t => t.id === inspectBracket.champion_team_id)?.name : inspectBracket.champion_team_id}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-500 font-semibold">Sin predecir</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Subcampeón 🥈</span>
                        <div className="text-sm font-extrabold text-slate-300 flex items-center gap-1.5">
                          {inspectBracket?.runner_up_team_id ? (
                            <>
                              <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded">
                                {inspectBracket.runner_up_team_id}
                              </span>
                              <span>
                                {inspectMatches[0] ? mockTeams.find(t => t.id === inspectBracket.runner_up_team_id)?.name : inspectBracket.runner_up_team_id}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-500 font-semibold">Sin predecir</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Detalle de Partidos Predichos (Grupos y Eliminatorias) */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-foreground">
                      ⚽ Cartilla de Predicciones
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {inspectPredictions.length > 0 ? (
                        inspectPredictions.map(pred => {
                          const match = inspectMatches.find(m => m.id === pred.match_id);
                          if (!match) return null;
                          
                          // Puntos ganados en esta apuesta
                          let ptsBadge = null;
                          if (pred.points_won !== null) {
                            if (pred.points_won === 4) ptsBadge = <span className="text-[9px] font-bold px-1.5 py-0.5 bg-accent/20 text-accent rounded shrink-0">4 pts</span>;
                            else if (pred.points_won === 3) ptsBadge = <span className="text-[9px] font-bold px-1.5 py-0.5 bg-primary/20 text-primary rounded shrink-0">3 pts</span>;
                            else ptsBadge = <span className="text-[9px] font-bold px-1.5 py-0.5 bg-destructive/10 text-destructive rounded shrink-0">0 pts</span>;
                          }

                          return (
                            <div key={pred.id} className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex items-center justify-between gap-3 text-xs">
                              <div className="flex flex-col text-left shrink-0">
                                <span className="font-mono text-slate-500 font-bold">#{pred.match_id}</span>
                                {match.stage !== 'GROUPS' && (
                                  <span className="text-[7px] bg-slate-900 text-slate-400 font-extrabold px-1 py-0.5 rounded uppercase tracking-wider mt-0.5 block max-w-fit">
                                    {match.stage === 'ROUND_32' ? 'R32' : match.stage === 'ROUND_16' ? 'R16' : match.stage}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex-1 flex flex-col items-center min-w-0">
                                <div className="flex items-center justify-between gap-2 w-full">
                                  <span className="font-extrabold text-slate-300 truncate text-right w-16">{match.home_team_id || 'TBD'}</span>
                                  <div className="flex flex-col items-center shrink-0">
                                    <span className="font-black bg-slate-900 px-2.5 py-1 rounded text-accent">
                                      {pred.home_score} - {pred.away_score}
                                    </span>
                                    {pred.home_score === pred.away_score && match.stage !== 'GROUPS' && pred.penalty_winner_id && (
                                      <span className="text-[7px] text-slate-400 font-extrabold mt-0.5">
                                        Pen: {pred.penalty_winner_id === match.home_team_id ? 'Local' : 'Visita'}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-extrabold text-slate-300 truncate text-left w-16">{match.away_team_id || 'TBD'}</span>
                                </div>
                                {match.status === 'FINISHED' && (
                                  <span className="text-[8px] text-slate-500 font-bold block text-center mt-1">
                                    Real: {match.home_score}-{match.away_score}
                                    {match.stage !== 'GROUPS' && match.home_score === match.away_score && match.penalties_home !== null && match.penalties_away !== null && (
                                      <> ({match.penalties_home}-{match.penalties_away} pen)</>
                                    )}
                                  </span>
                                )}
                              </div>
                              
                              {ptsBadge}
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-2 text-center py-6 text-slate-500 font-bold text-xs">
                          Este participante aún no ha rellenado predicciones de marcadores.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-4 bg-slate-950/80 border-t border-border/80 flex justify-end shrink-0">
              <button
                onClick={() => setInspectParticipant(null)}
                className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
              >
                Cerrar Cartilla
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
