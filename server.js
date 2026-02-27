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

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor funcionando en puerto ${PORT}`);
});

app.use(express.static('.')); // Esto sirve el archivo index.html automáticamente