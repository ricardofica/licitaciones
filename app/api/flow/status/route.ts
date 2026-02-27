import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token)
    return NextResponse.json({ error: "no token" }, { status: 400 });

  const apiKey = process.env.FLOW_API_KEY!;
  const secretKey = process.env.FLOW_SECRET_KEY!;

  const stringToSign =
    `apiKey${apiKey}token${token}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(stringToSign)
    .digest("hex");

  const res = await fetch(
    `https://sandbox.flow.cl/api/payment/getStatus?apiKey=${apiKey}&token=${token}&s=${signature}`
  );

  const data = await res.json();

  return NextResponse.json(data);
}