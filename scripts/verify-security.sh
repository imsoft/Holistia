#!/bin/bash

# ============================================================================
# Script de Verificación de Seguridad Frontend/Backend - Holistia
# ============================================================================

echo "🔒 =========================================="
echo "   VERIFICACIÓN DE SEGURIDAD - HOLISTIA"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# ============================================================================
# 1. FRONTEND SECURITY
# ============================================================================

echo "📱 FRONTEND SECURITY"
echo "-------------------------------------------"

# 1.1 dangerouslySetInnerHTML
echo -n "1.1 Verificando dangerouslySetInnerHTML... "
if grep -r "dangerouslySetInnerHTML" src/ --exclude-dir=node_modules 2>/dev/null | grep -v "blog" | grep -q "."; then
    echo "⚠️  ADVERTENCIA"
    echo "    Encontrado dangerouslySetInnerHTML fuera de blog"
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ OK"
fi

# 1.2 Variables de entorno públicas en cliente
echo -n "1.2 Verificando variables de entorno... "
if grep -r "process.env\." src/app src/components --exclude-dir=node_modules 2>/dev/null | grep -v "NEXT_PUBLIC" | grep -v "server" | grep -q "."; then
    echo "⚠️  ADVERTENCIA"
    echo "    Variables privadas en código cliente"
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ OK"
fi

# 1.3 Middleware existe
echo -n "1.3 Verificando middleware... "
if [ -f "src/middleware.ts" ]; then
    echo "✅ OK"
else
    echo "❌ ERROR"
    echo "    Middleware no encontrado"
    ERRORS=$((ERRORS + 1))
fi

# 1.4 Headers de seguridad
echo -n "1.4 Verificando headers de seguridad... "
if grep -q "X-Frame-Options\|X-Content-Type-Options" next.config.ts 2>/dev/null; then
    echo "✅ OK"
else
    echo "⚠️  ADVERTENCIA"
    echo "    Headers de seguridad no configurados"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# 2. BACKEND SECURITY
# ============================================================================

echo "⚙️  BACKEND SECURITY"
echo "-------------------------------------------"

# 2.1 Secrets en código
echo -n "2.1 Verificando secrets en código... "
if grep -r "sk_live_\|sk_test_\|service_role" src/ --exclude-dir=node_modules 2>/dev/null | grep -v "process.env" | grep -q "."; then
    echo "❌ ERROR CRÍTICO"
    echo "    Secrets hardcodeados en código"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ OK"
fi

# 2.2 .env.local en .gitignore
echo -n "2.2 Verificando .gitignore... "
if grep -q ".env.local" .gitignore 2>/dev/null; then
    echo "✅ OK"
else
    echo "❌ ERROR"
    echo "    .env.local no está en .gitignore"
    ERRORS=$((ERRORS + 1))
fi

# 2.3 Verificar que .env.local no esté en git
echo -n "2.3 Verificando .env.local en git... "
if git ls-files | grep -q ".env.local"; then
    echo "❌ ERROR CRÍTICO"
    echo "    .env.local está en git!"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ OK"
fi

# 2.4 API routes con autenticación
echo -n "2.4 Verificando API routes... "
API_COUNT=$(find src/app/api -name "route.ts" 2>/dev/null | wc -l)
AUTH_COUNT=$(grep -r "auth.getUser\|createClient" src/app/api --include="route.ts" 2>/dev/null | wc -l)
if [ "$API_COUNT" -gt 0 ] && [ "$AUTH_COUNT" -ge "$API_COUNT" ]; then
    echo "✅ OK ($AUTH_COUNT/$API_COUNT con auth)"
else
    echo "⚠️  ADVERTENCIA"
    echo "    Algunas API routes pueden no verificar auth"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# 3. DEPENDENCIES
# ============================================================================

echo "📦 DEPENDENCIES"
echo "-------------------------------------------"

# 3.1 npm audit
echo "3.1 Verificando vulnerabilidades..."
if command -v pnpm &> /dev/null; then
    pnpm audit --audit-level=high 2>&1 | head -20
else
    npm audit --audit-level=high 2>&1 | head -20
fi

echo ""

# ============================================================================
# 4. CONFIGURACIÓN
# ============================================================================

echo "⚙️  CONFIGURACIÓN"
echo "-------------------------------------------"

# 4.1 Verificar archivos de configuración
echo -n "4.1 Verificando next.config.ts... "
if [ -f "next.config.ts" ]; then
    echo "✅ OK"
else
    echo "⚠️  ADVERTENCIA"
    WARNINGS=$((WARNINGS + 1))
fi

# 4.2 Verificar tsconfig.json
echo -n "4.2 Verificando tsconfig.json... "
if [ -f "tsconfig.json" ]; then
    echo "✅ OK"
else
    echo "⚠️  ADVERTENCIA"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# 5. RESUMEN
# ============================================================================

echo "📊 RESUMEN"
echo "=========================================="
echo "Errores críticos: $ERRORS"
echo "Advertencias: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "🟢 ESTADO: SEGURO"
    echo "✅ Todos los checks pasaron"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "🟡 ESTADO: MEJORABLE"
    echo "⚠️  Hay $WARNINGS advertencias"
    echo "📖 Revisa: docs/SECURITY_FRONTEND_BACKEND.md"
    exit 0
else
    echo "🔴 ESTADO: REQUIERE ATENCIÓN"
    echo "❌ Hay $ERRORS errores críticos"
    echo "📖 Revisa: docs/SECURITY_FRONTEND_BACKEND.md"
    exit 1
fi

