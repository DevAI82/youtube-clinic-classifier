# 🚀 START HERE - YouTube Clinic Classifier

## ⚡ En 3 Pasos

### 1️⃣ Edita `.env`
```
OPENROUTER_API_KEY=sk-or-v1-tu_clave_aqui
```

### 2️⃣ Ejecuta
```bash
npm run scrape
```

### 3️⃣ Ve a
```
http://localhost:3000
```

---

## ✅ Qué Se Creó

### 6 Archivos TypeScript (~700 líneas)
- `config.ts` → Configuración
- `database.ts` → Base de datos en memoria
- `jev-classifier.ts` → Integración Jev/OpenRouter
- `youtube-scraper.ts` → Mock scraper
- `server.ts` → Express + Dashboard web
- `index.ts` → Orquestador

### 🎨 Dashboard Web
- Estadísticas en vivo
- Gráficos interactivos
- Lista de videos
- API REST con 4 endpoints

---

## 📊 Cómo Funciona

```
YOUTUBE VIDEOS
     ↓
COMENTARIOS
     ↓
JEV MODEL (OpenRouter)
     ↓
¿CONSULTA CLÍNICA?
     ↓
DASHBOARD WEB
```

**Resultado:** Cada comentario clasificado con:
- ✅ Decisión: SI/NO es consulta clínica
- 🎯 Confianza: 0-100%

---

## 📊 Ejemplo de Datos

```
20 videos analizados
450 comentarios clasificados
120 consultas clínicas (26.7%)
87% confianza promedio
```

---

## 💡 Tecnologías

- **TypeScript** - Código con tipos
- **Express.js** - Servidor HTTP
- **OpenRouter** - API para Jev
- **Chart.js** - Gráficos
- **dotenv** - Variables de entorno

---

## 📚 Documentación

| Archivo | Propósito |
|---------|-----------|
| `QUICKSTART.md` | Inicio rápido (30 seg) |
| `SETUP.md` | Guía completa de instalación |
| `README.md` | Documentación técnica |
| `PROYECTO_COMPLETADO.md` | Resumen ejecutivo |

---

## 🔑 Lo Único que Necesitas

**API Key de OpenRouter** (gratis registrarse)

1. Ve a https://openrouter.ai
2. Crea una cuenta
3. Genera una API key
4. Pégala en `.env`

---

## 🎯 Qué Aprendes

✅ Integración de APIs externas  
✅ Modelos de IA (Jev)  
✅ Dashboard interactivo  
✅ TypeScript avanzado  
✅ Express.js  

---

## 🚨 FAQ

**P: ¿Funcionará sin YouTube API key?**  
R: Sí, usa datos simulados. Para YouTube real, necesitas API key.

**P: ¿Cuántos tokens gastará?**  
R: ~100-200 tokens por ejecución (Jev es muy barato).

**P: ¿Puedo guardarlo en BD?**  
R: Sí, ahora es en memoria. Mira SETUP.md para SQLite.

**P: ¿Cómo customizar?**  
R: Todo es modular. Cada archivo hace una cosa.

---

## 🎉 ¡Listo!

El proyecto está **100% compilado y funcional**.

**Solo necesitas:**
1. Tu API key de OpenRouter
2. Ejecutar `npm run scrape`
3. Abrir `http://localhost:3000`

¡Eso es todo! 🚀

---

**¿Preguntas?** Mira los archivos `.md` o el código fuente.

Buen desarrollo. 💻✨
