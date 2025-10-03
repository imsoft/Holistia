# Configuración de Mapbox en Producción (Vercel)

## 🚨 Problema Actual
En producción aparece: **"Mapa no disponible - Mapbox access token no configurado"**

## 🔧 Solución Completa

### 1. Obtener Access Token de Mapbox

1. **Crear cuenta en Mapbox** (si no tienes una):
   - Ve a [mapbox.com](https://mapbox.com)
   - Haz clic en "Sign up" 
   - **Es completamente GRATUITO** - No necesitas tarjeta de crédito
   - Verifica tu email

2. **Obtener el token**:
   - Inicia sesión en [account.mapbox.com](https://account.mapbox.com)
   - En la sección "Access tokens" verás tu token por defecto
   - Copia el token (empieza con `pk.`)
   - Ejemplo: `pk.eyJ1IjoianVhbiIsImEiOiJjbXh4eHh4eHh4In0.xxxxxxxxxxxxxxxxxxxxx`

### 2. Configurar en Vercel (Producción)

1. **Ir al Dashboard de Vercel**:
   - Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
   - Selecciona tu proyecto "holistia"

2. **Configurar Variables de Entorno**:
   - Ve a la pestaña **"Settings"**
   - Busca la sección **"Environment Variables"**
   - Haz clic en **"Add New"**

3. **Agregar la variable**:
   ```
   Name: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
   Value: pk.eyJ1IjoianVhbiIsImEiOiJjbXh4eHh4eHh4In0.xxxxxxxxxxxxxxxxxxxxx
   Environment: Production, Preview, Development
   ```

4. **Redeploy**:
   - Después de agregar la variable, haz clic en **"Redeploy"** en la pestaña "Deployments"
   - O simplemente haz un nuevo push a GitHub

### 3. Verificar Configuración Local (Desarrollo)

Crea el archivo `.env.local` en la raíz del proyecto:

```env
# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoianVhbiIsImEiOiJjbXh4eHh4eHh4In0.xxxxxxxxxxxxxxxxxxxxx

# Otras variables de entorno que ya tengas...
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
```

### 4. Verificar que Funciona

1. **En desarrollo**:
   ```bash
   pnpm dev
   ```
   - Ve a cualquier página con mapa
   - Debería mostrar el mapa correctamente

2. **En producción**:
   - Después del redeploy, ve a tu sitio web
   - Los mapas deberían funcionar correctamente

## 🎯 Características del Plan Gratuito de Mapbox

✅ **50,000 cargas de mapa** por mes  
✅ **100,000 geocodificaciones** por mes  
✅ **Sin tarjeta de crédito** requerida  
✅ **Perfecto para proyectos pequeños y medianos**  

## 🔍 Troubleshooting

### Si sigue sin funcionar:

1. **Verificar que la variable esté en Vercel**:
   - Ve a Settings → Environment Variables
   - Asegúrate de que `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` esté listada
   - Verifica que esté habilitada para "Production"

2. **Verificar el token**:
   - El token debe empezar con `pk.`
   - No debe tener espacios o caracteres extra
   - Debe ser el token correcto de tu cuenta

3. **Redeploy completo**:
   - A veces necesitas un redeploy completo después de agregar variables
   - Ve a Deployments → Click en los 3 puntos → Redeploy

4. **Verificar en el código**:
   - El componente `MapboxMap` ya está configurado correctamente
   - Verifica que esté usando `process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

## 📱 Ubicaciones donde se usan los mapas

- Perfiles de profesionales
- Formulario Become Professional (preview de ubicación)
- Cualquier página que muestre direcciones

## ⚡ Solución Rápida

**Para solucionar inmediatamente**:
1. Ve a [account.mapbox.com](https://account.mapbox.com) → Copia tu token
2. Ve a [vercel.com/dashboard](https://vercel.com/dashboard) → Tu proyecto → Settings → Environment Variables
3. Agrega: `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` = `tu_token_aqui`
4. Redeploy

¡Los mapas deberían funcionar en 2-3 minutos! 🎉
