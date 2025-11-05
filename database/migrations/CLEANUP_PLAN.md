# Plan de Limpieza de Migraciones

## Análisis de Migraciones

### 1. Migraciones de Diagnóstico/Verificación (ELIMINAR)
Estos no son migraciones reales, son scripts de diagnóstico:
- ❌ `69_diagnose_missing_profiles.sql` - Script de diagnóstico
- ❌ `VERIFICAR_ADMIN_USER.sql` - Script de verificación

### 2. Migraciones Temporales/Debugging (ELIMINAR)
- ❌ `76_disable_rls_availability_blocks.sql` - Deshabilita RLS temporalmente (no debe estar en producción)

### 3. Migraciones Duplicadas (ELIMINAR - mantener solo versión final)
- ❌ `72_block_deactivated_users_rls.sql` → Mantener `73_block_deactivated_users_rls_fixed.sql`
- ❌ `74_force_logout_and_verify.sql` → Mantener `75_force_logout_fixed.sql`
- ❌ `74_fix_availability_blocks_rls_for_patients.sql` → Mantener `96_fix_availability_blocks_rls_policy.sql`
- ❌ `75_fix_professional_patient_info_view.sql` → Mantener `76_fix_professional_patient_info_rls.sql`
- ❌ `75_update_registration_fee_expiration.sql` → Ya está en `52_add_registration_fee_expiration.sql`

### 4. Migraciones con Números Duplicados (COMBINAR)
- `40_add_google_calendar_integration.sql` + `40_add_stripe_connect_accounts.sql` 
  → Combinar en `40_add_integrations.sql`

- `41_add_owner_to_events.sql` + `41_add_patient_read_services_policy.sql`
  → Combinar en `41_add_events_owner_and_policies.sql`

- `42_create_get_professional_services_function.sql` + `42_update_events_rls_policies.sql`
  → Combinar en `42_update_events_and_services_policies.sql`

### 5. Migraciones a Mantener (pero renumerar)
Todas las demás migraciones se mantendrán pero se renumerarán en orden secuencial.

## Orden de Ejecución del Plan

1. Eliminar migraciones de diagnóstico
2. Eliminar migraciones temporales
3. Eliminar versiones anteriores de migraciones duplicadas
4. Combinar migraciones con números duplicados
5. Renumerar todas las migraciones en orden secuencial

