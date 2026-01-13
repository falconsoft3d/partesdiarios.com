'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiService, PCP, Employee, Equipment, Budget, BimInterface, BimInterfacePcp, WorkBreakdown, BimElement, WorkPackage } from '@/services/api';
import { Settings, LogOut, Download, AlertCircle, Upload, Trash2, HelpCircle, Lock, Filter, Search, X } from 'lucide-react';

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
  const [diaryPartCodBrigada, setDiaryPartCodBrigada] = useState<string>('');
  const [diaryPartNameBrigada, setDiaryPartNameBrigada] = useState<string>('');
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
  const [hiddenPcpsHorasPerdidasEmpleados, setHiddenPcpsHorasPerdidasEmpleados] = useState<Set<string>>(new Set());
  const [hiddenPcpsHorasPerdidasEquipos, setHiddenPcpsHorasPerdidasEquipos] = useState<Set<string>>(new Set());
  const [showHiddenColumnsMenu, setShowHiddenColumnsMenu] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'manoObra' | 'equipos' | 'produccion' | 'horasPerdidas'>('manoObra');
  const [horasPerdidasTab, setHorasPerdidasTab] = useState<'empleados' | 'equipos'>('empleados');
  const [horasPerdidasEmpleadosData, setHorasPerdidasEmpleadosData] = useState<{[key: string]: number}>({});
  const [horasPerdidasEquiposData, setHorasPerdidasEquiposData] = useState<{[key: string]: number}>({});
  const [horasPerdidasEmpleadosHoraInicio, setHorasPerdidasEmpleadosHoraInicio] = useState<{[key: string]: number}>({});
  const [horasPerdidasEquiposHoraInicio, setHorasPerdidasEquiposHoraInicio] = useState<{[key: string]: number}>({});
  const [horasPerdidasEmpleadosCausa, setHorasPerdidasEmpleadosCausa] = useState<{[key: string]: string}>({});
  const [horasPerdidasEquiposCausa, setHorasPerdidasEquiposCausa] = useState<{[key: string]: string}>({});
  const [horasPerdidasEmpleadosDescripcion, setHorasPerdidasEmpleadosDescripcion] = useState<{[key: string]: string}>({});
  const [horasPerdidasEquiposDescripcion, setHorasPerdidasEquiposDescripcion] = useState<{[key: string]: string}>({});
  const [produccionData, setProduccionData] = useState<{[key: string]: number}>({});
  const [produccionEstatus, setProduccionEstatus] = useState<{[key: string]: string}>({});
  const [produccionODT, setProduccionODT] = useState<{[key: string]: number}>({});
  const [produccionDesglosa, setProduccionDesglosa] = useState<{[key: string]: number}>({});
  const [collapsedProduccionTables, setCollapsedProduccionTables] = useState<Set<string>>(new Set());
  const [produccionExtraRows, setProduccionExtraRows] = useState<{[tableKey: string]: Array<{id: string; elementId: number}>}>({});
  const [visibleElements, setVisibleElements] = useState<{[tableKey: string]: Set<number>}>({});
  const [showElementFilter, setShowElementFilter] = useState<{[tableKey: string]: boolean}>({});
  const [elementSearchTerm, setElementSearchTerm] = useState<{[tableKey: string]: string}>({});
  const [allInasistenciasChecked, setAllInasistenciasChecked] = useState(false);
  const [isPartInfoCollapsed, setIsPartInfoCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('part_info_collapsed');
      return saved === 'true';
    }
    return false;
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme_mode');
      return saved === 'dark';
    }
    return false;
  });
  
  // PIN de seguridad
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Escuchar cambios en el tema desde otras páginas
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme_mode');
        setIsDarkMode(saved === 'dark');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
        horasPerdidasEmpleadosData,
        horasPerdidasEquiposData,
        horasPerdidasEmpleadosHoraInicio,
        horasPerdidasEquiposHoraInicio,
        horasPerdidasEmpleadosCausa,
        horasPerdidasEquiposCausa,
        horasPerdidasEmpleadosDescripcion,
        horasPerdidasEquiposDescripcion,
        horasPerdidasTab,
        produccionData,
        produccionEstatus,
        produccionODT,
        produccionDesglosa,
        observations,
        inasistencias,
        noTrabajoState,
        attachmentName,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('diary_parts_draft', JSON.stringify(localData));
    }
  }, [pcps, employees, equipments, budgets, diaryPartId, diaryPartName, diaryPartDate, diaryPartTurno, diaryPartSupervisor, diaryPartFramework, diaryPartResponsable, diaryPartDisciplina, diaryPartArea, diaryPartUbicacion, cantPartesAbiertos, pcpData, equipmentData, horasPerdidasEmpleadosData, horasPerdidasEquiposData, horasPerdidasEmpleadosHoraInicio, horasPerdidasEquiposHoraInicio, horasPerdidasEmpleadosCausa, horasPerdidasEquiposCausa, horasPerdidasEmpleadosDescripcion, horasPerdidasEquiposDescripcion, horasPerdidasTab, produccionData, produccionEstatus, produccionODT, produccionDesglosa, observations, inasistencias, noTrabajoState, attachments]);

  // Cargar datos del localStorage al montar el componente
  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  // Guardar automáticamente cuando cambien los datos
  useEffect(() => {
    if (employees.length > 0 || pcps.length > 0) {
      saveToLocalStorage();
    }
  }, [employees, equipments, pcps, pcpData, equipmentData, horasPerdidasEmpleadosData, horasPerdidasEquiposData, horasPerdidasEmpleadosHoraInicio, horasPerdidasEquiposHoraInicio, horasPerdidasEmpleadosCausa, horasPerdidasEquiposCausa, horasPerdidasEmpleadosDescripcion, horasPerdidasEquiposDescripcion, observations, saveToLocalStorage]);

  // Ocultar PCPs por defecto en Horas Perdidas (excepto el primero)
  useEffect(() => {
    if (pcps.length > 0 && budgets.length > 0) {
      const hiddenKeys = new Set<string>();
      
      budgets.forEach(budget => {
        pcps.forEach((pcp, index) => {
          // Ocultar todos excepto el primero
          if (index > 0) {
            hiddenKeys.add(`${budget.budget_id}-${pcp.bim_pcp_id}`);
          }
        });
      });
      
      setHiddenPcpsHorasPerdidasEmpleados(hiddenKeys);
      setHiddenPcpsHorasPerdidasEquipos(new Set(hiddenKeys));
    }
  }, [pcps, budgets]);

  // Colapsar todas las tablas de producción por defecto
  useEffect(() => {
    if (pcps.length > 0 && budgets.length > 0) {
      const collapsedKeys = new Set<string>();
      
      budgets.forEach(budget => {
        pcps.forEach(pcp => {
          // Colapsar todas las tablas
          collapsedKeys.add(`${budget.budget_id}-${pcp.bim_pcp_id}`);
        });
      });
      
      setCollapsedProduccionTables(collapsedKeys);
    }
  }, [pcps, budgets]);

  const handleLoadPart = async () => {
    if (!connection) return;
    
    setLoadingParts(true);
    setError(null);
    setSaveSuccess(null); // Limpiar mensaje de éxito al cargar nuevo parte
    
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
        setDiaryPartCodBrigada(result.cod_brigada || '');
        setDiaryPartNameBrigada(result.name_brigada || '');
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

  const handleHorasPerdidasEmpleadosChange = (budgetId: number, pcpId: number, value: string) => {
    const key = `${budgetId}-${pcpId}`;
    setHorasPerdidasEmpleadosData(prev => ({
      ...prev,
      [key]: Number(value) || 0
    }));
  };

  const handleHorasPerdidasEquiposChange = (licensePlate: string, budgetId: number, pcpId: number, value: string) => {
    const key = `${licensePlate}-${budgetId}-${pcpId}`;
    setHorasPerdidasEquiposData(prev => ({
      ...prev,
      [key]: Number(value) || 0
    }));
  };

  const handleHorasPerdidasEmpleadosHoraInicioChange = (budgetId: number, pcpId: number, value: string) => {
    const key = `${budgetId}-${pcpId}`;
    setHorasPerdidasEmpleadosHoraInicio(prev => ({
      ...prev,
      [key]: Number(value) || 8
    }));
  };

  const handleHorasPerdidasEquiposHoraInicioChange = (licensePlate: string, budgetId: number, pcpId: number, value: string) => {
    const key = `${licensePlate}-${budgetId}-${pcpId}`;
    setHorasPerdidasEquiposHoraInicio(prev => ({
      ...prev,
      [key]: Number(value) || 8
    }));
  };

  const handleHorasPerdidasEmpleadosCausaChange = (budgetId: number, pcpId: number, value: string) => {
    const key = `${budgetId}-${pcpId}`;
    setHorasPerdidasEmpleadosCausa(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleHorasPerdidasEquiposCausaChange = (licensePlate: string, budgetId: number, pcpId: number, value: string) => {
    const key = `${licensePlate}-${budgetId}-${pcpId}`;
    setHorasPerdidasEquiposCausa(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleHorasPerdidasEmpleadosDescripcionChange = (budgetId: number, pcpId: number, value: string) => {
    const key = `${budgetId}-${pcpId}`;
    setHorasPerdidasEmpleadosDescripcion(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleHorasPerdidasEquiposDescripcionChange = (licensePlate: string, budgetId: number, pcpId: number, value: string) => {
    const key = `${licensePlate}-${budgetId}-${pcpId}`;
    setHorasPerdidasEquiposDescripcion(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleProduccionChange = (budgetId: number, interfaceId: number, pcpId: number, elementId: number, value: string) => {
    const key = `${budgetId}-${interfaceId}-${pcpId}-${elementId}`;
    setProduccionData(prev => ({
      ...prev,
      [key]: Number(value) || 0
    }));
  };

  const handleProduccionEstatusChange = (budgetId: number, interfaceId: number, pcpId: number, elementId: number, value: string) => {
    const key = `${budgetId}-${interfaceId}-${pcpId}-${elementId}`;
    setProduccionEstatus(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleProduccionODTChange = (budgetId: number, interfaceId: number, pcpId: number, elementId: number, value: string) => {
    const key = `${budgetId}-${interfaceId}-${pcpId}-${elementId}`;
    setProduccionODT(prev => ({
      ...prev,
      [key]: Number(value) || 0
    }));
  };

  const handleProduccionDesglosaChange = (budgetId: number, interfaceId: number, pcpId: number, elementId: number, value: string) => {
    const key = `${budgetId}-${interfaceId}-${pcpId}-${elementId}`;
    setProduccionDesglosa(prev => ({
      ...prev,
      [key]: Number(value) || 0
    }));
  };

  const toggleProduccionTable = (budgetId: number, pcpId: number) => {
    const key = `${budgetId}-${pcpId}`;
    setCollapsedProduccionTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const toggleElementFilter = (tableKey: string) => {
    setShowElementFilter(prev => ({
      ...prev,
      [tableKey]: !prev[tableKey]
    }));
  };

  const toggleElementVisibility = (tableKey: string, elementId: number) => {
    setVisibleElements(prev => {
      const currentSet = prev[tableKey] || new Set<number>();
      const newSet = new Set(currentSet);
      
      if (newSet.has(elementId)) {
        newSet.delete(elementId);
      } else {
        newSet.add(elementId);
      }
      
      return {
        ...prev,
        [tableKey]: newSet
      };
    });
  };

  const selectAllElements = (tableKey: string, allElementIds: number[]) => {
    setVisibleElements(prev => ({
      ...prev,
      [tableKey]: new Set(allElementIds)
    }));
  };

  const deselectAllElements = (tableKey: string) => {
    setVisibleElements(prev => ({
      ...prev,
      [tableKey]: new Set<number>()
    }));
  };

  const isElementVisible = (tableKey: string, elementId: number): boolean => {
    const visibleSet = visibleElements[tableKey];
    // Si no hay filtro definido (undefined), mostrar todos
    if (visibleSet === undefined) return true;
    // Si hay filtro definido pero está vacío, no mostrar ninguno
    if (visibleSet.size === 0) return false;
    return visibleSet.has(elementId);
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

  const handleToggleAllInasistencias = () => {
    const newValue = !allInasistenciasChecked;
    const newInasistencias: {[key: number]: boolean} = {};
    
    employees.forEach(employee => {
      // Verificar si este empleado tiene horas asignadas en algún PCP
      const hasHoras = Object.keys(pcpData).some(key => {
        const [empId] = key.split('-');
        return parseInt(empId) === employee.hr_employee_id && pcpData[key] > 0;
      });
      
      // Solo marcar/desmarcar si el empleado NO tiene horas asignadas
      if (!hasHoras) {
        newInasistencias[employee.hr_employee_id] = newValue;
      } else {
        // Mantener el valor actual si tiene horas
        newInasistencias[employee.hr_employee_id] = inasistencias[employee.hr_employee_id] || false;
      }
    });
    
    setInasistencias(newInasistencias);
    setAllInasistenciasChecked(newValue);
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
          setHorasPerdidasEmpleadosData(parsed.horasPerdidasEmpleadosData || {});
          setHorasPerdidasEquiposData(parsed.horasPerdidasEquiposData || {});
          setHorasPerdidasEmpleadosHoraInicio(parsed.horasPerdidasEmpleadosHoraInicio || {});
          setHorasPerdidasEquiposHoraInicio(parsed.horasPerdidasEquiposHoraInicio || {});
          setHorasPerdidasEmpleadosCausa(parsed.horasPerdidasEmpleadosCausa || {});
          setHorasPerdidasEquiposCausa(parsed.horasPerdidasEquiposCausa || {});
          setHorasPerdidasEmpleadosDescripcion(parsed.horasPerdidasEmpleadosDescripcion || {});
          setHorasPerdidasEquiposDescripcion(parsed.horasPerdidasEquiposDescripcion || {});
          setHorasPerdidasTab(parsed.horasPerdidasTab || 'empleados');
          setProduccionData(parsed.produccionData || {});
          setProduccionEstatus(parsed.produccionEstatus || {});
          setProduccionODT(parsed.produccionODT || {});
          setProduccionDesglosa(parsed.produccionDesglosa || {});
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

        // Preparar JSON de bajada (datos recibidos del servidor)
        const downloadJson = {
          part_id: diaryPartId,
          date: diaryPartDate,
          part_name: diaryPartName,
          pcps: pcps,
          employees: employees,
          equipments: equipments,
          budgets: budgets,
          turno: diaryPartTurno,
          framework_contract_id: diaryPartFramework,
          responsable: diaryPartResponsable,
          supervisor: diaryPartSupervisor,
          diciplina: diaryPartDisciplina,
          area: diaryPartArea,
          ubicacion: diaryPartUbicacion
        };

        // Preparar JSON de subida (datos enviados al servidor)
        const uploadJson = {
          id: diaryPartId,
          observation: observations || '',
          employee_lines_ids: [],
          equipment_lines_ids: [],
          produccion_lines_ids: [],
          horas_perdidas_empleados_ids: [],
          horas_perdidas_equipos_ids: [],
          state: noTrabajoState ? 'dont_work' : undefined
        };

        // Agregar líneas de empleados
        employees.forEach(employee => {
          const isInasistente = inasistencias[employee.hr_employee_id] || false;
          
          if (isInasistente) {
            if (budgets.length > 0 && pcps.length > 0) {
              uploadJson.employee_lines_ids.push({
                hr_employee_id: employee.hr_employee_id,
                bim_resource_id: false,
                budget_id: budgets[0].budget_id,
                bim_pcp_id: pcps[0].bim_pcp_id,
                hh: 0,
                i: true
              });
            }
          } else {
            budgets.forEach(budget => {
              pcps.forEach(pcp => {
                const key = `${employee.hr_employee_id}-${budget.budget_id}-${pcp.bim_pcp_id}`;
                const hours = pcpData[key] || 0;
                
                if (hours > 0) {
                  uploadJson.employee_lines_ids.push({
                    hr_employee_id: employee.hr_employee_id,
                    bim_resource_id: false,
                    budget_id: budget.budget_id,
                    bim_pcp_id: pcp.bim_pcp_id,
                    hh: hours,
                    i: false
                  });
                }
              });
            });
          }
        });

        // Agregar líneas de equipos
        equipments.forEach(equipment => {
          budgets.forEach(budget => {
            pcps.forEach(pcp => {
              const key = `${equipment.license_plate}-${budget.budget_id}-${pcp.bim_pcp_id}`;
              const hours = equipmentData[key] || 0;
              
              if (hours > 0) {
                uploadJson.equipment_lines_ids.push({
                  equipment_name: equipment.name,
                  license_plate: equipment.license_plate,
                  budget_id: budget.budget_id,
                  bim_pcp_id: pcp.bim_pcp_id,
                  hh: hours
                });
              }
            });
          });
        });

        // Agregar líneas de producción - elementos base
        console.log('🔍 DEBUG produccionData:', produccionData);
        console.log('🔍 DEBUG produccionODT:', produccionODT);
        console.log('🔍 DEBUG produccionDesglosa:', produccionDesglosa);
        console.log('🔍 DEBUG produccionExtraRows:', produccionExtraRows);
        
        // Crear un mapa de valores por defecto de desglose
        const defaultWorkBreakdown: {[key: string]: number} = {};
        budgets.forEach(budget => {
          budget.arr_bim_interface?.forEach((bimInterface: any) => {
            const pcpsArray = bimInterface.pcps || [];
            pcpsArray.forEach((pcpOrPackage: any) => {
              // Puede ser un PCP (con work_breakdown) o un work_package (con elements)
              if (pcpOrPackage.work_breakdown && pcpOrPackage.work_breakdown.length > 0) {
                // Es un PCP con work_breakdown
                const pcpId = pcpOrPackage.bim_pcp_id;
                const defaultWB = pcpOrPackage.work_breakdown[0].work_breakdown_id;
                
                // Ahora buscar los elementos en el siguiente item del array (work_package)
                const nextIndex = pcpsArray.indexOf(pcpOrPackage) + 1;
                if (nextIndex < pcpsArray.length && pcpsArray[nextIndex].elements) {
                  const workPackage = pcpsArray[nextIndex];
                  workPackage.elements.forEach((element: any) => {
                    const key = `${budget.budget_id}-${bimInterface.bim_interface_id}-${pcpId}-${element.bim_element_id}`;
                    defaultWorkBreakdown[key] = defaultWB;
                  });
                }
              }
            });
          });
        });
        
        console.log('🔍 DEBUG defaultWorkBreakdown:', defaultWorkBreakdown);
        
        Object.keys(produccionData).forEach(key => {
          const cantidad = produccionData[key];
          const odt = produccionODT?.[key] || 0;
          // Usar el valor guardado o el valor por defecto
          const workBreakdownId = produccionDesglosa?.[key] || defaultWorkBreakdown[key];
          
          console.log(`🔍 Procesando key: ${key}`, {
            cantidad,
            odt,
            workBreakdownId,
            workBreakdownIdGuardado: produccionDesglosa?.[key],
            workBreakdownIdDefault: defaultWorkBreakdown[key],
            pasaValidacion: (cantidad > 0 || odt > 0) && workBreakdownId
          });
          
          const parts = key.split('-');
          if (parts.length === 4 && (cantidad > 0 || odt > 0) && workBreakdownId) {
            const [budgetId, interfaceId, pcpId, elementId] = parts.map(Number);
            
            uploadJson.produccion_lines_ids.push({
              budget_id: budgetId,
              interface_id: interfaceId,
              pcp_id: pcpId,
              element_id: elementId,
              odt: odt,
              work_breakdown_id: Number(workBreakdownId),
              cantidad: cantidad
            });
          }
        });

        // Agregar líneas de producción - filas extra
        Object.keys(produccionExtraRows).forEach(tableKey => {
          const rows = produccionExtraRows[tableKey];
          rows.forEach(row => {
            // El key en el UI usa row.id, no row.elementId
            const rowKey = `${tableKey}-${row.id}`;
            const cantidad = produccionData?.[rowKey] || 0;
            const odt = produccionODT?.[rowKey] || 0;
            const workBreakdownId = produccionDesglosa?.[rowKey];
            
            console.log(`🔍 Procesando fila extra: ${rowKey}`, {
              cantidad,
              odt,
              workBreakdownId,
              elementId: row.elementId,
              pasaValidacion: (cantidad > 0 || odt > 0) && workBreakdownId
            });
            
            if ((cantidad > 0 || odt > 0) && workBreakdownId) {
              const [budgetId, interfaceId, pcpId] = tableKey.split('-').map(Number);
              
              uploadJson.produccion_lines_ids.push({
                budget_id: budgetId,
                interface_id: interfaceId,
                pcp_id: pcpId,
                element_id: row.elementId,
                odt: odt,
                work_breakdown_id: Number(workBreakdownId),
                cantidad: cantidad
              });
            }
          });
        });

        console.log('✅ Total líneas de producción agregadas:', uploadJson.produccion_lines_ids.length);
        console.log('📦 produccion_lines_ids:', JSON.stringify(uploadJson.produccion_lines_ids, null, 2));

        // Agregar horas perdidas de empleados (ahora basado en presupuestos, no empleados)
        Object.keys(horasPerdidasEmpleadosData).forEach(key => {
          const horasPerdidas = horasPerdidasEmpleadosData[key];
          if (horasPerdidas > 0) {
            const parts = key.split('-').map(Number);
            if (parts.length === 2) {
              const [budgetId, pcpId] = parts;
              uploadJson.horas_perdidas_empleados_ids.push({
                budget_id: budgetId,
                bim_pcp_id: pcpId,
                hora_inicio: horasPerdidasEmpleadosHoraInicio?.[key] || 0,
                horas_perdidas: horasPerdidas,
                causa: horasPerdidasEmpleadosCausa?.[key] || '',
                descripcion: horasPerdidasEmpleadosDescripcion?.[key] || ''
              });
            }
          }
        });

        // Agregar horas perdidas de equipos
        Object.keys(horasPerdidasEquiposData).forEach(key => {
          const horasPerdidas = horasPerdidasEquiposData[key];
          if (horasPerdidas > 0) {
            const lastHyphenIndex = key.lastIndexOf('-');
            const secondLastHyphenIndex = key.lastIndexOf('-', lastHyphenIndex - 1);
            const licensePlate = key.substring(0, secondLastHyphenIndex);
            const budgetId = parseInt(key.substring(secondLastHyphenIndex + 1, lastHyphenIndex));
            const pcpId = parseInt(key.substring(lastHyphenIndex + 1));
            
            uploadJson.horas_perdidas_equipos_ids.push({
              license_plate: licensePlate,
              budget_id: budgetId,
              bim_pcp_id: pcpId,
              hora_inicio: horasPerdidasEquiposHoraInicio?.[key] || 0,
              horas_perdidas: horasPerdidas,
              causa: horasPerdidasEquiposCausa?.[key] || '',
              descripcion: horasPerdidasEquiposDescripcion?.[key] || ''
            });
          }
        });

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
          action: 'upload',
          downloadJson: downloadJson,
          uploadJson: uploadJson
        };

        console.log('📝 Guardando entrada en historial:', {
          id: historyEntry.id,
          timestamp: historyEntry.timestamp,
          partName: historyEntry.partName,
          date: historyEntry.date
        });

        // Obtener historial existente
        const existingHistory = localStorage.getItem('diary_parts_history');
        const history = existingHistory ? JSON.parse(existingHistory) : [];
        
        console.log('📚 Historial antes de agregar:', history.length, 'entradas');
        
        // Agregar nueva entrada al inicio
        history.unshift(historyEntry);
        
        console.log('📚 Historial después de agregar:', history.length, 'entradas');
        
        // Limitar el historial a las últimas 50 entradas
        const limitedHistory = history.slice(0, 50);
        
        console.log('📚 Historial después de limitar:', limitedHistory.length, 'entradas');
        
        // Guardar en localStorage
        localStorage.setItem('diary_parts_history', JSON.stringify(limitedHistory));
        
        console.log('✅ Entrada guardada en el historial con JSONs completos');
        console.log('🔍 Verificar en localStorage:', localStorage.getItem('diary_parts_history')?.substring(0, 200));
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
      setHorasPerdidasEmpleadosData({});
      setHorasPerdidasEquiposData({});
      setHorasPerdidasEmpleadosHoraInicio({});
      setHorasPerdidasEquiposHoraInicio({});
      setHorasPerdidasEmpleadosCausa({});
      setHorasPerdidasEquiposCausa({});
      setHorasPerdidasEmpleadosDescripcion({});
      setHorasPerdidasEquiposDescripcion({});
      setProduccionData({});
      setProduccionEstatus({});
      setProduccionODT({});
      setProduccionDesglosa({});
      setProduccionExtraRows({});
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

  const hasValidationErrors = () => {
    // Si no hay empleados o pcps cargados, no hay errores
    if (employees.length === 0 || pcps.length === 0) return false;
    
    // Si está marcado "NO trabajo", no hay errores de validación
    if (noTrabajoState) return false;
    
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
          return true; // Hay un error de validación
        }
      }
    }
    
    return false; // No hay errores
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

        // Si hay errores de validación, detener el proceso (los errores ya se muestran arriba)
        if (validationErrors.length > 0) {
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
      console.log('Equipment Data keys:', Object.keys(equipmentData).length);
      console.log('Produccion Data keys:', Object.keys(produccionData).length);
      console.log('Horas Perdidas Empleados keys:', Object.keys(horasPerdidasEmpleadosData).length);
      console.log('Horas Perdidas Equipos keys:', Object.keys(horasPerdidasEquiposData).length);
      console.log('Observations:', observations);
      console.log('File attached:', !!fileData);
      console.log('Inasistencias:', inasistencias);

      // Calcular KPIs antes de enviar
      let manoObraRows = 0;
      employees.forEach(employee => {
        const isInasistente = inasistencias?.[employee.hr_employee_id] || false;
        if (isInasistente) {
          manoObraRows += 1; // Una fila por inasistencia
        } else {
          budgets.forEach(budget => {
            pcps.forEach(pcp => {
              const key = `${employee.hr_employee_id}-${budget.budget_id}-${pcp.bim_pcp_id}`;
              const hours = pcpData[key] || 0;
              if (hours > 0) {
                manoObraRows += 1;
              }
            });
          });
        }
      });

      let equiposRows = 0;
      if (equipments && equipmentData) {
        equipments.forEach(equipment => {
          budgets.forEach(budget => {
            pcps.forEach(pcp => {
              const key = `${equipment.license_plate}-${budget.budget_id}-${pcp.bim_pcp_id}`;
              const hours = equipmentData[key] || 0;
              if (hours > 0) {
                equiposRows += 1;
              }
            });
          });
        });
      }

      let produccionRows = 0;
      if (produccionData) {
        Object.keys(produccionData).forEach(key => {
          const cantidad = produccionData[key];
          const odt = produccionODT?.[key] || 0;
          if (cantidad > 0 || odt > 0) {
            produccionRows += 1;
          }
        });
      }

      let horasPerdidasEmpleadosRows = 0;
      if (horasPerdidasEmpleadosData) {
        Object.keys(horasPerdidasEmpleadosData).forEach(key => {
          const horas = horasPerdidasEmpleadosData[key] || 0;
          if (horas > 0) {
            horasPerdidasEmpleadosRows += 1;
          }
        });
      }

      let horasPerdidasEquiposRows = 0;
      if (horasPerdidasEquiposData) {
        Object.keys(horasPerdidasEquiposData).forEach(key => {
          const horas = horasPerdidasEquiposData[key] || 0;
          if (horas > 0) {
            horasPerdidasEquiposRows += 1;
          }
        });
      }

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
        noTrabajoState,
        equipments,
        equipmentData,
        produccionData,
        produccionODT,
        produccionDesglosa,
        produccionExtraRows,
        horasPerdidasEmpleadosData,
        horasPerdidasEmpleadosHoraInicio,
        horasPerdidasEmpleadosCausa,
        horasPerdidasEmpleadosDescripcion,
        horasPerdidasEquiposData,
        horasPerdidasEquiposHoraInicio,
        horasPerdidasEquiposCausa,
        horasPerdidasEquiposDescripcion
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

      // Crear mensaje con KPIs
      const kpiMessage = `✅ Parte subido exitosamente!\n\n📊 KPIs de subida:\n• Filas de mano de obra: ${manoObraRows}\n• Filas de equipos: ${equiposRows}\n• Filas de producción: ${produccionRows}\n• Filas de horas perdidas (empleados): ${horasPerdidasEmpleadosRows}\n• Filas de horas perdidas (equipos): ${horasPerdidasEquiposRows}\n• Observaciones: ${observations ? 'Sí' : 'No'}\n• Archivo adjunto: ${fileData ? 'Sí' : 'No'}`;

      console.log('✅ Guardado exitoso!');
      setSaveSuccess(kpiMessage);
      
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
      setHorasPerdidasEmpleadosData({});
      setHorasPerdidasEquiposData({});
      setHorasPerdidasEmpleadosHoraInicio({});
      setHorasPerdidasEquiposHoraInicio({});
      setHorasPerdidasEmpleadosCausa({});
      setHorasPerdidasEquiposCausa({});
      setHorasPerdidasEmpleadosDescripcion({});
      setHorasPerdidasEquiposDescripcion({});
      setHorasPerdidasEquiposData({});
      setHorasPerdidasEquiposHoraInicio({});
      setHorasPerdidasEquiposCausa({});
      setHorasPerdidasEquiposDescripcion({});
      setProduccionData({});
      setProduccionEstatus({});
      setProduccionODT({});
      setProduccionDesglosa({});
      setObservations('');
      setInasistencias({});
      setNoTrabajoState(false);
      setAttachments(null);
      clearLocalStorage();
      
      // No limpiar el mensaje de éxito automáticamente
      // Se limpiará solo cuando se suba un nuevo parte
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

  const handleLockApp = () => {
    if (typeof window !== 'undefined') {
      const isPinEnabled = localStorage.getItem('security_pin_enabled') === 'true';
      const savedPin = localStorage.getItem('security_pin');
      
      if (isPinEnabled && savedPin) {
        setIsLocked(true);
        setPinInput('');
        setPinError('');
      }
    }
  };

  const handleUnlockAttempt = () => {
    if (typeof window !== 'undefined') {
      const savedPin = localStorage.getItem('security_pin');
      
      if (pinInput === savedPin) {
        setIsLocked(false);
        setPinInput('');
        setPinError('');
      } else {
        setPinError('PIN incorrecto');
        setPinInput('');
      }
    }
  };

  const handlePinKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlockAttempt();
    }
  };

  const togglePcpVisibility = (budgetId: number, pcpId: number, tableType: 'manoObra' | 'equipos' | 'horasPerdidasEmpleados' | 'horasPerdidasEquipos' = 'manoObra') => {
    const key = `${budgetId}-${pcpId}`;
    let setterFn;
    if (tableType === 'manoObra') {
      setterFn = setHiddenPcpsManoObra;
    } else if (tableType === 'equipos') {
      setterFn = setHiddenPcpsEquipos;
    } else if (tableType === 'horasPerdidasEmpleados') {
      setterFn = setHiddenPcpsHorasPerdidasEmpleados;
    } else {
      setterFn = setHiddenPcpsHorasPerdidasEquipos;
    }
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

  const showAllPcps = (tableType: 'manoObra' | 'equipos' | 'horasPerdidasEmpleados' | 'horasPerdidasEquipos' = 'manoObra') => {
    if (tableType === 'manoObra') {
      setHiddenPcpsManoObra(new Set());
    } else if (tableType === 'equipos') {
      setHiddenPcpsEquipos(new Set());
    } else if (tableType === 'horasPerdidasEmpleados') {
      setHiddenPcpsHorasPerdidasEmpleados(new Set());
    } else {
      setHiddenPcpsHorasPerdidasEquipos(new Set());
    }
    setShowHiddenColumnsMenu(false);
  };

  // Funciones para verificar si las pestañas tienen datos
  const hasManoObraData = () => {
    // Verificar si hay horas en pcpData o si hay inasistencias marcadas
    return Object.keys(pcpData).length > 0 || Object.values(inasistencias).some(val => val);
  };

  const hasEquiposData = () => {
    // Verificar si hay horas de equipos en equipmentData
    return Object.keys(equipmentData).length > 0;
  };

  const hasProduccionData = () => {
    // Verificar si hay datos de producción (ODT, cantidad, o filas extra)
    return Object.keys(produccionODT).length > 0 || 
           Object.keys(produccionData).length > 0 || 
           Object.keys(produccionExtraRows).some(key => produccionExtraRows[key].length > 0);
  };

  const hasHorasPerdidasData = () => {
    // Verificar si hay horas perdidas de empleados o equipos
    return Object.keys(horasPerdidasEmpleadosData).length > 0 || 
           Object.keys(horasPerdidasEquiposData).length > 0;
  };

  // Función para verificar si un PCP tiene horas en mano de obra en cualquier presupuesto
  const pcpHasHorasInManoObra = (budgetId: number, pcpId: number): boolean => {
    // Verificar si hay alguna entrada en pcpData para este PCP en CUALQUIER presupuesto
    const hasHoras = Object.keys(pcpData).some(key => {
      const [empId, budId, pcpIdStr] = key.split('-');
      return parseInt(pcpIdStr) === pcpId && pcpData[key] > 0;
    });
    return hasHoras;
  };

  const togglePartInfoCollapse = () => {
    const newState = !isPartInfoCollapsed;
    setIsPartInfoCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('part_info_collapsed', String(newState));
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
      </div>
    );
  }

  if (!isAuthenticated || !connection) {
    return null; // Se redirige en useEffect
  }

  return (
    <div className={`min-h-screen p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      {/* Pantalla de bloqueo con PIN */}
      {isLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className={`rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-center mb-6">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-yellow-900' : 'bg-yellow-100'}`}>
                <Lock className={`h-8 w-8 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Parte Offline Bloqueado
                <AlertCircle className={`inline-block ml-2 h-6 w-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              </h2>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Ingresa tu PIN de 4 dígitos
              </p>
            </div>

            <div className="mb-6">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPinInput(value);
                  setPinError('');
                }}
                onKeyPress={handlePinKeyPress}
                autoFocus
                className={`w-full px-4 py-3 border-2 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } ${pinError ? 'border-red-500' : ''}`}
                placeholder="••••"
              />
              {pinError && (
                <p className="text-red-500 text-sm text-center mt-2">{pinError}</p>
              )}
            </div>

            <button
              onClick={handleUnlockAttempt}
              disabled={pinInput.length !== 4}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                pinInput.length === 4
                  ? isDarkMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Desbloquear
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Parte Diario: {connection.employeeName || connection.username}
              </h1>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                Conectado a: <span className="font-medium">{connection.url}</span>
              </p>
              {diaryPartDate && (
                <p className={`text-sm font-semibold mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
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
                disabled={savingParts || !hasLocalData() || hasValidationErrors()}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                title="Subir parte al servidor"
              >
                <Upload className="h-5 w-5" />
                <span>SUBIR</span>
              </button>
              <button
                onClick={() => window.location.href = '/help'}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-orange-400 hover:bg-gray-700' : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'}`}
                title="Ayuda y tutoriales"
              >
                <HelpCircle className="h-6 w-6" />
              </button>
              <button
                onClick={handleHistory}
                className={`relative p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-purple-400 hover:bg-gray-700' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'}`}
                title="Ver historial"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {historyCount > 0 && (
                  <span className={`absolute -top-1 -right-1 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-300 text-gray-700'}`}>
                    {historyCount > 99 ? '99+' : historyCount}
                  </span>
                )}
              </button>
              <button
                onClick={handleManageConnection}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
                title="Gestionar conexión"
              >
                <Settings className="h-6 w-6" />
              </button>
              {typeof window !== 'undefined' && localStorage.getItem('security_pin_enabled') === 'true' && (
                <button
                  onClick={handleLockApp}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-yellow-400 hover:bg-gray-700' : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'}`}
                  title="Bloquear con PIN"
                >
                  <Lock className="h-6 w-6" />
                </button>
              )}
              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-red-400 hover:bg-gray-700' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'}`}
                title="Cerrar sesión"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Información del parte - Contenedor separado */}
        {showParts && employees.length > 0 && pcps.length > 0 && (
          <div className={`rounded-2xl shadow-xl p-6 mt-3 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Información del Parte</h2>
              <div className="flex items-center space-x-3">
                <img src="/logo.png" alt="Logo" className="h-20 w-20 object-contain" />
                <button
                  onClick={togglePartInfoCollapse}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
                  title={isPartInfoCollapsed ? 'Expandir' : 'Minimizar'}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-transform duration-300 ${isPartInfoCollapsed ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
            <div className={`space-y-3 transition-all duration-300 overflow-hidden ${isPartInfoCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
              {/* Grid de 2x2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Fila 1, Columna 1: Framework Contract y Responsable */}
                {diaryPartFramework && (
                  <div className={`p-3 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      [{diaryPartFramework}]{diaryPartResponsable && `, RESPONSABLE: ${diaryPartResponsable}`}
                    </p>
                  </div>
                )}
                
                {/* Fila 1, Columna 2: Código del Parte y Turno */}
                <div className={`p-3 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                  <div className="flex items-center space-x-4">
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {diaryPartName || 'Parte Diario'}
                    </h3>
                    {diaryPartTurno && (
                      <div className={`px-3 py-1 border rounded ${isDarkMode ? 'bg-blue-900 border-blue-700 text-blue-100' : 'bg-blue-50 border-blue-300 text-gray-900'}`}>
                        <p className="text-sm font-semibold">
                          {diaryPartTurno}
                        </p>
                      </div>
                    )}
                    {cantPartesAbiertos > 0 && (
                      <div className={`px-3 py-1 border rounded ${isDarkMode ? 'bg-orange-900 border-orange-700 text-orange-100' : 'bg-orange-50 border-orange-300 text-gray-900'}`}>
                        <p className="text-sm font-semibold">
                          Cant Partes: {cantPartesAbiertos}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Fila 2, Columna 1: Disciplina, Área y Ubicación */}
                {(diaryPartDisciplina || diaryPartArea || diaryPartUbicacion) && (
                  <div className={`p-3 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {diaryPartDisciplina && `DISCP: ${diaryPartDisciplina}`}
                      {diaryPartArea && `, AREA: ${diaryPartArea}`}
                      {diaryPartUbicacion && `, UBIC: ${diaryPartUbicacion}`}
                    </p>
                  </div>
                )}

                {/* Fila 2, Columna 2: Código y Nombre de Brigada */}
                {(diaryPartCodBrigada || diaryPartNameBrigada) && (
                  <div className={`p-3 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {diaryPartCodBrigada && `CÓDIGO BRIGADA: ${diaryPartCodBrigada}`}
                      {diaryPartNameBrigada && ` - ${diaryPartNameBrigada}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Diary Parts List - Editable Table */}
        {showParts && employees.length > 0 && pcps.length > 0 && (
          <div className={`rounded-2xl shadow-xl p-6 mt-3 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Tabs */}
            <div className={`flex space-x-2 mb-4 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <button
                onClick={() => setActiveTab('manoObra')}
                className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'manoObra'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>👷 Mano de Obra</span>
                  {hasManoObraData() && (
                    <span className="text-green-600">✓</span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('equipos')}
                className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'equipos'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>🚜 Equipos</span>
                  {hasEquiposData() && (
                    <span className="text-green-600">✓</span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('produccion')}
                className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'produccion'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>📊 Producción</span>
                  {hasProduccionData() && (
                    <span className="text-green-600">✓</span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('horasPerdidas')}
                className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'horasPerdidas'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>⏱️ Horas Perdidas</span>
                  {hasHorasPerdidasData() && (
                    <span className="text-green-600">✓</span>
                  )}
                </span>
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
                <div className="flex items-start">
                  <svg className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-700 text-sm whitespace-pre-line">{saveSuccess}</span>
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
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${isDarkMode ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Mostrar {hiddenPcpsManoObra.size} columna{hiddenPcpsManoObra.size > 1 ? 's' : ''} oculta{hiddenPcpsManoObra.size > 1 ? 's' : ''}</span>
                  </button>
                </div>
              )}
              <table className={`w-full border-collapse border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                <thead>
                  {/* Primera fila de cabecera: Presupuestos */}
                  <tr className={isDarkMode ? 'bg-blue-900' : 'bg-blue-50'}>
                    <th className={`border px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'}`} rowSpan={2}>
                      ID
                    </th>
                    <th className={`border px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'}`} rowSpan={2}>
                      Empleado
                    </th>
                    <th className={`border px-4 py-3 text-center text-sm font-medium cursor-pointer ${isDarkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`} title="Click para marcar/desmarcar todas las inasistencias" rowSpan={2} onClick={handleToggleAllInasistencias}>
                      <div className="flex items-center justify-center space-x-1">
                        <input
                          type="checkbox"
                          checked={allInasistenciasChecked}
                          onChange={handleToggleAllInasistencias}
                          className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>I</span>
                      </div>
                    </th>
                    {budgets.map((budget) => {
                      // Contar cuántos PCPs visibles tiene este budget
                      const visiblePcpsCount = pcps.filter(pcp => !hiddenPcpsManoObra.has(`${budget.budget_id}-${pcp.bim_pcp_id}`)).length;
                      
                      // Si no hay PCPs visibles, no mostrar el budget
                      if (visiblePcpsCount === 0) return null;
                      
                      return (
                        <th 
                          key={budget.budget_id} 
                          className={`border px-2 py-2 text-center text-xs font-medium ${isDarkMode ? 'border-gray-600 text-gray-200 bg-blue-800' : 'border-gray-300 text-gray-700 bg-blue-100'}`} 
                          colSpan={visiblePcpsCount}
                        >
                          {budget.budget_name}
                        </th>
                      );
                    })}
                  </tr>
                  {/* Segunda fila de cabecera: PCPs (repetidos por cada presupuesto) */}
                  <tr className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                    {budgets.map((budget) => (
                      pcps.map((pcp) => {
                        const key = `${budget.budget_id}-${pcp.bim_pcp_id}`;
                        const isHidden = hiddenPcpsManoObra.has(key);
                        
                        if (isHidden) return null;
                        
                        return (
                          <th 
                            key={key}
                            className={`border px-2 py-8 text-center text-xs font-medium relative group ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'}`}
                          >
                            <div className="transform -rotate-90 whitespace-nowrap absolute inset-0 flex items-center justify-center pointer-events-none">
                              {pcp.bim_pcp_name}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePcpVisibility(budget.budget_id, pcp.bim_pcp_id, 'manoObra');
                              }}
                              className={`absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 pointer-events-auto ${isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-300 text-gray-600'}`}
                              title="Clic para ocultar esta columna"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${hasValidationError ? (isDarkMode ? 'bg-red-900 border-l-4 border-l-red-500' : 'bg-red-50 border-l-4 border-l-red-500') : ''}`}
                        title={hasValidationError ? 'Error: Debe tener al menos una hora asignada o marcar como inasistencia' : ''}
                      >
                        <td className={`border px-4 py-3 text-sm font-mono ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>
                          {employee.hr_employee_id}
                        </td>
                        <td className={`border px-4 py-3 text-sm ${isDarkMode ? 'border-gray-600 text-gray-100' : 'border-gray-300 text-gray-900'}`}>
                          {employee.hr_employee_name}
                        </td>
                        <td className={`border px-4 py-3 text-center ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                          <input
                            type="checkbox"
                            checked={inasistencias[employee.hr_employee_id] || false}
                            onChange={(e) => handleInasistenciaChange(employee.hr_employee_id, e.target.checked)}
                            className={`w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 focus:ring-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
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
                              <td key={key} className={`border px-2 py-3 text-center w-16 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={pcpData[key] || ''}
                                  onChange={(e) => handlePcpChange(employee.hr_employee_id, budget.budget_id, pcp.bim_pcp_id, e.target.value)}
                                  className={`w-12 px-1 py-1 border rounded text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${
                                    (pcpData[key] || 0) > 0 
                                      ? (isDarkMode ? 'bg-yellow-900 border-yellow-700 text-yellow-100' : 'bg-yellow-100 border-gray-300 text-gray-900')
                                      : (isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900')
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
                  <tr className={`font-medium ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <td className={`border px-4 py-3 text-sm ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'}`} colSpan={3}>
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
                <div className="flex items-start">
                  <svg className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-700 text-sm whitespace-pre-line">{saveSuccess}</span>
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
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700" rowSpan={2}>
                      HI
                    </th>
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
                                  className={`w-full px-2 py-1 border border-gray-300 rounded text-center text-sm text-gray-900 focus:text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                    (equipmentData[key] || 0) > 0 
                                      ? 'bg-yellow-100' 
                                      : 'bg-white'
                                  }`}
                                  placeholder=""
                                />
                              </td>
                            );
                          })
                        ))}
                        <td className="border border-gray-300 px-4 py-2 text-center text-sm font-bold text-gray-900">
                          {(8 - totalHours).toFixed(1)}
                        </td>
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
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <span className="text-xs font-bold text-gray-700">
                        -
                      </span>
                    </td>
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

            {/* Contenido de Producción */}
            {activeTab === 'produccion' && (
              <div className="space-y-4">
                {budgets.map(budget => 
                  pcps.map(pcp => {
                    const tableKey = `${budget.budget_id}-${pcp.bim_pcp_id}`;
                    const isCollapsed = collapsedProduccionTables.has(tableKey);
                    
                    // Obtener las interfaces BIM para este presupuesto
                    const bimInterfaces = budget.arr_bim_interface || [];
                    
                    // Recopilar datos relevantes: buscar interfaces que tengan PCPs coincidentes y sus elementos
                    const relevantData: {
                      interfaceName: string;
                      interfaceId: number;
                      elements: BimElement[];
                      workBreakdown: WorkBreakdown[];
                      workPackageName: string;
                    }[] = [];
                    
                    bimInterfaces.forEach(bimInterface => {
                      const interfacePcps = bimInterface.pcps || [];
                      
                      // Buscar si hay un PCP que coincida
                      let hasPcp = false;
                      let elementsData: BimElement[] = [];
                      let workBreakdownData: WorkBreakdown[] = [];
                      let workPackageNameData = '';
                      
                      interfacePcps.forEach(item => {
                        // Si el item tiene bim_pcp_id y coincide con el PCP actual
                        if (item.bim_pcp_id === pcp.bim_pcp_id) {
                          hasPcp = true;
                          workBreakdownData = item.work_breakdown || [];
                        }
                        
                        // Si el item tiene elements (es el objeto de work_package)
                        if (item.elements && item.elements.length > 0) {
                          elementsData = item.elements;
                          workPackageNameData = item.work_package_name || '';
                        }
                      });
                      
                      // Si encontramos el PCP y hay elementos, agregar a relevantData
                      if (hasPcp && elementsData.length > 0) {
                        relevantData.push({
                          interfaceName: bimInterface.bim_interface_name || '',
                          interfaceId: bimInterface.bim_interface_id,
                          elements: elementsData,
                          workBreakdown: workBreakdownData,
                          workPackageName: workPackageNameData
                        });
                      }
                    });
                    
                    // Si no hay datos relevantes para este PCP, no mostrar la tabla
                    if (relevantData.length === 0) return null;
                    
                    // Verificar si el PCP tiene horas en mano de obra
                    const hasHorasEnManoObra = pcpHasHorasInManoObra(budget.budget_id, pcp.bim_pcp_id);
                    
                    // Obtener el nombre del paquete de trabajo (es el mismo para toda la tabla)
                    const workPackageName = relevantData[0]?.workPackageName || '';
                    
                    return (
                      <div key={tableKey} className="bg-white rounded-lg border border-gray-300 shadow-sm">
                        {/* Header de la tabla con botón de colapso y filtro */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-300">
                          <button
                            onClick={() => toggleProduccionTable(budget.budget_id, pcp.bim_pcp_id)}
                            className="flex items-center space-x-2 hover:bg-gray-50 transition-colors flex-1"
                          >
                            <span className="text-lg">
                              {isCollapsed ? '▶' : '▼'}
                            </span>
                            <h3 className="text-sm font-bold text-gray-900">
                              Presupuesto {budget.budget_name} + PCP [{pcp.bim_pcp_name}] - Paquete: {workPackageName}
                            </h3>
                            {!hasHorasEnManoObra && (
                              <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                                ⚠️ Sin horas en mano de obra
                              </span>
                            )}
                          </button>
                          
                          {!isCollapsed && (
                            <button
                              onClick={() => toggleElementFilter(tableKey)}
                              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              title="Filtrar elementos"
                            >
                              <Filter className="h-4 w-4" />
                              <span>Elementos</span>
                              {visibleElements[tableKey] && visibleElements[tableKey].size > 0 && (
                                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                                  {visibleElements[tableKey].size}
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                        
                        {/* Modal de filtrado de elementos */}
                        {showElementFilter[tableKey] && !isCollapsed && (
                          <div className="border-b border-gray-300 p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-gray-900">Seleccionar elementos a mostrar</h4>
                              <button
                                onClick={() => toggleElementFilter(tableKey)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            
                            {/* Barra de búsqueda */}
                            <div className="mb-3 relative">
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Buscar elemento..."
                                value={elementSearchTerm[tableKey] || ''}
                                onChange={(e) => setElementSearchTerm(prev => ({
                                  ...prev,
                                  [tableKey]: e.target.value
                                }))}
                                className="w-full pl-10 pr-3 py-2 text-sm text-gray-400 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:text-gray-900"
                              />
                            </div>
                            
                            {/* Botones de selección rápida */}
                            <div className="flex space-x-2 mb-3">
                              <button
                                onClick={() => {
                                  const allElementIds = relevantData.flatMap(d => d.elements.map(e => e.bim_element_id));
                                  selectAllElements(tableKey, allElementIds);
                                }}
                                className="px-3 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                              >
                                Seleccionar todos
                              </button>
                              <button
                                onClick={() => deselectAllElements(tableKey)}
                                className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                              >
                                Deseleccionar todos
                              </button>
                            </div>
                            
                            {/* Lista de elementos */}
                            <div className="max-h-60 overflow-y-auto space-y-1">
                              {relevantData.flatMap(d => d.elements.map(el => ({ ...el, interfaceId: d.interfaceId })))
                                .filter((element, index, self) => 
                                  self.findIndex(e => e.bim_element_id === element.bim_element_id) === index
                                )
                                .filter(element => {
                                  const searchTerm = (elementSearchTerm[tableKey] || '').toLowerCase();
                                  return element.bim_element_name.toLowerCase().includes(searchTerm);
                                })
                                .map(element => (
                                  <label
                                    key={`${element.interfaceId}-${element.bim_element_id}`}
                                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isElementVisible(tableKey, element.bim_element_id)}
                                      onChange={() => toggleElementVisibility(tableKey, element.bim_element_id)}
                                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{element.bim_element_name}</span>
                                  </label>
                                ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Contenido de la tabla (colapsable) */}
                        {!isCollapsed && (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr>
                                  <th className="border border-gray-300 p-2 bg-gray-100 text-xs font-semibold text-gray-700 text-left">
                                    Elemento
                                  </th>
                                  <th className="border border-gray-300 p-2 bg-gray-100 text-xs font-semibold text-gray-700 text-left">
                                    ODT
                                  </th>
                                  <th className="border border-gray-300 p-2 bg-gray-100 text-xs font-semibold text-gray-700 text-left">
                                    Desgloce
                                  </th>
                                  <th className="border border-gray-300 p-2 bg-gray-100 text-xs font-semibold text-gray-700 text-left">
                                    Estatus
                                  </th>
                                  <th className="border border-gray-300 p-2 bg-gray-100 text-xs font-semibold text-gray-700 text-left">
                                    Cantidad
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {relevantData.map((data, dataIdx) => {
                                  return data.elements
                                    .filter(element => isElementVisible(tableKey, element.bim_element_id))
                                    .map((element, elementIdx) => {
                                    const key = `${budget.budget_id}-${data.interfaceId}-${pcp.bim_pcp_id}-${element.bim_element_id}`;
                                    const cantidadValue = produccionData[key] || '';
                                    const odtValue = produccionODT[key] || '';
                                    const desglosaValue = produccionDesglosa[key] || (data.workBreakdown.length > 0 ? data.workBreakdown[0].work_breakdown_id : '');
                                    
                                    // Mapear execution_status a etiquetas en español
                                    const estatusLabels: { [key: string]: string } = {
                                      'not': 'Sin Ejecutar',
                                      'not_r': 'Retrasado',
                                      'execute': 'Ejecutandose',
                                      'executed': 'Completado',
                                    };
                                    const estatusValue = estatusLabels[element.execution_status || ''] || element.execution_status || '-';
                                    
                                    return (
                                      <tr key={`${data.interfaceId}-${element.bim_element_id}`} className="hover:bg-gray-50">
                                        {/* Columna Elemento */}
                                        <td className="border border-gray-300 p-2 text-xs text-gray-700">
                                          {element.bim_element_name}
                                        </td>
                                        
                                        {/* Columna ODT */}
                                        <td className="border border-gray-300 p-1">
                                          <input
                                            type="number"
                                            value={odtValue}
                                            onChange={(e) => handleProduccionODTChange(
                                              budget.budget_id,
                                              data.interfaceId,
                                              pcp.bim_pcp_id,
                                              element.bim_element_id,
                                              e.target.value
                                            )}
                                            step="0.01"
                                            placeholder="0.00"
                                            disabled={!hasHorasEnManoObra}
                                            className={`w-full px-2 py-1 text-xs text-gray-900 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${odtValue ? 'bg-yellow-50' : ''} ${!hasHorasEnManoObra ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                          />
                                        </td>
                                        
                                        {/* Columna Desgloce */}
                                        <td className="border border-gray-300 p-1">
                                          <select
                                            value={desglosaValue}
                                            onChange={(e) => handleProduccionDesglosaChange(
                                              budget.budget_id,
                                              data.interfaceId,
                                              pcp.bim_pcp_id,
                                              element.bim_element_id,
                                              e.target.value
                                            )}
                                            disabled={!hasHorasEnManoObra}
                                            className={`w-full px-2 py-1 text-xs text-gray-900 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!hasHorasEnManoObra ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                          >
                                            {data.workBreakdown.map((wb) => (
                                              <option key={wb.work_breakdown_id} value={wb.work_breakdown_id}>
                                                {wb.work_breakdown_name}
                                              </option>
                                            ))}
                                          </select>
                                        </td>
                                        
                                        {/* Columna Estatus */}
                                        <td className="border border-gray-300 p-2 text-xs text-gray-700">
                                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                            element.execution_status === 'executed' ? 'bg-green-100 text-green-800' :
                                            element.execution_status === 'execute' ? 'bg-blue-100 text-blue-800' :
                                            element.execution_status === 'not_r' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {estatusValue}
                                          </span>
                                        </td>
                                        
                                        {/* Columna Cantidad */}
                                        <td className="border border-gray-300 p-1">
                                          <input
                                            type="number"
                                            value={cantidadValue}
                                            onChange={(e) => handleProduccionChange(
                                              budget.budget_id,
                                              data.interfaceId,
                                              pcp.bim_pcp_id,
                                              element.bim_element_id,
                                              e.target.value
                                            )}
                                            step="0.01"
                                            placeholder="0.00"
                                            disabled={!hasHorasEnManoObra}
                                            className={`w-full px-2 py-1 text-xs text-gray-900 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${cantidadValue ? 'bg-yellow-50' : ''} ${!hasHorasEnManoObra ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                          />
                                        </td>
                                      </tr>
                                    );
                                  });
                                })}
                                {/* Filas adicionales */}
                                {(produccionExtraRows[tableKey] || []).map((extraRow, idx) => {
                                  const element = relevantData.flatMap(d => d.elements).find(e => e.bim_element_id === extraRow.elementId);
                                  if (!element) return null;
                                  
                                  const interfaceData = relevantData.find(d => d.elements.some(e => e.bim_element_id === extraRow.elementId));
                                  if (!interfaceData) return null;
                                  
                                  const key = `${budget.budget_id}-${interfaceData.interfaceId}-${pcp.bim_pcp_id}-${extraRow.id}`;
                                  const cantidadValue = produccionData[key] || '';
                                  const odtValue = produccionODT[key] || '';
                                  const desglosaValue = produccionDesglosa[key] || (interfaceData.workBreakdown.length > 0 ? interfaceData.workBreakdown[0].work_breakdown_id : '');
                                  
                                  // Mapear execution_status a etiquetas en español
                                  const estatusLabels: { [key: string]: string } = {
                                    'not': 'Sin Ejecutar',
                                    'not_r': 'Retrasado',
                                    'execute': 'Ejecutandose',
                                    'executed': 'Completado',
                                  };
                                  const estatusValue = estatusLabels[element.execution_status || ''] || element.execution_status || '-';
                                  
                                  return (
                                    <tr key={extraRow.id} className="hover:bg-gray-50 bg-blue-50">
                                      {/* Columna Elemento con selector */}
                                      <td className="border border-gray-300 p-1">
                                        <div className="flex items-center space-x-1">
                                          <select
                                            value={extraRow.elementId}
                                            onChange={(e) => {
                                              const newElementId = parseInt(e.target.value);
                                              setProduccionExtraRows(prev => ({
                                                ...prev,
                                                [tableKey]: prev[tableKey].map(row => 
                                                  row.id === extraRow.id ? { ...row, elementId: newElementId } : row
                                                )
                                              }));
                                            }}
                                            disabled={!hasHorasEnManoObra}
                                            className={`flex-1 px-2 py-1 text-xs text-gray-900 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!hasHorasEnManoObra ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                          >
                                            {relevantData.flatMap(d => d.elements.map(el => ({ ...el, interfaceId: d.interfaceId })))
                                              .filter((element, index, self) => 
                                                self.findIndex(e => e.bim_element_id === element.bim_element_id) === index
                                              )
                                              .map(el => (
                                                <option key={`${el.interfaceId}-${el.bim_element_id}`} value={el.bim_element_id}>
                                                  {el.bim_element_name}
                                                </option>
                                              ))}
                                          </select>
                                          <button
                                            onClick={() => {
                                              setProduccionExtraRows(prev => ({
                                                ...prev,
                                                [tableKey]: prev[tableKey].filter(row => row.id !== extraRow.id)
                                              }));
                                              // Limpiar datos de esta fila
                                              setProduccionData(prev => {
                                                const newData = {...prev};
                                                delete newData[key];
                                                return newData;
                                              });
                                              setProduccionEstatus(prev => {
                                                const newData = {...prev};
                                                delete newData[key];
                                                return newData;
                                              });
                                              setProduccionODT(prev => {
                                                const newData = {...prev};
                                                delete newData[key];
                                                return newData;
                                              });
                                              setProduccionDesglosa(prev => {
                                                const newData = {...prev};
                                                delete newData[key];
                                                return newData;
                                              });
                                            }}
                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                            title="Eliminar fila"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </td>
                                      
                                      {/* Columna ODT */}
                                      <td className="border border-gray-300 p-1">
                                        <input
                                          type="number"
                                          value={odtValue}
                                          onChange={(e) => handleProduccionODTChange(
                                            budget.budget_id,
                                            interfaceData.interfaceId,
                                            pcp.bim_pcp_id,
                                            extraRow.id,
                                            e.target.value
                                          )}
                                          step="0.01"
                                          placeholder="0.00"
                                          disabled={!hasHorasEnManoObra}
                                          className={`w-full px-2 py-1 text-xs text-gray-900 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${odtValue ? 'bg-yellow-50' : ''} ${!hasHorasEnManoObra ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        />
                                      </td>
                                      
                                      {/* Columna Desgloce */}
                                      <td className="border border-gray-300 p-1">
                                        <select
                                          value={desglosaValue}
                                          onChange={(e) => handleProduccionDesglosaChange(
                                            budget.budget_id,
                                            interfaceData.interfaceId,
                                            pcp.bim_pcp_id,
                                            extraRow.id,
                                            e.target.value
                                          )}
                                          disabled={!hasHorasEnManoObra}
                                          className={`w-full px-2 py-1 text-xs text-gray-900 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!hasHorasEnManoObra ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        >
                                          {interfaceData.workBreakdown.map((wb) => (
                                            <option key={wb.work_breakdown_id} value={wb.work_breakdown_id}>
                                              {wb.work_breakdown_name}
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                      
                                      {/* Columna Estatus */}
                                      <td className="border border-gray-300 p-2 text-xs text-gray-700">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                          element.execution_status === 'executed' ? 'bg-green-100 text-green-800' :
                                          element.execution_status === 'execute' ? 'bg-blue-100 text-blue-800' :
                                          element.execution_status === 'not_r' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {estatusValue}
                                        </span>
                                      </td>
                                      
                                      {/* Columna Cantidad */}
                                      <td className="border border-gray-300 p-1">
                                        <input
                                          type="number"
                                          value={cantidadValue}
                                          onChange={(e) => handleProduccionChange(
                                            budget.budget_id,
                                            interfaceData.interfaceId,
                                            pcp.bim_pcp_id,
                                            extraRow.id,
                                            e.target.value
                                          )}
                                          step="0.01"
                                          placeholder="0.00"
                                          disabled={!hasHorasEnManoObra}
                                          className={`w-full px-2 py-1 text-xs text-gray-900 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${cantidadValue ? 'bg-yellow-50' : ''} ${!hasHorasEnManoObra ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            {/* Botón para agregar fila */}
                            <div className="p-2 border-t border-gray-300 bg-gray-50">
                              <button
                                onClick={() => {
                                  const firstElement = relevantData[0]?.elements[0];
                                  if (firstElement) {
                                    const newRowId = `extra-${Date.now()}-${Math.random()}`;
                                    setProduccionExtraRows(prev => ({
                                      ...prev,
                                      [tableKey]: [
                                        ...(prev[tableKey] || []),
                                        { id: newRowId, elementId: firstElement.bim_element_id }
                                      ]
                                    }));
                                  }
                                }}
                                disabled={!hasHorasEnManoObra}
                                className={`flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded transition-colors ${
                                  hasHorasEnManoObra 
                                    ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-100 cursor-pointer' 
                                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                }`}
                                title={!hasHorasEnManoObra ? 'Debe asignar horas en Mano de Obra primero' : ''}
                              >
                                <span className="text-lg">+</span>
                                <span>Agregar Fila</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Contenido de Horas Perdidas */}
            {activeTab === 'horasPerdidas' && (
              <>

            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">{saveError}</span>
                </div>
              </div>
            )}
            
            {/* Tabla de Horas Perdidas - Presupuestos */}
            <div className="overflow-x-auto mb-6">
              <div className="mb-3 flex items-center justify-end">
                {hiddenPcpsHorasPerdidasEmpleados.size > 0 && (
                  <button
                    onClick={() => showAllPcps('horasPerdidasEmpleados')}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Mostrar {hiddenPcpsHorasPerdidasEmpleados.size} PCP{hiddenPcpsHorasPerdidasEmpleados.size > 1 ? 's' : ''} oculto{hiddenPcpsHorasPerdidasEmpleados.size > 1 ? 's' : ''}</span>
                  </button>
                )}
              </div>

                <table className={`w-full border-collapse border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <thead>
                    <tr className={isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}>
                      <th className={`border ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'} px-4 py-3 text-left text-sm font-medium`}>
                        Presupuesto
                      </th>
                      {pcps.map((pcp, index) => {
                        // Verificar si hay al menos un presupuesto donde este PCP no esté oculto
                        const isVisibleInAnyBudget = budgets.some(budget => 
                          !hiddenPcpsHorasPerdidasEmpleados.has(`${budget.budget_id}-${pcp.bim_pcp_id}`)
                        );
                        
                        if (!isVisibleInAnyBudget) return null;
                        
                        return (
                          <th 
                            key={`${pcp.bim_pcp_id}-group`} 
                            className={`border ${isDarkMode ? 'border-gray-600 text-gray-200 bg-gray-600' : 'border-gray-300 text-gray-700 bg-blue-100'} px-2 py-2 text-center text-xs font-medium`} 
                            colSpan={4}
                          >
                            {pcp.bim_pcp_name}
                          </th>
                        );
                      })}
                    </tr>
                    <tr className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                      <th className={`border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}></th>
                      {pcps.map((pcp) => {
                        // Verificar si hay al menos un presupuesto donde este PCP no esté oculto
                        const isVisibleInAnyBudget = budgets.some(budget => 
                          !hiddenPcpsHorasPerdidasEmpleados.has(`${budget.budget_id}-${pcp.bim_pcp_id}`)
                        );
                        
                        if (!isVisibleInAnyBudget) return null;
                        
                        return (
                          <Fragment key={`${pcp.bim_pcp_id}-headers`}>
                            <th className={`border ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} px-2 py-2 text-center text-xs font-medium relative group`}>
                              Horas
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Ocultar este PCP para todos los presupuestos
                                  budgets.forEach(budget => {
                                    togglePcpVisibility(budget.budget_id, pcp.bim_pcp_id, 'horasPerdidasEmpleados');
                                  });
                                }}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-300 rounded p-0.5"
                                title="Clic para ocultar este PCP"
                              >
                                <svg className="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                              </button>
                            </th>
                            <th className={`border ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} px-2 py-2 text-center text-xs font-medium`}>
                              Hora Inicio
                            </th>
                            <th className={`border ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} px-2 py-2 text-center text-xs font-medium`}>
                              Causa
                            </th>
                            <th className={`border ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} px-2 py-2 text-center text-xs font-medium`}>
                              Descripción
                            </th>
                          </Fragment>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.map((budget) => (
                      <tr key={budget.budget_id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={`border ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-900'} px-4 py-2 text-sm font-medium`}>
                          {budget.budget_name}
                        </td>
                        {pcps.map((pcp) => {
                          const key = `${budget.budget_id}-${pcp.bim_pcp_id}`;
                          
                          // Verificar si hay al menos un presupuesto donde este PCP no esté oculto
                          const isVisibleInAnyBudget = budgets.some(b => 
                            !hiddenPcpsHorasPerdidasEmpleados.has(`${b.budget_id}-${pcp.bim_pcp_id}`)
                          );
                          
                          if (!isVisibleInAnyBudget) return null;
                          
                          return (
                            <Fragment key={key}>
                              <td className={`border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} px-2 py-2`}>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={horasPerdidasEmpleadosData[key] || ''}
                                  onChange={(e) => handleHorasPerdidasEmpleadosChange(budget.budget_id, pcp.bim_pcp_id, e.target.value)}
                                  className={`w-24 px-2 py-1 border rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                    isDarkMode 
                                      ? (horasPerdidasEmpleadosData[key] || 0) > 0 
                                        ? 'bg-red-900 border-gray-600 text-white' 
                                        : 'bg-gray-700 border-gray-600 text-white'
                                      : (horasPerdidasEmpleadosData[key] || 0) > 0 
                                        ? 'bg-red-100 border-gray-300 text-gray-900' 
                                        : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                  placeholder=""
                                />
                              </td>
                              <td className={`border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} px-2 py-2`}>
                                <input
                                  type="number"
                                  min="0"
                                  max="23"
                                  step="1"
                                  value={horasPerdidasEmpleadosHoraInicio[key] || 8}
                                  onChange={(e) => handleHorasPerdidasEmpleadosHoraInicioChange(budget.budget_id, pcp.bim_pcp_id, e.target.value)}
                                  className={`w-16 px-2 py-1 border rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                    isDarkMode 
                                      ? 'bg-gray-700 border-gray-600 text-white' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                  placeholder="8"
                                />
                              </td>
                              <td className={`border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} px-2 py-2`}>
                                <select
                                  value={horasPerdidasEmpleadosCausa[key] || ''}
                                  onChange={(e) => handleHorasPerdidasEmpleadosCausaChange(budget.budget_id, pcp.bim_pcp_id, e.target.value)}
                                  className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                    isDarkMode 
                                      ? 'bg-gray-700 border-gray-600 text-white' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                >
                                  <option value="">Seleccionar...</option>
                                  <option value="Falta de Equipo">Falta de Equipo</option>
                                  <option value="Seguridad">Seguridad</option>
                                  <option value="Otros">Otros</option>
                                  <option value="Orden del cliente">Orden del cliente</option>
                                  <option value="Falta de Materiales">Falta de Materiales</option>
                                  <option value="Lluvia">Lluvia</option>
                                  <option value="Inundación">Inundación</option>
                                  <option value="Falta de Andamios">Falta de Andamios</option>
                                  <option value="Alerta Roja">Alerta Roja</option>
                                </select>
                              </td>
                              <td className={`border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} px-2 py-2`}>
                                <input
                                  type="text"
                                  value={horasPerdidasEmpleadosDescripcion[key] || ''}
                                  onChange={(e) => handleHorasPerdidasEmpleadosDescripcionChange(budget.budget_id, pcp.bim_pcp_id, e.target.value)}
                                  className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                    isDarkMode 
                                      ? 'bg-gray-700 border-gray-600 text-white' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                  placeholder="Descripción..."
                                />
                              </td>
                            </Fragment>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
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
            {saveSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-700 text-sm whitespace-pre-line">{saveSuccess}</span>
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
          <p className="text-xs text-gray-500 mb-1">v1.0.0</p>
          <p className="text-xs text-gray-600">
            Desarrollado con <a href="https://www.odoo.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-600 hover:text-gray-800 hover:underline transition-colors">Odoo</a> por <a href="https://www.marlonfalcon.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-600 hover:text-gray-800 hover:underline transition-colors">Marlon Falcon</a>
          </p>
        </div>
      </div>
    </div>
  );
}
