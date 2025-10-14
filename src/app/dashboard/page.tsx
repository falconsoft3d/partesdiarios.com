'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Settings, LogOut, Download } from 'lucide-react';

export default function Dashboard() {
  const { isAuthenticated, isLoading, connection, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated, isLoading]);

  const handleLoadPart = () => {
    // Aquí implementarías la lógica para cargar parte
    alert('Funcionalidad de cargar parte - Por implementar');
  };

  const handleManageConnection = () => {
    window.location.href = '/connections';
  };

  const handleLogout = () => {
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Dashboard - Partes Diarios
              </h1>
              <p className="text-gray-600">
                Conectado a: <span className="font-medium">{connection.url}</span>
              </p>
              <p className="text-sm text-gray-500">
                Usuario: {connection.username}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleManageConnection}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Gestionar conexión"
              >
                <Settings className="h-6 w-6" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Cargar Parte Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Download className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Cargar Parte
            </h2>
            <p className="text-gray-600 mb-6">
              Descarga y sincroniza los datos del parte diario desde el servidor.
            </p>
            <button
              onClick={handleLoadPart}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Cargar Parte
            </button>
          </div>

          {/* Reports Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Reportes
            </h2>
            <p className="text-gray-600 mb-6">
              Consulta y genera reportes de los partes diarios guardados.
            </p>
            <button
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
              disabled
            >
              Próximamente
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estado de la Conexión
          </h3>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <span className="text-gray-500">URL:</span>
                <p className="font-medium break-all text-gray-900">{connection.url}</p>
            </div>
            <div>
              <span className="text-gray-500">Usuario:</span>
                <p className="font-medium text-gray-900">{connection.username}</p>
            </div>
            <div>
              <span className="text-gray-500">Guardado:</span>
                <p className="font-medium text-gray-900">
                {new Date(connection.savedAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}