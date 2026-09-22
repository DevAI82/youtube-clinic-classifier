# Setup - YouTube Clinic Classifier

## ✅ Está Configurado

El proyecto ya está instalado y compilado. Aquí está lo que falta:

## 1️⃣ Configurar tu API key de OpenRouter

1. Abre el archivo `.env`:
```bash
cp .env.example .env
```

2. Edita `.env` y reemplaza con tu información real:
```env
OPENROUTER_API_KEY=sk-or-v1-TU_API_KEY_AQUI
YOUTUBE_CHANNEL_HANDLE=@EscueladeAlopecia
MAX_VIDEOS=20
MAX_COMMENTS_PER_VIDEO=100
PORT=3000
```

**Importante:** 
- Reemplaza `sk-or-v1-TU_API_KEY_AQUI` con tu API key real de OpenRouter
- Mantén la URL `https://youtube-clinic-classifier.local` como referrer

## 2️⃣ Ejecutar el proyecto

```bash
npm run scrape
```

El script:
- ✅ Fetches últimos 20 videos del canal @EscueladeAlopecia
- ✅ Extrae comentarios de cada video
- ✅ Clasifica cada comentario con Jev
- ✅ Muestra resultados en la terminal
- ✅ Inicia un dashboard web en `http://localhost:3000`

## 3️⃣ Ver el Dashboard

Mientras se ejecuta el script, abre tu navegador:
```
http://localhost:3000
```

Verás:
- 📊 Estadísticas en vivo
- 🎥 Videos analizados
- 💬 Porcentaje de consultas clínicas
- 🎯 Confianza promedio del modelo

## ⚙️ Cómo funciona

### 1. Scraper (youtube-scraper.ts)
- Obtiene los últimos 20 videos del canal
- Extrae hasta 100 comentarios por video
- Retorna título, descripción, fecha

### 2. Clasificador (jev-classifier.ts)
- Usa el modelo `~typesafe/jev-latest` de OpenRouter
- Devuelve: `{ is_clinic_inquiry: boolean, confidence: 0-1 }`
- Aplica rate limiting (1 segundo entre clasificaciones)

### 3. Base de datos (database.ts)
- Almacena videos y comentarios en memoria
- Calcula estadísticas agregadas
- API REST para acceder a los datos

### 4. Dashboard (server.ts)
- Express + HTML/CSS/JS
- Gráficos con Chart.js
- Refresca cada 30 segundos

## 📊 Ejemplo de flujo

```
Canal YouTube
     ↓
Videos (últimos 20)
     ↓
Comentarios (hasta 100 por video)
     ↓
Jev Model (OpenRouter)
     ↓
Decisiones: ¿Consulta clínica? (SI/NO + confianza)
     ↓
Base de datos en memoria
     ↓
Dashboard web (http://localhost:3000)
```

## 🔧 Arquitectura del proyecto

```
src/
├── config.ts              # Configuración centralizada
├── database.ts            # Base de datos en memoria
├── jev-classifier.ts      # Integración con Jev vía OpenRouter
├── youtube-scraper.ts     # Mock scraper (simula YouTube)
├── server.ts              # Express API + Dashboard
└── index.ts               # Orquestador principal
```

## 🚨 Posibles errores

### "OPENROUTER_API_KEY is not set"
- Solución: Edita `.env` y agrega tu API key

### "Cannot connect to OpenRouter"
- Solución: Verifica tu conexión a internet
- Verifica que tu API key sea válida
- Comprueba que estés usando la URL correcta

### "Port 3000 already in use"
- Solución: Cambia el valor de `PORT` en `.env`
- O detén el proceso que está usando el puerto

## 💡 Próximos pasos

1. **Extender el scraper real:**
   - Implementar YouTube API oficial (requiere API key)
   - O usar yt-dlp para extraer videos reales

2. **Mejorar el dashboard:**
   - Agregar filtros por fecha
   - Exportar datos a CSV/Excel
   - Mostrar comentarios individuales

3. **Persistencia:**
   - Cambiar de base de datos en memoria a SQLite real
   - Guardar histórico de ejecuciones

4. **Análisis avanzado:**
   - Segmentación por tipo de consulta
   - Análisis de sentimiento
   - Clustering de comentarios similares

## 📖 Referencias

- [TypeSafe Jev Documentation](https://jev.works)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [Express.js Guide](https://expressjs.com)

---

**¿Listo para empezar?** Ejecuta:
```bash
npm run scrape
```

¡Los resultados aparecerán en `http://localhost:3000` 🚀
