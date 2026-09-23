import axios from 'axios';
import { config } from './config.js';

// Subtipos posibles dentro de cada bloque
export const BLOQUE_A_SUBTIPOS = ['pedir_cita_agendar', 'lead_potencial', 'seguimiento_recontacto'] as const;
export const BLOQUE_B_SUBTIPOS = ['medicacion_tratamiento', 'injertos_trasplante', 'consulta_general', 'dudas_preguntas'] as const;

export interface JevDecision {
  is_clinic_inquiry: boolean;
  bloque?: 'caso_personal' | 'consulta_generica';
  inquiry_type?: string; // pedir_cita_agendar, lead_potencial, seguimiento_recontacto, medicacion_tratamiento, injertos_trasplante, consulta_general, dudas_preguntas, no_aplica
  /** Confianza de la pregunta 1 (¿es clínico en absoluto?) */
  confidence: number;
  /** Confianza del subtipo concreto (pregunta 3) — úsala para priorizar/filtrar leads por score */
  typeConfidence: number;
  reasoning?: string;
  /** true si el subtipo devuelto por JEV no encaja con el bloque devuelto por JEV (posible respuesta inconsistente, revisar a mano) */
  inconsistent?: boolean;
}

export interface JevResponse {
  is_clinic_inquiry: boolean;
  bloque?: 'caso_personal' | 'consulta_generica';
  inquiry_type?: string;
  confidence: number;
  typeConfidence: number;
}

/**
 * Classifies a comment using TypeSafe Jev model via OpenRouter
 * Jev is a decision model that returns structured typed outputs with confidence scores
 *
 * 3 preguntas encadenadas, de lo general a lo específico:
 * 1. is_clinic_inquiry — ¿es esto una consulta clínica en absoluto?
 * 2. bloque — ¿expone su propio caso (caso_personal) o es una pregunta que podría hacer cualquiera (consulta_generica)?
 * 3. inquiry_type — subtipo concreto dentro del bloque correspondiente
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
            instructions: '¿Es este comentario una consulta clínica de un potencial paciente, o es ruido (agradecimientos, humor, peticiones de otro vídeo, historias sin pedir nada, debates ajenos a su caso)?',
            choices: ['positive_signal', 'negative_signal'],
            criteria: {
              positive_signal:
                'Es una consulta clínica: pide cita, expone su propio caso pidiendo orientación, o describe su propio tratamiento activo con dudas o resultados insuficientes.',
              negative_signal:
                'No es consulta clínica. Incluye: agradecimientos o cumplidos sobre el vídeo, humor o bromas, historias familiares/personales contadas sin pedir nada, peticiones de que trate otro tema o invite a otro especialista en un futuro vídeo, debates técnicos ajenos a su propio caso, testimonios compartidos sin pedir opinión ni ayuda.',
            },
          },
          // Pregunta 2: ¿Caso personal o consulta genérica? (solo relevante si Q1 = positive_signal)
          bloque: {
            type: 'choice',
            instructions:
              'Si es consulta clínica: ¿expone su propia situación personal o pide algo para sí mismo, o es una pregunta genérica que podría hacer cualquiera sin contar su caso?',
            choices: ['caso_personal', 'consulta_generica'],
            criteria: {
              caso_personal:
                'Pide algo para sí mismo (cita, orientación, seguimiento), aunque no dé detalles clínicos — ej. "cómo consigo cita" cuenta como caso personal aunque no mencione edad ni síntomas. También cuenta si expone su propia edad/síntoma/historial.',
              consulta_generica:
                'Pregunta que podría hacer cualquiera, sin pedir nada para sí mismo. Incluye preguntas sobre el tratamiento, la opinión o el propio caso del DOCTOR/creador del vídeo (no del que comenta).',
            },
          },
          // Pregunta 3: subtipo concreto dentro del bloque
          inquiry_type: {
            type: 'choice',
            instructions:
              'Elige el subtipo más preciso. Tu elección DEBE pertenecer al mismo bloque que elegiste en la pregunta anterior: si el bloque es caso_personal, usa SOLO pedir_cita_agendar, lead_potencial o seguimiento_recontacto (nunca elijas medicacion_tratamiento, injertos_trasplante, consulta_general ni dudas_preguntas). Si el bloque es consulta_generica, usa SOLO medicacion_tratamiento, injertos_trasplante, consulta_general o dudas_preguntas (nunca elijas pedir_cita_agendar, lead_potencial ni seguimiento_recontacto). Si no es consulta clínica, usa no_aplica.',
            choices: [
              'pedir_cita_agendar',
              'lead_potencial',
              'seguimiento_recontacto',
              'medicacion_tratamiento',
              'injertos_trasplante',
              'consulta_general',
              'dudas_preguntas',
              'no_aplica',
            ],
            criteria: {
              pedir_cita_agendar: '[Bloque caso_personal] Pide cita o contacto directo para sí mismo ("cómo consigo cita", "tienes clínica").',
              lead_potencial:
                '[Bloque caso_personal] Expone su caso pidiendo orientación u opinión, O pide recomendación de clínica/especialista mencionando su ubicación u otro dato personal. Nunca ha sido paciente, no describe tratamiento activo con dosis. NO aplica si la pregunta es sobre el tratamiento o la opinión personal del propio doctor/creador del vídeo — en ese caso es consulta_generica.',
              seguimiento_recontacto:
                '[Bloque caso_personal] Ya está en tratamiento activo ÉL MISMO (fármaco + dosis + tiempo, ej. "llevo 2 años tomando dutasteride 0.5mg") y describe dudas, efectos secundarios o resultados insuficientes sobre SU PROPIO tratamiento. NO aplica si pregunta por el tratamiento del doctor/creador del vídeo.',
              medicacion_tratamiento: '[Bloque consulta_generica] Pregunta general sobre un medicamento (interacción, precio, mecanismo), sin caso propio.',
              injertos_trasplante: '[Bloque consulta_generica] Pregunta general sobre injertos o trasplantes (precio, candidatura, resultados), sin caso propio.',
              consulta_general:
                '[Bloque consulta_generica] Pide recomendación de clínica o especialista sin dar ningún dato personal, O pregunta sobre el tratamiento/opinión/caso propio del doctor o creador del vídeo.',
              dudas_preguntas: '[Bloque consulta_generica] Pregunta técnica o científica sobre el tema del vídeo, sin relación con su caso propio.',
              no_aplica: 'No es una consulta clínica.',
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

    const bloqueObj = answers.bloque || {};
    const bloque = (typeof bloqueObj === 'object' ? bloqueObj.choice : bloqueObj) as
      | 'caso_personal'
      | 'consulta_generica'
      | undefined;

    const inquiryTypeObj = answers.inquiry_type || {};
    let inquiryType = typeof inquiryTypeObj === 'object' ? inquiryTypeObj.choice : inquiryTypeObj;

    // Extract confidence scores from choice objects
    const clinicConfidence = typeof clinicAnswer === 'object' ?
                            (clinicAnswer.confidence || 0.8) : 0.8;
    const typeConfidence = typeof inquiryTypeObj === 'object' ?
                          (inquiryTypeObj.confidence || 0.8) : 0.8;

    // Normalize confidence to 0-1 range
    const normalizedConfidence = Math.min(Math.max(clinicConfidence, 0), 1);
    const normalizedTypeConfidence = Math.min(Math.max(typeConfidence, 0), 1);

    // Regla de código: si Q1 dice que NO es clínico, se ignora lo que respondan
    // bloque/subtipo (podrían ser respuestas forzadas sin sentido) y se fuerza no_aplica.
    if (!isClinic) {
      return {
        is_clinic_inquiry: false,
        bloque: undefined,
        inquiry_type: 'no_aplica',
        confidence: normalizedConfidence,
        typeConfidence: normalizedTypeConfidence,
      };
    }

    inquiryType = inquiryType || 'no_aplica';

    // Comprobación de consistencia: el subtipo debe pertenecer al bloque declarado
    const perteneceABloqueA = (BLOQUE_A_SUBTIPOS as readonly string[]).includes(inquiryType);
    const perteneceABloqueB = (BLOQUE_B_SUBTIPOS as readonly string[]).includes(inquiryType);
    const inconsistent =
      (bloque === 'caso_personal' && !perteneceABloqueA) ||
      (bloque === 'consulta_generica' && !perteneceABloqueB);

    return {
      is_clinic_inquiry: isClinic,
      bloque,
      inquiry_type: inquiryType,
      confidence: normalizedConfidence,
      typeConfidence: normalizedTypeConfidence,
      inconsistent,
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
      typeConfidence: 0.5,
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
        typeConfidence: 0,
      });
    }
  }

  return results;
}
