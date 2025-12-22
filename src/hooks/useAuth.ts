'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { storageService, type ConnectionData } from '@/services/storage';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  connection: ConnectionData | null;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    connection: null,
    error: null
  });

  // Verificar autenticación al cargar
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      checkAuth();
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const checkAuth = () => {
    try {
      const connection = storageService.getConnection();
      if (connection && storageService.validateConnection()) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          connection,
          error: null
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          connection: null,
          error: null
        });
      }
    } catch {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        connection: null,
        error: 'Error verificando autenticación'
      });
    }
  };

  const login = async (url: string, username: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiService.login(url, username, password);
      
      if (response.success) {
        // Guardar conexión encriptada con el nombre del empleado
        const employeeName = response.name || username;
        const saved = storageService.saveConnection(url, username, password, employeeName);
        
        if (saved) {
          const connection = storageService.getConnection();
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            connection,
            error: null
          });
          return { success: true, message: 'Login exitoso' };
        } else {
          setAuthState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Error guardando credenciales' 
          }));
          return { success: false, message: 'Error guardando credenciales' };
        }
      } else {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: response.message || 'Error en login' 
        }));
        return { success: false, message: response.message || 'Error en login' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    storageService.clearConnection();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      connection: null,
      error: null
    });
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return {
    ...authState,
    login,
    logout,
    checkAuth,
    clearError
  };
}