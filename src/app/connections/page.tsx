'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Trash2, Plus, Settings, Eye, EyeOff, Sun, Moon } from 'lucide-react';

export default function Connections() {
  const { isAuthenticated, isLoading, connection, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme_mode');
      return saved === 'dark';
    }
    return false;
  });
  
  // PIN de seguridad
  const [isPinEnabled, setIsPinEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('security_pin_enabled');
      return saved === 'true';
    }
    return false;
  });
  const [showPinConfig, setShowPinConfig] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated, isLoading]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme_mode', newMode ? 'dark' : 'light');
    }
  };

  const handleTogglePin = () => {
    if (isPinEnabled) {
      // Desactivar PIN
      if (typeof window !== 'undefined') {
        localStorage.removeItem('security_pin');
        localStorage.setItem('security_pin_enabled', 'false');
      }
      setIsPinEnabled(false);
      setShowPinConfig(false);
      setNewPin('');
      setConfirmPin('');
      setPinError('');
    } else {
      // Activar PIN - mostrar formulario
      setShowPinConfig(true);
      setNewPin('');
      setConfirmPin('');
      setPinError('');
    }
  };

  const handleSavePin = () => {
    // Validar PIN
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError('El PIN debe tener exactamente 4 dígitos');
      return;
    }
    
    if (newPin !== confirmPin) {
      setPinError('Los PINs no coinciden');
      return;
    }

    // Guardar PIN
    if (typeof window !== 'undefined') {
      localStorage.setItem('security_pin', newPin);
      localStorage.setItem('security_pin_enabled', 'true');
    }
    
    setIsPinEnabled(true);
    setShowPinConfig(false);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  };

  const handleCancelPin = () => {
    setShowPinConfig(false);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  };

  const handleBackToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const handleDeleteConnection = () => {
    logout();
    window.location.href = '/';
  };

  const handleCreateNewConnection = () => {
    logout();
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
      </div>
    );
  }

  if (!isAuthenticated || !connection) {
    return null; // Se redirige en useEffect
  }

  return (
    <div className={`min-h-screen p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={handleBackToDashboard}
            className={`p-2 rounded-lg transition-colors mr-4 ${isDarkMode ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-800' : 'text-gray-600 hover:text-blue-600 hover:bg-white'}`}
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className={`text-2xl font-bold flex-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Gestión de Conexiones
          </h1>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-yellow-400 hover:bg-gray-800' : 'text-gray-600 hover:text-blue-600 hover:bg-white'}`}
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </button>
        </div>

        {/* Current Connection Card */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Settings className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              Conexión Actual
            </h2>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Conectado</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* URL */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                URL del Servidor
              </label>
              <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`font-mono text-sm break-all ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {connection.url}
                </p>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Usuario
              </label>
              <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={isDarkMode ? 'text-gray-100' : 'text-gray-900'}>{connection.username}</p>
              </div>
            </div>

            {/* Employee Name */}
            {connection.employeeName && (
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nombre Completo
                </label>
                <div className={`rounded-lg p-3 border ${isDarkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                  <p className={`font-medium ${isDarkMode ? 'text-blue-100' : 'text-gray-900'}`}>{connection.employeeName}</p>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Contraseña
              </label>
              <div className={`rounded-lg p-3 flex items-center justify-between ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`font-mono ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {showPassword ? connection.password : '••••••••'}
                </p>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className={`p-1 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Saved Date */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Guardado el
              </label>
              <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={isDarkMode ? 'text-gray-100' : 'text-gray-900'}>
                  {new Date(connection.savedAt).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings Card */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Configuración de Seguridad
          </h2>
          
          {/* PIN Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                PIN de Bloqueo
              </label>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Protege el acceso con un PIN de 4 dígitos
              </p>
            </div>
            <button
              onClick={handleTogglePin}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isPinEnabled 
                  ? 'bg-blue-600 focus:ring-blue-500' 
                  : isDarkMode 
                    ? 'bg-gray-600 focus:ring-gray-500' 
                    : 'bg-gray-200 focus:ring-gray-400'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPinEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* PIN Configuration Form */}
          {showPinConfig && (
            <div className={`border rounded-lg p-4 mt-4 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Configurar nuevo PIN
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Nuevo PIN (4 dígitos)
                  </label>
                  <input
                    type="number"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 4);
                      setNewPin(value);
                      setPinError('');
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="••••"
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Confirmar PIN
                  </label>
                  <input
                    type="number"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 4);
                      setConfirmPin(value);
                      setPinError('');
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="••••"
                  />
                </div>

                {pinError && (
                  <p className="text-xs text-red-500 mt-1">{pinError}</p>
                )}

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={handleSavePin}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                      isDarkMode 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Guardar PIN
                  </button>
                  <button
                    onClick={handleCancelPin}
                    className={`flex-1 border py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700' 
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Current PIN Display (when enabled) */}
          {isPinEnabled && !showPinConfig && (
            <div className={`border rounded-lg p-3 mt-3 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    PIN Actual
                  </label>
                  <p className={`font-mono text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {showCurrentPin ? localStorage.getItem('security_pin') : '••••'}
                  </p>
                </div>
                <button
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {showCurrentPin ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Create New Connection */}
          <button
            onClick={handleCreateNewConnection}
            className={`w-full py-3 px-6 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'}`}
          >
            <Plus className="h-5 w-5 mr-2" />
            Crear Nueva Conexión
          </button>

          {/* Delete Connection */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={`w-full border-2 py-3 px-6 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center ${isDarkMode ? 'bg-gray-800 border-red-600 text-red-400 hover:bg-gray-700 hover:border-red-500 focus:ring-red-500' : 'bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 focus:ring-red-500'}`}
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Eliminar Conexión
            </button>
          ) : (
            <div className={`border-2 rounded-lg p-4 ${isDarkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'}`}>
              <p className={`font-medium mb-3 text-center ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>
                ¿Estás seguro de que quieres eliminar esta conexión?
              </p>
              <p className={`text-sm mb-4 text-center ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
                Se eliminarán todos los datos guardados y regresarás a la pantalla de login.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteConnection}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
                >
                  Sí, Eliminar
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`flex-1 border py-2 px-4 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center pb-4">
          <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>v1.0.0</p>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Desarrollado con <a href="https://www.odoo.com" target="_blank" rel="noopener noreferrer" className={`font-semibold hover:underline transition-colors ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'}`}>Odoo</a> por <a href="https://www.marlonfalcon.com" target="_blank" rel="noopener noreferrer" className={`font-semibold hover:underline transition-colors ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'}`}>Marlon Falcon</a>
          </p>
        </div>
      </div>
    </div>
  );
}