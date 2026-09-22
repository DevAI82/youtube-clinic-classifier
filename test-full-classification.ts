import { classifyCommentsBatch } from './src/jev-classifier.js';

async function testFullClassification() {
  console.log('\n🎯 TEST COMPLETO - JEV CLASSIFICATION MULTI-NIVEL\n');
  console.log('='.repeat(70) + '\n');

  // Comentarios de prueba con categorías esperadas
  const testComments = [
    // Pedir Cita / Agendar (PRIORIDAD ALTA)
    {
      text: 'Excelente video, me gustaría agendar una consulta',
      expectedClinic: true,
      expectedType: 'pedir_cita_agendar',
    },
    {
      text: 'Necesito que me den una cita lo antes posible',
      expectedClinic: true,
      expectedType: 'pedir_cita_agendar',
    },

    // Consultas Generales
    {
      text: 'Necesito asesoramiento urgente para mi problema capilar',
      expectedClinic: true,
      expectedType: 'consulta_general',
    },

    // Medicación/Tratamiento
    {
      text: '¿Cuál es el costo del tratamiento tópico?',
      expectedClinic: true,
      expectedType: 'medicacion_tratamiento',
    },
    {
      text: '¿Qué medicinas recomienda para la caída de cabello?',
      expectedClinic: true,
      expectedType: 'medicacion_tratamiento',
    },

    // Injertos/Trasplante
    {
      text: '¿Cuánto cuesta un injerto de cabello?',
      expectedClinic: true,
      expectedType: 'injertos_trasplante',
    },
    {
      text: '¿Los trasplantes capilares son permanentes?',
      expectedClinic: true,
      expectedType: 'injertos_trasplante',
    },

    // Dudas/Preguntas
    {
      text: 'Tengo dudas sobre el procedimiento de trasplante',
      expectedClinic: true,
      expectedType: 'dudas_preguntas',
    },
    {
      text: '¿Cuáles son los efectos secundarios del tratamiento?',
      expectedClinic: true,
      expectedType: 'dudas_preguntas',
    },

    // Más Pedir Cita / Agendar
    {
      text: '¿Dónde puedo marcar una cita?',
      expectedClinic: true,
      expectedType: 'pedir_cita_agendar',
    },
    {
      text: 'Quiero reservar una consulta para este mes',
      expectedClinic: true,
      expectedType: 'pedir_cita_agendar',
    },

    // No son consultas clínicas
    {
      text: 'Muy buena explicación, gracias por compartir',
      expectedClinic: false,
      expectedType: 'no_aplica',
    },
    {
      text: 'Me encanta este contenido educativo',
      expectedClinic: false,
      expectedType: 'no_aplica',
    },
    {
      text: 'Excelente video, muy interesante',
      expectedClinic: false,
      expectedType: 'no_aplica',
    },
  ];

  console.log(`📝 Procesando ${testComments.length} comentarios con Jev...\n`);

  // Extraer solo los textos para clasificar
  const commentTexts = testComments.map((c) => c.text);

  // Clasificar con Jev
  const classifications = await classifyCommentsBatch(commentTexts, 800);

  // Mostrar resultados
  let correctClinic = 0;
  let correctType = 0;
  let totalClinic = 0;

  for (let i = 0; i < testComments.length; i++) {
    const test = testComments[i];
    const result = classifications[i];

    const clinicEmoji = result.is_clinic_inquiry ? '🏥' : '💬';
    const match = result.is_clinic_inquiry === test.expectedClinic ? '✅' : '❌';
    const typeMatch =
      result.inquiry_type === test.expectedType ? '✅' : '❌';

    console.log(`${match} ${clinicEmoji} COMENTARIO: "${test.text.substring(0, 50)}..."`);
    console.log(
      `   Resultado: ${result.is_clinic_inquiry ? 'CLÍNICA' : 'OTRO'} (${(result.confidence * 100).toFixed(1)}%)`
    );
    console.log(`   Tipo: ${result.inquiry_type || 'N/A'}`);
    console.log(`   Esperado: ${test.expectedClinic ? 'CLÍNICA' : 'OTRO'} → ${test.expectedType}`);
    console.log('');

    if (result.is_clinic_inquiry === test.expectedClinic) {
      correctClinic++;
    }
    if (result.inquiry_type === test.expectedType) {
      correctType++;
    }
    if (result.is_clinic_inquiry) {
      totalClinic++;
    }
  }

  console.log('='.repeat(70));
  console.log('\n📊 RESULTADOS:\n');
  console.log(`Total comentarios: ${testComments.length}`);
  console.log(
    `Precisión clasificación clínica: ${((correctClinic / testComments.length) * 100).toFixed(1)}% (${correctClinic}/${testComments.length})`
  );
  console.log(
    `Precisión tipo de consulta: ${((correctType / testComments.length) * 100).toFixed(1)}% (${correctType}/${testComments.length})`
  );
  console.log(`Consultas clínicas detectadas: ${totalClinic}/${testComments.length}`);

  console.log('\n' + '='.repeat(70));
  console.log('✅ Test completado!\n');
}

testFullClassification().catch(console.error);
