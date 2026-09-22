import axios from 'axios';
import { config } from './config.js';

export interface JevDecision {
  is_clinic_inquiry: boolean;
  inquiry_type?: string; // Type: pedir_cita_agendar, medicacion_tratamiento, injertos_trasplante, consulta_general, dudas_preguntas, no_aplica
  confidence: number;
  reasoning?: string;
}

export interface JevResponse {
  is_clinic_inquiry: boolean;
  inquiry_type?: string; // pedir_cita_agendar, medicacion_tratamiento, injertos_trasplante, consulta_general, dudas_preguntas, no_aplica
  confidence: number;
}

/**
 * Classifies a comment using TypeSafe Jev model via OpenRouter
 * Jev is a decision model that returns structured typed outputs with confidence scores
 */
export async function classifyComment(commentText: string): Promise<JevDecision> {
  try {
    // Jev requires /alpha/decisions endpoint
    const endpoint = 'https://openrouter.ai/api/alpha/decisions';
    
    const response = await axios.post(
      endpoint,
      {
        model: config.openrouter.model, // ~typesafe/jev-latest
        state: commentText,
        questions: {
          // Pregunta 1: ¿Es consulta clínica?
          is_clinic_inquiry: {
            type: 'choice',
            instructions: '¿Es este comentario una consulta clínica de un potencial paciente? ¿Pregunta sobre tratamientos capilares, injertos, medicación, citas o asesoramiento?',
            choices: ['positive_signal', 'negative_signal'],
            criteria: {
              positive_signal: 'Pregunta sobre tratamientos, citas, precios, injertos, medicación, consultas clínicas',
              negative_signal: 'Es solo un comentario positivo o negativo sobre el video, sin consultas clínicas',
            },
          },
          // Pregunta 2: ¿Qué tipo de consulta?
          inquiry_type: {
            type: 'choice',
            instructions: 'Si es consulta: ¿Quiere pedir cita/agendar, preguntar sobre medicación, injertos, consulta general o dudas? Si NO, "no_aplica"',
            choices: ['pedir_cita_agendar', 'medicacion_tratamiento', 'injertos_trasplante', 'consulta_general', 'dudas_preguntas', 'no_aplica'],
            criteria: {
              pedir_cita_agendar: 'Quiere agendar una cita, pedir una cita, marcar hora, reservar consulta - ACCIÓN DIRECTA',
              medicacion_tratamiento: 'Pregunta sobre medicamentos o tratamientos tópicos',
              injertos_trasplante: 'Pregunta sobre injertos, trasplantes capilares o procedimientos quirúrgicos',
              consulta_general: 'Solicita asesoramiento sin especificar tipo o acción',
              dudas_preguntas: 'Tiene dudas o preguntas sobre el procedimiento, resultados, efectos',
              no_aplica: 'No es una consulta clínica',
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${config.openrouter.apiKey}`,
          'HTTP-Referer': 'https://youtube-clinic-classifier.local',
          'X-OpenRouter-Title': 'YouTube Clinic Classifier',
        },
      }
    );

    // Jev decisions endpoint returns structured decision with choice objects
    const answers = response.data.answers || {};
    
    const clinicAnswer = answers.is_clinic_inquiry;
    const isClinic = clinicAnswer === 'positive_signal' || 
                     (typeof clinicAnswer === 'object' && clinicAnswer.choice === 'positive_signal');
    
    const inquiryTypeObj = answers.inquiry_type || {};
    const inquiryType = typeof inquiryTypeObj === 'object' ? inquiryTypeObj.choice : inquiryTypeObj;
    
    // Extract confidence scores from choice objects
    const clinicConfidence = typeof clinicAnswer === 'object' ? 
                            (clinicAnswer.confidence || 0.8) : 0.8;
    const typeConfidence = typeof inquiryTypeObj === 'object' ? 
                          (inquiryTypeObj.confidence || 0.8) : 0.8;

    // Normalize confidence to 0-1 range
    const normalizedConfidence = Math.min(Math.max(clinicConfidence, 0), 1);
    
    return {
      is_clinic_inquiry: isClinic,
      inquiry_type: inquiryType || 'no_aplica',
      confidence: normalizedConfidence,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('OpenRouter API Error:', {
        status: error.response?.status,
        message: error.response?.data?.error?.message,
      });
    } else {
      console.error('Error:', error instanceof Error ? error.message : error);
    }
    // Return neutral result on error
    return {
      is_clinic_inquiry: false,
      confidence: 0.5,
    };
  }
}

/**
 * Classifies multiple comments with rate limiting to avoid API throttling
 */
export async function classifyCommentsBatch(
  comments: string[],
  delayMs: number = 500
): Promise<JevDecision[]> {
  const results: JevDecision[] = [];

  for (let i = 0; i < comments.length; i++) {
    try {
      console.log(`Classifying comment ${i + 1}/${comments.length}...`);
      const result = await classifyComment(comments[i]);
      results.push(result);

      // Add delay between requests to avoid rate limiting
      if (i < comments.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Error classifying comment ${i + 1}:`, error);
      // Return a neutral result in case of error
      results.push({
        is_clinic_inquiry: false,
        confidence: 0,
      });
    }
  }

  return results;
}
