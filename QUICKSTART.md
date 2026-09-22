# Quick Start - YouTube Clinic Classifier 🚀

## 30 segundos para empezar

### 1. Editar `.env`
```bash
# Abre el archivo .env y reemplaza tu API key:
OPENROUTER_API_KEY=sk-or-v1-TU_CLAVE_AQUI
```

### 2. Ejecutar
```bash
npm run scrape
```

### 3. Abrir Dashboard
```
http://localhost:3000
```

---

## ¿Qué pasa?

```
┌─────────────────────┐
│  YouTube Channel    │  ← @EscueladeAlopecia
│  (últimos 20 videos)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    Comentarios      │  ← ~100 por video
│    Extraídos        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Jev Model          │  ← TypeSafe via OpenRouter
│  (OpenRouter API)   │  "¿Es consulta clínica?"
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Base de datos      │  ← En memoria (JSON)
│  Estadísticas       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Dashboard web      │  ← http://localhost:3000
│  Gráficos & Datos   │
└─────────────────────┘
```

---

## 📊 Qué verás en el Dashboard

### Tarjetas de Estadísticas
- 📺 **Videos**: Número total procesado
- 💬 **Comentarios**: Total de comentarios clasificados
- 🏥 **Consultas Clínicas**: Número y porcentaje
- 🎯 **Confianza**: Score promedio del modelo (0-100%)

### Gráficos
- **Gráfico Doughnut**: Distribución Clínicas vs Otros
- **Gauge**: Confianza promedio del modelo

### Lista de Videos
- Título
- Total de comentarios
- Consultas clínicas detectadas
- Confianza promedio

---

## 🔧 Troubleshooting

| Problema | Solución |
|----------|----------|
| `OPENROUTER_API_KEY not found` | Edita `.env` con tu clave |
| `Port 3000 already in use` | Cambia `PORT` en `.env` |
| `Cannot reach OpenRouter` | Verifica tu conexión/API key |
| Dashboard vacío | Espera a que termine el scrape |

---

## 💡 Datos de prueba

El proyecto viene con **datos simulados** para que veas cómo funciona sin usar tokens:

```javascript
// Ejemplo: 5 comentarios mock por video
"Excelente video, me gustaría agendar una consulta"
"Muy interesante la explicación"
"¿Es posible hacer una consulta por telemedicina?"
"Hace 6 meses que me cayó el pelo, necesito ayuda"
"Muy buen contenido, sigan así!"
```

Jev clasificará automáticamente cuáles son consultas clínicas.

---

## 📈 Resultados esperados

Con los datos simulados verás algo como:

```
✅ Vídeos analizados: 20
💬 Total de comentarios: 100
🏥 Consultas clínicas: 40-50 (40-50%)
🎯 Confianza promedio: 85-92%
```

---

## 🔗 Recursos

- **OpenRouter**: https://openrouter.ai
- **TypeSafe Jev**: https://jev.works
- **API Docs**: https://openrouter.ai/docs

---

## 🎓 Qué aprendes

1. ✅ Integración de APIs externas
2. ✅ Uso de modelos de IA (Jev)
3. ✅ Procesamiento de datos en batch
4. ✅ Dashboard en tiempo real
5. ✅ Gestión de configuración

---

**¡Listo!** Solo necesitas tu API key de OpenRouter. ¿Ya la tienes? 🚀
