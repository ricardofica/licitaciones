import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getTempDocument, deleteTempDocument } from '@/lib/temp-storage';
import { analyzeContract } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    // Solo necesitamos el token que viene de la URL de éxito
    const { token } = await req.json();

    if (!token) {
      console.error("API Error: Token no proporcionado");
      return NextResponse.json({ error: "Token no proporcionado" }, { status: 400 });
    }

    const apiKey = process.env.FLOW_API_KEY?.trim();
    const secretKey = process.env.FLOW_SECRET_KEY?.trim();

    if (!apiKey || !secretKey) {
      console.error("API Error: Claves de Flow no configuradas");
      return NextResponse.json({ error: "Claves de API no configuradas." }, { status: 500 });
    }

    // 1. Preparar la firma para consultar a Flow
    const params: any = {
      apiKey: apiKey,
      token: token,
    };

    const sortedKeys = Object.keys(params).sort();
    const stringToSign = sortedKeys.map(key => `${key}${params[key]}`).join('');
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(stringToSign)
      .digest('hex');

    const FLOW_ENDPOINT = (process.env.FLOW_ENDPOINT || "https://sandbox.flow.cl").replace(/\/$/, "");

    // 2. Consultar a Flow por el estado real del pago
    console.log(`Consultando estado de pago para token: ${token}`);
    const flowResponse = await fetch(
      `${FLOW_ENDPOINT}/api/payment/getStatus?apiKey=${apiKey}&token=${token}&s=${signature}`
    );
    
    if (!flowResponse.ok) {
      throw new Error(`Error al conectar con Flow: ${flowResponse.statusText}`);
    }

    const flowData = await flowResponse.json();
    console.log("Respuesta de Flow:", JSON.stringify(flowData));

    // 3. Verificar si el pago fue aceptado (status 2 = Pagado)
    if (String(flowData.status) === '2') {
      
      // Recuperamos el ID de la orden que Flow nos devuelve
      const orderId = flowData.commerceOrder;
      const tempDoc = getTempDocument(orderId);

      if (!tempDoc) {
        console.error(`Documento no encontrado para la orden: ${orderId}. Es posible que la instancia de Cloud Run se haya reiniciado.`);
        return NextResponse.json({ 
          success: false, 
          error: "Documento no encontrado. Debido a las políticas de seguridad de la sesión, por favor intenta subir el archivo nuevamente." 
        }, { status: 404 });
      }

      // 4. EJECUTAR EL ANÁLISIS CON GEMINI
      console.log("Iniciando análisis con Gemini...");
      const fullAnalysis = await analyzeContract(
        tempDoc.base64Data, 
        tempDoc.mimeType, 
        true 
      );

      // 5. Limpiar memoria y responder
      deleteTempDocument(orderId);

      return NextResponse.json({ 
        success: true, 
        analysis: fullAnalysis 
      });

    } else {
      // El pago no está en estado 2
      const statusMap: any = { 1: "Pendiente", 3: "Rechazado", 4: "Anulado" };
      return NextResponse.json({ 
        success: false, 
        error: `El pago no fue completado. Estado: ${statusMap[flowData.status] || 'Desconocido'}`
      });
    }

  } catch (error: any) {
    console.error("Error crítico en verify-result:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Error interno al procesar la auditoría: " + error.message 
    }, { status: 500 });
  }
}