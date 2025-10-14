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

  async login(url: string, username: string, password: string): Promise<LoginResponse> {
    try {
      const endpoint = `${url}/bim/diary-part-offline/pwa/load-part`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          message: 'Error de conexión. Verifica la URL del servidor.'
        };
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido'
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