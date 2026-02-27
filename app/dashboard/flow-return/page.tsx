"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LucideLoader2 } from "lucide-react";

function FlowReturnContent() {

  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {

    const token = params.get("token");

    if (!token) {
      router.replace("/dashboard/cancel");
      return;
    }

    async function checkStatus() {

      try {

        const res = await fetch(`/api/flow/status?token=${token}`);

        if (!res.ok) {
          router.replace("/dashboard/error");
          return;
        }

        const data = await res.json();

        switch (data.status) {

          case 2:
            router.replace("/dashboard/success");
            break;

          case 3:
          case 4:
            router.replace("/dashboard/cancel");
            break;

          default:
            router.replace("/dashboard/error");
        }

      } catch {
        router.replace("/dashboard/error");
      }

    }

    checkStatus();

  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
      <LucideLoader2 className="animate-spin text-emerald-500" size={48} />
      <p className="ml-4 text-slate-700">Verificando pago...</p>
    </div>
  );
}

export default function FlowReturn() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <LucideLoader2 className="animate-spin text-emerald-500" size={48} />
        <p className="ml-4 text-slate-700">Cargando...</p>
      </div>
    }>
      <FlowReturnContent />
    </Suspense>
  );
}