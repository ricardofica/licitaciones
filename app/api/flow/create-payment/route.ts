import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { storeTempDocument } from '@/lib/temp-storage';

export async function POST(req: Request) {
  try {

    const { base64Data, mimeType, fileName, email } = await req.json();

    const apiKey = process.env.FLOW_API_KEY?.trim();
    const secretKey = process.env.FLOW_SECRET_KEY?.trim();
    const host = req.headers.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    // const baseURL = `${protocol}://${host}`;
    const baseURL =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_URL ||
      process.env.APP_URL ||
      "https://auditoria.nexusai.cl";

    if (!apiKey || !secretKey || !baseURL) {
      return NextResponse.json(
        { error: "Variables FLOW_API_KEY, FLOW_SECRET_KEY o la URL base no configuradas correctamente." },
        { status: 500 }
      );
    }

    const commerceOrder = `audit_${Date.now()}`;
    const amount = 5990;

    storeTempDocument(commerceOrder, {
      base64Data,
      mimeType,
      fileName,
      email
    });

    const params: Record<string, string | number> = {
      apiKey,
      commerceOrder,
      subject: "Auditoria Legal AI",
      currency: "CLP",
      amount,
      email: email || "contacto@nexusai.cl",
      urlConfirmation: `${baseURL}/api/flow/webhook`,
      urlReturn: `${baseURL}/api/flow/return`,
      //urlCancel: `${baseURL}/dashboard/cancel`
    };

    const sortedKeys = Object.keys(params).sort();

    const stringToSign = sortedKeys
      .map(key => `${key}${params[key]}`)
      .join('');

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(stringToSign)
      .digest('hex');

    const formData = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    formData.append("s", signature);

    const response = await fetch(
      "https://sandbox.flow.cl/api/payment/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: 500 });
    }

    return NextResponse.json({
      flowUrl: `${data.url}?token=${data.token}`
    });

  } catch (error) {

    console.error("FLOW CREATE ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );

  }
}
