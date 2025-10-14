import CryptoJS from 'crypto-js';

interface ConnectionData {
  url: string;
  username: string;
  password: string;
  savedAt: string;
}

class StorageService {
  private readonly STORAGE_KEY = 'partesdiarios_connection';
  private readonly SECRET_KEY = 'partesdiarios_secret_2024';

  private encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.SECRET_KEY).toString();
  }

  private decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  saveConnection(url: string, username: string, password: string): boolean {
    try {
      const connectionData: ConnectionData = {
        url,
        username,
        password,
        savedAt: new Date().toISOString()
      };

      const dataString = JSON.stringify(connectionData);
      const encryptedData = this.encrypt(dataString);
      
      localStorage.setItem(this.STORAGE_KEY, encryptedData);
      return true;
    } catch (error) {
      console.error('Error guardando conexión:', error);
      return false;
    }
  }

  getConnection(): ConnectionData | null {
    try {
      const encryptedData = localStorage.getItem(this.STORAGE_KEY);
      if (!encryptedData) {
        return null;
      }

      const decryptedData = this.decrypt(encryptedData);
      return JSON.parse(decryptedData) as ConnectionData;
    } catch (error) {
      console.error('Error recuperando conexión:', error);
      return null;
    }
  }

  hasConnection(): boolean {
    return this.getConnection() !== null;
  }

  clearConnection(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error eliminando conexión:', error);
      return false;
    }
  }

  updateConnection(updates: Partial<ConnectionData>): boolean {
    try {
      const currentConnection = this.getConnection();
      if (!currentConnection) {
        return false;
      }

      const updatedConnection = {
        ...currentConnection,
        ...updates,
        savedAt: new Date().toISOString()
      };

      return this.saveConnection(
        updatedConnection.url,
        updatedConnection.username,
        updatedConnection.password
      );
    } catch (error) {
      console.error('Error actualizando conexión:', error);
      return false;
    }
  }

  // Método para verificar si los datos están corruptos
  validateConnection(): boolean {
    const connection = this.getConnection();
    if (!connection) return false;

    return !!(
      connection.url &&
      connection.username &&
      connection.password &&
      connection.savedAt
    );
  }
}

export const storageService = new StorageService();
export type { ConnectionData };