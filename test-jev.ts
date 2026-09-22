import { classifyComment } from './src/jev-classifier.js';

async function testJev() {
  console.log('\n🤖 PROBANDO INTEGRACIÓN CON JEV\n');
  console.log('='.repeat(60) + '\n');

  const testComments = [
    'Excelente video, me gustaría agendar una consulta',
    'Muy buena explicación, gracias',
    '¿Cuál es el costo del tratamiento?',
    'Me encanta este contenido educativo',
    'Necesito asesoramiento urgente para mi problema capilar',
  ];

  for (const comment of testComments) {
    console.log(`📝 Clasificando: "${comment}"`);
    try {
      const result = await classifyComment(comment);
      const typeLabel = result.inquiry_type && result.inquiry_type !== 'no_aplica' 
        ? ` → ${result.inquiry_type}`
        : '';
      console.log(`   ✅ Resultado: ${result.is_clinic_inquiry ? '🏥 CLÍNICA' : '💬 OTRO'} (${(result.confidence * 100).toFixed(1)}% confianza)${typeLabel}\n`);
    } catch (error) {
      console.error(`   ❌ Error:`, error instanceof Error ? error.message : error);
      console.log('');
    }
  }

  console.log('='.repeat(60) + '\n');
  console.log('✅ Test completado!\n');
}

testJev().catch(console.error);
