# 🔒 Seguridad Frontend y Backend - Holistia

## Análisis de Seguridad en Código

---

## 1. 🎨 FRONTEND (Next.js + React)

### ✅ Protecciones Implementadas

#### A. Protección contra XSS (Cross-Site Scripting)

**React Automáticamente Escapa HTML:**
```tsx
// ✅ SEGURO - React escapa automáticamente
<h1>{user.name}</h1>  // Si name = "<script>alert('xss')</script>"
                       // React lo renderiza como texto, no ejecuta

// ❌ INSEGURO (pero NO lo usamos)
<div dangerouslySetInnerHTML={{__html: userInput}} />
```

**Verificar que no usamos `dangerouslySetInnerHTML`:**
```bash
grep -r "dangerouslySetInnerHTML" src/
# Resultado esperado: Sin resultados o solo en componentes seguros de blog
```

---

#### B. Autenticación en Cliente

**Middleware de Next.js protege rutas:**
```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser();
  
  // ✅ Protege rutas admin
  if (pathname.includes('/admin') && user?.raw_user_meta_data?.type !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // ✅ Protege rutas de profesionales
  if (pathname.includes('/professional') && !isProfessional(user)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

**Estado:** ✅ Implementado

---

#### C. Variables de Entorno

**Solo variables públicas en cliente:**
```typescript
// ✅ SEGURO - Prefijo NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ SEGURO - Keys privadas NUNCA en cliente
// Estas solo existen en servidor:
// - SUPABASE_SERVICE_ROLE_KEY
// - STRIPE_SECRET_KEY
// - RESEND_API_KEY
```

**Verificar:**
```bash
grep -r "process.env" src/app/ src/components/ | grep -v "NEXT_PUBLIC"
# Si hay resultados, verificar que solo se usen en server components
```

---

#### D. Headers de Seguridad

**Next.js Config:**
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // ✅ Previene clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // ✅ Previene MIME sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

**Estado:** ⚠️ VERIFICAR (si no está, agregar)

---

#### E. Validación de Inputs en Cliente

**Formularios con validación:**
```typescript
// ✅ Ejemplo de validación correcta
const validateForm = () => {
  const errors: Record<string, string> = {};
  
  if (!formData.name || formData.name.trim().length < 2) {
    errors.name = "El nombre es requerido";
  }
  
  if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Email inválido";
  }
  
  return errors;
};
```

**Estado:** ✅ Implementado en forms críticos

---

#### F. Sanitización de URLs

**Redirecciones seguras:**
```typescript
// ✅ SEGURO - Usa URL relativas o valida origen
router.push('/dashboard');

// ❌ INSEGURO - No hacer redirecciones abiertas
// router.push(userInput); // Puede redirigir a sitio malicioso
```

---

## 2. ⚙️ BACKEND (API Routes + Server Actions)

### ✅ Protecciones Implementadas

#### A. Autenticación en Servidor

**Todas las API routes verifican auth:**
```typescript
// src/app/api/appointments/route.ts
export async function GET(request: Request) {
  const supabase = createClient(); // Server client
  
  // ✅ Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // ✅ RLS se encarga del resto
  const { data } = await supabase.from('appointments').select('*');
  return NextResponse.json(data);
}
```

**Estado:** ✅ Implementado

---

#### B. Validación en Servidor

**NO confiar en validación de cliente:**
```typescript
// ✅ CORRECTO - Validar en servidor SIEMPRE
export async function POST(request: Request) {
  const body = await request.json();
  
  // Validar datos
  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  }
  
  if (body.name.length > 100) {
    return NextResponse.json({ error: 'Name too long' }, { status: 400 });
  }
  
  // Continuar...
}
```

**Estado:** ⚠️ VERIFICAR en todas las API routes

---

#### C. Rate Limiting

**Protección contra brute force:**
```typescript
// ⚠️ PENDIENTE - Implementar rate limiting

// Opción 1: Usar Vercel Edge Config + KV
// Opción 2: Usar middleware con Map en memoria
// Opción 3: Usar servicio externo (Upstash, Redis)

// Ejemplo básico:
const rateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const userLimit = rateLimits.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= limit) {
    return false; // Bloqueado
  }
  
  userLimit.count++;
  return true;
}
```

**Estado:** ⚠️ RECOMENDADO IMPLEMENTAR

---

#### D. Stripe Webhooks - Verificación de Firma

**Webhook handler verifica firma:**
```typescript
// src/app/api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  
  // ✅ CRÍTICO - Verificar firma
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    // Solo si la firma es válida, procesar
    // ...
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }
}
```

**Estado:** ✅ Implementado

---

#### E. Secrets Management

**Variables de entorno NUNCA en código:**
```bash
# ✅ CORRECTO - En .env.local (ignorado por git)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
STRIPE_SECRET_KEY=sk_live_...
RESEND_API_KEY=re_...

# ✅ En producción (Vercel)
# Configuradas en dashboard de Vercel
```

**Verificar:**
```bash
# Verificar que .env.local está en .gitignore
grep ".env.local" .gitignore

# Verificar que NO hay secrets en código
grep -r "sk_live_" src/
grep -r "sk_test_" src/
# Resultado esperado: 0 matches
```

**Estado:** ✅ Implementado

---

#### F. SQL Injection

**Supabase protege automáticamente:**
```typescript
// ✅ SEGURO - Supabase usa prepared statements
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId); // Automáticamente escapado

// ❌ INSEGURO (pero NO lo usamos)
// await supabase.rpc('execute_raw_sql', { 
//   query: `SELECT * FROM users WHERE id = ${userId}` 
// });
```

**Estado:** ✅ Protegido por Supabase

---

## 3. 🔐 Vulnerabilidades Comunes

### A. CSRF (Cross-Site Request Forgery)

**Protección:**
```typescript
// ✅ Next.js + Supabase Auth protegen automáticamente
// - SameSite cookies
// - CSRF tokens en auth
```

**Estado:** ✅ Protegido

---

### B. Clickjacking

**Protección:**
```typescript
// ✅ Header X-Frame-Options: DENY
// Previene que el sitio se embeba en iframe
```

**Estado:** ✅ Protegido (si headers implementados)

---

### C. Open Redirect

**Verificar redirecciones:**
```typescript
// ✅ SEGURO
router.push('/dashboard');

// ⚠️ VALIDAR
const redirectUrl = searchParams.get('redirect');
if (redirectUrl && redirectUrl.startsWith('/')) {
  router.push(redirectUrl); // Solo URLs relativas
}

// ❌ INSEGURO
router.push(searchParams.get('redirect')); // Puede ser malicioso
```

**Estado:** ⚠️ VERIFICAR en callbacks de auth

---

### D. Dependency Vulnerabilities

**Verificar paquetes:**
```bash
npm audit
# o
pnpm audit
```

**Estado:** ✅ Verificar regularmente

---

## 4. 📝 CHECKLIST DE VERIFICACIÓN

### Frontend

- [ ] No hay `dangerouslySetInnerHTML` sin sanitización
- [ ] Validación de inputs en formularios
- [ ] Headers de seguridad configurados
- [ ] Variables de entorno con prefijo `NEXT_PUBLIC_`
- [ ] Middleware protege rutas privadas
- [ ] Redirecciones solo a URLs relativas

### Backend

- [ ] Autenticación verificada en todas las API routes
- [ ] Validación en servidor (no solo cliente)
- [ ] Rate limiting implementado
- [ ] Stripe webhooks verifican firma
- [ ] Secrets en variables de entorno
- [ ] Sin SQL injection (Supabase protege)

### General

- [ ] `npm audit` sin vulnerabilidades HIGH/CRITICAL
- [ ] `.env.local` en `.gitignore`
- [ ] HTTPS en producción
- [ ] Logs no contienen información sensible

---

## 5. 🚀 CÓMO VERIFICAR

### Script de Verificación Rápida

```bash
#!/bin/bash

echo "=== VERIFICACIÓN DE SEGURIDAD FRONTEND/BACKEND ==="

echo "1. Verificando dangerouslySetInnerHTML..."
grep -r "dangerouslySetInnerHTML" src/ && echo "⚠️ Encontrado" || echo "✅ OK"

echo "2. Verificando secrets en código..."
grep -r "sk_live_\|sk_test_\|eyJhbG" src/ && echo "❌ SECRETS EN CÓDIGO" || echo "✅ OK"

echo "3. Verificando .env.local en .gitignore..."
grep ".env.local" .gitignore && echo "✅ OK" || echo "❌ AGREGAR"

echo "4. Verificando vulnerabilidades..."
npm audit --audit-level=high

echo "5. Verificando headers de seguridad..."
grep "X-Frame-Options\|X-Content-Type-Options" next.config.ts && echo "✅ OK" || echo "⚠️ AGREGAR"

echo "=== FIN DE VERIFICACIÓN ==="
```

---

## 6. 🔧 MEJORAS RECOMENDADAS

### Priority 1 (Alta)

- [ ] Implementar rate limiting en login/signup
- [ ] Agregar headers de seguridad en next.config.ts
- [ ] Validar todas las API routes

### Priority 2 (Media)

- [ ] Implementar CSP (Content Security Policy)
- [ ] Agregar logging de eventos de seguridad
- [ ] Implementar CAPTCHA en forms públicos

### Priority 3 (Baja)

- [ ] Penetration testing profesional
- [ ] Bug bounty program
- [ ] Security audit externo

---

## ✅ CONCLUSIÓN

**Tu aplicación está BIEN protegida** gracias a:
- ✅ Next.js + React (protección XSS automática)
- ✅ Supabase Auth + RLS (protección backend)
- ✅ Stripe (webhooks firmados)
- ✅ Middleware (protección de rutas)

**Áreas a mejorar:**
- ⚠️ Rate limiting
- ⚠️ Headers de seguridad
- ⚠️ Validación exhaustiva en API routes

**Estado general:** 🟢 SEGURO (con mejoras recomendadas)

