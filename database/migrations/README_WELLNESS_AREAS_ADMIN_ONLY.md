# Restricción de Áreas de Bienestar a Solo Administradores

## Descripción del Cambio

Se ha implementado una restricción para que **solo los administradores** puedan modificar las áreas de bienestar (wellness_areas) de los profesionales. Los profesionales ya no pueden seleccionar o cambiar sus propias categorías.

## Áreas de Bienestar Disponibles

Las 5 categorías de áreas de bienestar son:
1. **Salud mental**
2. **Espiritualidad**
3. **Actividad física**
4. **Social**
5. **Alimentación**

## Cambios Realizados

### 1. Frontend - Formulario de Registro de Profesionales
**Archivo**: `src/app/(dashboard)/(patient)/patient/[id]/explore/become-professional/page.tsx`

- ✅ Eliminada la sección de selección de áreas de bienestar del formulario de registro (Paso 2)
- ✅ Reemplazada con un mensaje informativo que explica que las áreas serán asignadas por administración
- ✅ Eliminada la validación que requería al menos un área de bienestar
- ✅ Mantenida la visualización de áreas (solo lectura) en la página de estado de la aplicación

### 2. Frontend - Dashboard de Profesionales
**Archivo**: `src/components/ui/professional-profile-editor.tsx`

- ✅ Eliminada la funcionalidad de edición de wellness_areas
- ✅ Convertida la sección en solo lectura con mensaje informativo
- ✅ Eliminada la función `handleWellnessAreaToggle`

### 3. Frontend - Panel de Administración
**Archivo**: `src/app/(dashboard)/(admin)/admin/[id]/professionals/page.tsx`

- ✅ Agregada interfaz para visualizar wellness_areas de cada profesional
- ✅ Agregado botón "Editar" en el diálogo de perfil del profesional
- ✅ Creado nuevo diálogo modal para editar áreas de bienestar
- ✅ Implementadas funciones:
  - `handleOpenEditWellnessAreas`: Abre el diálogo de edición
  - `handleToggleWellnessArea`: Alterna la selección de un área
  - `handleSaveWellnessAreas`: Guarda los cambios en la base de datos
- ✅ Agregada visualización de áreas seleccionadas con badges
- ✅ Interfaz intuitiva con checkmarks para áreas seleccionadas

### 4. Base de Datos - Políticas RLS
**Archivo**: `database/migrations/79_restrict_wellness_areas_to_admin.sql`

- ✅ Actualizada la política RLS "Users can update own professional application"
- ✅ Agregada restricción: Los usuarios NO pueden modificar `wellness_areas`
- ✅ Solo los administradores pueden actualizar este campo
- ✅ Los usuarios pueden actualizar todos los demás campos de su aplicación

## Cómo Aplicar la Migración

### Opción 1: Supabase Dashboard (Recomendado)
1. Ir a tu proyecto en Supabase Dashboard
2. Navegar a "SQL Editor"
3. Copiar y pegar el contenido de `79_restrict_wellness_areas_to_admin.sql`
4. Ejecutar la consulta

### Opción 2: CLI de Supabase
```bash
# Desde la raíz del proyecto
supabase db push
```

## Flujo de Trabajo Actualizado

### Para Profesionales:
1. El profesional llena el formulario de solicitud
2. **NO** selecciona áreas de bienestar (ya no es posible)
3. Envía la solicitud para revisión
4. Una vez aprobado, puede ver sus áreas de bienestar asignadas (solo lectura)

### Para Administradores:
1. Revisan la solicitud del profesional
2. Aprueban o rechazan la solicitud
3. **Asignan las áreas de bienestar** apropiadas desde el panel de administración:
   - Ir a "Profesionales"
   - Hacer clic en "Ver Perfil" del profesional
   - En la sección "Áreas de bienestar", hacer clic en "Editar"
   - Seleccionar las áreas apropiadas
   - Guardar cambios

## Ventajas de Este Cambio

1. ✅ **Control de calidad**: Los administradores aseguran la correcta categorización
2. ✅ **Consistencia**: Evita que profesionales se auto-asignen categorías incorrectas
3. ✅ **Mejor UX para usuarios**: Los pacientes encuentran profesionales mejor categorizados
4. ✅ **Flexibilidad**: Los administradores pueden ajustar categorías según criterios del negocio
5. ✅ **Seguridad**: Protección a nivel de base de datos con RLS

## Mensajes para Usuarios

### Formulario de Registro
> "Las áreas de bienestar (Salud mental, Espiritualidad, Actividad física, Social, Alimentación) serán asignadas por el equipo de administración después de revisar tu solicitud. Esto asegura la correcta categorización de los profesionales en la plataforma."

### Dashboard del Profesional
> "Las áreas de bienestar son gestionadas por el equipo de administración"

## Verificación Post-Migración

Para verificar que la migración se aplicó correctamente:

```sql
-- Verificar que la política existe
SELECT * FROM pg_policies
WHERE tablename = 'professional_applications'
AND policyname = 'Users can update own professional application';

-- Intentar actualizar wellness_areas como usuario regular (debe fallar)
-- Intentar actualizar wellness_areas como admin (debe funcionar)
```

## Rollback (Si es necesario)

Si necesitas revertir este cambio:

```sql
-- Restaurar la política original
DROP POLICY IF EXISTS "Users can update own professional application" ON public.professional_applications;

CREATE POLICY "Users can update own professional application" ON public.professional_applications
    FOR UPDATE USING (auth.uid() = user_id);
```

**Nota**: También deberás revertir los cambios en el frontend.

## Soporte

Si encuentras algún problema con esta implementación, verifica:
1. Que la migración se haya ejecutado correctamente
2. Que el usuario admin tenga el campo `type` = 'admin' en `raw_user_meta_data`
3. Que no haya errores en la consola del navegador
4. Que las políticas RLS estén habilitadas en la tabla

---

**Fecha de implementación**: 2025-10-25
**Migración**: 79_restrict_wellness_areas_to_admin.sql
**Versión**: 1.0.0
