'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Globe, User, Lock, CheckCircle, QrCode, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import QRCode from 'react-qr-code';

interface LoginFormData {
  url: string;
  username: string;
  password: string;
}

export default function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<LoginFormData>({
    url: 'http://localhost:8069',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showServerUrl, setShowServerUrl] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  // Cargar URL del parámetro de la URL o credenciales guardadas al montar el componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Prioridad 1: URL desde parámetro de la URL
        const serverUrlParam = searchParams.get('serverUrl');
        
        const savedUrl = localStorage.getItem('remembered_url');
        const savedUsername = localStorage.getItem('remembered_username');
        const savedPassword = localStorage.getItem('remembered_password');
        const savedRemember = localStorage.getItem('remember_me');

        if (savedRemember === 'true' && savedUrl && savedUsername && savedPassword) {
          setFormData({
            url: serverUrlParam || savedUrl, // Usar parámetro si existe, sino el guardado
            username: savedUsername,
            password: savedPassword
          });
          setRememberMe(true);
        } else if (serverUrlParam) {
          // Si no hay credenciales guardadas pero hay parámetro de URL
          setFormData(prev => ({
            ...prev,
            url: serverUrlParam
          }));
        }
      } catch (error) {
        console.error('Error al cargar credenciales guardadas:', error);
      }
    }
  }, [searchParams]);

  // Limpiar error global cuando cambie algún campo
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, error, clearError]);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.url) {
      newErrors.url = 'La URL es requerida';
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = 'Ingresa una URL válida';
    }

    if (!formData.username) {
      newErrors.username = 'El usuario es requerido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 4) {
      newErrors.password = 'La contraseña debe tener al menos 4 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSuccessMessage('');
    
    try {
      const result = await login(formData.url, formData.username, formData.password);
      
      if (result.success) {
        // Guardar o limpiar credenciales según la opción de recordar
        if (typeof window !== 'undefined') {
          if (rememberMe) {
            localStorage.setItem('remembered_url', formData.url);
            localStorage.setItem('remembered_username', formData.username);
            localStorage.setItem('remembered_password', formData.password);
            localStorage.setItem('remember_me', 'true');
          } else {
            localStorage.removeItem('remembered_url');
            localStorage.removeItem('remembered_username');
            localStorage.removeItem('remembered_password');
            localStorage.removeItem('remember_me');
          }
        }

        setSuccessMessage('¡Conexión exitosa! Redirigiendo...');
        // Aquí podrías redirigir al dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      }
    } catch (error) {
      console.error('Error en login:', error);
    }
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div 
              onClick={() => setShowServerUrl(!showServerUrl)}
              className="mx-auto w-32 h-32 flex items-center justify-center mb-4 cursor-pointer hover:opacity-80 transition-opacity"
              title="Click para configurar servidor"
            >
              <img src="/logo.png" alt="Partes Diarios" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error global */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Mensaje de éxito */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-sm text-green-600">{successMessage}</p>
              </div>
            )}

            {/* URL Field */}
            {showServerUrl && (
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  URL del Servidor
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="url"
                    type="text"
                    placeholder="https://ejemplo.com"
                    value={formData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-900 text-gray-900 focus:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.url ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.url && (
                  <p className="mt-1 text-sm text-red-600">{errors.url}</p>
                )}
                <button
                  type="button"
                  onClick={() => setShowServerUrl(false)}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  Ocultar configuración
                </button>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  placeholder="Tu usuario"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer select-none">
                Recordar mis datos
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Conectando...
                </div>
              ) : (
                'Conectar'
              )}
            </button>
          </form>

          {/* QR Code Toggle Button */}
          {formData.url && isValidUrl(formData.url) && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowQR(!showQR)}
                className="w-full flex items-center justify-center py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <QrCode className="h-4 w-4 mr-2" />
                <span>Código QR para acceso móvil</span>
                {showQR ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </button>
              
              {/* QR Code Section */}
              {showQR && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="bg-white p-3 rounded-lg inline-block">
                      <QRCode 
                        value={formData.url} 
                        size={120}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        viewBox={`0 0 120 120`}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Escanea para abrir en móvil
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-gray-500 mb-1">v1.0.0</p>
            <p className="text-xs text-gray-600">
              Desarrollado con <a href="https://www.odoo.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-600 hover:text-gray-800 hover:underline transition-colors">Odoo</a> por <a href="https://www.marlonfalcon.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-600 hover:text-gray-800 hover:underline transition-colors">Marlon Falcon</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}