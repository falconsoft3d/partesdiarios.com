interface LoginRequest {
  login: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  name?: string;
  data?: unknown;
}

interface ApiError {
  message: string;
  status?: number;
}

interface EmployeeLine {
  id: number;
  hr_employee_id: number | false;
  hr_employee_name: string | false;
  bim_resource_id: number | false;
  bim_resource_name: string | false;
  budget_id: number | false;
  budget_name: string | false;
  bim_pcp_id: number | false;
  bim_pcp_name: string | false;
  hh: number;
  i?: boolean; // Campo de inasistencia
}

interface DiaryPart {
  id: number;
  name: string;
  date: string;
  hr_employee_id: number;
  hr_employee_name: string;
  state: string;
  observation?: string;
  employee_lines_ids: EmployeeLine[];
}

interface PCP {
  bim_pcp_id: number;
  bim_pcp_name: string;
}

interface Employee {
  hr_employee_id: number;
  hr_employee_name: string;
}

interface Equipment {
  name: string;
  license_plate: string;
}

interface WorkBreakdown {
  work_breakdown_id: number;
  work_breakdown_name: string;
  percentage: number;
}

interface BimElement {
  bim_element_id: number;
  bim_element_name: string;
  execution_status?: string;
}

interface WorkPackage {
  work_package_id: number;
  work_package_name: string;
  elements?: BimElement[];
}

interface BimInterfacePcp {
  bim_pcp_id: number;
  bim_pcp_name: string;
  bim_pcp_description?: string;
  work_breakdown?: WorkBreakdown[];
  work_package_id?: number;
  work_package_name?: string;
  work_package?: WorkPackage;
  elements?: BimElement[];
}

interface BimInterface {
  bim_interface_id: number;
  bim_interface_name: string;
  pcps?: BimInterfacePcp[];
}

interface Budget {
  budget_id: number;
  budget_name: string;
  arr_bim_interface?: BimInterface[];
}

interface DiaryPartsResponse {
  status: 'ok' | 'error';
  message?: string;
  diary_parts?: DiaryPart[];
  part_id?: number;
  date?: string;
  part_name?: string;
  state?: string;
  turno?: string;
  framework_contract_id?: string;
  responsable?: string;
  supervisor?: string;
  diciplina?: string;
  area?: string;
  ubicacion?: string;
  cant_partes_abiertos?: number;
  cod_brigada?: string;
  name_brigada?: string;
  pcps?: PCP[];
  employees?: Employee[];
  equipments?: Equipment[];
  all_equipments?: Equipment[];
  budgets?: Budget[];
}

class ApiService {
  private baseUrl: string = '';

  setBaseUrl(url: string) {
    // Asegurar que la URL no termine con /
    this.baseUrl = url.replace(/\/$/, '');
  }

  private validateUrl(url: string): { isValid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);
      
      // Verificar que sea http o https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, error: 'La URL debe usar protocolo HTTP o HTTPS' };
      }
      
      // Verificar que tenga host
      if (!urlObj.hostname) {
        return { isValid: false, error: 'URL inválida: falta el hostname' };
      }
      
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Formato de URL inválido' };
    }
  }

  async login(url: string, username: string, password: string): Promise<LoginResponse> {
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') {
      return {
        success: false,
        message: 'Esta función solo puede ejecutarse en el navegador'
      };
    }

    try {
      // Validar URL antes del fetch
      const urlValidation = this.validateUrl(url);
      if (!urlValidation.isValid) {
        return {
          success: false,
          message: urlValidation.error || 'URL inválida'
        };
      }

      // Usar nuestro proxy API para evitar CORS
      const proxyEndpoint = '/api/login';
      
      const response = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          login: username,
          password: password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Error HTTP: ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // El proxy ya devuelve el formato correcto
      return result;

    } catch (error) {
      console.error('Error en login:', error);
      
      // Errores específicos de red
      if (error instanceof TypeError) {
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          return {
            success: false,
            message: 'Error de conexión con el proxy. Verifica que el servidor Next.js esté funcionando.'
          };
        }
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido en la conexión'
      };
    }
  }

  async testConnection(url: string): Promise<boolean> {
    // Solo funciona en el cliente
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const fetchConfig: RequestInit = {
        method: 'GET',
      };

      // Solo agregar mode en el navegador
      if (typeof window !== 'undefined') {
        fetchConfig.mode = 'no-cors';
      }

      await fetch(url, fetchConfig);
      return true;
    } catch {
      return false;
    }
  }

  async getDiaryParts(url: string, username: string, password: string): Promise<DiaryPartsResponse> {
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') {
      return {
        status: 'error',
        message: 'Esta función solo puede ejecutarse en el navegador'
      };
    }

    try {
      // Validar URL antes del fetch
      const urlValidation = this.validateUrl(url);
      if (!urlValidation.isValid) {
        return {
          status: 'error',
          message: urlValidation.error || 'URL inválida'
        };
      }

      // Usar nuestro proxy API para evitar CORS - ahora apunta a /load-part
      const proxyEndpoint = '/api/diary-parts';
      
      const response = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          login: username,
          password: password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Error HTTP: ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      console.log('Diary parts received from backend:', result);
      
      // El backend ahora envía listas separadas de PCPs, Empleados y Presupuestos
      // El frontend debe generar la matriz de empleados x PCPs
      
      return result;

    } catch (error) {
      console.error('Error obteniendo partes diarios:', error);
      
      // Errores específicos de red
      if (error instanceof TypeError) {
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          return {
            status: 'error',
            message: 'Error de conexión con el proxy. Verifica que el servidor Next.js esté funcionando.'
          };
        }
      }
      
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido obteniendo partes diarios'
      };
    }
  }

  async saveDiaryPartsNew(
    url: string, 
    username: string, 
    password: string, 
    diaryPartId: number,
    employees: Array<{hr_employee_id: number, hr_employee_name: string}>,
    pcps: Array<{bim_pcp_id: number, bim_pcp_name: string}>,
    budgets: Array<{budget_id: number, budget_name: string, arr_bim_interface?: any[]}>,
    pcpData: {[key: string]: number},
    observations: string,
    fileData?: {name: string, data: string},
    inasistencias?: {[employeeId: number]: boolean},
    noTrabajoState?: boolean,
    equipments?: Array<{name: string, license_plate: string}>,
    equipmentData?: {[key: string]: number},
    produccionData?: {[key: string]: number},
    produccionODT?: {[key: string]: number},
    produccionDesglosa?: {[key: string]: number},
    produccionExtraRows?: {[tableKey: string]: Array<{id: string; elementId: number}>},
    horasPerdidasEmpleadosData?: {[key: string]: number},
    horasPerdidasEmpleadosHoraInicio?: {[key: string]: number},
    horasPerdidasEmpleadosCausa?: {[key: string]: string},
    horasPerdidasEmpleadosDescripcion?: {[key: string]: string},
    horasPerdidasEquiposData?: {[key: string]: number},
    horasPerdidasEquiposHoraInicio?: {[key: string]: number},
    horasPerdidasEquiposCausa?: {[key: string]: string},
    horasPerdidasEquiposDescripcion?: {[key: string]: string}
  ): Promise<{status: 'ok' | 'error', message?: string}> {
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') {
      return {
        status: 'error',
        message: 'Esta función solo puede ejecutarse en el navegador'
      };
    }

    try {
      // Validar URL antes del fetch
      const urlValidation = this.validateUrl(url);
      if (!urlValidation.isValid) {
        return {
          status: 'error',
          message: urlValidation.error || 'URL inválida'
        };
      }

      console.log('Preparing diary part save (new structure):', {
        diary_part_id: diaryPartId,
        employees_count: employees.length,
        pcps_count: pcps.length,
        budgets_count: budgets.length,
        pcp_data_keys: Object.keys(pcpData).length
      });

      // Construir las líneas de empleados desde los datos del PCP
      const employeeLines: Array<{
        hr_employee_id: number;
        bim_resource_id: number | false;
        budget_id: number | false;
        bim_pcp_id: number | false;
        hh: number;
        i: boolean;
      }> = [];

      // Crear las líneas para cada empleado
      employees.forEach((employee, employeeIndex) => {
        const isInasistente = inasistencias?.[employee.hr_employee_id] || false;
        
        // Si está marcado como inasistente, solo enviar UNA línea con el primer presupuesto y primer PCP
        if (isInasistente) {
          if (budgets.length > 0 && pcps.length > 0) {
            employeeLines.push({
              hr_employee_id: employee.hr_employee_id,
              bim_resource_id: false,
              budget_id: budgets[0].budget_id,
              bim_pcp_id: pcps[0].bim_pcp_id,
              hh: 0,
              i: true
            });
          }
        } else {
          // Si NO está marcado como inasistente, enviar todas las líneas con horas > 0
          budgets.forEach(budget => {
            pcps.forEach(pcp => {
              const key = `${employee.hr_employee_id}-${employeeIndex}-${budget.budget_id}-${pcp.bim_pcp_id}`;
              const hours = pcpData[key] || 0;
              
              if (hours > 0) {
                employeeLines.push({
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

      // Preparar los datos del parte diario
      const diaryPartData: {
        id: number;
        observation: string;
        employee_lines_ids: Array<{
          hr_employee_id: number;
          bim_resource_id: number | false;
          budget_id: number | false;
          bim_pcp_id: number | false;
          hh: number;
          i: boolean;
        }>;
        file?: {name: string, data: string};
        state?: string;
      } = {
        id: diaryPartId,
        observation: observations || '',
        employee_lines_ids: employeeLines
      };

      // Agregar archivo si existe
      if (fileData) {
        diaryPartData.file = fileData;
      }

      // Agregar estado "dont_work" si está marcado
      if (noTrabajoState) {
        diaryPartData.state = 'dont_work';
      }

      // Procesar datos de equipos (mano de obra equipos)
      if (equipments && equipmentData && Object.keys(equipmentData).length > 0) {
        const equipmentLines: Array<{
          equipment_name: string;
          license_plate: string;
          budget_id: number;
          bim_pcp_id: number;
          hh: number;
        }> = [];

        equipments.forEach(equipment => {
          budgets.forEach(budget => {
            pcps.forEach(pcp => {
              const key = `${equipment.license_plate}-${budget.budget_id}-${pcp.bim_pcp_id}`;
              const hours = equipmentData[key] || 0;
              
              if (hours > 0) {
                equipmentLines.push({
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

        if (equipmentLines.length > 0) {
          diaryPartData.equipment_lines_ids = equipmentLines;
        }
      }

      // Procesar datos de producción
      if (produccionData && Object.keys(produccionData).length > 0) {
        const produccionLines: Array<{
          budget_id: number;
          interface_id: number;
          pcp_id: number;
          element_id: number | string;
          odt: number;
          work_breakdown_id: number;
          work_package_id?: number;
          work_package_name?: string;
          cantidad: number;
        }> = [];

        // Crear mapas de valores por defecto
        const defaultWorkBreakdown: {[key: string]: number} = {};
        const workPackageMap: {[key: string]: {id: number, name: string}} = {};
        
        budgets.forEach(budget => {
          budget.arr_bim_interface?.forEach((bimInterface: any) => {
            const pcpsArray = bimInterface.pcps || [];
            pcpsArray.forEach((pcpOrPackage: any, index: number) => {
              if (pcpOrPackage.work_breakdown && pcpOrPackage.work_breakdown.length > 0) {
                const pcpId = pcpOrPackage.bim_pcp_id;
                const defaultWB = pcpOrPackage.work_breakdown[0].work_breakdown_id;
                
                // El work_package es el siguiente item en el array
                const nextIndex = index + 1;
                if (nextIndex < pcpsArray.length) {
                  const workPackage = pcpsArray[nextIndex];
                  const workPackageId = workPackage.work_package_id;
                  const workPackageName = workPackage.work_package_name;
                  
                  if (workPackage.elements) {
                    workPackage.elements.forEach((element: any) => {
                      const key = `${budget.budget_id}-${bimInterface.bim_interface_id}-${pcpId}-${element.bim_element_id}`;
                      defaultWorkBreakdown[key] = defaultWB;
                      if (workPackageId && workPackageName) {
                        workPackageMap[key] = {id: workPackageId, name: workPackageName};
                      }
                    });
                  }
                }
              }
            });
          });
        });

        console.log('🔍 API - defaultWorkBreakdown creado:', defaultWorkBreakdown);
        console.log('🔍 API - workPackageMap creado:', workPackageMap);

        // Procesar elementos originales
        Object.keys(produccionData).forEach(key => {
          const cantidad = produccionData[key];
          const odt = produccionODT?.[key] || 0;
          const workBreakdownId = produccionDesglosa?.[key] || defaultWorkBreakdown[key];
          const workPackageInfo = workPackageMap[key];
          
          console.log(`🔍 API - Procesando key: ${key}`, {
            cantidad,
            odt,
            workBreakdownIdGuardado: produccionDesglosa?.[key],
            workBreakdownIdDefault: defaultWorkBreakdown[key],
            workBreakdownIdFinal: workBreakdownId,
            workPackageInfo
          });
          
          // Key format: budgetId-interfaceId-pcpId-elementId
          const parts = key.split('-');
          if (parts.length === 4 && (cantidad > 0 || odt > 0) && workBreakdownId) {
            const [budgetId, interfaceId, pcpId, elementId] = parts.map(Number);
            
            const line: any = {
              budget_id: budgetId,
              interface_id: interfaceId,
              pcp_id: pcpId,
              element_id: elementId,
              odt: odt,
              work_breakdown_id: Number(workBreakdownId),
              cantidad: cantidad
            };
            
            if (workPackageInfo) {
              line.work_package_id = workPackageInfo.id;
              line.work_package_name = workPackageInfo.name;
            }
            
            produccionLines.push(line);
          }
        });

        // Procesar filas adicionales
        if (produccionExtraRows) {
          Object.keys(produccionExtraRows).forEach(tableKey => {
            const extraRows = produccionExtraRows[tableKey];
            extraRows.forEach(extraRow => {
              // Buscar budget y pcp del tableKey
              const [budgetId, pcpId] = tableKey.split('-').map(Number);
              
              // Buscar interfaceId del elemento
              const budget = budgets.find(b => b.budget_id === budgetId);
              if (budget?.arr_bim_interface) {
                budget.arr_bim_interface.forEach((bimInt: any) => {
                  if (bimInt.bim_interface_id) {
                    const key = `${budgetId}-${bimInt.bim_interface_id}-${pcpId}-${extraRow.id}`;
                    const cantidad = produccionData?.[key] || 0;
                    const odt = produccionODT?.[key] || 0;
                    const workBreakdownId = produccionDesglosa?.[key] || defaultWorkBreakdown[key];
                    const workPackageInfo = workPackageMap[key];
                    
                    console.log(`🔍 API - Procesando fila extra: ${key}`, {
                      cantidad,
                      odt,
                      workBreakdownIdGuardado: produccionDesglosa?.[key],
                      workBreakdownIdDefault: defaultWorkBreakdown[key],
                      workBreakdownIdFinal: workBreakdownId,
                      workPackageInfo
                    });
                    
                    if ((cantidad > 0 || odt > 0) && workBreakdownId) {
                      const line: any = {
                        budget_id: budgetId,
                        interface_id: bimInt.bim_interface_id,
                        pcp_id: pcpId,
                        element_id: extraRow.elementId,
                        odt: odt,
                        work_breakdown_id: Number(workBreakdownId),
                        cantidad: cantidad
                      };
                      
                      if (workPackageInfo) {
                        line.work_package_id = workPackageInfo.id;
                        line.work_package_name = workPackageInfo.name;
                      }
                      
                      produccionLines.push(line);
                    }
                  }
                });
              }
            });
          });
        }

        console.log('✅ API - Total líneas de producción:', produccionLines.length);
        console.log('📦 API - produccion_lines_ids:', JSON.stringify(produccionLines, null, 2));

        if (produccionLines.length > 0) {
          diaryPartData.produccion_lines_ids = produccionLines;
        }
      }

      // Procesar horas perdidas de empleados (ahora basado en presupuestos, no empleados)
      if (horasPerdidasEmpleadosData && Object.keys(horasPerdidasEmpleadosData).length > 0) {
        const horasPerdidasEmpleadosLines: Array<{
          budget_id: number;
          bim_pcp_id: number;
          hora_inicio: number;
          horas_perdidas: number;
          causa: string;
          descripcion: string;
        }> = [];

        Object.keys(horasPerdidasEmpleadosData).forEach(key => {
          const horasPerdidas = horasPerdidasEmpleadosData[key];
          if (horasPerdidas > 0) {
            const parts = key.split('-').map(Number);
            if (parts.length === 2) {
              const [budgetId, pcpId] = parts;
              horasPerdidasEmpleadosLines.push({
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

        if (horasPerdidasEmpleadosLines.length > 0) {
          diaryPartData.horas_perdidas_empleados_ids = horasPerdidasEmpleadosLines;
        }
      }

      // Procesar horas perdidas de equipos
      if (horasPerdidasEquiposData && Object.keys(horasPerdidasEquiposData).length > 0) {
        const horasPerdidasEquiposLines: Array<{
          license_plate: string;
          budget_id: number;
          bim_pcp_id: number;
          hora_inicio: number;
          horas_perdidas: number;
          causa: string;
          descripcion: string;
        }> = [];

        Object.keys(horasPerdidasEquiposData).forEach(key => {
          const horasPerdidas = horasPerdidasEquiposData[key];
          if (horasPerdidas > 0) {
            // Key format: license_plate-budgetId-pcpId
            const lastHyphenIndex = key.lastIndexOf('-');
            const secondLastHyphenIndex = key.lastIndexOf('-', lastHyphenIndex - 1);
            const licensePlate = key.substring(0, secondLastHyphenIndex);
            const budgetId = parseInt(key.substring(secondLastHyphenIndex + 1, lastHyphenIndex));
            const pcpId = parseInt(key.substring(lastHyphenIndex + 1));
            
            horasPerdidasEquiposLines.push({
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

        if (horasPerdidasEquiposLines.length > 0) {
          diaryPartData.horas_perdidas_equipos_ids = horasPerdidasEquiposLines;
        }
      }

      console.log('Final diary part data:', {
        id: diaryPartData.id,
        employee_lines_count: employeeLines.length,
        employee_lines: employeeLines,
        observation: diaryPartData.observation,
        has_file: !!diaryPartData.file
      });

      console.log('=== ENVIANDO A PROXY ===');
      console.log('URL:', url);
      console.log('Username:', username);
      console.log('Diary Part:', JSON.stringify(diaryPartData, null, 2));

      // Usar nuestro proxy API para evitar CORS
      const proxyEndpoint = '/api/save-diary-parts';
      
      const response = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          username: username,
          password: password,
          diary_part: diaryPartData
        })
      });

      console.log('=== RESPUESTA DEL PROXY ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Save response error:', errorData);
        const errorMessage = errorData?.message || `Error HTTP: ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Save result (RAW):', result);
      console.log('Save result (JSON):', JSON.stringify(result, null, 2));
      console.log('result.status value:', result.status);
      console.log('typeof result:', typeof result);
      console.log('typeof result.status:', typeof result.status);
      console.log('result has status property:', 'status' in result);
      
      // El proxy ya devuelve el formato correcto
      return result;

    } catch (error) {
      console.error('Error guardando partes diarios:', error);
      
      // Errores específicos de red
      if (error instanceof TypeError) {
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          return {
            status: 'error',
            message: 'Error de conexión con el proxy. Verifica que el servidor Next.js esté funcionando.'
          };
        }
      }
      
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido guardando partes diarios'
      };
    }
  }

  async saveDiaryParts(
    url: string, 
    username: string, 
    password: string, 
    diaryPart: DiaryPart, 
    pcpData: {[key: string]: number}, 
    observations: {[partId: number]: string},
    fileData?: {name: string, data: string},
    inasistencias?: {[employeeId: number]: boolean}
  ): Promise<{status: 'ok' | 'error', message?: string}> {
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') {
      return {
        status: 'error',
        message: 'Esta función solo puede ejecutarse en el navegador'
      };
    }

    try {
      // Validar URL antes del fetch
      const urlValidation = this.validateUrl(url);
      if (!urlValidation.isValid) {
        return {
          status: 'error',
          message: urlValidation.error || 'URL inválida'
        };
      }

      console.log('Preparing diary part save:', {
        diary_part_id: diaryPart.id,
        diary_part_name: diaryPart.name,
        original_lines: diaryPart.employee_lines_ids.length,
        pcp_data_keys: Object.keys(pcpData).length
      });

      // Construir las líneas de empleados desde los datos del PCP
      const employeeLines: Array<{
        hr_employee_id: number;
        bim_resource_id: number | false;
        bim_pcp_id: number | false;
        hh: number;
        i: boolean;
      }> = [];

      // Obtener todos los PCP únicos
      const uniquePCPs = [...new Set(
        diaryPart.employee_lines_ids
          .filter(line => line.hr_employee_name && line.bim_pcp_name)
          .map(line => line.bim_pcp_name)
      )];

      // Agrupar empleados únicos
      const uniqueEmployees = diaryPart.employee_lines_ids
        .filter(line => line.hr_employee_name)
        .reduce((acc, line) => {
          const existingEmployee = acc.find(emp => emp.hr_employee_id === line.hr_employee_id);
          if (!existingEmployee) {
            acc.push({
              hr_employee_id: line.hr_employee_id,
              hr_employee_name: line.hr_employee_name,
              lines: diaryPart.employee_lines_ids.filter(l => l.hr_employee_id === line.hr_employee_id)
            });
          }
          return acc;
        }, [] as Array<{
          hr_employee_id: number | false;
          hr_employee_name: string | false;
          lines: EmployeeLine[];
        }>);

      // Crear las líneas para cada empleado y PCP
      uniqueEmployees.forEach(employee => {
        uniquePCPs.forEach(pcp => {
          const key = `${employee.hr_employee_id}-${pcp}`;
          const value = pcpData[key] || 0;
          
          // Solo enviar líneas con valor > 0
          if (value > 0) {
            // Buscar la línea original para obtener los IDs de recurso y PCP
            const originalLine = employee.lines.find(l => l.bim_pcp_name === pcp);
            
            if (originalLine && employee.hr_employee_id !== false) {
              employeeLines.push({
                hr_employee_id: employee.hr_employee_id as number,
                bim_resource_id: originalLine.bim_resource_id,
                bim_pcp_id: originalLine.bim_pcp_id,
                hh: value,
                i: inasistencias?.[employee.hr_employee_id as number] || false
              });
            }
          }
        });
      });

      // Preparar los datos del parte diario
      const diaryPartData: {
        id: number;
        observation: string;
        employee_lines_ids: Array<{
          hr_employee_id: number;
          bim_resource_id: number | false;
          bim_pcp_id: number | false;
          hh: number;
          i: boolean;
        }>;
        file?: {name: string, data: string};
      } = {
        id: diaryPart.id,
        observation: observations[diaryPart.id] || '',
        employee_lines_ids: employeeLines
      };

      // Agregar archivo si existe
      if (fileData) {
        diaryPartData.file = fileData;
      }

      console.log('Final diary part data:', {
        id: diaryPartData.id,
        employee_lines_count: employeeLines.length,
        employee_lines: employeeLines
      });

      // Usar nuestro proxy API para evitar CORS
      const proxyEndpoint = '/api/save-diary-parts';
      
      const response = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          username: username,
          password: password,
          diary_part: diaryPartData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Save response error:', errorData);
        const errorMessage = errorData?.message || `Error HTTP: ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Save result:', result);
      
      // El proxy ya devuelve el formato correcto
      return result;

    } catch (error) {
      console.error('Error guardando partes diarios:', error);
      
      // Errores específicos de red
      if (error instanceof TypeError) {
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          return {
            status: 'error',
            message: 'Error de conexión con el proxy. Verifica que el servidor Next.js esté funcionando.'
          };
        }
      }
      
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido guardando partes diarios'
      };
    }
  }
}

export const apiService = new ApiService();
export type { LoginRequest, LoginResponse, ApiError, DiaryPart, EmployeeLine, DiaryPartsResponse, PCP, Employee, Equipment, Budget, BimInterface, BimInterfacePcp, WorkBreakdown, BimElement, WorkPackage };