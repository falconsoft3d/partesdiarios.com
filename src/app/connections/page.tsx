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
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Desarrollado con <a href="https://www.odoo.com" target="_blank" rel="noopener noreferrer" className={`font-semibold hover:underline transition-colors ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'}`}>Odoo</a> por <a href="https://www.marlonfalcon.com" target="_blank" rel="noopener noreferrer" className={`font-semibold hover:underline transition-colors ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'}`}>Marlon Falcon</a>
          </p>
        </div>
      </div>
    </div>
  );
}