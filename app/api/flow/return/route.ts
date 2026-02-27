import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const base =
  process.env.NEXT_PUBLIC_URL ||
  "https://auditoria.nexusai.cl";

function redirect303(url: string) {

  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: url,
    },
  });

}

export async function POST(req: Request) {

  const form = await req.formData();
  const token = form.get("token")?.toString();

  if (!token)
    return redirect303(`${base}/dashboard/cancel`);

  return redirect303(
    `${base}/dashboard/success?token=${token}`
  );

}

export async function GET(req: Request) {

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token)
    return redirect303(`${base}/dashboard/cancel`);

  return redirect303(
    `${base}/dashboard/success?token=${token}`
  );

}