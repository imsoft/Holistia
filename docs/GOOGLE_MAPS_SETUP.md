# Configuración de Mapbox

## Pasos para configurar Mapbox (GRATUITO - Sin tarjeta de crédito)

### 1. Crear cuenta en Mapbox

1. Ve a [Mapbox](https://www.mapbox.com/)
2. Haz clic en "Sign up" para crear una cuenta gratuita
3. **NO necesitas tarjeta de crédito** para la cuenta gratuita
4. Verifica tu email

### 2. Obtener Access Token

1. Una vez logueado, ve a [Account](https://account.mapbox.com/)
2. En la sección "Access tokens", verás tu token por defecto
3. Copia el token (empieza con `pk.`)

### 3. Configurar en el proyecto

1. Crea un archivo `.env.local` en la raíz del proyecto
2. Agrega la siguiente línea:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=tu_access_token_aqui
```

### 4. Reiniciar el servidor

Después de agregar la variable de entorno, reinicia el servidor de desarrollo:

```bash
pnpm dev
```

## Ventajas de Mapbox

✅ **Completamente gratuito** - 50,000 cargas de mapa por mes  
✅ **Sin tarjeta de crédito** requerida  
✅ **Mapas modernos y hermosos**  
✅ **Fácil de configurar**  
✅ **Geocodificación incluida**  
✅ **Marcadores personalizados**  
✅ **Controles de navegación**  

## Límites gratuitos

- **50,000 cargas de mapa** por mes
- **100,000 geocodificaciones** por mes
- **Perfecto para desarrollo y proyectos pequeños**

## Notas importantes

- El access token debe tener el prefijo `NEXT_PUBLIC_` para ser accesible en el cliente
- Mapbox es mucho más generoso que Google Maps en el plan gratuito
- No subas el archivo `.env.local` a tu repositorio
- Los mapas se ven modernos y profesionales
