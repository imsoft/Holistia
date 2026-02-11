# Diagnóstico de Sincronización de Google Calendar

## Problema Reportado
Los eventos de Google Calendar no se están sincronizando como bloques de disponibilidad en Holistia.

## Eventos en Google Calendar (Febrero 2026)
- Domingo 1 Feb: "OFF"
- Sábado 7 Feb: "Día de chavas con nata"
- Domingo 8 Feb: "off"
- Sábado 14 Feb: "Retiro Temazacal Aldo" ⚠️ **DEBERÍA bloquear pero no lo hace**
- Domingo 15 Feb: "Retiro Temazacal Aldo" y "off"
- Sábado 22 Feb: "off"
- Domingo 22 Feb: "Taller Herbolario Modulo 2 CDX"

## Causa Probable
Los eventos en Google Calendar están marcados como **"Disponible" (transparent)** en lugar de **"Ocupado" (opaque)**.

## Pasos para Resolver

### 1. Verificar configuración de eventos en Google Calendar
Para cada evento que quieres que bloquee tu disponibilidad:

1. Abre el evento en Google Calendar
2. Busca la opción **"Mostrar como"** o **"Show as"**
3. Debe estar configurado como:
   - ✅ **"Ocupado"** o **"Busy"** (opaque) → Bloquea tiempo
   - ❌ **"Disponible"** o **"Free"** (transparent) → NO bloquea tiempo

### 2. Cambiar eventos existentes a "Ocupado"
1. Selecciona cada evento (off, Retiro Temazacal Aldo, etc.)
2. Edita el evento
3. Cambia "Mostrar como" a **"Ocupado"**
4. Guarda los cambios

### 3. Sincronizar manualmente desde Holistia

Después de cambiar los eventos a "Ocupado":

1. Ve a tu dashboard de profesional en Holistia
2. Navega a "Horarios" o la sección de Google Calendar
3. Haz clic en el botón **"Importar de Google"**
4. Abre la consola del navegador (F12) para ver los logs de sincronización
5. Revisa los mensajes que aparecen:
   - ✅ "Sincronización completada: X eventos bloqueados"
   - ❌ Si dice "0 eventos bloqueados", verifica los logs de filtrado

### 4. Revisar logs de diagnóstico

En la consola del navegador, busca estos mensajes:

```
📋 Eventos de Google Calendar: {
  totalFromGoogle: X,
  holistiaEvents: Y,
  existingBlocks: Z,
  afterFiltering: W  ← Este número debe ser mayor a 0
}
```

Si `afterFiltering` es 0, busca el mensaje:

```
⚠️ Se obtuvieron eventos pero todos fueron filtrados. Analizando razones:
  Evento 1: "OFF" - Filtrado porque: evento transparente
  Evento 2: "Retiro Temazacal Aldo" - Filtrado porque: evento transparente
```

## Filtros que Aplica la Sincronización

El código filtra eventos por las siguientes razones:

1. **Sin ID**: El evento no tiene ID válido
2. **Es cita de Holistia**: El evento fue creado desde Holistia (ya existe como cita)
3. **Sin fecha/hora**: El evento no tiene fecha de inicio o fin
4. **Evento transparente**: ⚠️ El evento está marcado como "Disponible" en Google Calendar
5. **Ya existe como bloque**: El evento ya fue sincronizado anteriormente

## Solución Adicional: Configurar Eventos Futuros

Para que los eventos nuevos se sincronicen automáticamente:

1. Cuando crees un evento de bloqueo en Google Calendar
2. Asegúrate de marcarlo como **"Ocupado"**
3. La sincronización automática (cada 30 min) lo importará a Holistia

## Verificación de Logs del Cron

Para administradores, revisar:
- Dashboard Admin → "Logs de Cron Sync"
- Ver la última ejecución y los resultados por profesional
- Buscar en `results` el campo `diagnostics` para ver cuántos eventos se filtraron

## Código Relacionado

- `src/actions/google-calendar/sync.ts:265` - Filtro de eventos transparentes
- `src/actions/google-calendar/sync.ts:290-344` - Logging de diagnóstico
- `src/components/google-calendar-integration.tsx:202-244` - Botón "Importar de Google"
