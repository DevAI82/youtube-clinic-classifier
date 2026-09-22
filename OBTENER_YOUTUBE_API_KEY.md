# 🔑 CÓMO OBTENER LA API KEY DE YOUTUBE

## Paso 1: Ir a Google Cloud Console

1. Abre: https://console.cloud.google.com/apis/credentials
2. Inicia sesión con tu cuenta de Google

---

## Paso 2: Crear un Proyecto

1. Click en **"Seleccionar un proyecto"** (arriba a la izquierda)
2. Click en **"Nuevo proyecto"**
3. Nombre: `YouTube Clinic Classifier`
4. Click en **"Crear"**
5. Espera a que se cree (puede tardar un minuto)

---

## Paso 3: Habilitar YouTube Data API v3

1. En el menú de la izquierda, ve a **"Biblioteca"**
2. Busca: `YouTube Data API v3`
3. Click en el primer resultado
4. Click en **"HABILITAR"**
5. Espera a que se habilite

---

## Paso 4: Crear Credenciales

1. Vuelve a: https://console.cloud.google.com/apis/credentials
2. Click en **"+ Crear credenciales"** (arriba)
3. Selecciona **"Clave de API"**
4. ¡Listo! Tu API key aparecerá en una ventana
5. **Copia la clave completa**

---

## Paso 5: Configurar en tu Proyecto

Abre el archivo `.env` en tu proyecto y reemplaza:

```
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY_HERE
```

Con tu clave real:

```
YOUTUBE_API_KEY=AIzaSyD...tu_clave_aqui...
```

---

## ⚠️ IMPORTANTE

### Seguridad
- ❌ **NUNCA** compartas tu API key públicamente
- ❌ **NUNCA** la subas a GitHub (usa .gitignore)
- ✅ Guárdala solo en `.env` localmente

### Límites de Cuota
YouTube Data API tiene límites gratuitos:
- **10,000 unidades por día** (gratis)
- Cada operación cuesta unidades:
  - Buscar video: 100 unidades
  - Obtener comentarios: 1 unidad por comentario

**Estimado para nuestro caso:**
- 20 videos × 100 unidades = 2,000 unidades
- 2,000 comentarios × 1 unidad = 2,000 unidades
- **Total: ~4,000 unidades por ejecución** ✅ Dentro del límite

---

## Paso 6: Verificar que Funciona

Ejecuta:

```bash
npm run scrape
```

Si todo está bien, verás:
```
📹 Fetching latest 20 videos from @EscueladeAlopecia...
✅ Found 20 videos
📝 Fetching comments...
✅ Found 100 comments
🤖 Classifying comments with Jev model...
```

---

## 🆘 Errores Comunes

### Error: "Invalid API key"
- Verificar que la clave esté bien copiada
- Verificar que no hay espacios extras
- Verificar que está habilitada la YouTube Data API v3

### Error: "quotaExceeded"
- Esperaras 24 horas (el límite se reinicia diariamente)
- O solicitar un aumento de cuota a Google

### Error: "Channel not found"
- Verificar que el nombre del canal es correcto
- Ejemplo: `@EscueladeAlopecia` (con el @)

---

## 📊 Resultado Final

Una vez configurada, verás los resultados reales:

```
📊 RESULTADOS DEL ANÁLISIS:

📺 Videos analizados: 20
💬 Total de comentarios: 2000
🏥 Consultas clínicas: 1480 (74%)
💭 Otros comentarios: 520 (26%)
📈 Porcentaje clínicas: 74.0%
🎯 Confianza promedio: 94.2%

🎥 VIDEOS ANALIZADOS:

• Tratamiento de alopecia - 148 comentarios | 110 clínicas | 92.1% confianza
• Trasplante capilar - 156 comentarios | 115 clínicas | 94.3% confianza
• Casos reales - 142 comentarios | 105 clínicas | 90.1% confianza
```

---

## 🌐 Ver Resultados en Dashboard

Una vez procesados, abre:

```
http://localhost:3000
```

Verás un dashboard interactivo con:
- Estadísticas globales
- Gráficos por tipo de consulta
- Listado de videos
- Detalles de comentarios clasificados

---

**¡Listo! Ahora tienes acceso a datos REALES de YouTube** 🚀
