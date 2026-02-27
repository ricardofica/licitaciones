import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_PROMPT = `Actúa como un abogado senior con más de 20 años de trayectoria intachable en el derecho chileno, socio principal de una prestigiosa firma. Tu reputación se basa en la precisión quirúrgica y la protección total de tus clientes.

Tu tarea es realizar una auditoría legal exhaustiva de cualquier tipo de contrato o documento legal chileno (civil, comercial, laboral, arriendo, servicios, etc.).

METODOLOGÍA:
1. VALIDACIÓN: Determina si el documento es procesable legalmente.
2. ANÁLISIS DE RIESGOS: Evalúa el texto frente a toda la legislación chilena vigente y relevante para el tipo de contrato (Código Civil, Ley de Protección al Consumidor, Ley de Arriendo, Código del Trabajo, Ley de Propiedad Intelectual, Ley de Sociedades, etc.).
3. DETECCIÓN: Identifica al menos 5 riesgos críticos si existieran. Si hay menos, identifica los más relevantes hasta completar el análisis.
4. CLASIFICACIÓN: Categoriza cada riesgo como: Bajo, Medio, Alto o Crítico.
5. RESUMEN EJECUTIVO: Proporciona un conteo total de riesgos por cada categoría.

PROTOCOLO DE VALIDACIÓN FINAL:
- Criterio de Suficiencia: Si el contrato ya cumple con las normas imperativas (Garantía Legal Art. 20 Ley 19.496, escrituración de partes y objeto, y obligación tributaria), no solicites nuevas correcciones de fondo.
- Diferenciación de Hallazgos: Si el score es 100%, emite un dictamen de "CONFORMIDAD LEGAL". Cualquier observación adicional debe etiquetarse estrictamente como "Sugerencia de Optimización Comercial" y no como una "Corrección Necesaria".
- Prohibición de Redundancia: Si el usuario presenta un texto que ya integra tus recomendaciones anteriores, valida la integración y confirma que el riesgo ha sido mitigado en lugar de buscar nuevas variaciones de redacción.
- Anclaje Normativo y Brevedad: No penalices la brevedad ni la ausencia de cláusulas opcionales (como arbitraje o PI) si no son requisitos de validez. En Chile, un contrato es válido por el solo consentimiento sobre objeto y precio. Si estos están claros y no hay cláusulas abusivas, el score debe ser máximo.
- Fuentes de Verdad: Valida siempre utilizando como base la Biblioteca del Congreso Nacional (Ley Chile), específicamente el Código Civil, la Ley 19.496, el Código del Trabajo y la Ley de Arriendo.
- Interpretación de Silencios: Rige la autonomía de la voluntad (lo que no está prohibido es permitido). Si una cláusula es inusual pero legal, no bajes el score; etiquétala como "Nota de Atención".

TONO: Profesional, autoritario, sofisticado pero comprensible para un cliente no abogado.

Responde estrictamente en formato JSON.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    es_valido: { type: Type.BOOLEAN },
    mensaje_error: { type: Type.STRING },
    resumen: { type: Type.STRING },
    score_cumplimiento: { type: Type.NUMBER },
    conteo_riesgos: {
      type: Type.OBJECT,
      properties: {
        bajo: { type: Type.INTEGER },
        medio: { type: Type.INTEGER },
        alto: { type: Type.INTEGER },
        critico: { type: Type.INTEGER }
      },
      required: ["bajo", "medio", "alto", "critico"]
    },
    riesgos: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          titulo: { type: Type.STRING },
          explicacion: { type: Type.STRING },
          clausula_original: { type: Type.STRING },
          redaccion_alternativa: { type: Type.STRING },
          gravedad: { type: Type.STRING, description: "Bajo, Medio, Alto o Crítico" }
        },
        required: ["titulo", "explicacion", "clausula_original", "redaccion_alternativa", "gravedad"]
      }
    }
  },
  required: ["es_valido", "resumen", "score_cumplimiento", "conteo_riesgos", "riesgos"]
};

export async function analyzeContract(base64Data: string, mimeType: string, isPremium: boolean = false) {
  const genAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
  
  const promptText = isPremium 
    ? "Analiza este documento legal chileno de forma EXHAUSTIVA. Proporciona redacciones alternativas detalladas y blindadas para cada riesgo detectado."
    : "Analiza este documento legal chileno. Identifica los riesgos principales.";

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            { text: promptText }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Error en auditoría legal:", error);
    throw error;
  }
}
