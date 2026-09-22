# YouTube Clinic Classifier 🎬

Classificador de comentarios de YouTube que utiliza el modelo **TypeSafe Jev** vía **OpenRouter API** para identificar consultas de clínica de potenciales clientes.

## 🎯 Características

- **Scraper de YouTube** - Extrae los últimos 20 videos de un canal
- **Clasificación con Jev** - Utiliza el modelo TypeSafe Jev para decisiones estructuradas
- **Base de datos SQLite** - Almacena videos y comentarios clasificados
- **Dashboard web** - Visualiza métricas y estadísticas en tiempo real
- **API REST** - Acceso a datos clasificados

## 📊 Modelo Jev

Jev es un "System One Model" de TypeSafe que:
- Devuelve **decisiones estructuradas** (no texto)
- Incluye **scores de confianza** en cada decisión
- Es **238x más barato** que Claude
- Es **193.6x más rápido** que GPT-4

## 🚀 Instalación

### Requisitos
- Node.js 18+
- npm o yarn
- API key de OpenRouter

### Pasos

1. **Clonar repositorio**
```bash
cd youtube-clinic-classifier
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` y agregar:
```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxx
YOUTUBE_CHANNEL_HANDLE=@EscueladeAlopecia
MAX_VIDEOS=20
PORT=3000
```

4. **Compilar TypeScript**
```bash
npm run build
```

5. **Ejecutar**
```bash
npm run scrape
```

## 📈 Uso

El programa:
1. Obtiene los últimos 20 videos del canal
2. Extrae comentarios de cada video
3. Clasifica cada comentario con Jev (¿es consulta clínica?)
4. Guarda resultados en SQLite
5. Inicia un dashboard web en `http://localhost:3000`

### Ejemplo de clasificación

**Entrada:** `"Excelente video, me gustaría agendar una consulta. ¿Cuál es el precio?"`

**Salida (Jev):**
```json
{
  "is_clinic_inquiry": true,
  "confidence": 0.95
}
```

## 📊 Dashboard

Accede a `http://localhost:3000` para ver:
- 📊 Gráficos de distribución de comentarios
- 🎯 Scores de confianza promedio
- 📈 Estadísticas por video
- 💬 Detalles de comentarios clasificados

## 🏗️ Estructura del proyecto

```
src/
├── config.ts           # Configuración
├── database.ts         # SQLite database
├── jev-classifier.ts   # Integración con Jev
├── youtube-scraper.ts  # Scraper de YouTube
├── server.ts          # Express API + Dashboard
└── index.ts           # Punto de entrada
```

## 🔗 APIs

### GET /api/statistics
```json
{
  "totalVideos": 20,
  "totalComments": 450,
  "clinicInquiries": 120,
  "otherComments": 330,
  "clinicPercentage": 26.67,
  "averageConfidence": 0.92
}
```

### GET /api/videos
Lista todos los videos analizados

### GET /api/videos/:videoId
Obtiene detalles de un video específico

## ⚙️ Configuración

En `.env`:
- `OPENROUTER_API_KEY` - Tu API key de OpenRouter
- `YOUTUBE_CHANNEL_HANDLE` - Canal a analizar
- `MAX_VIDEOS` - Máximo de videos a procesar (default: 20)
- `MAX_COMMENTS_PER_VIDEO` - Máximo de comentarios por video (default: 100)
- `PORT` - Puerto del dashboard (default: 3000)

## 💡 Notas

- Jev es un modelo de decisión estructurada, no genera texto
- Cada clasificación incluye un score de confianza 0-1
- Se aplica rate limiting para evitar problemas de API
- Los datos se guardan en SQLite para análisis futuro

## 📝 Licencia

MIT

## 🤝 Autor

Desarrollado para análisis de comentarios de YouTube con modelos de IA

---

**Nota:** Este proyecto utiliza datos simulados en la fase de demo. Para producción, implementa la integración real con YouTube API.
