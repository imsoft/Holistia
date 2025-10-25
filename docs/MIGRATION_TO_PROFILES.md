# 🔄 Migración a `public.profiles`

## 📋 Información de la Migración

**Fecha de inicio:** 25 de octubre de 2025  
**Rama:** `feature/add-profiles-table`  
**Responsable:** Equipo Holistia  
**Duración estimada:** 4-6 horas  
**Estrategia:** Incremental (baja interrupción)

---

## 🎯 Objetivo

Migrar datos de usuario de `auth.users.user_metadata` (JSON) a tabla dedicada `public.profiles` para:

1. ✅ Mejor performance con índices
2. ✅ RLS más granular
3. ✅ Queries SQL más simples
4. ✅ Escalabilidad sin límites
5. ✅ Arquitectura más profesional

---

## 📊 Estado Actual (ANTES de la Migración)

### Arquitectura Actual

```
auth.users (Supabase Auth)
  ├── id: UUID
  ├── email: TEXT
  ├── created_at: TIMESTAMP
  └── user_metadata: JSONB
      ├── first_name
      ├── last_name
      ├── phone
      ├── avatar_url
      ├── type (admin/patient/professional)
      └── otros campos...

professional_applications
  ├── user_id → auth.users.id
  └── datos específicos de profesionales

appointments
  ├── patient_id → auth.users.id (usuario)
  └── professional_id → professional_applications.id
```

---

### Estadísticas Pre-Migración

**Usuarios totales en BD:** _[Ejecutar query para obtener]_

```sql
SELECT COUNT(*) as total_users FROM auth.users;
```

**Distribución por tipo:**

```sql
SELECT 
  COALESCE(raw_user_meta_data->>'type', 'sin_tipo') as tipo,
  COUNT(*) as cantidad
FROM auth.users
GROUP BY tipo;
```

**Usuarios con datos en user_metadata:**

```sql
SELECT 
  COUNT(*) FILTER (WHERE raw_user_meta_data->>'first_name' IS NOT NULL) as con_first_name,
  COUNT(*) FILTER (WHERE raw_user_meta_data->>'last_name' IS NOT NULL) as con_last_name,
  COUNT(*) FILTER (WHERE raw_user_meta_data->>'phone' IS NOT NULL) as con_phone,
  COUNT(*) FILTER (WHERE raw_user_meta_data->>'avatar_url' IS NOT NULL) as con_avatar,
  COUNT(*) FILTER (WHERE raw_user_meta_data->>'type' IS NOT NULL) as con_type
FROM auth.users;
```

**Tablas que referencian auth.users:**

```sql
-- appointments
SELECT COUNT(DISTINCT patient_id) as pacientes_unicos 
FROM appointments;

-- professional_applications
SELECT COUNT(*) as profesionales 
FROM professional_applications;

-- event_registrations
SELECT COUNT(DISTINCT user_id) as usuarios_eventos 
FROM event_registrations;

-- user_favorites
SELECT COUNT(DISTINCT user_id) as usuarios_con_favoritos 
FROM user_favorites;
```

---

### Archivos que Usan `user_metadata`

**Frontend (TypeScript/React):**

1. `src/app/(dashboard)/(patient)/patient/[id]/explore/profile/page.tsx`
   - Lee: `user.user_metadata.first_name`, `last_name`, `phone`, `avatar_url`
   - Actualiza: `supabase.auth.updateUser({ data: { phone } })`

2. `src/app/(dashboard)/(patient)/layout.tsx`
   - Lee: `user.user_metadata.first_name`, `last_name`, `type`
   - Verifica si es profesional

3. `src/app/(dashboard)/(patient)/patient/[id]/explore/become-professional/page.tsx`
   - Lee: `user.user_metadata.first_name`, `last_name`, `phone`, `avatar_url`
   - Pre-llena formulario

4. `src/components/professional-sidebar.tsx`
   - Lee datos de `professional_applications`
   - No usa directamente `user_metadata`

5. `src/components/admin-sidebar.tsx`
   - Lee datos de `professional_applications` o `user_metadata`

6. `src/components/admin-redirect.tsx`
   - Lee: `user.user_metadata.type` para verificar admin

**Backend (SQL/Policies):**

Archivos con referencias a `auth.users`:
- `database/migrations/32_update_payments_for_events.sql` (3 políticas)
- `database/migrations/42_update_events_rls_policies.sql` (4 políticas)
- `database/migrations/55_create_email_logs_table.sql` (1 política)
- `database/migrations/25_add_rls_policies_to_availability_blocks.sql` (2 políticas)
- `database/migrations/24_setup_complete_professional_applications.sql` (2 políticas)
- `database/migrations/06_add_admin_policies_for_profiles.sql` (2 políticas)
- Y ~24 archivos más...

**Total:** ~30 archivos de migración con políticas RLS

---

### Políticas RLS que Verifican `user_metadata.type = 'admin'`

```sql
-- Patrón actual (se repetirá en ~15 políticas):
EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = auth.uid() 
  AND auth.users.raw_user_meta_data->>'type' = 'admin'
)
```

**Tablas afectadas:**
- payments (2 políticas)
- appointments (2 políticas)
- events_workshops (4 políticas)
- event_registrations (2 políticas)
- professional_applications (2 políticas)
- blog_posts (4 políticas)
- availability_blocks (2 políticas)
- Y ~10 tablas más...

---

## 🎯 Estado Objetivo (DESPUÉS de la Migración)

### Nueva Arquitectura

```
auth.users (Solo autenticación)
  ├── id: UUID
  ├── email: TEXT
  └── created_at: TIMESTAMP

public.profiles (Datos de perfil) ← NUEVO
  ├── id: UUID → auth.users.id
  ├── email: TEXT
  ├── first_name: TEXT
  ├── last_name: TEXT
  ├── phone: TEXT
  ├── avatar_url: TEXT
  ├── type: TEXT (admin/patient/professional)
  ├── created_at: TIMESTAMP
  └── updated_at: TIMESTAMP

professional_applications
  ├── user_id → profiles.id (o auth.users.id)
  └── datos específicos

appointments
  ├── patient_id → profiles.id (o auth.users.id)
  └── professional_id → professional_applications.id
```

---

### Cambios en Código

**Frontend:**
```typescript
// ANTES
const name = user.user_metadata?.first_name;
await supabase.auth.updateUser({ data: { phone } });

// DESPUÉS
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
const name = profile.first_name;

await supabase
  .from('profiles')
  .update({ phone })
  .eq('id', user.id);
```

**Backend (RLS):**
```sql
-- ANTES
EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = auth.uid() 
  AND auth.users.raw_user_meta_data->>'type' = 'admin'
)

-- DESPUÉS
EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.type = 'admin'
)
```

---

## 📅 Plan de Ejecución

### Fase 1: Infraestructura (30 min)
- [ ] Crear tabla `profiles`
- [ ] Crear trigger `handle_new_user`
- [ ] Migrar datos existentes
- [ ] Verificar sincronización

### Fase 2: RLS (1-2 hrs)
- [ ] Actualizar ~15 políticas que verifican admin
- [ ] Actualizar políticas de ~10 tablas
- [ ] Ejecutar audit de seguridad

### Fase 3: Frontend (2-3 hrs)
- [ ] Crear hook `use-profile.ts`
- [ ] Actualizar ~10-15 componentes
- [ ] Actualizar layouts

### Fase 4: Testing (1 hr)
- [ ] Test de registro
- [ ] Test de login
- [ ] Test de edición
- [ ] Test de RLS
- [ ] Test de páginas principales

### Fase 5: Deploy
- [ ] Merge a main
- [ ] Deploy a staging
- [ ] Test en staging
- [ ] Deploy a producción
- [ ] Monitorear

---

## ⚠️ Riesgos Identificados

### Riesgo 1: Desincronización de Datos
**Probabilidad:** Media  
**Impacto:** Alto  
**Mitigación:**
- Script de verificación continua
- Trigger bidireccional (opcional)
- Monitoreo post-migración

### Riesgo 2: RLS Mal Configurado
**Probabilidad:** Baja  
**Impacto:** Crítico  
**Mitigación:**
- Testing exhaustivo de cada política
- Script `security_audit_simple.sql`
- Review de cada cambio

### Riesgo 3: Frontend Rompe en Producción
**Probabilidad:** Media  
**Impacto:** Alto  
**Mitigación:**
- Testing en staging
- Deploy gradual
- Rollback plan

---

## 🔙 Plan de Rollback

Si algo sale mal:

1. **Revertir Frontend:**
   ```bash
   git revert [commit-hash]
   git push origin main
   ```

2. **Revertir Migraciones de RLS:**
   ```sql
   -- Ejecutar versiones anteriores de políticas
   -- Scripts de rollback en: database/rollback/
   ```

3. **Mantener `profiles`:**
   - NO eliminar tabla `profiles`
   - Útil para retry más adelante
   - Solo revertir código que la usa

---

## 📊 Métricas de Éxito

### Pre-migración (Baseline)

```sql
-- Tiempo de query actual (user_metadata)
EXPLAIN ANALYZE
SELECT 
  pa.*,
  u.raw_user_meta_data->>'first_name' as name
FROM professional_applications pa
LEFT JOIN auth.users u ON u.id = pa.user_id
WHERE u.raw_user_meta_data->>'type' = 'admin';
```

**Tiempo esperado:** ~50-100ms

### Post-migración (Objetivo)

```sql
-- Tiempo de query con profiles
EXPLAIN ANALYZE
SELECT 
  pa.*,
  p.first_name as name
FROM professional_applications pa
LEFT JOIN profiles p ON p.id = pa.user_id
WHERE p.type = 'admin';
```

**Objetivo:** <25ms (50% más rápido)

---

## 📝 Notas Importantes

1. **Trigger crea profiles automáticamente**
   - Nuevos usuarios → profile automático
   - Sin intervención manual

2. **Coexistencia temporal**
   - `user_metadata` seguirá existiendo
   - NO eliminar datos de `user_metadata`
   - Útil como backup/fallback

3. **Sin downtime**
   - Migración sin interrupciones
   - Usuarios no notarán cambios
   - Deploy gradual

4. **Documentación actualizada**
   - README.md actualizado
   - Onboarding de devs actualizado
   - API docs actualizados

---

## 📞 Contactos

**En caso de problemas:**
- Equipo Dev: [contacto]
- DBA: [contacto]
- Rollback immediato si: Login no funciona, RLS expone datos

---

## ✅ Checklist Final

### Pre-migración
- [x] Backup completo de BD
- [x] Crear rama `feature/add-profiles-table`
- [x] Documentar estado actual

### Fase 1: Infraestructura
- [ ] Crear tabla `profiles`
- [ ] Crear trigger `handle_new_user`
- [ ] Migrar datos existentes
- [ ] Verificar sincronización

### Fase 2: RLS
- [ ] Actualizar políticas (~15 archivos)
- [ ] Ejecutar security audit

### Fase 3: Frontend
- [ ] Hook `use-profile.ts`
- [ ] Actualizar componentes (~10 archivos)

### Fase 4: Testing
- [ ] Todos los tests pasan

### Fase 5: Deploy
- [ ] Staging OK
- [ ] Producción OK
- [ ] Monitoreo 24hrs

---

**Estado:** 🟡 EN PROGRESO  
**Última actualización:** 25 de octubre de 2025  
**Próximo paso:** Ejecutar backup de BD y crear infraestructura

