# 💰 Página de Finanzas para Administradores

## 📋 Resumen

Nueva página completa de análisis financiero para que los administradores puedan monitorear los ingresos, costos, comisiones e impuestos de la plataforma de manera clara y fácil.

## 🎯 Características Principales

### 1. **Métricas Principales**

Cuatro tarjetas con las métricas más importantes:

| Métrica | Descripción | Cambio |
|---------|-------------|---------|
| **Ingresos Totales** | Suma de todos los pagos recibidos | % vs período anterior |
| **Comisiones Plataforma** | 15% de cada transacción | % vs período anterior |
| **Ingresos Netos** | Comisiones - Costos Stripe - Impuestos | Después de costos |
| **Transacciones** | Número total de pagos procesados | % vs período anterior |

### 2. **Desglose de Ingresos**

Muestra de dónde viene el dinero:

```
📅 Citas
   Servicios profesionales
   $X,XXX.XX

🗓️  Eventos
   Talleres y actividades
   $X,XXX.XX

👥 Inscripciones
   Profesionales nuevos
   $X,XXX.XX
```

### 3. **Análisis de Costos**

Desglose detallado de todos los costos:

```
💳 Comisiones Stripe
   3.6% + $3 por transacción
   -$X,XXX.XX

📄 Impuestos (IVA 16%)
   Sobre comisiones
   -$X,XXX.XX

💰 Comisiones Plataforma
   15% en transacciones
   +$X,XXX.XX

═══════════════════════
💵 Ingreso Neto Holistia
   $X,XXX.XX
```

### 4. **Selector de Período**

Puedes ver las finanzas por:
- 📅 **Este Mes** - Desde el día 1 del mes actual
- 📅 **Este Trimestre** - Últimos 3 meses
- 📅 **Este Año** - Desde enero del año actual

### 5. **Transacciones Recientes**

Lista de las últimas 10 transacciones con:
- Tipo de pago (Cita, Evento, Inscripción)
- Monto total
- Comisión de la plataforma
- Estado (Exitoso, Procesando, Fallido)
- Fecha y hora

## 📊 Cómo se Calculan los Números

### Ingresos Totales
```
Suma de todos los pagos con status "succeeded" o "processing"
en el período seleccionado
```

### Comisiones de Stripe
```
Por cada transacción:
- 3.6% del monto total
- + $3 MXN fijo

Ejemplo: Pago de $1,000
Comisión Stripe = ($1,000 × 0.036) + $3 = $39
```

### Comisiones de la Plataforma
```
15% del monto total de cada transacción

Ejemplo: Pago de $1,000
Comisión Plataforma = $1,000 × 0.15 = $150
```

### Impuestos (IVA)
```
16% sobre las comisiones totales (Plataforma + Stripe)

Ejemplo:
Comisión Plataforma = $150
Comisión Stripe = $39
Total Comisiones = $189
IVA = $189 × 0.16 = $30.24
```

### Ingreso Neto de Holistia
```
Comisión Plataforma - Comisión Stripe - Impuestos

Ejemplo:
Comisión Plataforma = $150
- Comisión Stripe = $39
- IVA = $30.24
= Ingreso Neto = $80.76
```

## 🎨 Diseño Visual

### Colores de las Métricas

- 🟢 **Verde** - Ingresos Totales (dinero que entra)
- 🔵 **Azul** - Comisiones Plataforma (lo que ganamos)
- 🟣 **Morado** - Ingresos Netos (ganancia real)
- 🟠 **Naranja** - Transacciones (volumen)

### Estados de Transacciones

- ✅ **Verde** - Pago exitoso (succeeded)
- ⏰ **Amarillo** - En proceso (processing)
- ❌ **Rojo** - Fallido (failed)

### Tipos de Pago

- 🔵 **Azul** - Citas con profesionales
- 🟣 **Morado** - Eventos y talleres
- 🟢 **Verde** - Inscripciones de profesionales

## 📱 Responsive Design

La página se adapta perfectamente a:
- 📱 **Móvil** - Tarjetas en columna, información compacta
- 💻 **Tablet** - 2 columnas para métricas
- 🖥️ **Desktop** - 4 columnas, vista completa

## 🔐 Seguridad

- ✅ Solo accesible para administradores
- ✅ Los datos se obtienen directamente de la base de datos
- ✅ No se almacenan datos sensibles de tarjetas
- ✅ Solo se muestran totales y estadísticas

## 🚀 Cómo Acceder

1. Inicia sesión como **Administrador**
2. En el menú lateral, haz clic en **💰 Finanzas**
3. Selecciona el período que quieres ver
4. ¡Listo! Verás todos los datos financieros

## 📈 Casos de Uso

### 1. Revisar Ingresos del Mes
```
1. Selecciona "Este Mes"
2. Revisa "Ingresos Totales" en la primera tarjeta
3. Compara con el mes anterior (% de cambio)
```

### 2. Calcular Ganancias Reales
```
1. Ve a la tarjeta "Ingresos Netos"
2. Este es el dinero real que queda para Holistia
3. Ya tiene descontados todos los costos
```

### 3. Verificar Comisiones de Stripe
```
1. Ve a la sección "Análisis de Costos"
2. Revisa "Comisiones Stripe"
3. Compara con tu factura de Stripe
```

### 4. Revisar Transacciones Recientes
```
1. Baja hasta "Transacciones Recientes"
2. Ve las últimas 10 transacciones
3. Verifica montos y comisiones
```

## 💡 Ejemplos Reales

### Ejemplo 1: Cita de $1,000 MXN

```
Monto Total:              $1,000.00
─────────────────────────────────────
Comisión Plataforma (15%): $150.00 ✅ Para Holistia
Comisión Stripe (3.6%+$3): -$39.00 ❌ Costo
IVA sobre comisiones (16%): -$30.24 ❌ Impuestos
─────────────────────────────────────
Ingreso Neto Holistia:     $80.76 💰
```

### Ejemplo 2: Evento de $500 MXN

```
Monto Total:              $500.00
─────────────────────────────────────
Comisión Plataforma (15%):  $75.00 ✅ Para Holistia
Comisión Stripe (3.6%+$3): -$21.00 ❌ Costo
IVA sobre comisiones (16%): -$15.36 ❌ Impuestos
─────────────────────────────────────
Ingreso Neto Holistia:     $38.64 💰
```

### Ejemplo 3: Inscripción de $1,000 MXN

```
Monto Total:              $1,000.00
─────────────────────────────────────
Comisión Plataforma (15%): $150.00 ✅ Para Holistia (100% en inscripciones)
Comisión Stripe (3.6%+$3): -$39.00 ❌ Costo
IVA sobre comisiones (16%): -$30.24 ❌ Impuestos
─────────────────────────────────────
Ingreso Neto Holistia:     $80.76 💰
```

## 🔮 Mejoras Futuras Sugeridas

- [ ] Gráficos de línea para ver evolución mensual
- [ ] Exportar reportes a PDF/Excel
- [ ] Proyecciones de ingresos futuros
- [ ] Comparación año con año
- [ ] Alertas cuando los ingresos bajan
- [ ] Desglose por profesional individual
- [ ] Métricas de retención de clientes
- [ ] Análisis de eventos más rentables

## 📞 Preguntas Frecuentes

### ¿Por qué los ingresos netos son menores que las comisiones?

Porque tenemos que pagar:
- Las comisiones de Stripe (3.6% + $3)
- Los impuestos (IVA 16% sobre nuestras comisiones)

### ¿El IVA se calcula sobre todo?

No, el IVA del 16% solo se calcula sobre las **comisiones** (lo que gana la plataforma), no sobre el monto total de las transacciones.

### ¿Las comisiones de Stripe son exactas?

Las comisiones de Stripe se calculan como 3.6% + $3 MXN por transacción, que es la tarifa estándar de Stripe México. Para el monto exacto, revisa tu dashboard de Stripe.

### ¿Qué pasa con los pagos "processing"?

Los pagos en estado "processing" se incluyen en los cálculos porque están en proceso de completarse. Una vez que se confirmen, cambiarán a "succeeded".

### ¿Cuándo se actualizan los datos?

Los datos se actualizan en tiempo real cada vez que cargas la página. Selecciona el período que quieres ver y los números se recalculan automáticamente.

## 🎯 Métricas Clave para el Negocio

### 1. **Tasa de Comisión Efectiva**
```
(Ingreso Neto / Ingresos Totales) × 100

Ejemplo:
$80.76 / $1,000 × 100 = 8.08%

Esto significa que de cada $100 que pasan por la plataforma,
realmente ganamos $8.08 después de todos los costos.
```

### 2. **Costo de Procesamiento**
```
(Comisión Stripe + IVA) / Ingresos Totales × 100

Ejemplo:
($39 + $30.24) / $1,000 × 100 = 6.92%

El 6.92% de cada transacción se va en costos
```

### 3. **Margen de Beneficio**
```
Ingreso Neto / Comisión Plataforma × 100

Ejemplo:
$80.76 / $150 × 100 = 53.84%

De cada peso que cobramos en comisión,
53.84% es ganancia real
```

## 📊 Interpretando los Datos

### Si los ingresos suben ⬆️
✅ Más transacciones = más dinero para la plataforma
✅ La plataforma está creciendo
✅ Considera invertir en marketing

### Si las transacciones suben pero ingresos bajan ⬇️
⚠️ Puede ser que haya más eventos/citas de menor precio
⚠️ Revisa el ticket promedio
⚠️ Considera promocionar servicios premium

### Si el ingreso neto es negativo ⚠️
❌ Los costos son mayores que las comisiones
❌ Revisa la estructura de comisiones
❌ Puede necesitar ajustar el % de comisión

---

**Fecha de creación**: 24 de octubre de 2025  
**Versión**: 1.0  
**Página**: `/admin/[id]/finances`

