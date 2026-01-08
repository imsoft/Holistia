# Instrucciones para Crear Políticas de Storage para Professional Services

## Problema
El script SQL no puede crear políticas de storage automáticamente porque requiere permisos de superusuario. Debes crearlas manualmente desde el Dashboard de Supabase.

## Pasos para Crear las Políticas

### 1. Ir al Dashboard de Supabase
1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto Holistia
3. Ve a **Storage** en el menú lateral

### 2. Verificar/Crear el Bucket
1. Si no existe, crea el bucket `professional-services`:
   - Haz clic en **"New bucket"**
   - **Name**: `professional-services`
   - **Public bucket**: ✅ (activado)
   - **File size limit**: 5242880 (5MB)
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`
   - Haz clic en **"Create bucket"**

### 3. Crear Políticas de Storage

Haz clic en el bucket `professional-services` → Ve a la pestaña **"Policies"**

#### Política 1: Lectura Pública
- Haz clic en **"New policy"**
- Selecciona **"Create a policy from scratch"**
- **Policy name**: `Public can view service images`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **USING expression**:
  ```sql
  bucket_id = 'professional-services'
  ```
- Haz clic en **"Review"** → **"Save policy"**

#### Política 2: Subida para Profesionales
- Haz clic en **"New policy"**
- Selecciona **"Create a policy from scratch"**
- **Policy name**: `Professionals can upload service images`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **WITH CHECK expression**:
  ```sql
  bucket_id = 'professional-services' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- Haz clic en **"Review"** → **"Save policy"**

#### Política 3: Subida para Admins
- Haz clic en **"New policy"**
- Selecciona **"Create a policy from scratch"**
- **Policy name**: `Admins can upload service images`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **WITH CHECK expression**:
  ```sql
  bucket_id = 'professional-services'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
    AND profiles.account_active = true
  )
  ```
- Haz clic en **"Review"** → **"Save policy"**

#### Política 4: Actualización para Profesionales
- Haz clic en **"New policy"**
- Selecciona **"Create a policy from scratch"**
- **Policy name**: `Professionals can update service images`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'professional-services' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- **WITH CHECK expression**:
  ```sql
  bucket_id = 'professional-services' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- Haz clic en **"Review"** → **"Save policy"**

#### Política 5: Actualización para Admins
- Haz clic en **"New policy"**
- Selecciona **"Create a policy from scratch"**
- **Policy name**: `Admins can update service images`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'professional-services'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
    AND profiles.account_active = true
  )
  ```
- **WITH CHECK expression**:
  ```sql
  bucket_id = 'professional-services'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
    AND profiles.account_active = true
  )
  ```
- Haz clic en **"Review"** → **"Save policy"**

#### Política 6: Eliminación para Profesionales
- Haz clic en **"New policy"**
- Selecciona **"Create a policy from scratch"**
- **Policy name**: `Professionals can delete service images`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'professional-services' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- Haz clic en **"Review"** → **"Save policy"**

#### Política 7: Eliminación para Admins
- Haz clic en **"New policy"**
- Selecciona **"Create a policy from scratch"**
- **Policy name**: `Admins can delete service images`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'professional-services'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
    AND profiles.account_active = true
  )
  ```
- Haz clic en **"Review"** → **"Save policy"**

## Verificación

Después de crear todas las políticas, verifica que funcionan:

1. Intenta subir una imagen desde el formulario de servicios
2. Verifica que no aparezca el error "new row violates row-level security policy"
3. Verifica que las imágenes se puedan ver públicamente

## Notas Importantes

- El formato de path para las imágenes debe ser: `{user_id}/{service_id}-{timestamp}.{ext}`
- Los profesionales solo pueden subir en su propia carpeta (`{user_id}/...`)
- Los admins pueden subir en cualquier carpeta
- Todas las imágenes son públicas para lectura
