'use client';

import { useEffect, useState, useCallback } from 'react';
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
  const [observations, setObservations] = useState<{[partId: number]: string}>({});
  const [attachments, setAttachments] = useState<{[partId: number]: File | null}>({});
  const [inasistencias, setInasistencias] = useState<{[employeeId: number]: boolean}>({});
  const [savingParts, setSavingParts] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated, isLoading]);

  // Funciones para guardado automático local
  const saveToLocalStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      // Guardar solo los nombres de archivos, no el contenido binario
      const attachmentNames: {[partId: number]: string} = {};
      Object.entries(attachments).forEach(([partId, file]) => {
        if (file) {
          attachmentNames[parseInt(partId)] = file.name;
        }
      });

      const localData = {
        diaryParts,
        pcpData,
        observations,
        inasistencias,
        attachmentNames,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('diary_parts_draft', JSON.stringify(localData));
    }
  }, [diaryParts, pcpData, observations, inasistencias, attachments]);

  // Cargar datos del localStorage al montar el componente
  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  // Guardar automáticamente cuando cambien los datos
  useEffect(() => {
    if (diaryParts.length > 0) {
      saveToLocalStorage();
    }
  }, [diaryParts, pcpData, observations, saveToLocalStorage]);

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
        // Los datos se guardarán automáticamente por el useEffect
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

  const handleObservationChange = (partId: number, value: string) => {
    setObservations(prev => ({
      ...prev,
      [partId]: value
    }));
  };

  const handleAttachmentChange = (partId: number, file: File | null) => {
    setAttachments(prev => ({
      ...prev,
      [partId]: file
    }));
  };

  const handleInasistenciaChange = (employeeId: number, value: boolean) => {
    setInasistencias(prev => ({
      ...prev,
      [employeeId]: value
    }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remover el prefijo "data:type/subtype;base64," para obtener solo el base64
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Error al leer el archivo'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const loadFromLocalStorage = () => {
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem('diary_parts_draft');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setDiaryParts(parsed.diaryParts || []);
          setPcpData(parsed.pcpData || {});
          setObservations(parsed.observations || {});
          setInasistencias(parsed.inasistencias || {});
          // Note: Los archivos no se pueden restaurar desde localStorage
          // Solo mostramos una indicación si había archivos adjuntos
          if (parsed.diaryParts && parsed.diaryParts.length > 0) {
            setShowParts(true);
          }
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    }
  };

  const clearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('diary_parts_draft');
    }
  };

  const hasLocalData = () => {
    return diaryParts.length > 0;
  };

  const handleSaveParts = async () => {
    if (!connection || diaryParts.length === 0) return;
    
    setSavingParts(true);
    setSaveError(null);
    setSaveSuccess(null);
    
    try {
      // Validar antes de guardar
      const validationErrors: string[] = [];
      
      for (const part of diaryParts) {
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

        // Validar cada empleado
        for (const employee of uniqueEmployees) {
          const isInasistente = inasistencias[employee.hr_employee_id] || false;
          
          // Si no está marcado como inasistente, debe tener al menos una hora > 0
          if (!isInasistente) {
            let totalHours = 0;
            
            for (const pcp of uniquePCPs) {
              const key = `${employee.hr_employee_id}-${pcp}`;
              const line = employee.lines.find((l: {bim_pcp_name: string | false, hh: number}) => l.bim_pcp_name === pcp);
              const value = pcpData[key] !== undefined ? pcpData[key] : (line?.hh || 0);
              totalHours += value;
            }
            
            if (totalHours === 0) {
              validationErrors.push(`${employee.hr_employee_name}: Debe tener al menos una hora asignada o marcar como inasistencia`);
            }
          }
        }
      }

      // Si hay errores de validación, mostrarlos y detener el proceso
      if (validationErrors.length > 0) {
        setSaveError(`Errores de validación:\n${validationErrors.join('\n')}`);
        return;
      }

      // Guardar cada parte diario
      for (const part of diaryParts) {
        // Preparar el archivo si existe
        let fileData = undefined;
        const attachment = attachments[part.id];
        if (attachment) {
          try {
            const base64Data = await fileToBase64(attachment);
            fileData = {
              name: attachment.name,
              data: base64Data
            };
          } catch (error) {
            console.error('Error processing attachment:', error);
            throw new Error(`Error al procesar el archivo adjunto: ${attachment.name}`);
          }
        }

        const result = await apiService.saveDiaryParts(
          connection.url,
          connection.username,
          connection.password,
          part,
          pcpData,
          observations,
          fileData,
          inasistencias
        );
        
        if (result.status !== 'ok') {
          throw new Error(result.message || 'Error al guardar el parte diario');
        }
      }
      setSaveSuccess('Partes diarios guardados exitosamente');
      // Limpiar los datos y ocultar la tabla
      setDiaryParts([]);
      setShowParts(false);
      setPcpData({});
      setObservations({});
      setInasistencias({});
      setAttachments({});
      clearLocalStorage();
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
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                💾 Guardado automático local
              </span>
            </div>
            
            {/* Mensajes de estado */}
            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-red-700 text-sm">
                    {saveError.split('\n').map((line, index) => (
                      <div key={index} className={index > 0 ? 'mt-1' : ''}>
                        {line}
                      </div>
                    ))}
                  </div>
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
                            <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700" title="Inasistencia">
                              I
                            </th>
                            {uniquePCPs.map((pcp, index) => (
                              <th key={index} className="border border-gray-300 px-2 py-8 text-center text-sm font-medium text-gray-700 relative">
                                <div className="transform -rotate-90 whitespace-nowrap absolute inset-0 flex items-center justify-center">
                                  {pcp}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {uniqueEmployees.map((employee) => {
                            // Calcular si esta fila tiene problemas de validación
                            const isInasistente = inasistencias[employee.hr_employee_id] || false;
                            let totalHours = 0;
                            
                            uniquePCPs.forEach(pcp => {
                              const key = `${employee.hr_employee_id}-${pcp}`;
                              const line = employee.lines.find((l: {bim_pcp_name: string | false, hh: number}) => l.bim_pcp_name === pcp);
                              const value = pcpData[key] !== undefined ? pcpData[key] : (line?.hh || 0);
                              totalHours += value;
                            });
                            
                            const hasValidationError = !isInasistente && totalHours === 0;
                            
                            return (
                              <tr 
                                key={employee.hr_employee_id} 
                                className={`hover:bg-gray-50 ${hasValidationError ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}
                                title={hasValidationError ? 'Error: Debe tener al menos una hora asignada o marcar como inasistencia' : ''}
                              >
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 font-mono">
                                {employee.hr_employee_id}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                                {employee.hr_employee_name}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={inasistencias[employee.hr_employee_id] || false}
                                  onChange={(e) => handleInasistenciaChange(employee.hr_employee_id, e.target.checked)}
                                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                                />
                              </td>
                              {uniquePCPs.map((pcp, pcpIndex) => {
                                // Buscar la línea correspondiente a este empleado y PCP
                                const line = employee.lines.find((l: {bim_pcp_name: string | false, hh: number}) => l.bim_pcp_name === pcp);
                                const key = `${employee.hr_employee_id}-${pcp}`;
                                
                                return (
                                  <td key={pcpIndex} className="border border-gray-300 px-2 py-3 text-center w-16">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      value={pcpData[key] !== undefined ? pcpData[key] : (line?.hh || 0)}
                                      onChange={(e) => handlePcpChange(employee.hr_employee_id, pcp || '', e.target.value)}
                                      className={`w-12 px-1 py-1 border border-gray-300 rounded text-sm text-center text-gray-900 focus:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${
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
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100 font-medium">
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700" colSpan={3}>
                              <strong>Subtotal</strong>
                            </td>
                            {uniquePCPs.map((pcp, pcpIndex) => {
                              // Calcular el subtotal para este PCP
                              let subtotal = 0;
                              uniqueEmployees.forEach(employee => {
                                const key = `${employee.hr_employee_id}-${pcp}`;
                                const line = employee.lines.find((l: {bim_pcp_name: string | false, hh: number}) => l.bim_pcp_name === pcp);
                                const value = pcpData[key] !== undefined ? pcpData[key] : (line?.hh || 0);
                                subtotal += value;
                              });

                              return (
                                <td key={pcpIndex} className="border border-gray-300 px-2 py-3 text-center w-16">
                                  <span className="font-bold text-blue-600">
                                    {subtotal.toFixed(1)}h
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        </tfoot>
                      </table>
                    );
                  })()}
                </div>

                {/* Observaciones */}
                <div className="mt-6">
                  <label htmlFor={`observation-${part.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    id={`observation-${part.id}`}
                    rows={3}
                    value={observations[part.id] || part.observation || ''}
                    onChange={(e) => handleObservationChange(part.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Agregar observaciones del parte diario..."
                  />
                </div>

                {/* Archivo Adjunto */}
                <div className="mt-4">
                  <label htmlFor={`attachment-${part.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                    Archivo Adjunto (opcional)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      id={`attachment-${part.id}`}
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleAttachmentChange(part.id, file);
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    {attachments[part.id] && (
                      <div className="flex items-center text-sm text-green-600">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {attachments[part.id]?.name}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos soportados: imágenes, PDF, documentos de Word, archivos de texto
                  </p>
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
              disabled={loadingParts || hasLocalData()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingParts ? 'Cargando...' : 'Leer Parte'}
            </button>
            {hasLocalData() && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Ya tienes un parte cargado. Súbelo primero para cargar uno nuevo.
              </p>
            )}
            {!hasLocalData() && !loadingParts && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Carga un parte desde el servidor para comenzar
              </p>
            )}
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
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-red-700 text-sm">
                    {saveError.split('\n').map((line, index) => (
                      <div key={index} className={index > 0 ? 'mt-1' : ''}>
                        {line}
                      </div>
                    ))}
                  </div>
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
              disabled={savingParts || !hasLocalData()}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingParts ? 'Guardando...' : 'Subir Parte'}
            </button>
            {!hasLocalData() && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Primero debes cargar un parte para poder subirlo
              </p>
            )}
            {hasLocalData() && !savingParts && (
              <p className="text-xs text-green-600 mt-2 text-center">
                ✓ Parte listo para subir al servidor
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}