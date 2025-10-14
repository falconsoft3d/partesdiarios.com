# Partes Diarios PWA

Una aplicación web progresiva (PWA) construida con Next.js para la gestión de partes diarios.

## 🚀 Características

- ✅ **PWA Completa**: Instalable en dispositivos móviles
- ✅ **Formulario de Autenticación**: URL, Usuario y Contraseña
- ✅ **Diseño Responsive**: Optimizado para móviles
- ✅ **Validación de Formularios**: Validación en tiempo real
- ✅ **Iconos Modernos**: Usando Lucide React
- ✅ **Tailwind CSS**: Diseño moderno y limpio

## 📱 Instalación como PWA

1. Abre la aplicación en tu navegador móvil
2. En Chrome: Toca el menú (⋮) > "Instalar app"
3. En Safari: Toca el botón compartir > "Agregar a pantalla de inicio"

## 🛠️ Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar servidor de producción
npm start
```

## 📋 Características del Formulario

### Campos
- **URL del Servidor**: Validación de URL válida
- **Usuario**: Campo requerido
- **Contraseña**: Mínimo 4 caracteres, con toggle para mostrar/ocultar

### Validaciones
- ✅ URL válida requerida
- ✅ Usuario no puede estar vacío
- ✅ Contraseña mínimo 4 caracteres
- ✅ Mensajes de error en tiempo real

### Estados
- 🔄 Loading durante la conexión
- ✅ Feedback visual de éxito/error

## 🎨 Iconos Necesarios

Para completar la PWA, necesitas crear los siguientes iconos PNG en la carpeta `public/`:

- `icon-192x192.png` (192x192px)
- `icon-256x256.png` (256x256px)  
- `icon-384x384.png` (384x384px)
- `icon-512x512.png` (512x512px)
- `favicon.ico` (32x32px)

Puedes usar el archivo `public/icon.svg` como base para generar estos iconos.

## 🌐 Configuración PWA

La aplicación está configurada con:

- **Manifest**: `/public/manifest.json`
- **Service Worker**: Generado automáticamente por next-pwa
- **Metadatos**: Configurados en `src/app/layout.tsx`
- **Viewport**: Optimizado para móviles

## 📱 Pruebas en Móvil

1. **Android Chrome**:
   - Accede a `http://[tu-ip]:3000` desde el móvil
   - Verás la opción "Instalar app" en el menú

2. **iOS Safari**:
   - Accede a la URL desde Safari
   - Toca "Compartir" > "Agregar a pantalla de inicio"

## 🔧 Próximos Pasos

1. **Crear iconos reales** en lugar del SVG placeholder
2. **Implementar lógica de autenticación** real
3. **Agregar almacenamiento local** para credenciales
4. **Implementar navegación** a otras pantallas
5. **Agregar funcionalidad offline** avanzada

## 🚀 Despliegue

Para producción, considera:

- **Vercel**: Despliegue automático con Git
- **Netlify**: Alternativa con CDN global
- **Servidor propio**: Con PM2 para Node.js

```bash
# Construir para producción
npm run build

# Exportar como sitio estático (opcional)
npm run export
```

La aplicación está ready para ser desplegada y funcionará como una app nativa en dispositivos móviles.
