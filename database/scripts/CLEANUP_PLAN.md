# Plan de Limpieza de Scripts

## Análisis de Scripts

### 1. Scripts Temporales/Debugging (ELIMINAR)
Estos scripts deshabilitan RLS o hacen cambios temporales que no deberían estar en producción:
- ❌ `disable_rls_availability_blocks.sql` - Deshabilita RLS temporalmente
- ❌ `disable_rls_temporarily.sql` - Deshabilita RLS temporalmente
- ❌ `keep_rls_disabled.sql` - Mantiene RLS deshabilitado
- ❌ `restore_safe_rls.sql` - Restauración temporal
- ❌ `restore_basic_access.sql` - Restauración temporal
- ❌ `nuclear_fix_rls.sql` - Fix nuclear temporal
- ❌ `emergency_fix_rls_recursion.sql` - Fix de emergencia temporal
- ❌ `complete_rls_reset.sql` - Reset temporal de RLS

### 2. Scripts de Diagnóstico Obsoletos (ELIMINAR - mantener solo los útiles)
- ❌ `diagnostico_y_correccion_completo.sql` - Legacy (usa \echo, no compatible con Supabase)
- ❌ `diagnostico_nombres_pacientes.sql` - Obsoleto
- ❌ `diagnostico_completo_nombres.sql` - Obsoleto
- ❌ `diagnostico_final_nombres_pacientes.sql` - Obsoleto
- ❌ `verificar_codigo_frontend.sql` - Verificación obsoleta
- ❌ `verificar_calculos_correctos.sql` - Obsoleto
- ❌ `verificar_calculos_financieros.sql` - Obsoleto
- ❌ `verificacion_final_calculos.sql` - Obsoleto
- ❌ `verify_profiles_migration.sql` - Verificación de migración obsoleta
- ❌ `verify_rls_migration.sql` - Verificación de migración obsoleta
- ❌ `verify_professionals_exist.sql` - Verificación obsoleta
- ❌ `verify_restaurant_center_storage.sql` - Verificación obsoleta
- ❌ `verificar_profiles_completo.sql` - Obsoleto
- ❌ `verificar_finanzas_corregidas.sql` - Obsoleto
- ❌ `verificar_permisos_admin_finanzas.sql` - Obsoleto
- ✅ `diagnostico_supabase.sql` - MANTENER (útil y actualizado)
- ✅ `correccion_automatica.sql` - MANTENER (útil y actualizado)

### 3. Scripts Duplicados (ELIMINAR - mantener solo versión final)
- ❌ `mark_professionals_as_paid.sql` → Mantener `complete_mark_professionals_as_paid.sql`
- ❌ `mark_professionals_as_paid_by_user_id.sql` → Mantener `complete_mark_professionals_as_paid.sql`
- ❌ `fix_professional_patient_info_rls.sql` - Ya está en migraciones
- ❌ `fix_rls_professionals_patients.sql` - Ya está en migraciones
- ❌ `fix_patient_names_safe.sql` - Ya no necesario
- ❌ `poblar_nombres_faltantes.sql` - Ya no necesario

### 4. Scripts Específicos de Profesionales (MANTENER pero organizar)
Estos son útiles para casos específicos:
- ✅ `fix_andrea_cerezo_appointment.sql` - Caso específico
- ✅ `fix_andrea_cerezo_payments.sql` - Caso específico
- ✅ `fix_andrea_complete.sql` - Caso específico
- ✅ `marcar_pago_externo_lili_ruiz.sql` - Caso específico
- ✅ `marcar_pago_externo_maria_gomez.sql` - Caso específico
- ✅ `mark_brenda_rodriguez_as_paid.sql` - Caso específico
- ✅ `mark_aura_stephany_brenda_as_paid.sql` - Caso específico

### 5. Scripts de Utilidad (MANTENER)
- ✅ `create_get_professional_availability_blocks_function.sql` - Función útil
- ✅ `security_audit.sql` - Auditoría de seguridad
- ✅ `security_audit_simple.sql` - Auditoría simple
- ✅ `pre_migration_stats.sql` - Estadísticas
- ✅ `find_remaining_policies.sql` - Utilidad
- ✅ `cleanup_orphan_restaurant_center_images.sql` - Limpieza

### 6. Scripts de Fechas/Pagos (MANTENER si son útiles)
- ✅ `fix_payment_dates_2024.sql` - Corrección de fechas
- ✅ `corregir_fechas_pagos_2025.sql` - Corrección de fechas
- ✅ `mark_external_payments.sql` - Marcar pagos externos
- ✅ `mark_external_payments_2025_10_30_set_expiration.sql` - Marcar pagos con expiración
- ✅ `mark_professionals_as_paid_external_2025_10_30.sql` - Marcar profesionales externos

### 7. Scripts de Instrucciones (MANTENER)
- ✅ `README_SCRIPTS.md` - Documentación principal
- ✅ `README_mark_professionals_paid.md` - Instrucciones
- ✅ `INSTRUCCIONES_*.md` - Mantener todos

### 8. Scripts Específicos (MANTENER)
- ✅ `EJECUTAR_AQUI.sql` - Script rápido para casos específicos
- ✅ `marcar_cita_como_pendiente.sql` - Utilidad
- ✅ `recreate_appointment_justo_torres.sql` - Caso específico

