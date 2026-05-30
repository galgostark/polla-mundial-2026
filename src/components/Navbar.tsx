'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Trophy, 
  User, 
  Calendar, 
  BarChart2, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Coins
} from 'lucide-react';
import { Polla, Participant } from '../types';

interface NavbarProps {
  polla: Polla;
  participant: Participant | null;
  isAdmin: boolean;
  logout: () => void;
}

export default function Navbar({ polla, participant, isAdmin, logout }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const baseRoute = `/polla/${polla.id}`;

  const navItems = [
    { name: 'Tabla y Ranking', path: baseRoute, icon: Trophy },
    { name: 'Mis Pronósticos', path: `${baseRoute}/pronosticos`, icon: User },
    { name: 'Fixture y Resultados', path: `${baseRoute}/partidos`, icon: Calendar },
    { name: 'Estadísticas Grada', path: `${baseRoute}/estadisticas`, icon: BarChart2 },
    { name: 'Administrar', path: `${baseRoute}/admin`, icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === baseRoute) {
      return pathname === baseRoute;
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full glass border-b border-border shadow-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo y Nombre de la Polla */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2 group">
                <Trophy className="h-6 w-6 text-accent animate-pulse group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
                  {polla.name}
                </span>
              </Link>
            </div>

            {/* Navegación Desktop */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20'
                        : 'text-secondary-foreground hover:bg-secondary hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Perfil del Participante / Estado de Pago Desktop */}
            <div className="hidden md:flex items-center gap-4">
              {participant ? (
                <div className="flex items-center gap-3 pl-4 border-l border-border">
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-bold text-foreground">{participant.name}</span>
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    >
                      {participant.is_paid ? (
                        <span className="text-success flex items-center gap-1 hover:underline">
                          <CheckCircle2 className="h-3 w-3" /> Pago Listo
                        </span>
                      ) : (
                        <span className="text-destructive flex items-center gap-1 animate-pulse hover:underline">
                          <AlertTriangle className="h-3 w-3" /> Pago Pendiente
                        </span>
                      )}
                    </button>
                  </div>
                  
                  <button
                    onClick={logout}
                    title="Salir de la polla"
                    className="p-2 rounded-lg hover:bg-destructive hover:text-white transition-colors cursor-pointer text-slate-400"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="pl-4 border-l border-border">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent font-semibold flex items-center gap-1">
                    👑 Modo Espectador / Admin
                  </span>
                </div>
              )}
            </div>

            {/* Hamburguesa Mobile */}
            <div className="flex md:hidden items-center gap-2">
              {participant && (
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className={`p-1.5 rounded-full cursor-pointer ${
                    participant.is_paid ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10 animate-pulse'
                  }`}
                >
                  {participant.is_paid ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </button>
              )}
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-secondary text-foreground hover:text-white cursor-pointer"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
            
          </div>
        </div>

        {/* Menú Móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-border py-3 px-4 space-y-1 shadow-lg animate-fade-in">
            {participant && (
              <div className="px-3 py-2 rounded-xl bg-slate-900/40 border border-border mb-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Participante</span>
                  <span className="text-sm font-extrabold text-foreground">{participant.name}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowPaymentModal(true);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-full font-bold cursor-pointer flex items-center gap-1 ${
                    participant.is_paid ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive animate-pulse'
                  }`}
                >
                  {participant.is_paid ? 'Pago Listo' : 'Pendiente'}
                </button>
              </div>
            )}
            
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            {participant && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
                Salir de la Polla
              </button>
            )}
          </div>
        )}
      </nav>

      {/* MODAL DE INFORMACIÓN DE PAGO */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass border border-border rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                  <Coins className="h-5 w-5 text-accent" /> Información de Cuota
                </h3>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1 rounded-full hover:bg-secondary text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-border flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-400">Cuota de Entrada</span>
                  <span className="text-2xl font-black text-accent">
                    {polla.entry_fee > 0 ? `${polla.currency} ${polla.entry_fee}` : '¡Gratis! 🎁'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/30 border border-border space-y-2">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Estado Actual</span>
                  {participant?.is_paid ? (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <span className="text-sm font-bold">¡Tu pago ha sido confirmado por el organizador! Estás habilitado para competir en el ranking.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5 shrink-0 animate-bounce" />
                        <span className="text-sm font-bold">Pago Pendiente de Confirmación</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Por favor, realiza el pago de la cuota al administrador e infórmale para que te habilite en la tabla de posiciones.
                      </p>
                    </div>
                  )}
                </div>

                {polla.payment_info && (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-border space-y-2">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Instrucciones de Pago de la Polla</span>
                    <p className="text-sm whitespace-pre-line text-slate-200 bg-slate-950/50 p-2.5 rounded-lg font-mono text-center">
                      {polla.payment_info}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
