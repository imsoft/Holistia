# 🚨 INSTRUCCIONES URGENTES - SOLUCIONAR ERROR 403

## ❌ PROBLEMA:
Tu usuario NO tiene permisos de admin y el bucket `event-gallery` NO existe.

## ✅ SOLUCIÓN PASO A PASO:

### 1. Ve a Supabase Dashboard
- Abre tu navegador
- Ve a [supabase.com](https://supabase.com)
- Inicia sesión en tu proyecto

### 2. Abre SQL Editor
- Haz clic en **"SQL Editor"** en el menú lateral izquierdo

### 3. Ejecuta este SQL EXACTO:
```sql
-- Actualizar usuario admin
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"type": "admin"}'::jsonb
WHERE email = 'holistia.io@gmail.com';

-- Crear bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-gallery', 'event-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Verificar
SELECT 'Usuario:' as tipo, email, raw_user_meta_data->>'type' as user_type
FROM auth.users WHERE email = 'holistia.io@gmail.com';

SELECT 'Bucket:' as tipo, id, name, public 
FROM storage.buckets WHERE id = 'event-gallery';
```

### 4. Haz clic en "Run"
- Copia y pega TODO el SQL de arriba
- Haz clic en el botón verde **"Run"**
- Espera a que termine

### 5. Verifica el resultado
Deberías ver algo como:
```
Usuario: holistia.io@gmail.com | admin
Bucket: event-gallery | event-gallery | true
```

### 6. Cierra sesión y vuelve a iniciar
- En tu aplicación, cierra sesión
- Vuelve a iniciar sesión
- Prueba subir las imágenes

## ⚠️ IMPORTANTE:
- **DEBES ejecutar el SQL manualmente en Supabase**
- **NO puedo hacerlo por ti desde aquí**
- **Después de ejecutar, cierra sesión y vuelve a iniciar**

## 🎯 RESULTADO ESPERADO:
Después de esto, podrás subir imágenes sin el error 403.
