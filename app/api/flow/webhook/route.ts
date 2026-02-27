import { NextResponse } from "next/server";

export async function POST(req: Request) {

  const body = await req.text();

  console.log("FLOW WEBHOOK:", body);

  return NextResponse.json({ received: true });

}