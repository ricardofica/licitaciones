"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { 
  LucideCheckCircle, 
  LucideAlertTriangle, 
  LucideShieldAlert, 
  LucideInfo, 
  LucideLoader2,
  LucideArrowLeft,
  LucideFileText
} from "lucide-react";

interface Risk {
  titulo: string;
  explicacion: string;
  clausula_original: string;
  redaccion_alternativa: string;
  gravedad: "Bajo" | "Medio" | "Alto" | "Crítico";
}

interface AnalysisResult {
  es_valido: boolean;
  resumen: string;
  score_cumplimiento: number;
  conteo_riesgos: {
    bajo: number;
    medio: number;
    alto: number;
    critico: number;
  };
  riesgos: Risk[];
}

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");

    if (!token) {
      router.replace("/dashboard/cancel");
      return;
    }

    const runAudit = async () => {
      try {
        // 1. Verificar status
        const statusRes = await fetch(`/api/flow/status?token=${token}`);
        const statusData = await statusRes.json();

        if (statusData.status !== 2) {
          router.replace("/dashboard/cancel");
          return;
        }

        setVerifying(false);

        // 2. Ejecutar auditoría
        const auditRes = await fetch("/api/flow/verify-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const auditData = await auditRes.json();

        if (auditData.success) {
          setAnalysis(auditData.analysis);
        } else {
          setError(auditData.error || "No se pudo completar la auditoría.");
        }
      } catch (err) {
        console.error(err);
        setError("Error de conexión al procesar la auditoría.");
      } finally {
        setLoading(false);
      }
    };

    runAudit();
  }, [params, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] p-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <LucideLoader2 className="mb-4 h-12 w-12 animate-spin text-emerald-500" />
          <h2 className="text-xl font-semibold text-slate-800">
            {verifying ? "Confirmando Pago..." : "Ejecutando Auditoría Senior..."}
          </h2>
          <p className="mt-2 text-slate-500">
            {verifying 
              ? "Estamos validando tu transacción con Flow." 
              : "Nuestro Auditor IA está analizando las cláusulas según la normativa chilena."}
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] p-4 text-center">
        <LucideShieldAlert className="mb-4 h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-bold text-slate-900">Algo salió mal</h2>
        <p className="mt-2 max-w-md text-slate-600">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-8 flex items-center rounded-lg bg-slate-900 px-6 py-3 font-medium text-white transition-all hover:bg-slate-800"
        >
          <LucideArrowLeft className="mr-2 h-4 w-4" />
          Volver al Inicio
        </button>
      </div>
    );
  }

  const getGravedadColor = (gravedad: string) => {
    switch (gravedad) {
      case "Crítico": return "bg-red-100 text-red-700 border-red-200";
      case "Alto": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Medio": return "bg-amber-100 text-amber-700 border-amber-200";
      case "Bajo": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getGravedadIcon = (gravedad: string) => {
    switch (gravedad) {
      case "Crítico": return <LucideShieldAlert className="h-5 w-5" />;
      case "Alto": return <LucideAlertTriangle className="h-5 w-5" />;
      case "Medio": return <LucideInfo className="h-5 w-5" />;
      case "Bajo": return <LucideCheckCircle className="h-5 w-5" />;
      default: return <LucideFileText className="h-5 w-5" />;
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20 pt-12">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div>
            <div className="mb-4 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <LucideCheckCircle className="mr-1.5 h-3.5 w-3.5" />
              Auditoría Completada
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              Resultado de la <span className="text-emerald-600">Auditoría</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              Análisis realizado bajo la normativa del Código Civil, Código de Comercio y Ley 19.496.
            </p>
          </div>
          
          <div className="mt-8 flex flex-col items-center md:mt-0 md:items-end">
            <div className="flex items-baseline">
              <span className={`text-6xl font-black ${analysis?.score_cumplimiento! < 50 ? 'text-red-600' : 'text-emerald-600'}`}>
                {analysis?.score_cumplimiento}%
              </span>
            </div>
            <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Score de Cumplimiento</span>
          </div>
        </div>

        {/* Resumen Ejecutivo */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="col-span-1 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
            <div>
              <h3 className="mb-4 flex items-center font-bold text-slate-900">
                <LucideFileText className="mr-2 h-5 w-5 text-emerald-500" />
                Resumen del Auditor
              </h3>
              <p className="leading-relaxed text-slate-600">
                {analysis?.resumen}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 font-bold text-slate-900">Hallazgos por Gravedad</h3>
            <div className="space-y-4">
              {[
                { label: "Crítico", count: analysis?.conteo_riesgos.critico, color: "bg-red-500" },
                { label: "Alto", count: analysis?.conteo_riesgos.alto, color: "bg-orange-500" },
                { label: "Medio", count: analysis?.conteo_riesgos.medio, color: "bg-amber-500" },
                { label: "Bajo", count: analysis?.conteo_riesgos.bajo, color: "bg-blue-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`mr-3 h-2.5 w-2.5 rounded-full ${item.color}`} />
                    <span className="text-sm font-medium text-slate-600">{item.label}</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Riesgos Detallados */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Detalle de Hallazgos</h2>
          {analysis?.riesgos.map((risk, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <span className={`flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getGravedadColor(risk.gravedad)}`}>
                    {getGravedadIcon(risk.gravedad)}
                    <span className="ml-1.5">{risk.gravedad}</span>
                  </span>
                  <h3 className="font-bold text-slate-900">{risk.titulo}</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Análisis del Riesgo</h4>
                  <p className="text-sm leading-relaxed text-slate-600">{risk.explicacion}</p>
                  
                  <div className="mt-6">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Cláusula Original</h4>
                    <div className="rounded-lg bg-slate-50 p-4 font-mono text-xs text-slate-500">
                      "{risk.clausula_original}"
                    </div>
                  </div>
                </div>
                
                <div className="bg-emerald-50/30 p-6">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-600">Redacción Alternativa Sugerida</h4>
                  <p className="text-sm leading-relaxed text-slate-700 italic">
                    {risk.redaccion_alternativa}
                  </p>
                  <div className="mt-4 flex items-center text-xs font-medium text-emerald-700">
                    <LucideShieldAlert className="mr-1.5 h-3.5 w-3.5" />
                    Esta redacción protege tus derechos irrenunciables.
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Action */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={() => router.push("/")}
            className="flex items-center rounded-xl bg-slate-900 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-slate-800 active:scale-95"
          >
            <LucideArrowLeft className="mr-2 h-5 w-5" />
            Auditar otro documento
          </button>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <LucideLoader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
