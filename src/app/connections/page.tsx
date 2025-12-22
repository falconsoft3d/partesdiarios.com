'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Trash2, Plus, Settings, Eye, EyeOff } from 'lucide-react';

export default function Connections() {
  const { isAuthenticated, isLoading, connection, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated, isLoading]);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !connection) {
    return null; // Se redirige en useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={handleBackToDashboard}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors mr-4"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Conexiones
          </h1>
        </div>

        {/* Current Connection Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-blue-600" />
              Conexión Actual
            </h2>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600 font-medium">Conectado</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL del Servidor
              </label>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-900 font-mono text-sm break-all">
                  {connection.url}
                </p>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-900">{connection.username}</p>
              </div>
            </div>

            {/* Employee Name */}
            {connection.employeeName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-gray-900 font-medium">{connection.employeeName}</p>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <p className="text-gray-900 font-mono">
                  {showPassword ? connection.password : '••••••••'}
                </p>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-gray-500 hover:text-gray-700"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guardado el
              </label>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-900">
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
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Crear Nueva Conexión
          </button>

          {/* Delete Connection */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-white border-2 border-red-200 text-red-600 py-3 px-6 rounded-lg font-medium hover:bg-red-50 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Eliminar Conexión
            </button>
          ) : (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-3 text-center">
                ¿Estás seguro de que quieres eliminar esta conexión?
              </p>
              <p className="text-red-600 text-sm mb-4 text-center">
                Se eliminarán todos los datos guardados y regresarás a la pantalla de login.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteConnection}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Sí, Eliminar
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center pb-4">
          <p className="text-xs text-gray-600">
            Desarrollado con <a href="https://www.odoo.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-600 hover:text-gray-800 hover:underline transition-colors">Odoo</a> por <a href="https://www.marlonfalcon.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-600 hover:text-gray-800 hover:underline transition-colors">Marlon Falcon</a>
          </p>
        </div>
      </div>
    </div>
  );
}