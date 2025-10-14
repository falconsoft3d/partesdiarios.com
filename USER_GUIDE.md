# Guía de Usuario - Partes Diarios PWA

## 🔐 **Autenticación y Conexión**

### Primer Uso
1. **Instalar la PWA** (opcional pero recomendado):
   - En móvil: "Instalar app" desde el navegador
   - En escritorio: Ícono de instalación en la barra de direcciones

2. **Configurar Conexión**:
   - **URL**: Introduce la URL de tu servidor (ej: `http://localhost:8069`)
   - **Usuario**: Tu email o nombre de usuario
   - **Contraseña**: Tu contraseña del sistema

### Funcionalidades de Seguridad
- ✅ **Datos encriptados**: Credenciales guardadas con encriptación AES
- ✅ **Validación en tiempo real**: Verificación de URL y campos
- ✅ **Conexión segura**: Verificación de conectividad al servidor

## 📱 **Navegación de la App**

### 1. Pantalla de Login (`/`)
- Formulario de conexión inicial
- Validación de datos en tiempo real
- Mensajes de error detallados
- Redirección automática si ya hay sesión

### 2. Dashboard (`/dashboard`)
- Información de la conexión actual
- **Botón "Cargar Parte"**: Funcionalidad principal
- Acceso rápido a configuración y logout
- Estado de la conexión en tiempo real

### 3. Gestión de Conexiones (`/connections`)
- Ver datos de la conexión actual
- Opción para crear nueva conexión
- Eliminar conexión existente
- Mostrar/ocultar contraseña

## 🔧 **API Integration**

### Endpoint de Login
```bash
POST http://[tu-servidor]/bim/diary-part-offline/pwa/load-part
Content-Type: application/json

{
  "login": "usuario@ejemplo.com",
  "password": "mi_contraseña"
}
```

### Flujo de Autenticación
1. Usuario completa formulario
2. App valida datos localmente
3. Llamada HTTP al endpoint
4. Si es exitoso: guarda credenciales encriptadas
5. Redirección al dashboard

## 💾 **Almacenamiento Local**

### Datos Guardados (Encriptados)
- URL del servidor
- Nombre de usuario
- Contraseña
- Fecha de último guardado

### Gestión de Datos
- **Encriptación**: AES con clave secreta
- **Persistencia**: localStorage del navegador
- **Limpieza**: Automática al hacer logout
- **Validación**: Verificación de integridad

## 🚀 **Funcionalidades Implementadas**

### ✅ Completado
- [x] Formulario de login con validaciones
- [x] Integración con API real
- [x] Almacenamiento seguro de credenciales
- [x] Dashboard con información de conexión
- [x] Gestión de conexiones (ver/eliminar/crear)
- [x] Navegación automática entre páginas
- [x] PWA completamente funcional
- [x] Diseño responsive para móviles

### 🔄 Por Implementar
- [ ] Funcionalidad real de "Cargar Parte"
- [ ] Gestión de partes descargados
- [ ] Sincronización offline
- [ ] Reportes y estadísticas
- [ ] Notificaciones push

## 📱 **Uso en Móviles**

### Instalación
1. **Android Chrome**:
   - Abrir la URL en Chrome
   - Tocar "Instalar app" en el menú
   - Confirmar instalación

2. **iOS Safari**:
   - Abrir la URL en Safari
   - Tocar "Compartir" > "Agregar a pantalla de inicio"
   - Confirmar instalación

### Ventajas de la PWA
- ✅ Funciona como app nativa
- ✅ Icono en pantalla de inicio
- ✅ Pantalla completa (sin barra del navegador)
- ✅ Funcionalidad offline básica
- ✅ Actualizaciones automáticas

## 🔍 **Troubleshooting**

### Problemas Comunes

**Error de Conexión**
- Verificar que la URL sea correcta
- Comprobar que el servidor esté ejecutándose
- Verificar conectividad de red

**Credenciales Incorrectas**
- Verificar usuario y contraseña
- Probar login directo en el sistema
- Contactar administrador si persiste

**Datos Corruptos**
- Ir a "Gestión de Conexiones"
- Eliminar conexión actual
- Crear nueva conexión

**App No Funciona**
- Cerrar y reabrir la app
- Actualizar página (PWA se actualiza automáticamente)
- Verificar conexión a internet

## 🛡️ **Seguridad**

### Medidas Implementadas
- **Encriptación AES**: Para credenciales almacenadas
- **Validación client-side**: Verificación antes de envío
- **HTTPS recomendado**: Para conexiones en producción
- **No persistencia en memoria**: Credenciales no quedan en variables

### Recomendaciones
- Usar HTTPS en producción
- Cambiar contraseñas regularmente
- No compartir credenciales
- Cerrar sesión en dispositivos compartidos

---

## 📞 **Soporte**

Para problemas técnicos o dudas sobre la aplicación, contactar al equipo de desarrollo con los siguientes datos:

- URL del servidor utilizada
- Navegador y versión
- Descripción detallada del problema
- Capturas de pantalla si es relevante