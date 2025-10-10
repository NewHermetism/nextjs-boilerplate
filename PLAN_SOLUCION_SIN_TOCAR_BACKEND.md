# Plan de Solución: Login con Wallet (SIN tocar Backend)

**Fecha:** 2025-10-10
**Premisa:** El código funcional está en el `.zip`, el backend NO se tocó

---

## 🎯 HIPÓTESIS PRINCIPAL

El problema **NO está en el código**, está en la **configuración de Vercel** o en diferencias entre:
- El deployment del otro dev (funcionaba)
- Tu deployment actual (no funciona)

---

## 📋 PLAN DE ACCIÓN - DÍA 1

### **PASO 1: Verificar el origin actual del token** ⭐ CRÍTICO

**En el navegador, después de hacer login:**

1. Abrir `https://supervictornft.com`
2. Hacer login con la wallet
3. Abrir consola del navegador (F12)
4. Ejecutar este código:

```javascript
// Ver el origin de la página actual
console.log('🌐 Origin de la página:', window.location.origin);

// Decodificar el token para ver su origin
const loginInfo = localStorage.getItem('persist:loginInfo');
if (loginInfo) {
  const parsed = JSON.parse(loginInfo);
  const tokenLogin = JSON.parse(parsed.tokenLogin || '{}');
  const token = tokenLogin.nativeAuthToken;

  if (token) {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    console.log('🔑 Token payload completo:', payload);
    console.log('🎯 Origin en el token:', payload.origin);
  }
}
```

**📝 ANOTA LOS RESULTADOS:**
```
Origin de la página: _____________________
Origin en el token: _____________________
```

**¿Coinciden?**
- ✅ **SÍ:** El problema está en otro lado
- ❌ **NO:** El problema es que el token tiene un origin diferente al esperado

---

### **PASO 2: Verificar variables de entorno en Vercel** ⭐⭐ MUY PROBABLE

1. Ir a **Vercel Dashboard**
2. Seleccionar el proyecto `supervictornft`
3. Ir a **Settings** → **Environment Variables**

**Verificar si existen estas variables:**
- `NEXT_PUBLIC_API_URL`
- `VITE_API_URL`
- `REACT_APP_API_URL`
- `NEXT_PUBLIC_DAPP_URL`
- Cualquier variable con `URL`, `API`, `SOCKET`

**📝 ANOTA:**
```
Variables encontradas:
- Nombre: _____________ | Valor: _____________
- Nombre: _____________ | Valor: _____________
```

**Si NO hay ninguna variable:**
- Contactar al otro dev y pedir un screenshot de sus Environment Variables

---

### **PASO 3: Verificar la configuración del dominio custom en Vercel**

1. En Vercel Dashboard → Tu proyecto
2. **Settings** → **Domains**

**Verificar:**
- ✅ `supervictornft.com` debe aparecer en la lista
- ✅ Debe tener un checkmark verde (✓) o "Ready"
- ✅ Debe decir **"Primary"** o ser el primer dominio de la lista

**Si hay múltiples dominios:**
```
Dominios encontrados:
1. _______________________ (Primary? _____)
2. _______________________ (Primary? _____)
3. _______________________ (Primary? _____)
```

**Acción:** Si `supervictornft.com` NO es el primario:
- Click en los 3 puntos (...)
- **"Set as Primary Domain"**

---

### **PASO 4: Hacer un Redeploy limpio (sin cache)**

1. En Vercel Dashboard → Tu proyecto
2. Ir a **Deployments**
3. Buscar el **último deployment exitoso** (con ✓ verde)
4. Click en los 3 puntos (...) → **"Redeploy"**
5. **IMPORTANTE:** Desmarcar la casilla "Use existing Build Cache"
6. Click en **"Redeploy"**

**Esperar a que termine el deployment** (2-5 minutos)

**Después del redeploy:**
- Abrir `https://supervictornft.com`
- Hard refresh: `Ctrl + Shift + R` (o `Cmd + Shift + R` en Mac)
- Intentar login nuevamente

---

### **PASO 5: Limpiar cache del navegador**

**Antes de probar el login:**

1. Abrir DevTools (F12)
2. Click derecho en el botón de refresh
3. Seleccionar **"Empty Cache and Hard Reload"**

**O manualmente:**
1. `Ctrl + Shift + Delete` (abrir panel de limpieza)
2. Marcar:
   - ✅ Cookies y datos del sitio
   - ✅ Archivos e imágenes en caché
3. Rango de tiempo: **"Última hora"**
4. Click en **"Borrar datos"**

---

## 🔍 DIAGNÓSTICO BASADO EN RESULTADOS

### **Escenario A: Los origins coinciden**

Si `Origin de la página` === `Origin en el token` === `https://supervictornft.com`:

**✅ Entonces el problema NO es el origin.**

**Siguientes pasos:**
1. Verificar que el backend acepte `https://supervictornft.com` (ya lo hace según el código)
2. Verificar logs del backend para ver otro tipo de error
3. Puede ser problema de CORS en nginx/proxy

---

### **Escenario B: Los origins NO coinciden**

Si el token tiene un origin diferente (ej: `https://supervictornft-abc123.vercel.app`):

**❌ Este es el problema.**

**Por qué pasa:**
- Vercel está usando el deployment URL en lugar del custom domain
- El dominio custom no está configurado como primario
- Hay un problema con la configuración DNS

**Solución temporal (SI y SOLO SI pasa esto):**

Agregar el deployment URL al backend:

```bash
# SSH al servidor backend
ssh root@v-dash-game-1

# Editar configuración
cd /home/vdash/victor-api
nano src/config/index.ts

# Agregar:
export const ACCEPTED_ORIGINS = [
  'https://supervictornft.com',
  'https://supervictornft-[HASH].vercel.app',  # ← Usar el hash real del PASO 1
];

# Editar verify_signature.ts
nano src/utils/verify_signature.ts

# Cambiar línea 6:
import { MVX_API_URL, DAPP_URL, ACCEPTED_ORIGINS } from '../config';

# Cambiar línea 9:
acceptedOrigins: ACCEPTED_ORIGINS || [DAPP_URL],

# Guardar y reconstruir Docker
docker-compose down && docker-compose build && docker-compose up -d
```

---

### **Escenario C: El token no se genera**

Si `tokenLogin.nativeAuthToken` está `undefined` o vacío:

**❌ El problema está en la generación del token (frontend).**

**Verificar:**
1. Logs de la consola durante el login
2. Network tab → Ver si hay errores en las llamadas a MultiversX API
3. Verificar que `nativeAuth` esté habilitado en `src/config/sharedConfig.ts`

---

## 🚨 TROUBLESHOOTING RÁPIDO

### Si después de todo sigue sin funcionar:

#### **Opción 1: Comparar con el deployment del otro dev**

Pídele al otro dev:
1. URL exacta de su deployment que funcionaba
2. Screenshot de Environment Variables en Vercel
3. Screenshot de la configuración de Domains

#### **Opción 2: Forzar uso del dominio custom en el código**

En `src/App.tsx`, después del `DappProvider`:

```typescript
// Verificar que siempre use el dominio correcto
useEffect(() => {
  if (window.location.hostname !== 'supervictornft.com') {
    console.warn('⚠️ No estás en el dominio principal');
    // Opcional: redirigir
    // window.location.href = 'https://supervictornft.com';
  }
}, []);
```

#### **Opción 3: Ver el deployment funcional del otro dev**

Si el otro dev todavía tiene su deployment activo:
1. Intenta hacer login ahí
2. Compara los logs de la consola
3. Compara el `origin` del token
4. Ve qué es diferente

---

## 📊 CHECKLIST DE VERIFICACIÓN

### Antes de contactar al otro dev:

- [ ] Verificado origin del token (PASO 1)
- [ ] Verificadas variables de entorno en Vercel (PASO 2)
- [ ] Verificado dominio custom como Primary (PASO 3)
- [ ] Hecho redeploy limpio sin cache (PASO 4)
- [ ] Limpiado cache del navegador (PASO 5)
- [ ] Probado login después de cada cambio

### Si nada funciona, preguntar al otro dev:

- [ ] ¿Qué URL usabas para acceder? (vercel.app o supervictornft.com)
- [ ] ¿Tenías variables de entorno configuradas en Vercel?
- [ ] ¿Alguna configuración especial en Vercel que deba saber?
- [ ] ¿Puedes compartir un screenshot de tu configuración de Domains?

---

## 🎯 RESULTADO ESPERADO

Después de seguir estos pasos, deberías ver en la consola del navegador:

```
✅ AuthRedirectWrapper: User is logged in and authorized
🎮 Game.tsx - Initializing Phaser game with token
🔌 SocketHandler: Connected to server
✅ Received profile from backend: {...}
🎮 NFT Ownership Details:
   White Pijama (Character 0): ✅ OWNED
```

Y en los logs del backend:

```
Client connected: [SOCKET_ID]
getVDashProfile
vdash_profile { address: 'erd1...', has_white_pijama_nft: true, ... }
```

**SIN ver:**
```
❌ Verification error: NativeAuthOriginNotAcceptedError
```

---

## 📝 REGISTRO DE RESULTADOS

**Fecha de ejecución:** __________

**PASO 1 - Origin del token:**
```
Origin de la página: _____________________
Origin en el token: _____________________
¿Coinciden? SÍ / NO
```

**PASO 2 - Variables de entorno:**
```
Variables encontradas:
_____________________________________
_____________________________________
```

**PASO 3 - Dominio primary:**
```
Dominio primary: _____________________
¿Era supervictornft.com? SÍ / NO
```

**PASO 4 - Redeploy:**
```
Deployment ID: _____________________
Estado: SUCCESS / FAILED
```

**PASO 5 - Resultado final:**
```
¿Funciona el login? SÍ / NO

Si NO: ¿Qué error muestra?
_____________________________________
_____________________________________
```

---

## 🔄 SI TODO FALLA: Plan B

Si después de todos estos pasos NO funciona, entonces sí hay que revisar:

1. **El backend** (aunque no se tocó, puede haber un problema de configuración)
2. **Las versiones de las dependencias** (comparar `package.json` del `.zip` con el actual)
3. **La configuración de CORS en nginx** (si hay un proxy adelante del backend)

**Pero intenta primero estos pasos**, que son los más probables.

---

**Tiempo estimado total:** 30-45 minutos
**Confianza:** ⭐⭐⭐⭐ (80% - muy probable que sea Vercel/dominio)

---

**Última actualización:** 2025-10-10
**Estado:** Listo para ejecutar mañana

---

## 💡 TIP FINAL

**Lo más probable es que sea el PASO 3:** El dominio custom no está configurado como Primary en Vercel, entonces el token se genera con el deployment URL en lugar del dominio custom.

Empieza por ahí si tienes poco tiempo.
