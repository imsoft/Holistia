# Agregar Políticas de Storage para Admins - Professional Services

## Estado Actual
Tienes 4 políticas creadas:
- ✅ Public can view service images (SELECT)
- ✅ Professionals can upload service images (INSERT)
- ✅ Professionals can update service images (UPDATE)
- ✅ Professionals can delete service images (DELETE)

## Políticas Faltantes
Necesitas agregar 3 políticas para que los admins puedan gestionar imágenes:

### Política 1: Admins can upload service images

1. Ve a **Supabase Dashboard** → **Storage** → **professional-services** → **Policies**
2. Haz clic en **"New policy"**
3. Selecciona **"Create a policy from scratch"**
4. Configuración:
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
5. Haz clic en **"Review"** → **"Save policy"**

### Política 2: Admins can update service images

1. Haz clic en **"New policy"**
2. Selecciona **"Create a policy from scratch"**
3. Configuración:
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
   - **WITH CHECK expression** (mismo que USING):
     ```sql
     bucket_id = 'professional-services'
     AND EXISTS (
       SELECT 1 FROM public.profiles
       WHERE profiles.id = auth.uid()
       AND profiles.type = 'admin'
       AND profiles.account_active = true
     )
     ```
4. Haz clic en **"Review"** → **"Save policy"**

### Política 3: Admins can delete service images

1. Haz clic en **"New policy"**
2. Selecciona **"Create a policy from scratch"**
3. Configuración:
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
4. Haz clic en **"Review"** → **"Save policy"**

## Verificación

Después de crear las 3 políticas, deberías tener **7 políticas en total**:

1. ✅ Public can view service images
2. ✅ Professionals can upload service images
3. ✅ **Admins can upload service images** (NUEVA)
4. ✅ Professionals can update service images
5. ✅ **Admins can update service images** (NUEVA)
6. ✅ Professionals can delete service images
7. ✅ **Admins can delete service images** (NUEVA)

## Resultado

Una vez creadas estas políticas:
- ✅ Los admins podrán subir imágenes de servicios desde el dashboard
- ✅ Los admins podrán actualizar imágenes de servicios
- ✅ Los admins podrán eliminar imágenes de servicios
- ✅ Los profesionales seguirán pudiendo gestionar sus propias imágenes
- ✅ El error "new row violates row-level security policy" debería desaparecer para admins
