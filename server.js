require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json());

// CONFIGURACIÓN DE IA
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// BASE DE DATOS TEMPORAL (En memoria, se borra al reiniciar el servidor)
let usuariosDummy = {
    "tu_correo@ejemplo.com": { credits: 10 }
};

console.log("⚠️ MODALIDAD: Ejecutando sin MongoDB (Créditos locales)");

// RUTA PARA COMPRAR CRÉDITOS
app.post('/api/comprar-creditos', (req, res) => {
    const { email, cantidad } = req.body;
    if (!usuariosDummy[email]) usuariosDummy[email] = { credits: 0 };
    usuariosDummy[email].credits += cantidad;
    res.json({ mensaje: "Créditos actualizados localmente", total: usuariosDummy[email].credits });
});

// RUTA PARA ANALIZAR CON IA
app.post('/api/analizar', async (req, res) => {
    const { email, bases, oferta } = req.body;
    try {
        const user = usuariosDummy[email];
        
        if (!user || user.credits <= 0) {
            return res.status(403).json({ error: "No tienes créditos o el email no existe." });
        }

        const systemInstruction = `
            Eres "SaaS-Builder GPT: Chile Edition", un CTO experto en Micro-SaaS y arquitectura legal-tech enfocada en el mercado chileno. 
            Tu misión es guiar al usuario en la creación de una App de auditoría de contratos que cumpla con la normativa de la República de Chile.

            PRINCIPIOS OPERATIVOS:
            1. Pensamiento Lean & Local: Prioriza el MVP para validar el mercado en Chile. Usa herramientas de bajo costo e integra soluciones como Flow.cl o Mercado Pago.
            2. Cumplimiento Normativo: Aplica criterios basados en el Código Civil Chileno, Ley 18.101 (Arriendo), Ley 19.496 (Consumidor) y Ley 21.461 (Devuélveme mi Casa).
            3. Arquitectura de Ingresos: Propón modelos en CLP, sugiriendo "Packs de Créditos" para evitar fricción bancaria.
            4. Privacidad: Cumple con la Ley 19.628 (Protección de la vida privada).

            FORMATO DE RESPUESTA:
            - Análisis de Viabilidad: Evalúa el dolor real (notarías, riesgos de arriendo).
            - Lógica de Ingeniería: Estructura de DB y API enfocada en OCR.
            - Código Limpio: Snippets en JS con comentarios claros.
            - Estrategia de Pago: Flujo con Flow.cl para aceptar Webpay.

            Actúa como un socio técnico directo, con ingenio chileno y orientado a generar dividendos reales.
            
            
            Actúa además como un Auditor Jurídico Senior especializado en la normativa vigente en Chile (Código Civil, Código de Comercio y Ley 19.496 de Protección al Consumidor).
                ​Objetivo: Evaluar la validez de las cláusulas basándote en la irrenunciabilidad de derechos. Un contrato simple no es un contrato deficiente.
                ​Reglas de Scoring (Escala 0-100%):
                ​Detección de Nulidad (Crítico): Si el contrato contiene renuncias a derechos irrenunciables (ej: garantía legal, derecho a retracto cuando aplica, o exención de responsabilidad por dolo/culpa grave), el score debe caer automáticamente por debajo del 50%.
                ​Silencio Legal (Neutral): No penalices la ausencia de cláusulas que no son obligatorias por ley. Si una materia no está mencionada, asume que rige el Derecho Supletorio (lo que dice la ley general). El score debe mantenerse sobre el 90% si el fondo es legal.
                ​Transparencia Tributaria (Alto): Todo contrato de compraventa comercial debe permitir o mencionar la emisión de boleta o factura. Si se prohíbe explícitamente, baja el score al 60%.
                ​Equilibrio de Poder (Medio): Identifica cláusulas abusivas (modificaciones unilaterales de precio o condiciones). Si existen, califica como hallazgo Medio y ajusta el score a un 80% máximo.
            
            Incluye el siguiente Protocolo de Validación Final:
                Criterio de Suficiencia: Si el contrato ya cumple con las normas imperativas (Garantía Legal Art. 20 Ley 19.496, escrituración de partes y objeto, y obligación tributaria), no solicites nuevas correcciones de fondo.
                Diferenciación de Hallazgos: Si el score es, el agente debe emitir un dictamen de "CONFORMIDAD LEGAL". Cualquier observación adicional debe etiquetarse estrictamente como "Sugerencia de Optimización Comercial" y no como una "Corrección Necesaria".
                Prohibición de Redundancia: Si el usuario presenta un texto que ya integra tus recomendaciones anteriores, valida la integración y confirma que el riesgo ha sido mitigado en lugar de buscar nuevas variaciones de redacción.
                Anclaje Normativo: No penalices la brevedad. En Chile, un contrato es válido por el solo consentimiento de las partes (consensual) sobre objeto y precio. Si estos están claros y no hay cláusulas abusivas, el score debe ser máximo.
                `;

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: systemInstruction,
            generationConfig: {
                temperature: 0.7, // Equilibrio entre creatividad e ingenio técnico
                topP: 0.95,
            }
        });

        const prompt = `Actúa como experto en licitaciones de Mercado Público Chile. 
        Analiza si esta OFERTA cumple con las BASES. 
        BASES: ${bases} 
        OFERTA: ${oferta}`;

        const result = await model.generateContent(prompt);
        user.credits -= 1;

        res.json({ analisis: result.response.text(), creditosRestantes: user.credits });
    } catch (error) {
        console.error("Error en IA:", error);
        res.status(500).json({ error: "Error al procesar con Gemini. Revisa tu API KEY." });
    }
});

const PORT = process.env.PORT || 8080; // Cloud Run usa 8080
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor en la nube de Google corriendo en el puerto ${PORT}`);
});

app.use(express.static('.')); // Esto sirve el archivo index.html automáticamente