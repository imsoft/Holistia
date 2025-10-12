# 🔒 Privacidad del Campo Instagram - Profesionales

## Resumen

El campo de Instagram de los profesionales es **privado y confidencial**. Solo los **administradores** tienen acceso a esta información.

## 🎯 Propósito

El campo de Instagram se utiliza para que el equipo administrativo de Holistia pueda:
- Contactar directamente a los profesionales
- Verificar la autenticidad de las aplicaciones
- Mantener comunicación interna

## 🔐 Nivel de Privacidad

### ✅ Quién PUEDE ver el Instagram

- **Administradores** (usuarios con rol `admin`)
  - Panel de administración (`/admin/[id]/professionals`)
  - Modal de detalles del profesional

### ❌ Quién NO PUEDE ver el Instagram

- **Pacientes/Usuarios**
- **Público en general**
- **Perfil público del profesional**
- **Tarjetas de profesionales**
- **Búsquedas y listados**

## 📍 Ubicaciones donde SÍ aparece

1. **Panel de Administración de Profesionales**
   - Ruta: `/admin/[id]/professionals`
   - Modal: "Perfil del Profesional"
   - Sección: "Información de Contacto"

## 📍 Ubicaciones donde NO aparece

1. **Perfil Público del Profesional**
   - Ruta: `/patient/[id]/explore/professional/[slug]`
   - ❌ NO se muestra Instagram

2. **Tarjetas de Profesionales**
   - Componente: `ProfessionalCard`
   - ❌ NO se muestra Instagram

3. **Listados de Búsqueda**
   - Ruta: `/patient/[id]/explore`
   - ❌ NO se muestra Instagram

4. **Dashboard del Profesional**
   - Ruta: `/professional/[id]/dashboard`
   - ❌ NO se muestra Instagram en la vista pública

## 🔧 Implementación Técnica

### Base de Datos

```sql
-- Campo en professional_applications
instagram VARCHAR(255) -- Opcional, sin NOT NULL
```

### Tipos TypeScript

```typescript
export interface Professional {
  // ...
  instagram?: string;  // Campo privado, solo visible para administradores
  // ...
}
```

### Formulario de Registro

- **Paso**: 4 (Biografía e información adicional)
- **Campo**: Opcional
- **Validación**: Limpia automáticamente `@` y URLs
- **Almacenamiento**: Solo el nombre de usuario

### Panel de Administración

```tsx
// Solo visible en el modal de administración
<Instagram className="h-4 w-4 text-muted-foreground" />
<span className="font-medium">Instagram:</span>
{selectedProfessional.instagram ? (
  <a 
    href={`https://instagram.com/${selectedProfessional.instagram}`}
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary hover:underline"
  >
    @{selectedProfessional.instagram}
  </a>
) : (
  <span className="text-muted-foreground">No disponible</span>
)}
```

## ⚠️ Importante para Desarrollo

### Al crear nuevas vistas del profesional

**SIEMPRE verifica que NO se incluya el campo `instagram`** en:
- Perfiles públicos
- APIs públicas
- Tarjetas de presentación
- Listados de búsqueda
- Cualquier vista accesible por pacientes

### Al modificar queries

Cuando hagas queries a `professional_applications`, asegúrate de:

```typescript
// ❌ MAL - Expone Instagram públicamente
.select('*')

// ✅ BIEN - Selecciona solo campos públicos
.select('id, first_name, last_name, email, profession, ...')

// ✅ MEJOR - Selecciona campos según el rol del usuario
const fields = isAdmin 
  ? '*' 
  : 'id, first_name, last_name, email, profession, ...';
.select(fields)
```

## 📊 Flujo de Datos

```
Usuario llena formulario
        ↓
Instagram se guarda en BD
        ↓
    ┌───────┴───────┐
    ↓               ↓
Admin lo ve    Público NO lo ve
```

## 🔍 Auditoría

Para verificar que Instagram esté protegido:

1. **Verifica las queries**:
   ```bash
   grep -r "instagram" src/app
   ```

2. **Revisa los tipos**:
   - Solo debe aparecer en `Professional` con comentario de privacidad

3. **Prueba como usuario**:
   - Navega al perfil de un profesional como paciente
   - Verifica que NO aparezca Instagram

4. **Prueba como admin**:
   - Ve al panel de administración
   - Verifica que SÍ aparezca Instagram

## 📝 Notas Adicionales

- El campo es **opcional** durante el registro
- Los profesionales pueden dejarlo en blanco
- Si el profesional ingresa una URL completa, se limpia automáticamente
- El formato guardado es: `usuario` (sin `@` ni URLs)

## 🔒 Cumplimiento de Privacidad

Este diseño cumple con:
- ✅ Protección de datos personales
- ✅ Principio de mínima exposición
- ✅ Separación de información pública/privada
- ✅ Acceso basado en roles (RBAC)

