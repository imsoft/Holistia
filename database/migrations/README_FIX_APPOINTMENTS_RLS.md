# Solución: Profesionales y Pacientes no pueden ver sus citas

## Problema
Los profesionales y pacientes no pueden ver sus citas en la aplicación. El mensaje "No se encontraron citas" aparece incluso cuando hay citas en la base de datos.

## Causa
Las políticas RLS (Row Level Security) para que los profesionales puedan ver sus citas no estaban aplicadas en la base de datos, aunque existían en el archivo de migración original.

## Solución

### Paso 1: Ir al Dashboard de Supabase
1. Abre tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Ve a la sección **SQL Editor** en el menú lateral

### Paso 2: Ejecutar la migración
1. Abre el archivo `57_fix_professionals_appointments_rls.sql`
2. Copia todo el contenido del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **Run** (o presiona Ctrl/Cmd + Enter)

### Paso 3: Verificar que funcionó
Ejecuta esta consulta para verificar que las políticas se crearon correctamente:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'appointments'
ORDER BY policyname;
```

Deberías ver las siguientes políticas:
- ✅ `Admins can manage all appointments`
- ✅ `Admins can view all appointments`
- ✅ `Patients can create their own appointments`
- ✅ `Patients can update their own appointments`
- ✅ `Patients can view their own appointments`
- ✅ `Professionals can update their appointments` ← **Nueva**
- ✅ `Professionals can view their appointments` ← **Nueva**

### Paso 4: Probar en la aplicación
1. Inicia sesión como profesional
2. Ve a la página de Citas
3. Deberías ver todas tus citas programadas

4. Inicia sesión como paciente
5. Ve a la página de Mis Citas
6. Deberías ver todas tus citas

## ¿Qué hace esta migración?

Esta migración realiza dos cambios importantes:

### 1. Políticas RLS para la tabla `appointments`

Agrega dos políticas RLS a la tabla `appointments`:

- **Professionals can view their appointments**: Permite que los profesionales vean las citas donde ellos son el profesional asignado, siempre y cuando:
  - Su `professional_application` esté aprobada (`status = 'approved'`)
  - El `user_id` del profesional coincida con el usuario autenticado

- **Professionals can update their appointments**: Permite que los profesionales actualicen el estado de sus citas (por ejemplo, confirmarlas o cancelarlas)

### 2. Vista segura `professional_patient_info`

Crea una vista que permite a los profesionales ver información básica de sus pacientes:
- Solo pueden ver pacientes con los que tienen citas programadas
- La información incluye: nombre completo, email y teléfono
- La vista tiene seguridad a nivel de fila (RLS) habilitada
- Es completamente segura y respeta la privacidad de los pacientes

## Notas importantes

- ⚠️ Esta migración es **idempotente** (puede ejecutarse múltiples veces sin causar errores)
- ✅ No afecta las políticas existentes para pacientes y administradores
- ✅ Solo afecta a profesionales con aplicaciones aprobadas
- ✅ Los datos existentes no se modifican, solo se agregan permisos de acceso

## Si el problema persiste

Si después de aplicar la migración los profesionales aún no pueden ver sus citas, verifica:

1. **Que el profesional tenga una aplicación aprobada**:
```sql
SELECT id, user_id, first_name, last_name, status
FROM professional_applications
WHERE user_id = 'ID_DEL_USUARIO';
```

2. **Que existan citas para ese profesional**:
```sql
SELECT COUNT(*) as total_citas
FROM appointments
WHERE professional_id = 'ID_DE_PROFESSIONAL_APPLICATION';
```

3. **Que el RLS esté habilitado**:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'appointments';
```
(Debería retornar `rowsecurity = true`)

