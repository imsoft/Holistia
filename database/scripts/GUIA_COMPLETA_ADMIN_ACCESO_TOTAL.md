# 🔐 GUÍA COMPLETA: Acceso Total de Administradores

**Fecha:** 2026-01-13
**Propósito:** Asegurar que los administradores tengan acceso completo a TODOS los recursos de profesionales

---

## 📋 RESUMEN

Esta guía te ayudará a configurar las políticas de storage en Supabase para que los administradores puedan:
- ✅ Subir/editar/eliminar fotos de perfil de profesionales (`avatars`)
- ✅ Gestionar imágenes de servicios profesionales (`professional-services`)
- ✅ Gestionar galería de profesionales (`professional-gallery`)
- ✅ Gestionar productos digitales (`digital-products`)
- ✅ Gestionar challenges (`challenges`)
- ✅ Gestionar todas las tablas relacionadas

---

## 🎯 BUCKETS QUE NECESITAN POLÍTICAS DE ADMIN

### 1. **avatars** (FOTOS DE PERFIL)
### 2. **professional-gallery** (GALERÍA DE PROFESIONALES)
### 3. **professional-services** (IMÁGENES DE SERVICIOS)
### 4. **digital-products** (PRODUCTOS DIGITALES)
### 5. **challenges** (RETOS)

---

## 🚀 INSTRUCCIONES PASO A PASO

### PASO 1: Ve a Supabase Dashboard

1. Abre [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto **Holistia**
3. Ve a **Storage** en el menú lateral

---

## 📝 POLÍTICAS PARA CADA BUCKET

---

### 🟦 BUCKET 1: `avatars`

#### Ve a: Storage → avatars → Policies

#### Política 1: Lectura pública
- **Policy name:** `Public can view avatars`
- **Allowed operation:** `SELECT`
- **Target roles:** `public`
- **USING expression:**
```sql
bucket_id = 'avatars'
```

#### Política 2: Admins pueden subir
- **Policy name:** `Admins can upload avatars`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated`
- **WITH CHECK expression:**
```sql
bucket_id = 'avatars'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```

#### Política 3: Admins pueden actualizar
- **Policy name:** `Admins can update avatars`
- **Allowed operation:** `UPDATE`
- **Target roles:** `authenticated`
- **USING expression:**
```sql
bucket_id = 'avatars'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```
- **WITH CHECK expression:** (mismo que USING)
```sql
bucket_id = 'avatars'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```

#### Política 4: Admins pueden eliminar
- **Policy name:** `Admins can delete avatars`
- **Allowed operation:** `DELETE`
- **Target roles:** `authenticated`
- **USING expression:**
```sql
bucket_id = 'avatars'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```

---

### 🟦 BUCKET 2: `professional-gallery`

#### Ve a: Storage → professional-gallery → Policies

#### Política 1: Lectura pública
- **Policy name:** `Public can view gallery`
- **Allowed operation:** `SELECT`
- **Target roles:** `public`
- **USING expression:**
```sql
bucket_id = 'professional-gallery'
```

#### Política 2: Admins pueden subir
- **Policy name:** `Admins can upload to gallery`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated`
- **WITH CHECK expression:**
```sql
bucket_id = 'professional-gallery'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```

#### Política 3: Admins pueden actualizar
- **Policy name:** `Admins can update gallery`
- **Allowed operation:** `UPDATE`
- **Target roles:** `authenticated`
- **USING expression:**
```sql
bucket_id = 'professional-gallery'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```
- **WITH CHECK expression:** (mismo que USING)
```sql
bucket_id = 'professional-gallery'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```

#### Política 4: Admins pueden eliminar
- **Policy name:** `Admins can delete from gallery`
- **Allowed operation:** `DELETE`
- **Target roles:** `authenticated`
- **USING expression:**
```sql
bucket_id = 'professional-gallery'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```

---

### 🟦 BUCKET 3: `professional-services`

#### Ve a: Storage → professional-services → Policies

#### Política 1: Admins pueden subir
- **Policy name:** `Admins can upload service images`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated`
- **WITH CHECK expression:**
```sql
bucket_id = 'professional-services'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```

#### Política 2: Admins pueden actualizar
- **Policy name:** `Admins can update service images`
- **Allowed operation:** `UPDATE`
- **Target roles:** `authenticated`
- **USING expression:**
```sql
bucket_id = 'professional-services'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```
- **WITH CHECK expression:** (mismo que USING)
```sql
bucket_id = 'professional-services'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```

#### Política 3: Admins pueden eliminar
- **Policy name:** `Admins can delete service images`
- **Allowed operation:** `DELETE`
- **Target roles:** `authenticated`
- **USING expression:**
```sql
bucket_id = 'professional-services'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```

---

### 🟦 BUCKET 4: `digital-products`

#### Ve a: Storage → digital-products → Policies

Estas políticas **YA DEBERÍAN EXISTIR** según la migración 160, pero verifica que estén configuradas:

#### Verifica que exista: `Admins can manage digital-products files`
- **Allowed operation:** `ALL`
- **Target roles:** `authenticated`
- **USING expression:**
```sql
bucket_id = 'digital-products'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```
- **WITH CHECK expression:** (mismo que USING)

---

### 🟦 BUCKET 5: `challenges`

#### Ve a: Storage → challenges → Policies

#### Política 1: Admins pueden subir
- **Policy name:** `Admins can upload to challenges`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated`
- **WITH CHECK expression:**
```sql
bucket_id = 'challenges'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```

#### Política 2: Admins pueden actualizar
- **Policy name:** `Admins can update challenges`
- **Allowed operation:** `UPDATE`
- **Target roles:** `authenticated`
- **USING expression:**
```sql
bucket_id = 'challenges'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```
- **WITH CHECK expression:** (mismo que USING)

#### Política 3: Admins pueden eliminar
- **Policy name:** `Admins can delete from challenges`
- **Allowed operation:** `DELETE`
- **Target roles:** `authenticated`
- **USING expression:**
```sql
bucket_id = 'challenges'
AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.type = 'admin'
  AND profiles.account_active = true
)
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Después de configurar todas las políticas, verifica lo siguiente:

### Storage Buckets
- [ ] `avatars` - 4 políticas (1 SELECT public + 3 admin INSERT/UPDATE/DELETE)
- [ ] `professional-gallery` - 4 políticas (1 SELECT public + 3 admin INSERT/UPDATE/DELETE)
- [ ] `professional-services` - 3 políticas adicionales de admin (INSERT/UPDATE/DELETE)
- [ ] `digital-products` - 1 política de admin (ALL operations)
- [ ] `challenges` - 3 políticas adicionales de admin (INSERT/UPDATE/DELETE)

### Tablas de Base de Datos
- [ ] `professional_applications` - Política de admin activa (verificado en migración 81)
- [ ] `professional_services` - Política de admin activa (verificado en migración 154)
- [ ] `digital_products` - Política de admin activa (verificado en migración 157)
- [ ] `challenges` - Política de admin activa (verificado en migración 150)

---

## 🧪 CÓMO PROBAR

1. **Inicia sesión como administrador** en tu aplicación
2. Ve al panel de administración
3. Intenta editar un profesional y cambiar su foto de perfil
4. Intenta subir imágenes a la galería
5. Intenta editar servicios y subir imágenes
6. Verifica que NO recibas errores 403 o "Unauthorized"

---

## 🐛 SI AÚN TIENES PROBLEMAS

### Error 403 "Unauthorized" o "new row violates row-level security policy"

1. **Verifica tu usuario admin:**
   - Ve a SQL Editor en Supabase
   - Ejecuta:
   ```sql
   SELECT id, email, type, account_active
   FROM profiles
   WHERE id = auth.uid();
   ```
   - Verifica que `type = 'admin'` y `account_active = true`

2. **Verifica que las políticas se crearon:**
   - Ve a SQL Editor en Supabase
   - Ejecuta:
   ```sql
   SELECT
     schemaname,
     tablename,
     policyname,
     cmd,
     roles
   FROM pg_policies
   WHERE schemaname = 'storage'
     AND tablename = 'objects'
     AND policyname LIKE '%admin%'
   ORDER BY tablename, policyname;
   ```

3. **Limpia la caché:**
   - Cierra sesión de la aplicación
   - Limpia las cookies y localStorage
   - Vuelve a iniciar sesión

---

## 📞 SOPORTE

Si después de seguir todos estos pasos aún tienes problemas:
1. Revisa los logs de Supabase (Dashboard → Logs)
2. Revisa la consola del navegador para ver el error exacto
3. Verifica que estás usando el cliente correcto de Supabase (client vs server)

---

**¡Listo!** Con estas políticas configuradas, los administradores tendrán acceso completo para gestionar todos los recursos de profesionales sin restricciones. 🎉
