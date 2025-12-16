#!/bin/bash

# Supabase Integration Status Check
# This script checks if all components are properly configured

echo "🔍 Checking Supabase Integration Status"
echo "========================================"
echo ""

# Check 1: Environment Variables
echo "1️⃣  Environment Variables (.env.local)"
if [ -f .env.local ]; then
    echo "   ✅ .env.local file exists"
    
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d '=' -f2)
        echo "   ✅ NEXT_PUBLIC_SUPABASE_URL is set: ${URL:0:30}..."
    else
        echo "   ❌ NEXT_PUBLIC_SUPABASE_URL not found"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo "   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
    else
        echo "   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found"
    fi
    
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        echo "   ✅ SUPABASE_SERVICE_ROLE_KEY is set"
    else
        echo "   ⚠️  SUPABASE_SERVICE_ROLE_KEY not found (optional but recommended)"
    fi
else
    echo "   ❌ .env.local file not found"
    echo "   💡 Create it with Supabase credentials"
fi
echo ""

# Check 2: Required Files
echo "2️⃣  Required Files"
FILES=(
    "src/lib/supabase.ts"
    "src/lib/supabase-api.ts"
    "src/app/api/participants/route.ts"
    "src/app/api/sessions/route.ts"
    "src/app/api/responses/route.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (missing)"
    fi
done
echo ""

# Check 3: Node Modules
echo "3️⃣  Dependencies"
if [ -d "node_modules/@supabase" ]; then
    echo "   ✅ @supabase packages installed"
else
    echo "   ❌ @supabase packages not found"
    echo "   💡 Run: npm install"
fi
echo ""

# Check 4: Check for duplicate routes
echo "4️⃣  API Route Integrity"
if [ -f "src/app/api/resposes/route.ts" ]; then
    echo "   ⚠️  Duplicate route found: resposes/route.ts (should be removed)"
else
    echo "   ✅ No duplicate routes detected"
fi
echo ""

# Check 5: TypeScript Compilation
echo "5️⃣  TypeScript Status"
if command -v npx &> /dev/null; then
    echo "   🔄 Checking TypeScript compilation..."
    npx tsc --noEmit 2>&1 | head -5
    if [ $? -eq 0 ]; then
        echo "   ✅ TypeScript compilation successful"
    else
        echo "   ⚠️  TypeScript has some issues (check above)"
    fi
else
    echo "   ⚠️  npx not found, skipping TS check"
fi
echo ""

# Summary
echo "======================================"
echo "📋 Summary"
echo "======================================"
echo ""
echo "Next Steps:"
echo "1. Ensure dev server is running: npm run dev"
echo "2. Test with: node test-supabase-complete.js"
echo "3. Or visit: http://localhost:3000/test_user?group=1"
echo ""
echo "📚 Documentation:"
echo "   - docs/SUPABASE_SETUP.md"
echo "   - docs/SUPABASE_TESTING_GUIDE.md"
echo ""
