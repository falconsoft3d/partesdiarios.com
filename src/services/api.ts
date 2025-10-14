interface LoginRequest {
  login: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
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
}

interface DiaryPart {
  id: number;
  name: string;
  date: string;
  hr_employee_id: number;
  hr_employee_name: string;
  state: string;
  employee_lines_ids: EmployeeLine[];
}

interface DiaryPartsResponse {
  status: 'ok' | 'error';
  message?: string;
  diary_parts?: DiaryPart[];
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

      // Usar nuestro proxy API para evitar CORS
      const proxyEndpoint = '/api/diary-parts';
      
      // Obtener la fecha actual para los logs (el servidor usa date.today())
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          login: username,
          password: password,
          date: today // Solo para referencia, el servidor no lo usa
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

  async saveDiaryParts(url: string, username: string, password: string, diaryPart: DiaryPart, pcpData: {[key: string]: number}): Promise<{status: 'ok' | 'error', message?: string}> {
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
                hh: value
              });
            }
          }
        });
      });

      // Preparar los datos del parte diario
      const diaryPartData = {
        id: diaryPart.id,
        employee_lines_ids: employeeLines
      };

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
export type { LoginRequest, LoginResponse, ApiError, DiaryPart, EmployeeLine, DiaryPartsResponse };