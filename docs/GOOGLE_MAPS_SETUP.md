# 🗺️ Configuración de Google Maps - Holistia

## Resumen

Este documento explica cómo configurar Google Maps API para la funcionalidad de mapas en servicios profesionales.

## 🔧 Configuración Requerida

### 1. Obtener API Key de Google Maps

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las siguientes APIs:
   - **Maps JavaScript API**
   - **Geocoding API**
   - **Places API** (opcional, para búsquedas avanzadas)

4. Ve a **Credenciales** → **Crear credenciales** → **Clave de API**
5. Copia la API key generada

### 2. Configurar Variables de Entorno

Agrega la siguiente variable a tu archivo `.env.local`:

```bash
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

### 3. Restricciones de Seguridad (Recomendado)

Para mayor seguridad, configura restricciones en la API key:

#### Restricción de Aplicaciones HTTP:
- **Sitios web**: `https://tu-dominio.com/*`
- **Dominios de desarrollo**: `http://localhost:3000/*`

#### Restricción de APIs:
- Maps JavaScript API
- Geocoding API

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
- Marcador personalizado con el nombre del servicio
- Info window con información detallada
- Botones para obtener direcciones
- Apertura en Google Maps

## 💰 Estimación de Costos

### Google Maps API Pricing (2024)
- **Maps JavaScript API**: $7 por 1,000 cargas
- **Geocoding API**: $5 por 1,000 requests

### Con Lazy Loading
- **Reducción estimada**: 80-90% en costos
- **Carga solo cuando se necesita**: Modal abierto
- **Cache local**: Evita requests repetidos

## 🔍 Monitoreo de Uso

### Google Cloud Console
1. Ve a **APIs y servicios** → **Panel**
2. Selecciona tu proyecto
3. Monitorea el uso de APIs en tiempo real

### Métricas Importantes
- Requests por día/mes
- Costo por API
- Errores de API

## 🛠️ Solución de Problemas

### Error: "Google Maps API key not found"
- Verifica que `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` esté en `.env.local`
- Reinicia el servidor de desarrollo
- Verifica que la API key sea válida

### Error: "Geocoding failed"
- Verifica que Geocoding API esté habilitada
- Verifica las restricciones de la API key
- Revisa los logs de la consola

### Mapa no se carga
- Verifica la conexión a internet
- Verifica que la API key tenga permisos correctos
- Revisa la consola del navegador para errores

## 🔒 Consideraciones de Seguridad

### 1. Restricciones de Dominio
```javascript
// En Google Cloud Console
Aplicaciones HTTP autorizadas:
- https://holistia.io/*
- https://www.holistia.io/*
- http://localhost:3000/* (desarrollo)
```

### 2. Restricciones de API
- Solo habilitar APIs necesarias
- Deshabilitar APIs no utilizadas

### 3. Límites de Cuota
- Configurar límites diarios
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

## 🚀 Próximos Pasos

1. **Configurar API key** en variables de entorno
2. **Probar funcionalidad** en desarrollo
3. **Configurar restricciones** de seguridad
4. **Monitorear uso** en producción
5. **Optimizar** según necesidades

## 📞 Soporte

Si tienes problemas con la configuración:
1. Revisa este documento
2. Consulta la [documentación oficial de Google Maps](https://developers.google.com/maps/documentation)
3. Contacta al equipo de desarrollo