'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { History, ArrowLeft, Trash2, Download } from 'lucide-react';

interface HistoryEntry {
  id: string;
  timestamp: string;
  date: string;
  partName: string;
  partId: number;
  employeesCount: number;
  pcpsCount: number;
  budgetsCount: number;
  totalHours: number;
  textData: string;
}

export default function HistoryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    if (typeof window !== 'undefined') {
      try {
        const savedHistory = localStorage.getItem('diary_parts_history');
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          // Ordenar por fecha más reciente primero
          parsed.sort((a: HistoryEntry, b: HistoryEntry) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setHistory(parsed);
        }
      } catch (error) {
        console.error('Error loading history:', error);
      }
    }
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta entrada del historial?')) {
      const updatedHistory = history.filter(entry => entry.id !== id);
      localStorage.setItem('diary_parts_history', JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('¿Estás seguro de que deseas limpiar todo el historial? Esta acción no se puede deshacer.')) {
      localStorage.removeItem('diary_parts_history');
      setHistory([]);
      setSelectedEntry(null);
    }
  };

  const handleDownloadEntry = (entry: HistoryEntry) => {
    const blob = new Blob([entry.textData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parte_${entry.partName}_${entry.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBack = () => {
    window.location.href = '/dashboard';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Volver al dashboard"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <History className="h-8 w-8 mr-3 text-blue-600" />
                  Historial de Partes Diarios
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {history.length} {history.length === 1 ? 'entrada' : 'entradas'} guardadas
                </p>
              </div>
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 className="h-5 w-5" />
                <span>Limpiar Todo</span>
              </button>
            )}
          </div>
        </div>

        {history.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay historial
            </h3>
            <p className="text-gray-600">
              Los partes diarios que envíes se guardarán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Lista de entradas */}
            <div className="lg:col-span-1 space-y-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className={`bg-white rounded-xl shadow-md p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedEntry?.id === entry.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{entry.partName}</h3>
                      <p className="text-sm text-gray-600">{entry.date}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEntry(entry.id);
                      }}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>👥 {entry.employeesCount} empleados</div>
                    <div>📊 {entry.pcpsCount} PCPs</div>
                    <div>💰 {entry.budgetsCount} presupuestos</div>
                    <div>⏱️ {entry.totalHours}h totales</div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(entry.timestamp).toLocaleString('es-ES')}
                  </p>
                </div>
              ))}
            </div>

            {/* Detalle de la entrada seleccionada */}
            <div className="lg:col-span-2">
              {selectedEntry ? (
                <div className="bg-white rounded-xl shadow-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedEntry.partName}
                    </h2>
                    <button
                      onClick={() => handleDownloadEntry(selectedEntry)}
                      className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Download className="h-5 w-5" />
                      <span>Descargar</span>
                    </button>
                  </div>
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600">
                      <strong>Fecha del parte:</strong> {selectedEntry.date}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Guardado:</strong> {new Date(selectedEntry.timestamp).toLocaleString('es-ES')}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>ID:</strong> {selectedEntry.partId}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono overflow-auto max-h-[600px]">
                      {selectedEntry.textData}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-xl p-12 text-center">
                  <p className="text-gray-600">
                    Selecciona una entrada del historial para ver los detalles
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
