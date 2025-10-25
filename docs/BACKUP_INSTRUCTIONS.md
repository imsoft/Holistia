# 💾 Instrucciones de Backup - Migración a Profiles

## ⚠️ IMPORTANTE

**Hacer backup ANTES de cualquier migración** es crítico para poder revertir cambios si algo sale mal.

---

## 📋 Opciones de Backup

### Opción 1: Backup desde Supabase Dashboard (Recomendado)

**Pasos:**

1. **Ve a Supabase Dashboard:**
   ```
   https://supabase.com/dashboard
   → Tu proyecto Holistia
   → Database
   → Backups
   ```

2. **Crear Backup Manual:**
   - Click en **"Create backup"**
   - Descripción: `Pre-migration to profiles - 2025-10-25`
   - Click **"Create"**
   - Espera a que complete (puede tardar 5-10 min)

3. **Verificar Backup:**
   - El backup debe aparecer en la lista
   - Estado: "Completed" ✅
   - Tamaño: ~XXX MB

**Ventajas:**
- ✅ Más fácil
- ✅ Backup completo (estructura + datos)
- ✅ Restauración con un click
- ✅ Recomendado por Supabase

**Limitaciones:**
- ⚠️ Solo disponible en planes Pro+
- ⚠️ Si estás en plan Free, usar Opción 2

---

### Opción 2: pg_dump (Manual - Plan Free)

Si estás en plan Free de Supabase y no tienes backups automáticos:

#### Paso 1: Obtener Credenciales

1. **Supabase Dashboard:**
   ```
   Settings → Database
   ```

2. **Copiar Connection String:**
   ```
   postgresql://postgres:[TU_PASSWORD]@[TU_HOST]:5432/postgres
   ```

#### Paso 2: Instalar PostgreSQL Client

**Mac (con Homebrew):**
```bash
brew install postgresql@15
```

**Linux:**
```bash
sudo apt-get install postgresql-client
```

**Windows:**
- Descargar de: https://www.postgresql.org/download/windows/

#### Paso 3: Hacer Backup

```bash
# Crear directorio para backups
mkdir -p ~/backups/holistia

# Hacer backup completo
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --schema=public \
  --schema=auth \
  > ~/backups/holistia/backup_pre_profiles_$(date +%Y%m%d_%H%M%S).sql

# Comprimir (opcional)
gzip ~/backups/holistia/backup_pre_profiles_*.sql
```

**Verificar:**
```bash
ls -lh ~/backups/holistia/
# Debe mostrar el archivo .sql o .sql.gz
```

---

### Opción 3: Backup Solo de Datos Críticos (Rápido)

Si solo quieres backup de las tablas críticas:

```sql
-- Ejecutar en Supabase SQL Editor

-- 1. Backup de auth.users (metadata)
COPY (
  SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
  FROM auth.users
) TO '/tmp/auth_users_backup.csv' WITH CSV HEADER;

-- 2. Backup de professional_applications
COPY (
  SELECT * FROM professional_applications
) TO '/tmp/professional_applications_backup.csv' WITH CSV HEADER;

-- 3. Backup de appointments
COPY (
  SELECT * FROM appointments
) TO '/tmp/appointments_backup.csv' WITH CSV HEADER;
```

**Nota:** Esto crea CSVs que puedes descargar. No incluye estructura, solo datos.

---

## 📊 Ejecutar Script de Estadísticas Pre-Migración

Antes de continuar, ejecuta el script de estadísticas:

1. **Abrir Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard
   → Tu proyecto
   → SQL Editor
   → New query
   ```

2. **Copiar contenido de:**
   ```
   database/scripts/pre_migration_stats.sql
   ```

3. **Ejecutar (Cmd/Ctrl + Enter)**

4. **Guardar resultados:**
   - Copiar resultados
   - Pegar en archivo: `docs/PRE_MIGRATION_RESULTS.txt`
   - Commit a git

---

## ✅ Verificación de Backup

### Checklist:

- [ ] Backup completo creado
- [ ] Backup verificado (tamaño > 0)
- [ ] Estadísticas pre-migración ejecutadas
- [ ] Resultados guardados en git
- [ ] Nota de fecha/hora del backup

### Información del Backup:

```
Fecha: 25 de octubre de 2025
Hora: [COMPLETAR]
Método: [Supabase Dashboard / pg_dump / CSV]
Tamaño: [COMPLETAR] MB
Ubicación: [COMPLETAR]
Hash (opcional): [sha256sum del archivo]
```

---

## 🔙 Cómo Restaurar (Si Algo Sale Mal)

### Desde Supabase Dashboard:

1. **Database → Backups**
2. Click en **"..."** del backup
3. **"Restore"**
4. Confirmar ⚠️

### Desde pg_dump:

```bash
# Restaurar desde backup
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  < ~/backups/holistia/backup_pre_profiles_YYYYMMDD_HHMMSS.sql

# Si está comprimido
gunzip -c ~/backups/holistia/backup_pre_profiles_*.sql.gz | \
  psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

---

## ⚠️ IMPORTANTE: Antes de Restaurar

Si necesitas restaurar:

1. **Avisar al equipo** - Downtime incoming
2. **Pausar webhooks** - Evitar datos nuevos
3. **Verificar backup** - Asegurarse que es el correcto
4. **Restaurar** - Seguir pasos arriba
5. **Verificar** - Ejecutar queries de verificación
6. **Reanudar** - Reactivar servicios

---

## 📝 Notas Adicionales

### Retención de Backups:

- **Supabase Dashboard:** 7-30 días (según plan)
- **Backups locales:** Mantener al menos 30 días
- **Backup pre-migración:** Mantener indefinidamente

### Seguridad:

- ⚠️ Backups contienen datos sensibles
- 🔒 Encriptar si guardas localmente
- 🚫 NO subir a repositorio público
- ✅ Guardar en almacenamiento seguro

### Testing de Restauración:

Es buena práctica probar que el backup funciona ANTES de necesitarlo:

1. Crear proyecto de prueba en Supabase
2. Restaurar backup ahí
3. Verificar que datos están completos
4. Eliminar proyecto de prueba

---

## ✅ Estado del Backup

- [x] Instrucciones de backup creadas
- [ ] Backup completo realizado
- [ ] Estadísticas pre-migración ejecutadas
- [ ] Resultados guardados
- [ ] Listo para continuar con migración

---

**Próximo paso:** Ejecutar backup y continuar con Fase 1 (Infraestructura)

