# Instrucciones para Marcar Pago Externo - Lili Ruiz

## 📋 Resumen

Este script marca como **pagada externamente** la inscripción anual de:

**Lilia del Rocio Ruiz Camacho (Lili Ruiz)**
- Email: liliruiz.dance@gmail.com
- Profesión: Coach
- Estado actual: Aprobada pero sin pago registrado

## ✅ Estado de Pagos Externos

| Profesional | Email | Estado de Pago | Acción Requerida |
|------------|-------|----------------|------------------|
| Andrea Olivares Lara | a.olivareslara@hotmail.com | ✅ Ya marcada como pagada | Ninguna |
| Jessica Flores Valencia | jessflova@gmail.com | ✅ Ya marcada como pagada | Ninguna |
| María Jimena | lamistika.love@gmail.com | ✅ Ya marcada como pagada | Ninguna |
| **Lili Ruiz** | liliruiz.dance@gmail.com | ❌ **Falta marcar** | **Ejecutar script** |

## 🚀 Pasos para Ejecutar el Script

### Opción 1: Ejecutar en Supabase Dashboard (Recomendado)

1. **Abre Supabase Dashboard**
   - Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto de Holistia

2. **Abre el SQL Editor**
   - En el menú lateral, haz clic en **SQL Editor**
   - Haz clic en **New Query**

3. **Copia y pega el script**
   - Abre el archivo: `database/scripts/marcar_pago_externo_lili_ruiz.sql`
   - Copia TODO el contenido
   - Pégalo en el editor SQL de Supabase

4. **Ejecuta el script**
   - Haz clic en el botón **Run** (o presiona `Cmd/Ctrl + Enter`)
   - Espera a que se ejecute

5. **Verifica el resultado**
   - Deberías ver una tabla con la información de Lili Ruiz
   - Verifica que:
     - `registration_fee_paid`: **true**
     - `registration_fee_paid_at`: Fecha y hora actual
     - `registration_fee_expires_at`: Fecha actual + 1 año
     - `dias_restantes`: Aproximadamente 365 días

### Opción 2: Desde la Terminal (Avanzado)

Si tienes acceso al CLI de Supabase:

```bash
# Navega al directorio del proyecto
cd /Users/brangarciaramos/Proyectos/holistia

# Ejecuta el script
supabase db execute --file database/scripts/marcar_pago_externo_lili_ruiz.sql
```

## 🔍 ¿Qué hace el script?

El script actualiza el registro de **Lilia del Rocio Ruiz Camacho** en la tabla `professional_applications`:

```sql
-- Campos actualizados:
registration_fee_paid = true              -- Marca como pagada
registration_fee_paid_at = NOW()          -- Fecha de pago (hoy)
registration_fee_expires_at = NOW() + 1 año  -- Expira en 1 año
updated_at = NOW()                        -- Actualiza timestamp
```

## ✅ Verificación Post-Ejecución

Después de ejecutar el script, verifica que:

### 1. En la Base de Datos
- [x] `registration_fee_paid` = `true`
- [x] `registration_fee_paid_at` tiene fecha actual
- [x] `registration_fee_expires_at` es en 1 año
- [x] `dias_restantes` es ~365

### 2. En la Plataforma Holistia
- [x] Lili Ruiz aparece como "aprobada" en el dashboard de admin
- [x] Su perfil es visible en la plataforma pública
- [x] Puede recibir citas de pacientes
- [x] Tiene acceso completo a su dashboard profesional

## 📧 Notificación Opcional

Si quieres enviar un email de confirmación a Lili Ruiz:

1. Ve al dashboard de admin
2. Busca a Lili Ruiz en la lista de profesionales
3. Envíale un mensaje de bienvenida confirmando su inscripción

O puedes enviarle un email manual explicando que su inscripción está activa.

## 🔐 Seguridad

- ✅ El script solo actualiza el registro de Lili Ruiz (verificado por email)
- ✅ No afecta a otros profesionales
- ✅ Incluye verificación automática
- ✅ Se puede ejecutar múltiples veces sin problemas (idempotente)

## ⚠️ Importante

- Este script marca el pago como realizado **HOY**
- La inscripción expirará en **1 año desde hoy**
- Si Lili pagó en una fecha específica diferente y quieres registrar esa fecha exacta, modifica el script antes de ejecutarlo

## 🐛 Troubleshooting

### Error: "No se encontró el registro"
- Verifica que el email sea correcto: `liliruiz.dance@gmail.com`
- Verifica que el ID sea correcto: `3ec204cd-87a5-4c46-8bd4-3eb3b11f7448`

### Error: "Permiso denegado"
- Asegúrate de tener permisos de admin en Supabase
- Intenta ejecutar el script directamente en el SQL Editor de Supabase

### El script se ejecutó pero no cambió nada
- Revisa los mensajes de error en la consola
- Verifica que la condición WHERE coincida con el registro correcto

## 📞 Soporte

Si tienes problemas ejecutando el script:

1. Revisa los logs en Supabase
2. Verifica que el ID y email sean correctos
3. Contacta al equipo de desarrollo de Holistia

---

**✅ Una vez ejecutado el script, Lili Ruiz estará completamente activa en la plataforma con su inscripción anual pagada.**

