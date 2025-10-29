# 🗺️ Configuración de Mapbox - Holistia

## Resumen

Este documento explica cómo configurar Mapbox GL para la funcionalidad de mapas en servicios profesionales.

## 🔧 Configuración Requerida

### 1. Obtener Access Token de Mapbox

1. Ve a [Mapbox Account](https://account.mapbox.com/)
2. Crea una cuenta o inicia sesión
3. Ve a **Account** → **Access tokens**
4. Copia tu **Default public token** o crea uno nuevo con los permisos necesarios:
   - **Geocoding API** (para geocodificación de direcciones)
   - **Styles API** (para estilos de mapa)

### 2. Configurar Variables de Entorno

Agrega la siguiente variable a tu archivo `.env.local`:

```bash
# Mapbox Access Token
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=tu_access_token_aqui
```

### 3. Restricciones de Seguridad (Recomendado)

Para mayor seguridad, configura restricciones en el access token:

#### Restricción de URL:
- **Allowed URLs**: `https://tu-dominio.com/*`
- **Dominios de desarrollo**: `http://localhost:3000/*`

#### Permisos del Token:
- **Public scopes**: Solo los necesarios (geocoding, styles)
- **Secret scopes**: No usar en el frontend

## 🚀 Funcionalidades Implementadas

### 1. Mapa Lazy-Loaded
- Solo se carga cuando el usuario abre el modal
- Optimiza el rendimiento de la página
- Reduce costos de API

### 2. Geocodificación con Cache
- Cache local para evitar llamadas repetidas
- Mejora la velocidad de carga
- Reduce costos de API

### 3. Interactividad del Mapa
- Marcador personalizado con icono verde
- Popup con información del servicio
- Botones para obtener direcciones
- Controles de navegación y pantalla completa

## 💰 Estimación de Costos

### Mapbox Pricing (2024)
- **Geocoding API**: Gratis hasta 100,000 requests/mes
- **Map Loads**: Gratis hasta 50,000 cargas/mes
- **Después del límite**: $0.50 por 1,000 requests adicionales

### Con Lazy Loading
- **Reducción estimada**: 80-90% en costos
- **Carga solo cuando se necesita**: Modal abierto
- **Cache local**: Evita requests repetidos

## 🔍 Monitoreo de Uso

### Mapbox Dashboard
1. Ve a [Mapbox Account](https://account.mapbox.com/)
2. Selecciona tu proyecto
3. Monitorea el uso de APIs en tiempo real

### Métricas Importantes
- Requests por día/mes
- Costo por API
- Errores de API

## 🛠️ Solución de Problemas

### Error: "Mapbox access token no configurado"
- Verifica que `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` esté en `.env.local`
- Reinicia el servidor de desarrollo
- Verifica que el access token sea válido

### Error: "Geocoding failed"
- Verifica que el access token tenga permisos de geocoding
- Verifica las restricciones del token
- Revisa los logs de la consola

### Mapa no se carga
- Verifica la conexión a internet
- Verifica que el access token tenga permisos correctos
- Revisa la consola del navegador para errores
- Verifica que `mapbox-gl` esté instalado: `pnpm install mapbox-gl`

### Estilos de mapa no se cargan
- Verifica que el access token tenga permisos de **Styles API**
- Verifica que el estilo especificado existe (`mapbox://styles/mapbox/streets-v12`)

## 🔒 Consideraciones de Seguridad

### 1. Restricciones de Token
```javascript
// En Mapbox Dashboard
Allowed URLs:
- https://holistia.io/*
- https://www.holistia.io/*
- http://localhost:3000/* (desarrollo)
```

### 2. Permisos del Token
- Solo habilitar permisos necesarios (geocoding, styles)
- No usar tokens secretos en el frontend
- Regenerar tokens periódicamente

### 3. Límites de Cuota
- Configurar límites diarios en el dashboard
- Configurar alertas de uso

## 📱 Compatibilidad

### Navegadores Soportados
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Dispositivos Móviles
- iOS Safari 12+
- Chrome Mobile 60+
- Samsung Internet 8+

## 🎨 Estilos de Mapa Disponibles

Mapbox ofrece varios estilos predefinidos:

- `mapbox://styles/mapbox/streets-v12` - Estilo por defecto (calles)
- `mapbox://styles/mapbox/outdoors-v12` - Al aire libre
- `mapbox://styles/mapbox/light-v11` - Estilo claro
- `mapbox://styles/mapbox/dark-v11` - Estilo oscuro
- `mapbox://styles/mapbox/satellite-v9` - Satelital
- `mapbox://styles/mapbox/navigation-day-v1` - Navegación diurna

Puedes cambiar el estilo en `map-component.tsx`:

```typescript
style: 'mapbox://styles/mapbox/streets-v12'
```

## 🚀 Próximos Pasos

1. **Configurar Access Token** en variables de entorno
2. **Probar funcionalidad** en desarrollo
3. **Configurar restricciones** de seguridad
4. **Monitorear uso** en producción
5. **Optimizar** según necesidades
6. **Personalizar estilos** de mapa si es necesario

## 📞 Soporte

Si tienes problemas con la configuración:
1. Revisa este documento
2. Consulta la [documentación oficial de Mapbox](https://docs.mapbox.com/)
3. Visita el [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
4. Contacta al equipo de desarrollo

## 📦 Dependencias

El proyecto ya incluye `mapbox-gl`:
```bash
pnpm install mapbox-gl
```

Para tipos TypeScript (opcional):
```bash
pnpm install -D @types/mapbox-gl
```
