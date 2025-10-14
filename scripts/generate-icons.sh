#!/bin/bash

# Script para generar iconos PWA básicos
# Este script crea iconos PNG simples usando ImageMagick (si está disponible)

SIZES=(192 256 384 512)
COLOR="#3b82f6"
TEXT_COLOR="white"

echo "🎨 Generando iconos PWA..."

# Crear un SVG temporal
cat > /tmp/icon_template.svg << EOF
<svg width="SIZE" height="SIZE" viewBox="0 0 SIZE SIZE" xmlns="http://www.w3.org/2000/svg">
  <rect width="SIZE" height="SIZE" rx="RADIUS" fill="$COLOR"/>
  <text x="CENTERX" y="CENTERY" text-anchor="middle" font-family="Arial, sans-serif" font-size="FONTSIZE" font-weight="bold" fill="$TEXT_COLOR">PD</text>
</svg>
EOF

for size in "${SIZES[@]}"; do
    radius=$((size / 8))
    centerx=$((size / 2))
    centery=$((size * 3 / 4))
    fontsize=$((size / 4))
    
    # Reemplazar variables en el template
    sed "s/SIZE/$size/g; s/RADIUS/$radius/g; s/CENTERX/$centerx/g; s/CENTERY/$centery/g; s/FONTSIZE/$fontsize/g" /tmp/icon_template.svg > "/tmp/icon_$size.svg"
    
    # Si ImageMagick está disponible, convertir a PNG
    if command -v convert &> /dev/null; then
        convert "/tmp/icon_$size.svg" "public/icon-${size}x${size}.png"
        echo "✅ Creado icon-${size}x${size}.png"
    else
        echo "⚠️  ImageMagick no encontrado. Copiando SVG como icon-${size}x${size}.svg"
        cp "/tmp/icon_$size.svg" "public/icon-${size}x${size}.svg"
    fi
done

# Crear favicon.ico si ImageMagick está disponible
if command -v convert &> /dev/null; then
    convert "/tmp/icon_192.svg" -resize 32x32 "public/favicon.ico"
    echo "✅ Creado favicon.ico"
fi

# Limpiar archivos temporales
rm -f /tmp/icon_*.svg /tmp/icon_template.svg

echo "🎉 ¡Iconos generados! La PWA está lista para producción."