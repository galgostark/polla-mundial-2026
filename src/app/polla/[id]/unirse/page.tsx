'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Trophy, 
  UserPlus, 
  Coins, 
  CheckCircle, 
  ArrowLeft,
  ChevronRight,
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';
import { PollaService } from '../../../../services/api';
import { Polla } from '../../../../types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UnirsePollaPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const pollaId = resolvedParams.id;

  const [polla, setPolla] = useState<Polla | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkSessionAndLoadPolla = async () => {
      try {
        // 1. Si el usuario ya tiene sesión iniciada para esta polla, redirigir al dashboard directo
        const savedPartId = localStorage.getItem(`m26_session_${pollaId}`);
        if (savedPartId) {
          router.push(`/polla/${pollaId}`);
          return;
        }

        // 2. Cargar detalles del grupo
        const pollaData = await PollaService.getPolla(pollaId);
        setPolla(pollaData);
      } catch (err) {
        console.error(err);
        setError('El enlace de invitación es inválido o la polla ya no existe.');
      } finally {
        setLoading(false);
      }
    };

    if (pollaId) {
      checkSessionAndLoadPolla();
    }
  }, [pollaId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor escribe tu nombre o apodo.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Validar si el apodo ya existe en esta polla
      const participants = await PollaService.getParticipants(pollaId);
      const nameExists = participants.some(p => p.name.trim().toLowerCase() === name.trim().toLowerCase());
      
      if (nameExists) {
        setError('¡Este apodo ya está en uso por otro participante! Por favor elige otro apodo o agrégale un distintivo.');
        setSubmitting(false);
        return;
      }

      // Registrar al participante
      const newPart = await PollaService.joinPolla(pollaId, name.trim(), email.trim() || undefined);
      
      // Guardar sesión en localStorage
      localStorage.setItem(`m26_session_${pollaId}`, newPart.id);
      
      // Redirigir directamente a llenar su cartilla
      router.push(`/polla/${pollaId}/pronosticos`);
      
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al unirte a la polla. Por favor inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a13] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-t-primary border-slate-800 rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-400">Verificando invitación...</span>
        </div>
      </div>
    );
  }

  if (error && !polla) {
    return (
      <div className="min-h-screen bg-[#070a13] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md glass border border-destructive/20 rounded-2xl p-6 text-center space-y-4">
          <Trophy className="h-12 w-12 text-destructive mx-auto animate-pulse" />
          <h2 className="text-xl font-bold text-foreground">Acceso Denegado</h2>
          <p className="text-sm text-slate-300">{error}</p>
          <div className="pt-2">
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#070a13] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      
      <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[130px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="max-w-xl mx-auto w-full py-4">
        <Link 
          href="/" 
          className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al Inicio
        </Link>
      </header>

      {/* Main container */}
      <main className="max-w-md mx-auto w-full glass border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto soccer-glow relative">
        
        {/* Info de la Polla */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
            Invitación Recibida
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {polla?.name}
          </h1>
          <p className="text-slate-400 text-xs">
            ¡Te han invitado a unirte a este grupo! Rellena tus datos abajo para empezar a competir.
          </p>
        </div>

        {/* Tarjeta del Pozo y Pago */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Coins className="h-4 w-4 text-accent" /> Cuota de Entrada
            </span>
            <span className="text-lg font-black text-accent">
              {polla && polla.entry_fee > 0 ? `${polla.currency} ${polla.entry_fee}` : '¡Gratuito! 🎁'}
            </span>
          </div>

          {polla?.payment_info && (
            <div className="pt-2 border-t border-slate-800/60 text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Método e Instrucciones del Organizador</span>
              <p className="text-xs text-slate-300 font-mono mt-1 bg-slate-950/80 p-2.5 rounded-lg whitespace-pre-line text-center border border-slate-800">
                {polla.payment_info}
              </p>
            </div>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-2">
            <label htmlFor="nickname" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Tu Apodo o Nombre en la Polla
            </label>
            <input
              id="nickname"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Ej: El Dibu, Golazooo9, Lapadula"
              className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-850 rounded-xl text-white placeholder-slate-500 font-medium text-sm focus:outline-none focus:border-primary transition-colors text-center"
            />
            <p className="text-[9px] text-slate-500">Este nombre será público para todos los demás amigos del grupo en la tabla de posiciones.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              Correo Electrónico
              <span className="text-[9px] text-slate-500 font-bold lowercase tracking-normal font-sans">(opcional)</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: correo@ejemplo.com"
              className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-850 rounded-xl text-white placeholder-slate-500 font-medium text-sm focus:outline-none focus:border-primary transition-colors text-center"
            />
            <p className="text-[9px] text-slate-500">Nos sirve para resguardar o recuperar tu cartilla de marcadores si cambias de celular.</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-primary text-primary-foreground font-black text-base rounded-xl hover:opacity-90 active:scale-[0.99] transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? 'Registrando...' : 'Unirme y Llenar Cartilla ⚽'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </form>

      </main>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full py-6 text-center text-xs text-slate-600 font-medium">
        Polla Mundial 2026 • Registro Privado de Participantes
      </footer>

    </div>
  );
}
