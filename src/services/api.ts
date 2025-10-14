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
    try {
      // Validar URL antes del fetch
      const urlValidation = this.validateUrl(url);
      if (!urlValidation.isValid) {
        return {
          success: false,
          message: urlValidation.error || 'URL inválida'
        };
      }

      // Limpiar URL y construir endpoint
      const cleanUrl = url.replace(/\/$/, '');
      const endpoint = `${cleanUrl}/bim/diary-part-offline/pwa/load-part`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors', // Explícitamente permitir CORS
        credentials: 'omit', // No enviar cookies por defecto
        body: JSON.stringify({
          login: username,
          password: password
        })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
        message: 'Login exitoso'
      };

    } catch (error) {
      console.error('Error en login:', error);
      
      // Errores específicos de red/CORS
      if (error instanceof TypeError) {
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          return {
            success: false,
            message: 'Error de conexión. Verifica que el servidor esté ejecutándose y la URL sea correcta.'
          };
        }
        if (error.message.includes('CORS')) {
          return {
            success: false,
            message: 'Error de CORS. El servidor debe permitir conexiones desde este dominio.'
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
    try {
      await fetch(url, {
        method: 'GET',
        mode: 'no-cors' // Para evitar problemas de CORS en test
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
export type { LoginRequest, LoginResponse, ApiError };