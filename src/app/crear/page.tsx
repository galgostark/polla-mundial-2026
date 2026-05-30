'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Trophy, 
  Coins, 
  Key, 
  ArrowLeft, 
  Check, 
  Copy, 
  Share2, 
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PollaService } from '../../services/api';

export default function CrearPollaPage() {
  const router = useRouter();
  
  // Estados del Formulario
  const [name, setName] = useState('');
  const [entryFee, setEntryFee] = useState('50');
  const [currency, setCurrency] = useState('PEN');
  const [adminPin, setAdminPin] = useState('');
  const [paymentInfo, setPaymentInfo] = useState('');
  const [adminName, setAdminName] = useState(''); // Opcional, para unirse automáticamente
  
  // Estados de Control
  const [loading, setLoading] = useState(false);
  const [createdPolla, setCreatedPolla] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor escribe un nombre para tu polla.');
      return;
    }
    if (adminPin.length < 4) {
      setError('El PIN del administrador debe tener al menos 4 dígitos numéricos.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const newPolla = await PollaService.createPolla(
        name.trim(),
        parseFloat(entryFee) || 0,
        currency,
        adminPin,
        paymentInfo.trim() || undefined
      );

      // Si el creador ingresó su apodo, unirlo automáticamente como participante
      if (adminName.trim()) {
        const creatorPart = await PollaService.joinPolla(newPolla.id, adminName.trim());
        // Guardar su sesión de participante en localStorage
        localStorage.setItem(`m26_session_${newPolla.id}`, creatorPart.id);
      }

      // Autenticar automáticamente como Admin en sessionStorage
      sessionStorage.setItem(`m26_admin_${newPolla.id}`, newPolla.admin_pin);
      
      setCreatedPolla(newPolla);

      // Disparar confeti premium 🎉
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      
    } catch (err: any) {
      console.error(err);
      setError('Ocurrió un error al crear la polla. Por favor inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getInviteLink = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/polla/${createdPolla.id}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getInviteLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWhatsAppShareText = () => {
    const feeText = createdPolla.entry_fee > 0 
      ? `La cuota de entrada es de ${createdPolla.currency} ${createdPolla.entry_fee}.` 
      : '¡La entrada es completamente gratis!';
      
    return encodeURIComponent(
      `🏆 ¡Hola! Te invito a unirte a mi Polla del Mundial de Fútbol FIFA 2026: "${createdPolla.name}".\n\n` +
      `📅 Registra tus marcadores, arma tu cuadro y compite por el pozo en tiempo real.\n` +
      `💰 ${feeText}\n\n` +
      `👉 Regístrate aquí para ingresar tu cartilla: ${getInviteLink()}`
    );
  };

  // VISTA DE ÉXITO (Polla Creada)
  if (createdPolla) {
    return (
      <div className="relative min-h-screen bg-[#070a13] text-white flex items-center justify-center p-4">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-primary/15 blur-[120px] -z-10 pointer-events-none" />
        
        <div className="w-full max-w-xl glass border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 text-center animate-fade-in soccer-glow">
          
          <div className="mx-auto h-16 w-16 rounded-full bg-success/20 border border-success/30 flex items-center justify-center text-success animate-bounce">
            <ShieldCheck className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-foreground">¡Polla Creada con Éxito!</h2>
            <p className="text-slate-400 text-sm">
              Tu polla <span className="text-primary font-bold">"{createdPolla.name}"</span> ya está lista. Comparte el enlace con tus amigos para que empiecen a pronosticar.
            </p>
          </div>

          {/* Caja con Link de Invitación */}
          <div className="space-y-3 text-left">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Enlace de Invitación para Compartir
            </label>
            <div className="flex gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl items-center">
              <span className="flex-1 truncate pl-4 text-sm font-mono text-slate-300">
                {getInviteLink()}
              </span>
              <button
                onClick={copyToClipboard}
                className="px-4 py-3 bg-secondary hover:bg-slate-800 text-white rounded-xl font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copied ? <Check className="h-4.5 w-4.5 text-success" /> : <Copy className="h-4.5 w-4.5" />}
                {copied ? 'Copiado' : 'Copiar Link'}
              </button>
            </div>
          </div>

          {/* Opciones de Compartir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href={`https://api.whatsapp.com/send?text=${getWhatsAppShareText()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-4 bg-[#25D366] hover:bg-[#20ba59] text-white font-black rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="h-4.5 w-4.5" />
              Compartir en WhatsApp
            </a>

            <button
              onClick={() => router.push(`/polla/${createdPolla.id}/admin`)}
              className="py-4 bg-primary text-primary-foreground font-black rounded-xl text-sm hover:opacity-90 transition-opacity shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              Panel de Admin (Tú)
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex justify-center">
            <Link 
              href={`/polla/${createdPolla.id}`}
              className="text-sm font-bold text-accent hover:underline flex items-center gap-1"
            >
              Ver Tabla de Posiciones General <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // FORMULARIO DE CREACIÓN
  return (
    <div className="relative min-h-screen bg-[#070a13] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      
      <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[130px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="max-w-3xl mx-auto w-full py-4 flex items-center">
        <Link 
          href="/" 
          className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Inicio
        </Link>
      </header>

      {/* Caja de Formulario */}
      <main className="max-w-xl mx-auto w-full glass border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 my-auto soccer-glow relative">
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-2xl text-primary shrink-0">
            <PlusCircle className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Configura tu Polla
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Define los parámetros básicos para armar tu grupo del mundial.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          
          {/* Nombre de la Polla */}
          <div className="space-y-2">
            <label htmlFor="polla-name" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Nombre de la Polla
            </label>
            <input
              id="polla-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Polla de la Familia o Qataris FC"
              className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-850 rounded-xl text-white placeholder-slate-500 font-medium text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Apodo del Creador (Opcional, para autounirse) */}
          <div className="space-y-2">
            <label htmlFor="admin-name" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              Tu Apodo / Nombre
              <span className="text-[10px] text-slate-500 font-bold lowercase tracking-normal">(opcional)</span>
            </label>
            <input
              id="admin-name"
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Ej: Daniel (Admin) o El Dibu"
              className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-850 rounded-xl text-white placeholder-slate-500 font-medium text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-[10px] text-slate-500">Si lo rellenas, te unirás automáticamente a la polla como participante con este nombre.</p>
          </div>

          {/* Cuota de Entrada y Moneda */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <label htmlFor="entry-fee" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-accent" /> Costo de Entrada
              </label>
              <input
                id="entry-fee"
                type="number"
                min="0"
                required
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                placeholder="Ej: 50"
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-850 rounded-xl text-white placeholder-slate-500 font-medium text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="currency" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Moneda
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-3.5 bg-slate-950/80 border border-slate-855 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="PEN">S/ (PEN)</option>
                <option value="USD">$ (USD)</option>
                <option value="EUR">€ (EUR)</option>
                <option value="MXN">$ (MXN)</option>
                <option value="CLP">$ (CLP)</option>
                <option value="COP">$ (COP)</option>
              </select>
            </div>
          </div>

          {/* Datos e Instrucciones de Pago */}
          <div className="space-y-2">
            <label htmlFor="payment-info" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-slate-400" /> Instrucciones de Pago
            </label>
            <textarea
              id="payment-info"
              rows={3}
              value={paymentInfo}
              onChange={(e) => setPaymentInfo(e.target.value)}
              placeholder="Ej: Yapear al 987654321 (Daniel) o Transferir a cuenta BCP: 191-xxxxxx. Enviar comprobante por WhatsApp."
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-850 rounded-xl text-white placeholder-slate-500 font-medium text-sm focus:outline-none focus:border-primary transition-colors resize-none"
            />
            <p className="text-[10px] text-slate-500">Tus amigos verán estas instrucciones en su panel para pagar su inscripción.</p>
          </div>

          {/* PIN de Administrador */}
          <div className="space-y-2">
            <label htmlFor="admin-pin" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Key className="h-3.5 w-3.5 text-accent" /> PIN del Administrador (Mínimo 4 dígitos)
            </label>
            <input
              id="admin-pin"
              type="password"
              inputMode="numeric"
              maxLength={8}
              required
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Ej: 1982 o 2026"
              className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-850 rounded-xl text-white placeholder-slate-500 font-bold text-sm focus:outline-none focus:border-primary transition-colors tracking-[0.3em] text-center"
            />
            <p className="text-[10px] text-slate-500">
              Guarda este PIN. Lo usarás para confirmar los pagos de tus amigos y registrar los resultados de los partidos.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-foreground font-black text-base rounded-xl hover:opacity-90 active:scale-[0.99] transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Creando Polla...' : 'Crear Polla Mundial 2026 🏆'}
          </button>

        </form>

      </main>

      {/* Footer */}
      <footer className="max-w-xl mx-auto w-full py-6 text-center text-xs text-slate-600 font-medium">
        Polla Mundial 2026 • Configuración privada del Administrador
      </footer>

    </div>
  );
}
