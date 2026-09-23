import fs from 'fs';
import { classifyComment } from './src/jev-classifier.js';

/**
 * Re-clasifica los comentarios ya guardados en data/store.json con los
 * nuevos criterios de 3 preguntas (bloque A/B), SIN tocar data/store.json.
 * Guarda el resultado en data/jev-v2-comparison.json y muestra un resumen
 * comparando contra la clasificación actual (JEV original + revisión manual).
 */

interface StoredComment {
  id: string;
  videoId: string;
  author: string;
  text: string;
  isClinicInquiry: boolean;
  inquiryType?: string;
  confidence: number;
}

async function main() {
  const raw = fs.readFileSync('data/store.json', 'utf-8');
  const data = JSON.parse(raw) as { comments: StoredComment[] };
  const comments = data.comments;

  console.log(`\n🔄 Re-clasificando ${comments.length} comentarios con los nuevos criterios (bloque A/B)...\n`);

  const results: Array<StoredComment & {
    v2_is_clinic_inquiry: boolean;
    v2_bloque?: string;
    v2_inquiry_type?: string;
    v2_confidence: number;
    v2_type_confidence: number;
    v2_inconsistent?: boolean;
    changed: boolean;
  }> = [];

  const outPath = 'data/jev-v2-comparison.json';
  let processed = 0;

  for (const c of comments) {
    let v2;
    try {
      v2 = await classifyComment(c.text);
    } catch (e) {
      console.error(`Error en comentario ${c.id}:`, e);
      v2 = { is_clinic_inquiry: false, inquiry_type: 'no_aplica', confidence: 0, typeConfidence: 0 };
    }

    const changed = v2.is_clinic_inquiry !== c.isClinicInquiry || v2.inquiry_type !== c.inquiryType;

    results.push({
      ...c,
      v2_is_clinic_inquiry: v2.is_clinic_inquiry,
      v2_bloque: v2.bloque,
      v2_inquiry_type: v2.inquiry_type,
      v2_confidence: v2.confidence,
      v2_type_confidence: v2.typeConfidence,
      v2_inconsistent: v2.inconsistent,
      changed,
    });

    processed++;
    if (processed % 25 === 0 || processed === comments.length) {
      console.log(`  ${processed}/${comments.length} procesados...`);
      // Guardado incremental por si el proceso se interrumpe
      fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 400));
  }

  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  // --- Resumen ---
  const totalChanged = results.filter((r) => r.changed).length;
  const inconsistentCount = results.filter((r) => r.v2_inconsistent).length;

  const v1Types: Record<string, number> = {};
  const v2Types: Record<string, number> = {};
  for (const r of results) {
    const t1 = r.isClinicInquiry ? (r.inquiryType || 'no_aplica') : 'no_aplica';
    const t2 = r.v2_is_clinic_inquiry ? (r.v2_inquiry_type || 'no_aplica') : 'no_aplica';
    v1Types[t1] = (v1Types[t1] || 0) + 1;
    v2Types[t2] = (v2Types[t2] || 0) + 1;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE LA COMPARATIVA');
  console.log('='.repeat(60));
  console.log(`\nTotal comentarios: ${results.length}`);
  console.log(`Cambiaron de clasificación: ${totalChanged} (${((totalChanged / results.length) * 100).toFixed(1)}%)`);
  console.log(`Respuestas inconsistentes (bloque vs subtipo): ${inconsistentCount}`);

  console.log('\n--- Distribución ANTES (v1: JEV original + revisión manual) ---');
  Object.entries(v1Types).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => console.log(`  ${t}: ${n}`));

  console.log('\n--- Distribución DESPUÉS (v2: nuevos criterios) ---');
  Object.entries(v2Types).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => console.log(`  ${t}: ${n}`));

  console.log(`\n💾 Detalle completo guardado en: ${outPath}`);
  console.log('='.repeat(60) + '\n');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
