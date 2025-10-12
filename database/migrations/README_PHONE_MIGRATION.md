# 📱 Migración del Campo Phone - IMPORTANTE

## ⚠️ Acción Requerida

Para que el nuevo componente `PhoneInput` funcione correctamente con números que incluyen código de país, **debes ejecutar esta migración en tu base de datos de Supabase**.

## 🔍 Problema

El campo `phone` en la tabla `professional_applications` actualmente es `VARCHAR(20)`, lo cual es insuficiente para almacenar números con código de país:

- ❌ `VARCHAR(20)` - Máximo 20 caracteres
- 📱 `"+52 55 1234 5678"` - 17 caracteres (México)
- 📱 `"+1 555 123 4567"` - 16 caracteres (USA/Canadá)
- 📱 Números más largos pueden exceder 20 caracteres

## ✅ Solución

Cambiar el tipo de dato de `VARCHAR(20)` a `TEXT` para soportar cualquier longitud.

## 📝 Pasos para Aplicar la Migración

### Opción 1: Desde el Dashboard de Supabase (Recomendado)

1. Ve a tu proyecto en Supabase: [https://supabase.com/dashboard](https://supabase.com/dashboard)

2. Selecciona tu proyecto de Holistia

3. Ve a la sección **SQL Editor** en el menú lateral izquierdo

4. Haz clic en **"New query"**

5. Copia y pega el siguiente SQL:

```sql
-- Ampliar el campo phone en professional_applications para soportar códigos de país
ALTER TABLE public.professional_applications 
ALTER COLUMN phone TYPE TEXT;

-- Actualizar el comentario de la columna
COMMENT ON COLUMN professional_applications.phone IS 'Teléfono del profesional con código de país (ej: +52 55 1234 5678)';
```

6. Haz clic en **"Run"** o presiona `Cmd/Ctrl + Enter`

7. Deberías ver el mensaje: ✅ **"Success. No rows returned"**

### Opción 2: Usando la CLI de Supabase

Si tienes la CLI de Supabase instalada:

```bash
cd /Users/brangarciaramos/Proyectos/holistia
supabase db push database/migrations/35_extend_phone_field_length.sql
```

## 🔍 Verificar que la Migración se Aplicó Correctamente

Después de ejecutar la migración, verifica que funcionó:

```sql
-- Verificar el tipo de dato del campo phone
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    col_description('professional_applications'::regclass, ordinal_position) as description
FROM information_schema.columns
WHERE table_name = 'professional_applications' 
AND column_name = 'phone';
```

Deberías ver:
- **data_type**: `text`
- **character_maximum_length**: `null` (ilimitado)

## 📊 Impacto de la Migración

- ✅ **Sin pérdida de datos**: Los números existentes se mantienen sin cambios
- ✅ **Compatible hacia atrás**: Números sin código de país siguen funcionando
- ✅ **Mejora hacia adelante**: Ahora soporta números con código de país
- ✅ **Sin tiempo de inactividad**: La migración es instantánea

## 🎯 Otros Campos de Teléfono

Los siguientes campos **YA están correctos** y NO requieren cambios:

- ✅ `event_registrations.emergency_contact_phone` → Ya es `TEXT`
- ✅ `auth.users.phone` → Manejado por Supabase Auth (ya soporta códigos de país)

## 📱 Formato de Números Después de la Migración

Después de aplicar la migración, los números se guardarán en este formato:

```
+52 55 1234 5678  (México)
+1 555 123 4567   (USA/Canadá)
+54 11 1234 5678  (Argentina)
+34 912 345 678   (España)
```

## ⚠️ Importante

**No olvides ejecutar esta migración antes de usar el nuevo componente PhoneInput en producción**, de lo contrario, los números con código de país se truncarán y perderán información.

## ✅ Checklist

- [ ] Ejecutar la migración SQL en Supabase
- [ ] Verificar que el tipo de dato cambió a TEXT
- [ ] Probar el formulario de "Convertirse en Profesional"
- [ ] Confirmar que los números con código de país se guardan correctamente

