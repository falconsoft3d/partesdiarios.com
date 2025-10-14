'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiService, DiaryPart } from '@/services/api';
import { Settings, LogOut, Download, AlertCircle, Upload } from 'lucide-react';

export default function Dashboard() {
  const { isAuthenticated, isLoading, connection, logout } = useAuth();
  const [diaryParts, setDiaryParts] = useState<DiaryPart[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showParts, setShowParts] = useState(false);
  const [pcpData, setPcpData] = useState<{[key: string]: number}>({});
  const [savingParts, setSavingParts] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated, isLoading]);

  const handleLoadPart = async () => {
    if (!connection) return;
    
    setLoadingParts(true);
    setError(null);
    
    try {
      const result = await apiService.getDiaryParts(
        connection.url,
        connection.username,
        connection.password
      );
      
      if (result.status === 'ok' && result.diary_parts) {
        setDiaryParts(result.diary_parts);
        setShowParts(true);
        setError(null);
      } else {
        setError(result.message || 'Error al obtener los partes diarios');
        setShowParts(false);
      }
    } catch {
      setError('Error de conexión al obtener los partes diarios');
      setShowParts(false);
    } finally {
      setLoadingParts(false);
    }
  };

  const handlePcpChange = (employeeId: number, pcp: string, value: string) => {
    const key = `${employeeId}-${pcp}`;
    setPcpData(prev => ({
      ...prev,
      [key]: Number(value) || 0
    }));
  };

  const handleSaveParts = async () => {
    if (!connection || diaryParts.length === 0) return;
    
    setSavingParts(true);
    setSaveError(null);
    setSaveSuccess(null);
    
    try {
      // Guardar cada parte diario
      for (const part of diaryParts) {
        const result = await apiService.saveDiaryParts(
          connection.url,
          connection.username,
          connection.password,
          part,
          pcpData
        );
        
        if (result.status !== 'ok') {
          throw new Error(result.message || 'Error al guardar el parte diario');
        }
      }
      
      setSaveSuccess('Partes diarios guardados exitosamente');
      
      // Limpiar los datos después de guardar
      setTimeout(() => {
        setSaveSuccess(null);
      }, 5000);
      
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Error desconocido al guardar');
    } finally {
      setSavingParts(false);
    }
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

        {/* Diary Parts List - Editable Table */}
        {showParts && diaryParts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Partes Diarios - {new Date().toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <button
                onClick={handleSaveParts}
                disabled={savingParts}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingParts ? 'Guardando...' : 'Guardar Partes'}
              </button>
            </div>
            
            {/* Mensajes de estado */}
            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">{saveError}</span>
                </div>
              </div>
            )}
            
            {saveSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-700 text-sm">{saveSuccess}</span>
                </div>
              </div>
            )}
            
            {diaryParts.map((part) => (
              <div key={part.id} className="mb-8">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{part.name}</h4>
                    <p className="text-sm text-gray-600">Empleado: {part.hr_employee_name}</p>
                  </div>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    part.state === 'draft' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {part.state === 'draft' ? 'Borrador' : part.state}
                  </span>
                </div>

                {/* Tabla editable con columnas dinámicas de PCP */}
                <div className="overflow-x-auto">
                  {(() => {
                    // Obtener todos los PCP únicos del parte actual
                    const uniquePCPs = [...new Set(
                      part.employee_lines_ids
                        .filter(line => line.hr_employee_name && line.bim_pcp_name)
                        .map(line => line.bim_pcp_name)
                    )];

                    // Agrupar empleados únicos
                    const uniqueEmployees = part.employee_lines_ids
                      .filter(line => line.hr_employee_name && line.hr_employee_id !== false)
                      .reduce((acc, line) => {
                        const existingEmployee = acc.find(emp => emp.hr_employee_id === line.hr_employee_id);
                        if (!existingEmployee) {
                          acc.push({
                            hr_employee_id: line.hr_employee_id as number,
                            hr_employee_name: line.hr_employee_name as string,
                            lines: part.employee_lines_ids.filter(l => l.hr_employee_id === line.hr_employee_id)
                          });
                        }
                        return acc;
                      }, [] as Array<{
                        hr_employee_id: number;
                        hr_employee_name: string;
                        lines: typeof part.employee_lines_ids;
                      }>);

                    return (
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                              ID
                            </th>
                            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                              Empleado
                            </th>
                            {uniquePCPs.map((pcp, index) => (
                              <th key={index} className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                                {pcp}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {uniqueEmployees.map((employee) => (
                            <tr key={employee.hr_employee_id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 font-mono">
                                {employee.hr_employee_id}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                                {employee.hr_employee_name}
                              </td>
                              {uniquePCPs.map((pcp, pcpIndex) => {
                                // Buscar la línea correspondiente a este empleado y PCP
                                const line = employee.lines.find((l: {bim_pcp_name: string | false, hh: number}) => l.bim_pcp_name === pcp);
                                const key = `${employee.hr_employee_id}-${pcp}`;
                                
                                return (
                                  <td key={pcpIndex} className="border border-gray-300 px-4 py-3 text-center">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      value={pcpData[key] !== undefined ? pcpData[key] : (line?.hh || 0)}
                                      onChange={(e) => handlePcpChange(employee.hr_employee_id, pcp || '', e.target.value)}
                                      className={`w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center text-gray-900 focus:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${
                                        (pcpData[key] !== undefined ? pcpData[key] : (line?.hh || 0)) > 0 
                                          ? 'bg-yellow-100' 
                                          : 'bg-white'
                                      }`}
                                      placeholder="0"
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}

        {showParts && diaryParts.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sin partes diarios
            </h3>
            <p className="text-gray-600">
              No se encontraron partes diarios para el día de hoy.
            </p>
          </div>
        )}

        {/* Main Content - Cards moved to bottom */}
        <div className="grid gap-6 md:grid-cols-2 mt-6">
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
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}
            <button
              onClick={handleLoadPart}
              disabled={loadingParts}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingParts ? 'Cargando...' : 'Leer Parte'}
            </button>
          </div>

          {/* Reports Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Upload className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Subir Parte
            </h2>
            <p className="text-gray-600 mb-6">
              Guarda y sincroniza los datos modificados del parte diario al servidor.
            </p>
            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">{saveError}</span>
                </div>
              </div>
            )}
            {saveSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-700 text-sm">{saveSuccess}</span>
                </div>
              </div>
            )}
            <button
              onClick={handleSaveParts}
              disabled={savingParts || !showParts || diaryParts.length === 0}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingParts ? 'Guardando...' : 'Subir Parte'}
            </button>
            {(!showParts || diaryParts.length === 0) && (
              <p className="text-xs text-gray-500 mt-2">
                Primero debes cargar un parte para poder subirlo
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}