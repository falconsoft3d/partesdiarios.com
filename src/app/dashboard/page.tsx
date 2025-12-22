'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiService, PCP, Employee, Equipment, Budget } from '@/services/api';
import { Settings, LogOut, Download, AlertCircle, Upload, Trash2, HelpCircle } from 'lucide-react';

export default function Dashboard() {
  const { isAuthenticated, isLoading, connection, logout } = useAuth();
  const [pcps, setPcps] = useState<PCP[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [diaryPartId, setDiaryPartId] = useState<number | null>(null);
  const [diaryPartName, setDiaryPartName] = useState<string>('');
  const [diaryPartDate, setDiaryPartDate] = useState<string>('');
  const [diaryPartTurno, setDiaryPartTurno] = useState<string>('');
  const [diaryPartSupervisor, setDiaryPartSupervisor] = useState<string>('');
  const [diaryPartFramework, setDiaryPartFramework] = useState<string>('');
  const [diaryPartResponsable, setDiaryPartResponsable] = useState<string>('');
  const [diaryPartDisciplina, setDiaryPartDisciplina] = useState<string>('');
  const [diaryPartArea, setDiaryPartArea] = useState<string>('');
  const [diaryPartUbicacion, setDiaryPartUbicacion] = useState<string>('');
  const [cantPartesAbiertos, setCantPartesAbiertos] = useState<number>(0);
  const [loadingParts, setLoadingParts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showParts, setShowParts] = useState(false);
  const [pcpData, setPcpData] = useState<{[key: string]: number}>({});
  const [equipmentData, setEquipmentData] = useState<{[key: string]: number}>({});
  const [observations, setObservations] = useState<string>('');
  const [attachments, setAttachments] = useState<File | null>(null);
  const [inasistencias, setInasistencias] = useState<{[employeeId: number]: boolean}>({});
  const [savingParts, setSavingParts] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [noTrabajoState, setNoTrabajoState] = useState<boolean>(false);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [hiddenPcpsManoObra, setHiddenPcpsManoObra] = useState<Set<string>>(new Set());
  const [hiddenPcpsEquipos, setHiddenPcpsEquipos] = useState<Set<string>>(new Set());
  const [showHiddenColumnsMenu, setShowHiddenColumnsMenu] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'manoObra' | 'equipos'>('manoObra');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated, isLoading]);

  // Cargar contador del historial
  useEffect(() => {
    const updateHistoryCount = () => {
      if (typeof window !== 'undefined') {
        try {
          const existingHistory = localStorage.getItem('diary_parts_history');
          const history = existingHistory ? JSON.parse(existingHistory) : [];
          setHistoryCount(history.length);
        } catch (error) {
          console.error('Error al leer el historial:', error);
          setHistoryCount(0);
        }
      }
    };

    updateHistoryCount();

    // Actualizar el contador cada vez que cambie el localStorage
    const interval = setInterval(updateHistoryCount, 1000);
    return () => clearInterval(interval);
  }, []);

  // Funciones para guardado automático local
  const saveToLocalStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      const attachmentName = attachments?.name || null;

      const localData = {
        pcps,
        employees,
        equipments,
        budgets,
        diaryPartId,
        diaryPartName,
        diaryPartDate,
        diaryPartTurno,
        diaryPartSupervisor,
        diaryPartFramework,
        diaryPartResponsable,
        diaryPartDisciplina,
        diaryPartArea,
        diaryPartUbicacion,
        cantPartesAbiertos,
        pcpData,
        equipmentData,
        observations,
        inasistencias,
        noTrabajoState,
        attachmentName,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('diary_parts_draft', JSON.stringify(localData));
    }
  }, [pcps, employees, equipments, budgets, diaryPartId, diaryPartName, diaryPartDate, diaryPartTurno, diaryPartSupervisor, diaryPartFramework, diaryPartResponsable, diaryPartDisciplina, diaryPartArea, diaryPartUbicacion, cantPartesAbiertos, pcpData, equipmentData, observations, inasistencias, noTrabajoState, attachments]);

  // Cargar datos del localStorage al montar el componente
  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  // Guardar automáticamente cuando cambien los datos
  useEffect(() => {
    if (employees.length > 0 || pcps.length > 0) {
      saveToLocalStorage();
    }
  }, [employees, equipments, pcps, pcpData, equipmentData, observations, saveToLocalStorage]);

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
      
      if (result.status === 'ok' && result.pcps && result.employees) {
        setPcps(result.pcps || []);
        setEmployees(result.employees || []);
        setEquipments(result.equipments || []);
        setBudgets(result.budgets || []);
        // Guardar la información del parte diario
        setDiaryPartId(result.part_id || null);
        setDiaryPartName(result.part_name || '');
        setDiaryPartDate(result.date || '');
        setDiaryPartTurno(result.turno || '');
        setDiaryPartSupervisor(result.supervisor || '');
        setDiaryPartFramework(result.framework_contract_id || '');
        setDiaryPartResponsable(result.responsable || '');
        setDiaryPartDisciplina(result.diciplina || '');
        setDiaryPartArea(result.area || '');
        setDiaryPartUbicacion(result.ubicacion || '');
        setCantPartesAbiertos(result.cant_partes_abiertos || 0);
        // Cargar el estado "dont_work" si viene del backend
        setNoTrabajoState(result.state === 'dont_work');
        setShowParts(true);
        setError(null);
        // Los datos se guardarán automáticamente por el useEffect
        
        // Guardar en el historial que se descargó
        setTimeout(() => {
          saveDownloadToHistory();
        }, 100);
      } else {
        setError(result.message || 'Error al obtener los partes diarios');
        setShowParts(false);
      }
    } catch (err) {
      console.error('Error al cargar partes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      
      // Detectar si es el error específico de "no hay partes disponibles"
      if (errorMessage.includes('IndexError') || errorMessage.includes('tuple index out of range')) {
        setError('❌ No hay partes diarios disponibles para cargar en este momento.\n\nPor favor, crea un parte diario en Odoo primero.');
      } else {
        setError(`Error al obtener los partes diarios: ${errorMessage}`);
      }
      setShowParts(false);
    } finally {
      setLoadingParts(false);
    }
  };

  const handlePcpChange = (employeeId: number, budgetId: number, pcpId: number, value: string) => {
    const key = `${employeeId}-${budgetId}-${pcpId}`;
    setPcpData(prev => ({
      ...prev,
      [key]: Number(value) || 0
    }));
  };

  const handleEquipmentChange = (licensePlate: string, budgetId: number, pcpId: number, value: string) => {
    const key = `${licensePlate}-${budgetId}-${pcpId}`;
    setEquipmentData(prev => ({
      ...prev,
      [key]: Number(value) || 0
    }));
  };

  const handleObservationChange = (value: string) => {
    setObservations(value);
  };

  const handleAttachmentChange = (file: File | null) => {
    setAttachments(file);
  };

  const handleInasistenciaChange = (employeeId: number, value: boolean) => {
    setInasistencias(prev => ({
      ...prev,
      [employeeId]: value
    }));
  };

  const handleNoTrabajoChange = (value: boolean) => {
    if (value) {
      // Pedir confirmación cuando se marca el checkbox
      const confirmed = window.confirm(
        '⚠️ ¿Confirmas que NO se trabajó hoy?\n\nEsto marcará el parte como "No trabajo" y se enviará al servidor.'
      );
      if (confirmed) {
        setNoTrabajoState(true);
      }
    } else {
      // Si desmarca, no necesita confirmación
      setNoTrabajoState(false);
    }
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
          setPcps(parsed.pcps || []);
          setEmployees(parsed.employees || []);
          setEquipments(parsed.equipments || []);
          setBudgets(parsed.budgets || []);
          setDiaryPartId(parsed.diaryPartId || null);
          setDiaryPartName(parsed.diaryPartName || '');
          setDiaryPartDate(parsed.diaryPartDate || '');
          setDiaryPartTurno(parsed.diaryPartTurno || '');
          setDiaryPartSupervisor(parsed.diaryPartSupervisor || '');
          setDiaryPartFramework(parsed.diaryPartFramework || '');
          setDiaryPartResponsable(parsed.diaryPartResponsable || '');
          setDiaryPartDisciplina(parsed.diaryPartDisciplina || '');
          setDiaryPartArea(parsed.diaryPartArea || '');
          setDiaryPartUbicacion(parsed.diaryPartUbicacion || '');
          setCantPartesAbiertos(parsed.cantPartesAbiertos || 0);
          setPcpData(parsed.pcpData || {});
          setEquipmentData(parsed.equipmentData || {});
          setObservations(parsed.observations || '');
          setInasistencias(parsed.inasistencias || {});
          setNoTrabajoState(parsed.noTrabajoState || false);
          // Note: Los archivos no se pueden restaurar desde localStorage
          if (parsed.employees && parsed.employees.length > 0) {
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

  const saveDownloadToHistory = () => {
    if (typeof window !== 'undefined') {
      try {
        // Generar el texto formateado
        let textData = `📥 PARTE DESCARGADO\n`;
        textData += `PARTE DIARIO: ${diaryPartName}\n`;
        textData += `FECHA: ${diaryPartDate}\n`;
        textData += `ID: ${diaryPartId}\n`;
        textData += `DESCARGADO: ${new Date().toLocaleString('es-ES')}\n`;
        textData += `\n${'='.repeat(80)}\n\n`;
        
        textData += `EMPLEADOS: ${employees.length}\n`;
        textData += `PRESUPUESTOS: ${budgets.length}\n`;
        textData += `PCPs: ${pcps.length}\n`;
        textData += `\n${'='.repeat(80)}\n\n`;
        
        textData += 'EMPLEADOS:\n';
        employees.forEach(employee => {
          textData += `- ${employee.hr_employee_name} (ID: ${employee.hr_employee_id})\n`;
        });
        
        textData += '\nPRESUPUESTOS:\n';
        budgets.forEach(budget => {
          textData += `- ${budget.budget_name} (ID: ${budget.budget_id})\n`;
        });
        
        textData += '\nPCPs:\n';
        pcps.forEach(pcp => {
          textData += `- ${pcp.bim_pcp_name} (ID: ${pcp.bim_pcp_id})\n`;
        });

        // Crear la entrada del historial
        const historyEntry = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          date: diaryPartDate,
          partName: `📥 ${diaryPartName}`,
          partId: diaryPartId || 0,
          employeesCount: employees.length,
          pcpsCount: pcps.length,
          budgetsCount: budgets.length,
          totalHours: 0,
          textData,
          action: 'download'
        };

        // Obtener historial existente
        const existingHistory = localStorage.getItem('diary_parts_history');
        const history = existingHistory ? JSON.parse(existingHistory) : [];
        
        // Agregar nueva entrada al inicio
        history.unshift(historyEntry);
        
        // Limitar el historial a las últimas 50 entradas
        const limitedHistory = history.slice(0, 50);
        
        // Guardar en localStorage
        localStorage.setItem('diary_parts_history', JSON.stringify(limitedHistory));
        
        console.log('✅ Descarga registrada en el historial');
      } catch (error) {
        console.error('Error al guardar descarga en el historial:', error);
      }
    }
  };

  const saveToHistory = () => {
    if (typeof window !== 'undefined') {
      try {
        // Generar el texto formateado de la matriz
        let textData = `📤 PARTE SUBIDO\n`;
        textData += `PARTE DIARIO: ${diaryPartName}\n`;
        textData += `FECHA: ${diaryPartDate}\n`;
        textData += `ID: ${diaryPartId}\n`;
        textData += `GUARDADO: ${new Date().toLocaleString('es-ES')}\n`;
        textData += `\n${'='.repeat(80)}\n\n`;
        
        if (observations) {
          textData += `OBSERVACIONES:\n${observations}\n\n`;
          textData += `${'='.repeat(80)}\n\n`;
        }

        // Calcular el total de horas
        let totalHours = 0;

        // Encabezados de tabla
        textData += 'EMPLEADO\t';
        budgets.forEach(budget => {
          pcps.forEach(pcp => {
            textData += `${budget.budget_name} - ${pcp.bim_pcp_name}\t`;
          });
        });
        textData += 'INASISTENCIA\n';
        textData += '-'.repeat(150) + '\n';

        // Datos de empleados
        employees.forEach(employee => {
          textData += `${employee.hr_employee_name}\t`;
          
          budgets.forEach(budget => {
            pcps.forEach(pcp => {
              const key = `${employee.hr_employee_id}-${budget.budget_id}-${pcp.bim_pcp_id}`;
              const hours = pcpData[key] || 0;
              totalHours += hours;
              textData += `${hours}h\t`;
            });
          });
          
          const isInasistente = inasistencias[employee.hr_employee_id] || false;
          textData += isInasistente ? 'SÍ' : 'NO';
          textData += '\n';
        });

        textData += '\n' + '='.repeat(80) + '\n';
        textData += `TOTAL DE HORAS: ${totalHours}h\n`;
        textData += `EMPLEADOS: ${employees.length}\n`;
        textData += `PRESUPUESTOS: ${budgets.length}\n`;
        textData += `PCPs: ${pcps.length}\n`;

        if (attachments) {
          textData += `\nARCHIVO ADJUNTO: ${attachments.name}\n`;
        }

        // Crear la entrada del historial
        const historyEntry = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          date: diaryPartDate,
          partName: `📤 ${diaryPartName}`,
          partId: diaryPartId || 0,
          employeesCount: employees.length,
          pcpsCount: pcps.length,
          budgetsCount: budgets.length,
          totalHours,
          textData,
          action: 'upload'
        };

        // Obtener historial existente
        const existingHistory = localStorage.getItem('diary_parts_history');
        const history = existingHistory ? JSON.parse(existingHistory) : [];
        
        // Agregar nueva entrada al inicio
        history.unshift(historyEntry);
        
        // Limitar el historial a las últimas 50 entradas
        const limitedHistory = history.slice(0, 50);
        
        // Guardar en localStorage
        localStorage.setItem('diary_parts_history', JSON.stringify(limitedHistory));
        
        console.log('✅ Entrada guardada en el historial');
      } catch (error) {
        console.error('Error al guardar en el historial:', error);
      }
    }
  };

  const hasLocalData = () => {
    return employees.length > 0 || pcps.length > 0;
  };

  const handleClearLocalData = () => {
    if (window.confirm('¿Estás seguro de que deseas limpiar el parte actual? Se perderán todos los cambios no guardados.')) {
      setPcps([]);
      setEmployees([]);
      setEquipments([]);
      setBudgets([]);
      setDiaryPartId(null);
      setDiaryPartName('');
      setDiaryPartDate('');
      setDiaryPartTurno('');
      setDiaryPartSupervisor('');
      setDiaryPartFramework('');
      setDiaryPartResponsable('');
      setDiaryPartDisciplina('');
      setDiaryPartArea('');
      setDiaryPartUbicacion('');
      setCantPartesAbiertos(0);
      setShowParts(false);
      setPcpData({});
      setEquipmentData({});
      setObservations('');
      setInasistencias({});
      setNoTrabajoState(false);
      setAttachments(null);
      clearLocalStorage();
      setSaveSuccess('Parte local limpiado correctamente');
      setTimeout(() => {
        setSaveSuccess(null);
      }, 3000);
    }
  };

  const handleSaveParts = async () => {
    if (!connection || employees.length === 0 || pcps.length === 0) return;
    
    setSavingParts(true);
    setSaveError(null);
    setSaveSuccess(null);
    
    try {
      // Validar antes de guardar (solo si NO está marcado "NO trabajo")
      const validationErrors: string[] = [];
      
      if (!noTrabajoState) {
        // Validar cada empleado
        for (const employee of employees) {
          const isInasistente = inasistencias[employee.hr_employee_id] || false;
          
          // Si no está marcado como inasistente, debe tener al menos una hora > 0
          if (!isInasistente) {
            let totalHours = 0;
            
            // Sumar horas de todas las combinaciones de presupuesto x PCP
            for (const budget of budgets) {
              for (const pcp of pcps) {
                const key = `${employee.hr_employee_id}-${budget.budget_id}-${pcp.bim_pcp_id}`;
                const value = pcpData[key] || 0;
                totalHours += value;
              }
            }
            
            if (totalHours === 0) {
              validationErrors.push(`${employee.hr_employee_name}: Debe tener al menos una hora asignada o marcar como inasistencia`);
            }
          }
        }

        // Si hay errores de validación, mostrarlos y detener el proceso
        if (validationErrors.length > 0) {
          setSaveError(`Errores de validación:\n${validationErrors.join('\n')}`);
          return;
        }
      }

      // Preparar el archivo si existe
      let fileData = undefined;
      if (attachments) {
        try {
          const base64Data = await fileToBase64(attachments);
          fileData = {
            name: attachments.name,
            data: base64Data
          };
        } catch (error) {
          console.error('Error processing attachment:', error);
          throw new Error(`Error al procesar el archivo adjunto: ${attachments.name}`);
        }
      }

      // Verificar que tenemos el diaryPartId
      if (!diaryPartId) {
        throw new Error('No se ha cargado ningún parte diario. Por favor, carga un parte primero.');
      }

      console.log('=== Iniciando guardado de parte ===');
      console.log('Diary Part ID:', diaryPartId);
      console.log('Employees:', employees.length);
      console.log('PCPs:', pcps.length);
      console.log('Budgets:', budgets.length);
      console.log('PCP Data keys:', Object.keys(pcpData).length);
      console.log('Observations:', observations);
      console.log('File attached:', !!fileData);
      console.log('Inasistencias:', inasistencias);

      // Llamar al nuevo método de guardado
      const result = await apiService.saveDiaryPartsNew(
        connection.url,
        connection.username,
        connection.password,
        diaryPartId,
        employees,
        pcps,
        budgets,
        pcpData,
        observations,
        fileData,
        inasistencias,
        noTrabajoState
      );
      
      console.log('=== Resultado del guardado ===', result);
      console.log('Result type:', typeof result);
      console.log('Result.status:', result?.status);
      console.log('Result.status type:', typeof result?.status);
      console.log('Result.status === "ok":', result?.status === 'ok');
      
      if (!result || result.status !== 'ok') {
        console.error('Error en la respuesta:', result);
        throw new Error(result?.message || 'Error al guardar el parte diario');
      }

      console.log('✅ Guardado exitoso!');
      setSaveSuccess('Partes diarios guardados exitosamente');
      
      // Guardar en el historial antes de limpiar
      saveToHistory();
      
      // Limpiar los datos y ocultar la tabla
      setPcps([]);
      setEmployees([]);
      setEquipments([]);
      setBudgets([]);
      setDiaryPartId(null);
      setDiaryPartName('');
      setDiaryPartDate('');
      setDiaryPartTurno('');
      setDiaryPartSupervisor('');
      setDiaryPartFramework('');
      setDiaryPartResponsable('');
      setDiaryPartDisciplina('');
      setDiaryPartArea('');
      setDiaryPartUbicacion('');
      setCantPartesAbiertos(0);
      setShowParts(false);
      setPcpData({});
      setEquipmentData({});
      setObservations('');
      setInasistencias({});
      setNoTrabajoState(false);
      setAttachments(null);
      clearLocalStorage();
      
      setTimeout(() => {
        setSaveSuccess(null);
      }, 5000);
    } catch (error) {
      console.error('=== ERROR al guardar parte ===', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al guardar';
      console.error('Error message:', errorMessage);
      setSaveError(errorMessage);
    } finally {
      setSavingParts(false);
    }
  };

  const handleManageConnection = () => {
    window.location.href = '/connections';
  };

  const handleHistory = () => {
    window.location.href = '/history';
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const togglePcpVisibility = (budgetId: number, pcpId: number, tableType: 'manoObra' | 'equipos' = 'manoObra') => {
    const key = `${budgetId}-${pcpId}`;
    const setterFn = tableType === 'manoObra' ? setHiddenPcpsManoObra : setHiddenPcpsEquipos;
    setterFn(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const showAllPcps = (tableType: 'manoObra' | 'equipos' = 'manoObra') => {
    if (tableType === 'manoObra') {
      setHiddenPcpsManoObra(new Set());
    } else {
      setHiddenPcpsEquipos(new Set());
    }
    setShowHiddenColumnsMenu(false);
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
                Parte Offline: {connection.employeeName || connection.username}
              </h1>
              <p className="text-gray-600">
                Conectado a: <span className="font-medium">{connection.url}</span>
              </p>
              {diaryPartDate && (
                <p className="text-sm text-blue-600 font-semibold mt-1">
                  Fecha: {new Date(diaryPartDate).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSaveParts}
                disabled={savingParts || !hasLocalData()}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Subir parte al servidor"
              >
                <Upload className="h-6 w-6" />
              </button>
              <button
                onClick={() => window.location.href = '/help'}
                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                title="Ayuda y tutoriales"
              >
                <HelpCircle className="h-6 w-6" />
              </button>
              <button
                onClick={handleHistory}
                className="relative p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Ver historial"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {historyCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {historyCount > 99 ? '99+' : historyCount}
                  </span>
                )}
              </button>
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

        {/* Información del parte - Contenedor separado */}
        {showParts && employees.length > 0 && pcps.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-3">
            <div className="space-y-3">
              {/* Framework Contract, Responsable, Parte y Turno */}
              {diaryPartFramework && (
                <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <p className="text-sm font-bold text-gray-900">
                      [{diaryPartFramework}]{diaryPartResponsable && `, RESPONSABLE: ${diaryPartResponsable}`}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Código del Parte y Turno */}
              <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {diaryPartName || 'Parte Diario'}
                  </h3>
                  {diaryPartTurno && (
                    <div className="px-3 py-1 bg-blue-50 border border-blue-300 rounded">
                      <p className="text-sm font-semibold text-gray-900">
                        {diaryPartTurno}
                      </p>
                    </div>
                  )}
                  {cantPartesAbiertos > 0 && (
                    <div className="px-3 py-1 bg-orange-50 border border-orange-300 rounded">
                      <p className="text-sm font-semibold text-gray-900">
                        Cant Partes: {cantPartesAbiertos}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Disciplina, Área y Ubicación */}
              {(diaryPartDisciplina || diaryPartArea || diaryPartUbicacion) && (
                <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                  <p className="text-sm font-bold text-gray-900">
                    {diaryPartDisciplina && `DISCP: ${diaryPartDisciplina}`}
                    {diaryPartArea && `, AREA: ${diaryPartArea}`}
                    {diaryPartUbicacion && `, UBIC: ${diaryPartUbicacion}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diary Parts List - Editable Table */}
        {showParts && employees.length > 0 && pcps.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-3">
            {/* Tabs */}
            <div className="flex space-x-2 mb-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('manoObra')}
                className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'manoObra'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                👷 Mano de Obra
              </button>
              <button
                onClick={() => setActiveTab('equipos')}
                className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'equipos'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🚜 Equipos
              </button>
            </div>

            {/* Contenido de Mano de Obra */}
            {activeTab === 'manoObra' && (
              <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                
                {/* Checkbox NO trabajo */}
                <div className="flex items-center space-x-2 bg-red-50 border-2 border-red-300 px-4 py-2 rounded-lg">
                  <input
                    type="checkbox"
                    id="no-trabajo"
                    checked={noTrabajoState}
                    onChange={(e) => handleNoTrabajoChange(e.target.checked)}
                    className="h-5 w-5 text-red-600 focus:ring-red-500 border-red-300 rounded cursor-pointer"
                  />
                  <label 
                    htmlFor="no-trabajo" 
                    className="text-sm font-semibold text-red-700 cursor-pointer select-none"
                  >
                    NO trabajo
                  </label>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  💾 Guardado automático local
                </span>
                <button
                  onClick={handleClearLocalData}
                  className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full transition-colors"
                  title="Limpiar parte actual"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Limpiar</span>
                </button>
              </div>
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
            
            {/* Tabla editable con columnas combinadas de PCP x Presupuesto */}
            <div className="overflow-x-auto">
              {/* Botón para mostrar columnas ocultas */}
              {hiddenPcpsManoObra.size > 0 && (
                <div className="mb-3 flex items-center justify-end">
                  <button
                    onClick={() => showAllPcps('manoObra')}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Mostrar {hiddenPcpsManoObra.size} columna{hiddenPcpsManoObra.size > 1 ? 's' : ''} oculta{hiddenPcpsManoObra.size > 1 ? 's' : ''}</span>
                  </button>
                </div>
              )}
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  {/* Primera fila de cabecera: Presupuestos */}
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700" rowSpan={2}>
                      ID
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700" rowSpan={2}>
                      Empleado
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700" title="Inasistencia" rowSpan={2}>
                      I
                    </th>
                    {budgets.map((budget) => {
                      // Contar cuántos PCPs visibles tiene este budget
                      const visiblePcpsCount = pcps.filter(pcp => !hiddenPcpsManoObra.has(`${budget.budget_id}-${pcp.bim_pcp_id}`)).length;
                      
                      // Si no hay PCPs visibles, no mostrar el budget
                      if (visiblePcpsCount === 0) return null;
                      
                      return (
                        <th 
                          key={budget.budget_id} 
                          className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 bg-blue-100" 
                          colSpan={visiblePcpsCount}
                        >
                          {budget.budget_name}
                        </th>
                      );
                    })}
                  </tr>
                  {/* Segunda fila de cabecera: PCPs (repetidos por cada presupuesto) */}
                  <tr className="bg-gray-50">
                    {budgets.map((budget) => (
                      pcps.map((pcp) => {
                        const key = `${budget.budget_id}-${pcp.bim_pcp_id}`;
                        const isHidden = hiddenPcpsManoObra.has(key);
                        
                        if (isHidden) return null;
                        
                        return (
                          <th 
                            key={key}
                            className="border border-gray-300 px-2 py-8 text-center text-xs font-medium text-gray-700 relative group"
                          >
                            <div className="transform -rotate-90 whitespace-nowrap absolute inset-0 flex items-center justify-center pointer-events-none">
                              {pcp.bim_pcp_name}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePcpVisibility(budget.budget_id, pcp.bim_pcp_id, 'manoObra');
                              }}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-300 rounded p-0.5 pointer-events-auto"
                              title="Clic para ocultar esta columna"
                            >
                              <svg className="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            </button>
                          </th>
                        );
                      })
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => {
                    // Calcular si esta fila tiene problemas de validación
                    const isInasistente = inasistencias[employee.hr_employee_id] || false;
                    let totalHours = 0;
                    
                    // Calcular total de horas sumando todas las combinaciones
                    budgets.forEach(budget => {
                      pcps.forEach(pcp => {
                        const key = `${employee.hr_employee_id}-${budget.budget_id}-${pcp.bim_pcp_id}`;
                        const value = pcpData[key] || 0;
                        totalHours += value;
                      });
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
                        {/* Generar celdas para cada combinación de Presupuesto x PCP */}
                        {budgets.map((budget) => (
                          pcps.map((pcp) => {
                            const columnKey = `${budget.budget_id}-${pcp.bim_pcp_id}`;
                            const isHidden = hiddenPcpsManoObra.has(columnKey);
                            
                            if (isHidden) return null;
                            
                            const key = `${employee.hr_employee_id}-${budget.budget_id}-${pcp.bim_pcp_id}`;
                            
                            return (
                              <td key={key} className="border border-gray-300 px-2 py-3 text-center w-16">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={pcpData[key] || ''}
                                  onChange={(e) => handlePcpChange(employee.hr_employee_id, budget.budget_id, pcp.bim_pcp_id, e.target.value)}
                                  className={`w-12 px-1 py-1 border border-gray-300 rounded text-sm text-center text-gray-900 focus:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${
                                    (pcpData[key] || 0) > 0 
                                      ? 'bg-yellow-100' 
                                      : 'bg-white'
                                  }`}
                                  placeholder="0"
                                />
                              </td>
                            );
                          })
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-medium">
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700" colSpan={3}>
                      <strong>Subtotal</strong>
                    </td>
                    {/* Calcular subtotales para cada combinación de Presupuesto x PCP */}
                    {budgets.map((budget) => (
                      pcps.map((pcp) => {
                        const columnKey = `${budget.budget_id}-${pcp.bim_pcp_id}`;
                        const isHidden = hiddenPcpsManoObra.has(columnKey);
                        
                        if (isHidden) return null;
                        
                        // Calcular el subtotal para esta combinación
                        let subtotal = 0;
                        employees.forEach(employee => {
                          const key = `${employee.hr_employee_id}-${budget.budget_id}-${pcp.bim_pcp_id}`;
                          const value = pcpData[key] || 0;
                          subtotal += value;
                        });

                        return (
                          <td key={columnKey} className="border border-gray-300 px-2 py-3 text-center w-16">
                            <span className="font-bold text-blue-600">
                              {subtotal.toFixed(1)}h
                            </span>
                          </td>
                        );
                      })
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Supervisor */}
            {diaryPartSupervisor && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                <p className="text-sm font-bold text-gray-900">
                  SUPERVISOR: {diaryPartSupervisor}
                </p>
              </div>
            )}

            {/* Observaciones */}
            <div className="mt-6">
              <label htmlFor="observation" className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                id="observation"
                rows={3}
                value={observations}
                onChange={(e) => handleObservationChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none"
                placeholder="Agregar observaciones del parte diario..."
              />
            </div>

            {/* Archivo Adjunto */}
            <div className="mt-4">
              <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-2">
                Archivo Adjunto (opcional)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  id="attachment"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleAttachmentChange(file);
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                {attachments && (
                  <div className="flex items-center text-sm text-green-600">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {attachments.name}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Formatos soportados: imágenes, PDF, documentos de Word, archivos de texto
              </p>
            </div>

            {/* Info de presupuestos disponibles */}
            {budgets.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Presupuestos Disponibles:</h4>
                <div className="flex flex-wrap gap-2">
                  {budgets.map((budget) => (
                    <span key={budget.budget_id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {budget.budget_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
              </>
            )}

            {/* Contenido de Equipos */}
            {activeTab === 'equipos' && (
              <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-semibold text-gray-700">🚜 Equipos</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  💾 Guardado automático local
                </span>
              </div>
            </div>

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
            
            {/* Tabla de equipos */}
            <div className="overflow-x-auto">
              {hiddenPcpsEquipos.size > 0 && (
                <div className="mb-3 flex items-center justify-end">
                  <button
                    onClick={() => showAllPcps('equipos')}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Mostrar {hiddenPcpsEquipos.size} columna{hiddenPcpsEquipos.size > 1 ? 's' : ''} oculta{hiddenPcpsEquipos.size > 1 ? 's' : ''}</span>
                  </button>
                </div>
              )}
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700" rowSpan={2}>
                      Placa
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700" rowSpan={2}>
                      Equipo
                    </th>
                    {budgets.map((budget) => {
                      const visiblePcpsCount = pcps.filter(pcp => !hiddenPcpsEquipos.has(`${budget.budget_id}-${pcp.bim_pcp_id}`)).length;
                      if (visiblePcpsCount === 0) return null;
                      
                      return (
                        <th 
                          key={budget.budget_id} 
                          className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 bg-blue-100" 
                          colSpan={visiblePcpsCount}
                        >
                          {budget.budget_name}
                        </th>
                      );
                    })}
                  </tr>
                  <tr className="bg-gray-50">
                    {budgets.map((budget) => (
                      pcps.map((pcp) => {
                        const key = `${budget.budget_id}-${pcp.bim_pcp_id}`;
                        const isHidden = hiddenPcpsEquipos.has(key);
                        
                        if (isHidden) return null;
                        
                        return (
                          <th 
                            key={key}
                            className="border border-gray-300 px-2 py-8 text-center text-xs font-medium text-gray-700 relative group"
                          >
                            <div className="transform -rotate-90 whitespace-nowrap absolute inset-0 flex items-center justify-center pointer-events-none">
                              {pcp.bim_pcp_name}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePcpVisibility(budget.budget_id, pcp.bim_pcp_id, 'equipos');
                              }}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-300 rounded p-0.5 pointer-events-auto"
                              title="Clic para ocultar esta columna"
                            >
                              <svg className="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            </button>
                          </th>
                        );
                      })
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {equipments.map((equipment, index) => {
                    let totalHours = 0;
                    budgets.forEach(budget => {
                      pcps.forEach(pcp => {
                        const key = `${equipment.license_plate}-${budget.budget_id}-${pcp.bim_pcp_id}`;
                        const value = equipmentData[key] || 0;
                        totalHours += value;
                      });
                    });
                    
                    return (
                      <tr key={equipment.license_plate} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 font-medium">
                          {equipment.license_plate}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                          {equipment.name}
                        </td>
                        {budgets.map((budget) => (
                          pcps.map((pcp) => {
                            const key = `${equipment.license_plate}-${budget.budget_id}-${pcp.bim_pcp_id}`;
                            const columnKey = `${budget.budget_id}-${pcp.bim_pcp_id}`;
                            const isHidden = hiddenPcpsEquipos.has(columnKey);
                            
                            if (isHidden) return null;
                            
                            return (
                              <td key={key} className="border border-gray-300 px-2 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={equipmentData[key] || ''}
                                  onChange={(e) => handleEquipmentChange(equipment.license_plate, budget.budget_id, pcp.bim_pcp_id, e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm text-gray-900 focus:text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder=""
                                />
                              </td>
                            );
                          })
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={2} className="border border-gray-300 px-4 py-2 text-sm text-gray-900 text-right">
                      Subtotal (horas):
                    </td>
                    {budgets.map((budget) => (
                      pcps.map((pcp) => {
                        const columnKey = `${budget.budget_id}-${pcp.bim_pcp_id}`;
                        const isHidden = hiddenPcpsEquipos.has(columnKey);
                        
                        if (isHidden) return null;
                        
                        let subtotal = 0;
                        equipments.forEach(equipment => {
                          const key = `${equipment.license_plate}-${budget.budget_id}-${pcp.bim_pcp_id}`;
                          subtotal += equipmentData[key] || 0;
                        });
                        
                        return (
                          <td key={columnKey} className="border border-gray-300 px-2 py-2 text-center">
                            <span className="text-xs font-bold text-blue-700">
                              {subtotal.toFixed(1)}h
                            </span>
                          </td>
                        );
                      })
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Info de presupuestos disponibles */}
            {budgets.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Presupuestos Disponibles:</h4>
                <div className="flex flex-wrap gap-2">
                  {budgets.map((budget) => (
                    <span key={budget.budget_id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {budget.budget_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
              </>
            )}
          </div>
        )}

        {showParts && employees.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-3 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sin empleados
            </h3>
            <p className="text-gray-600">
              No se encontraron empleados en la brigada del parte diario.
            </p>
          </div>
        )}

        {/* Main Content - Cards moved to bottom */}
        <div className="grid gap-6 md:grid-cols-2 mt-3">
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
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-red-800 font-semibold mb-1">Error al cargar parte diario</h4>
                    <div className="text-red-700 text-sm">
                      {error.split('\n').map((line, index) => (
                        <div key={index} className={index > 0 ? 'mt-1' : ''}>
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
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
              <div className="mt-3">
                <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 font-medium">
                    ⚠️ Ya tienes un parte cargado
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Súbelo o límpialo para cargar uno nuevo
                  </p>
                </div>
                <button
                  onClick={handleClearLocalData}
                  className="w-full flex items-center justify-center space-x-2 bg-red-100 text-red-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Descartar parte actual</span>
                </button>
              </div>
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
