'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Polla, Participant } from '../types';
import { PollaService } from '../services/api';

export function usePollaSession(pollaId: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [polla, setPolla] = useState<Polla | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Obtener detalles de la polla
      const pollaData = await PollaService.getPolla(pollaId);
      setPolla(pollaData);

      // 2. Verificar PIN de Admin en sessionStorage (si ya se autenticó como admin)
      const adminSessionPin = sessionStorage.getItem(`m26_admin_${pollaId}`);
      if (adminSessionPin === pollaData.admin_pin) {
        setIsAdmin(true);
      }

      // 3. Buscar sesión de participante en localStorage
      const savedParticipantId = localStorage.getItem(`m26_session_${pollaId}`);
      
      if (savedParticipantId) {
        // Cargar participantes de la polla
        const participantsList = await PollaService.getParticipants(pollaId);
        const currentPart = participantsList.find(p => p.id === savedParticipantId);
        
        if (currentPart) {
          setParticipant(currentPart);
        } else {
          // Si el ID guardado no existe en esta polla (fue eliminado o corrupto), limpiar
          localStorage.removeItem(`m26_session_${pollaId}`);
        }
      }
    } catch (err) {
      console.error('Error al cargar sesión de polla:', err);
    } finally {
      setLoading(false);
    }
  }, [pollaId]);

  useEffect(() => {
    if (pollaId) {
      fetchSession();
    }
  }, [pollaId, fetchSession]);

  // Cerrar sesión
  const logout = useCallback(() => {
    localStorage.removeItem(`m26_session_${pollaId}`);
    sessionStorage.removeItem(`m26_admin_${pollaId}`);
    setParticipant(null);
    setIsAdmin(false);
    router.push('/');
  }, [pollaId, router]);

  // Guardar ID del participante en localStorage para iniciar sesión
  const loginAsParticipant = useCallback((participantId: string) => {
    localStorage.setItem(`m26_session_${pollaId}`, participantId);
    fetchSession();
  }, [pollaId, fetchSession]);

  // Autenticar como Admin
  const loginAsAdmin = useCallback((pin: string): boolean => {
    if (polla && polla.admin_pin === pin) {
      sessionStorage.setItem(`m26_admin_${pollaId}`, pin);
      setIsAdmin(true);
      return true;
    }
    return false;
  }, [polla, pollaId]);

  return {
    loading,
    polla,
    participant,
    isAdmin,
    loginAsParticipant,
    loginAsAdmin,
    logout,
    refreshSession: fetchSession
  };
}
