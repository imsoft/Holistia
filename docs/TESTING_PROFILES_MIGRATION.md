# 🧪 Guía de Testing - Migración a `public.profiles`

## 📋 Checklist de Verificación

### ✅ Fase 1: Verificación de Base de Datos

#### 1.1 Ejecutar Script de Verificación Completa

En **Supabase SQL Editor**, ejecuta:
```bash
database/scripts/verificar_profiles_completo.sql
```

**Resultados esperados:**
- ✅ Usuarios en `auth.users` = Perfiles en `profiles`
- ✅ Usuarios sin perfil = 0
- ✅ Al menos 1 admin (tú)
- ✅ Distribución de tipos correcta
- ⚠️ Algunos usuarios sin nombres (OAuth) es normal

#### 1.2 Poblar Nombres Faltantes (OPCIONAL)

Si quieres que todos los usuarios tengan nombres:
```bash
database/scripts/poblar_nombres_faltantes.sql
```

**Nota:** Esto es completamente opcional. La app maneja correctamente usuarios sin nombres (usa el email como fallback).

---

### ✅ Fase 2: Testing de Autenticación

#### 2.1 Signup (Nuevo Usuario)

**Pasos:**
1. Abre el navegador en modo incógnito
2. Ve a `https://holistia.io/signup` (o localhost)
3. Crea una cuenta nueva con:
   - Email: `test+profile@holistia.io`
   - Password: `TestProfile123!`
   - Nombre: `Test`
   - Apellido: `Profile`

**Verificación:**
```sql
-- En Supabase SQL Editor
SELECT * FROM profiles 
WHERE email = 'test+profile@holistia.io';
```

**Resultado esperado:**
- ✅ Perfil creado automáticamente
- ✅ `first_name = 'Test'`
- ✅ `last_name = 'Profile'`
- ✅ `type = 'patient'`

#### 2.2 Login (Usuario Existente)

**Pasos:**
1. Logout
2. Login con el usuario que acabas de crear

**Verificación:**
- ✅ Redirige a `/patient/[id]/explore`
- ✅ Muestra nombre correcto en navbar
- ✅ Avatar funciona (o muestra placeholder)

#### 2.3 OAuth Google (Si está configurado)

**Pasos:**
1. Logout
2. Click en "Continuar con Google"
3. Selecciona una cuenta

**Verificación:**
```sql
SELECT * FROM profiles 
WHERE email = 'tu-email-google@gmail.com';
```

**Resultado esperado:**
- ✅ Perfil creado automáticamente
- ✅ `type = 'patient'` (por defecto)
- ✅ `avatar_url` de Google
- ⚠️ `first_name` y `last_name` pueden estar vacíos (normal)

---

### ✅ Fase 3: Testing de Roles y Permisos

#### 3.1 Paciente (Patient)

**Login como paciente y verifica:**

1. **Dashboard:**
   - ✅ `/patient/[id]/explore` accesible
   - ✅ Nombre correcto en navbar
   - ✅ Avatar visible

2. **Perfil:**
   - ✅ `/patient/[id]/explore/profile` accesible
   - ✅ Puede editar teléfono
   - ✅ Puede cambiar foto de perfil

3. **Restricciones:**
   - ❌ No puede acceder a `/admin/[id]/*`
   - ❌ No puede acceder a `/professional/[id]/*` (si no es profesional)

#### 3.2 Profesional (Professional)

**Login como profesional y verifica:**

1. **Dashboard:**
   - ✅ `/professional/[id]/dashboard` accesible
   - ✅ Estadísticas visibles
   - ✅ Nombre correcto

2. **Citas:**
   - ✅ `/professional/[id]/appointments` accesible
   - ✅ Puede ver lista de citas
   - ✅ Nombres de pacientes visibles

3. **Pagos:**
   - ✅ Indicador "Pagado" / "Sin pago" visible
   - ✅ Ingresos totales calculados correctamente

#### 3.3 Administrador (Admin)

**Login como admin (`holistia.io@gmail.com`) y verifica:**

1. **Dashboard:**
   - ✅ `/admin/[id]/dashboard` accesible
   - ✅ Analytics funcionan

2. **Finanzas:**
   - ✅ `/admin/[id]/finances` accesible
   - ✅ Datos de ingresos visibles
   - ❌ Otros usuarios NO pueden acceder

3. **Registros de Eventos:**
   - ✅ `/admin/[id]/event-registrations` accesible
   - ✅ Nombres de usuarios visibles
   - ✅ Búsqueda funciona

4. **Blog:**
   - ✅ `/admin/[id]/blog/new` accesible
   - ✅ Puede seleccionar autores (con nombres desde profiles)

---

### ✅ Fase 4: Testing de Funcionalidades Críticas

#### 4.1 Reservar Cita

**Pasos (como paciente):**
1. Ve a `/patient/[id]/explore`
2. Selecciona un profesional
3. Intenta reservar una cita

**Verificación:**
- ✅ Formulario pre-llena datos desde profiles
- ✅ Email correcto
- ✅ Teléfono correcto (si existe)
- ✅ Nombre correcto

#### 4.2 Pago de Cita

**Pasos:**
1. Completa el pago (Stripe)
2. Verifica emails recibidos

**Verificación:**
- ✅ Email al paciente con nombre correcto
- ✅ Email al profesional con nombre del paciente correcto
- ✅ Webhook procesa correctamente

**SQL:**
```sql
SELECT 
  a.id,
  a.status,
  p.status as payment_status,
  prof.first_name || ' ' || prof.last_name as patient_name
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id
LEFT JOIN profiles prof ON prof.id = a.patient_id
ORDER BY a.created_at DESC
LIMIT 5;
```

#### 4.3 Registro a Evento

**Pasos (como paciente):**
1. Ve a un evento
2. Regístrate y paga

**Verificación:**
- ✅ Email de confirmación con nombre correcto
- ✅ Admin puede ver registro con nombre desde profiles
- ✅ Export CSV tiene nombres correctos

#### 4.4 Reseñas

**Pasos (como paciente):**
1. Deja una reseña a un profesional
2. Verifica que se muestre

**Verificación:**
- ✅ Reseña muestra "Tú" si es tuya
- ✅ Reseña muestra nombre o "Usuario verificado" para otros
- ✅ No hay errores de `user_metadata`

---

### ✅ Fase 5: Testing de Seguridad (RLS)

#### 5.1 Verificar RLS Políticas

**En Supabase SQL Editor:**
```sql
-- Como usuario normal (no service_role)
-- Deberías ver solo TU perfil
SELECT * FROM profiles;

-- Como admin (usar tu cuenta admin)
-- Deberías ver todos los perfiles
SELECT * FROM profiles;
```

#### 5.2 Intentar Acceso No Autorizado

**Pasos:**
1. Login como paciente
2. Intenta acceder a:
   - `/admin/[otro-id]/dashboard` → ❌ Debe redirigir
   - `/professional/[otro-id]/appointments` → ❌ Debe redirigir

3. Login como profesional (no admin)
4. Intenta acceder a:
   - `/admin/[id]/finances` → ❌ Debe redirigir

---

### ✅ Fase 6: Testing de Performance

#### 6.1 Verificar Queries

**Abrir Chrome DevTools > Network > Filter by "supabase"**

1. Cargar dashboard de profesional
2. Verificar queries a Supabase

**Resultado esperado:**
- ✅ Query a `profiles` en lugar de `auth.users`
- ✅ Tiempo de respuesta < 500ms
- ✅ No hay múltiples queries redundantes

#### 6.2 Verificar Console Logs

**Abrir Chrome DevTools > Console**

**Resultado esperado:**
- ✅ No hay errores de `user_metadata`
- ✅ No hay warnings de `raw_user_meta_data`
- ⚠️ Logs de debug (`console.log`) son normales

---

## 🐛 Problemas Comunes y Soluciones

### Problema 1: "Usuario sin perfil"

**Síntoma:** Error al hacer login o algunas funciones no funcionan.

**Causa:** Perfil no creado automáticamente.

**Solución:**
```sql
-- Verificar usuarios sin perfil
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Crear perfil manualmente
INSERT INTO profiles (id, email, type, created_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'type', 'patient'),
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;
```

### Problema 2: "Nombres vacíos"

**Síntoma:** Se muestra email en lugar de nombre.

**Causa:** Usuarios de OAuth sin nombres.

**Solución:** Ejecutar `database/scripts/poblar_nombres_faltantes.sql` (opcional).

**Alternativa:** La app ya maneja esto con fallbacks, no es crítico.

### Problema 3: "RLS Error: permission denied"

**Síntoma:** Errores al intentar acceder a datos.

**Causa:** Políticas RLS mal configuradas.

**Solución:**
```sql
-- Verificar políticas
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Re-ejecutar migración RLS si es necesario
-- database/migrations/62_update_all_rls_to_use_profiles.sql
```

---

## ✅ Checklist Final

Marca cada item después de verificarlo:

### Base de Datos
- [ ] Ejecuté `verificar_profiles_completo.sql`
- [ ] Usuarios en `auth.users` = Perfiles en `profiles`
- [ ] 0 usuarios sin perfil
- [ ] (Opcional) Ejecuté `poblar_nombres_faltantes.sql`

### Autenticación
- [ ] Signup funciona
- [ ] Login funciona
- [ ] OAuth Google funciona (si aplica)
- [ ] Nombres se muestran correctamente

### Roles
- [ ] Paciente puede acceder a su dashboard
- [ ] Profesional puede ver citas con nombres
- [ ] Admin puede acceder a finanzas
- [ ] Restricciones de acceso funcionan

### Funcionalidades
- [ ] Reservar cita funciona
- [ ] Pagos funcionan con webhooks
- [ ] Emails tienen nombres correctos
- [ ] Reseñas se muestran correctamente

### Seguridad
- [ ] RLS funciona correctamente
- [ ] Accesos no autorizados son bloqueados
- [ ] No hay errores en console

### Performance
- [ ] Queries usan `profiles` en lugar de `auth.users`
- [ ] Tiempos de respuesta < 500ms
- [ ] No hay queries redundantes

---

## 🚀 Si Todo Funciona...

¡Felicidades! 🎉 La migración a `public.profiles` está completa.

**Próximo paso:** Deploy a producción (Fase 9)

**Comandos:**
```bash
# Merge a main
git checkout main
git merge feature/add-profiles-table

# Push
git push origin main

# Vercel hará deploy automático
```

---

## 📞 ¿Necesitas Ayuda?

Si encuentras problemas:
1. Revisa los logs en Supabase Dashboard > Logs
2. Verifica console de Chrome DevTools
3. Ejecuta los scripts de diagnóstico
4. Consulta `docs/MIGRATION_TO_PROFILES.md`

