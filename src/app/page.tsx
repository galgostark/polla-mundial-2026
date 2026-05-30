'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Trophy, 
  Users, 
  Sparkles, 
  ChevronRight, 
  Smartphone, 
  ArrowRight, 
  Coins, 
  Zap, 
  ShieldAlert
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [pollaCode, setPollaCode] = useState('');
  const [error, setError] = useState('');

  const handleJoinPolla = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollaCode.trim()) {
      setError('Por favor ingresa un código o enlace válido.');
      return;
    }

    // Extraer UUID de polla si el usuario pega todo el enlace completo
    let cleanCode = pollaCode.trim();
    if (cleanCode.includes('/polla/')) {
      const parts = cleanCode.split('/polla/');
      if (parts.length > 1) {
        cleanCode = parts[1].split('/')[0].split('?')[0];
      }
    }

    // Validar formato UUID básico
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(cleanCode)) {
      router.push(`/polla/${cleanCode}`);
    } else {
      setError('Código o enlace inválido. Revisa que tenga el formato de polla (ej. uuid).');
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070a13] text-white flex flex-col justify-between">
      
      {/* Luces reflectoras de fondo (Neon Estadio) */}
      <div className="absolute top-[-10%] left-[5%] w-[800px] h-[800px] rounded-full bg-primary/10 blur-[150px] -z-10 pointer-events-none glow-animation" />
      <div className="absolute bottom-[-10%] right-[5%] w-[600px] h-[600px] rounded-full bg-accent/5 blur-[150px] -z-10 pointer-events-none" />

      {/* Header simple */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Trophy className="h-8 w-8 text-accent shrink-0 animate-bounce" />
          <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-primary via-emerald-400 to-accent bg-clip-text text-transparent">
            POLLA MUNDIAL 2026
          </span>
        </div>
        <div className="text-xs bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full text-slate-300 font-bold flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-success rounded-full animate-ping" />
          Mundial FIFA 2026
        </div>
      </header>

      {/* Cuerpo principal */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex flex-col lg:flex-row items-center gap-16 z-10 my-auto">
        
        {/* Lado Izquierdo - Copy e Impacto */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-extrabold mx-auto lg:mx-0">
            <Sparkles className="h-4 w-4 text-accent" />
            La emoción de jugar en grupo
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-foreground">
            Arma la quiniela <br className="hidden sm:inline" />
            del mundial con <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-black">
              tus amigos en vivo
            </span>
          </h1>

          <p className="text-slate-300 text-lg sm:text-xl font-normal max-w-xl mx-auto lg:mx-0 leading-relaxed">
            La plataforma definitiva y móvil-primero para pronosticar los marcadores de la Copa del Mundo 2026. Calcula puntos, maneja cuotas de entrada y compite en tiempo real.
          </p>

          {/* Botones de acción principales */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <Link
              href="/crear"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground font-black text-lg rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 hover:shadow-primary/30 active:scale-95 transition-all text-center flex items-center justify-center gap-2 group cursor-pointer"
            >
              Crear mi Polla 🏆
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#unirse"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 text-slate-200 font-bold text-lg rounded-2xl hover:bg-slate-850 hover:text-white transition-colors text-center cursor-pointer"
            >
              ¿Cómo funciona?
            </a>
          </div>

          {/* Mini Estadísticas */}
          <div className="grid grid-cols-3 gap-6 border-t border-slate-800/80 pt-8 max-w-md mx-auto lg:mx-0">
            <div>
              <span className="block text-2xl font-black text-primary">100%</span>
              <span className="text-xs text-slate-400 font-semibold">Realtime</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-accent">104</span>
              <span className="text-xs text-slate-400 font-semibold">Partidos</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-success">48</span>
              <span className="text-xs text-slate-400 font-semibold">Selecciones</span>
            </div>
          </div>

        </div>

        {/* Lado Derecho - Formulario de Unión e Ilustración */}
        <div id="unirse" className="w-full lg:max-w-md glass border border-slate-800/80 rounded-3xl p-6 sm:p-8 soccer-glow shadow-2xl relative">
          
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 bg-accent text-accent-foreground text-xs font-black px-3 py-1 rounded-lg uppercase tracking-wider shadow-md">
            Móvil Primero 📱
          </div>

          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
            ¿Tienes una invitación?
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Pega el enlace o ingresa el código de la polla que te compartió tu amigo para unirte de inmediato.
          </p>

          <form onSubmit={handleJoinPolla} className="mt-6 space-y-4">
            <div>
              <label htmlFor="code" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Código / Link de la Polla
              </label>
              <input
                id="code"
                type="text"
                value={pollaCode}
                onChange={(e) => {
                  setPollaCode(e.target.value);
                  setError('');
                }}
                placeholder="Pega el link o código aquí..."
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 font-medium text-sm focus:outline-none focus:border-primary transition-colors text-center font-mono"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold animate-shake">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-accent hover:opacity-90 active:scale-[0.99] text-accent-foreground font-black text-base rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              Ingresar a la Polla
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Cómo jugar rápido */}
          <div className="mt-8 pt-8 border-t border-slate-800/80 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider">
              ¿Cómo empezar a jugar?
            </h3>
            
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 text-primary font-black text-sm flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Crea tu Polla</h4>
                <p className="text-xs text-slate-400 mt-0.5">Elige el nombre, el monto del pozo e instrucciones de pago.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-accent/10 border border-accent/20 text-accent font-black text-sm flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Invita a tus Amigos</h4>
                <p className="text-xs text-slate-400 mt-0.5">Comparte el enlace único por WhatsApp en segundos.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Pronostica y Gana</h4>
                <p className="text-xs text-slate-400 mt-0.5">Llena marcadores, clasifica equipos y domina la tabla en vivo.</p>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/40 bg-slate-950/20 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <span>© 2026 Polla Mundial 2026. Diseñado para fanáticos del fútbol.</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-accent" /> Entrada configurable
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" /> Resultados inmediatos
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
