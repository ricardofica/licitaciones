'use client';

import React, { useState } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { analyzeContract } from '@/lib/gemini';
import { LucideShieldAlert, LucideCheckCircle, LucideLock, LucideZap, LucideLoader2 } from 'lucide-react';

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [uploadedFileData, setUploadedFileData] = useState<{ base64Data: string; mimeType: string; fileName: string } | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setIsUnlocked(false);
    setUploadedFileData(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(file);
      const base64Data = await base64Promise;
      
      // Almacenar los datos del archivo para usarlos en el pago si el usuario decide desbloquear
      setUploadedFileData({ base64Data, mimeType: file.type, fileName: file.name });

      // Realizar el análisis inicial (gratuito) para mostrar el resumen y riesgos
      const initialAnalysisResult = await analyzeContract(base64Data, file.type);

      if (!initialAnalysisResult.es_valido) {
        setError(initialAnalysisResult.mensaje_error || 'El documento subido no parece ser un contrato o documento legal procesable por nuestra IA.');
        setAnalysisResult(null);
        setUploadedFileData(null);
        return;
      }

      setAnalysisResult(initialAnalysisResult);

    } catch (err) {
      setError('Error al procesar el documento para la vista previa. Intenta nuevamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockSuggestions = async () => {
    if (!uploadedFileData) {
      setError('No hay documento cargado para desbloquear.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/flow/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data: uploadedFileData.base64Data,
          mimeType: uploadedFileData.mimeType,
          fileName: uploadedFileData.fileName,
          email: "contacto@nexusai.cl",
        }),
      });

      const data = await response.json();

      if (response.ok && data.flowUrl) {
        console.log("Redirigiendo a Flow...", data.flowUrl);
        // Redirección directa
        window.location.href = data.flowUrl;
      } else {
        const errorMessage = data.error || 'Error al iniciar el proceso de pago con Flow.';
        const errorDetails = data.details ? ` (${JSON.stringify(data.details)})` : '';
        setError(`${errorMessage}${errorDetails}`);
      }
    } catch (err) {
      setError('Error al conectar con el servicio de pago. Intenta nuevamente.');
      console.error(err);
    } finally {
      // Importante: No ponemos isLoading(false) si vamos a redirigir
      // para evitar que el usuario haga clic de nuevo mientras carga Webpay
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen flex-col items-center p-4 md:p-12 bg-[#F8FAFC]"
    >
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-widest text-emerald-700 uppercase bg-emerald-100 rounded-full"
          >
            SaaS Legal-Tech Chile
          </motion.div>
          <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Auditoría Legal <span className="text-emerald-600">con IA</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Sube tu contrato o documento legal y nuestra IA lo auditará según la normativa chilena.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm font-medium">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800">Código Civil</span>
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-800">Ley de Arriendo</span>
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800">Ley del Consumidor</span>
            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">Ley Devuélveme mi Casa</span>
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800">Otras Normativas</span>
          </div>
        </div>

        {/* File Upload / Analysis Section */}
        <AnimatePresence mode="wait">
          {(!analysisResult && !isLoading) && (
            <motion.div
              key="upload-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center"
            >
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors duration-200"
              >
                <LucideZap className="w-12 h-12 text-emerald-500 mb-4" />
                <p className="text-lg font-semibold text-slate-800">Arrastra tu documento aquí</p>
                <p className="text-sm text-slate-500 mt-1">o haz clic para seleccionar (PDF, DOCX, JPG, PNG)</p>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </label>
            </motion.div>
          )}

          {isLoading && (
            <motion.div
              key="loading-section"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-12"
            >
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-slate-500 font-medium animate-pulse">Analizando tu contrato...</p>
            </motion.div>
          )}

          {analysisResult && !isUnlocked && (
            <motion.div
              key="preview-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Score Card & Risk Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${analysisResult.score_cumplimiento > 70 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    <LucideShieldAlert size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Score Legal</p>
                    <p className="text-2xl font-black text-slate-900">{analysisResult.score_cumplimiento}%</p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 text-center">Resumen de Hallazgos</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <p className="text-lg font-black text-slate-900">{analysisResult.conteo_riesgos.bajo}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Bajo</p>
                    </div>
                    <div className="text-center border-l border-slate-100">
                      <p className="text-lg font-black text-amber-500">{analysisResult.conteo_riesgos.medio}</p>
                      <p className="text-[9px] font-bold text-amber-500/70 uppercase">Medio</p>
                    </div>
                    <div className="text-center border-l border-slate-100">
                      <p className="text-lg font-black text-orange-500">{analysisResult.conteo_riesgos.alto}</p>
                      <p className="text-[9px] font-bold text-orange-500/70 uppercase">Alto</p>
                    </div>
                    <div className="text-center border-l border-slate-100">
                      <p className="text-lg font-black text-red-600">{analysisResult.conteo_riesgos.critico}</p>
                      <p className="text-[9px] font-bold text-red-600/70 uppercase">Crítico</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Dictamen del Experto</p>
                  <p className="text-slate-700 leading-relaxed italic">&quot;{analysisResult.resumen}&quot;</p>
                </div>
              </div>

              {/* Risks List (Preview - without suggestions) */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 flex items-center">
                  <LucideShieldAlert className="mr-2 text-red-600" />
                  Riesgos Detectados
                </h3>
                
                {analysisResult.riesgos.map((riesgo: any, index: number) => (
                  <div key={index} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-slate-900">{index + 1}. {riesgo.titulo}</h4>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          riesgo.gravedad.toLowerCase() === 'crítico' ? 'bg-red-600 text-white' : 
                          riesgo.gravedad.toLowerCase() === 'alto' ? 'bg-orange-100 text-orange-600' :
                          riesgo.gravedad.toLowerCase() === 'medio' ? 'bg-amber-100 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {riesgo.gravedad}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Unlock Button */}
              <motion.button
                onClick={handleUnlockSuggestions}
                className="w-full flex items-center justify-center px-8 py-4 bg-emerald-600 text-white text-lg font-bold rounded-2xl shadow-lg hover:bg-emerald-700 transition-colors duration-200 mt-8"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <LucideLoader2 className="animate-spin mr-2" size={20} />
                ) : (
                  <LucideZap className="mr-2" size={20} />
                )}
                Desbloquea todas las reparaciones detectadas por $5.990 (CLP)
              </motion.button>
            </motion.div>
          )}

          {analysisResult && isUnlocked && (
            <motion.div
              key="full-analysis-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Score Card & Risk Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${analysisResult.score_cumplimiento > 70 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    <LucideShieldAlert size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Score Legal</p>
                    <p className="text-2xl font-black text-slate-900">{analysisResult.score_cumplimiento}%</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 text-center">Resumen de Hallazgos</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <p className="text-lg font-black text-slate-900">{analysisResult.conteo_riesgos.bajo}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Bajo</p>
                    </div>
                    <div className="text-center border-l border-slate-100">
                      <p className="text-lg font-black text-amber-500">{analysisResult.conteo_riesgos.medio}</p>
                      <p className="text-[9px] font-bold text-amber-500/70 uppercase">Medio</p>
                    </div>
                    <div className="text-center border-l border-slate-100">
                      <p className="text-lg font-black text-orange-500">{analysisResult.conteo_riesgos.alto}</p>
                      <p className="text-[9px] font-bold text-orange-500/70 uppercase">Alto</p>
                    </div>
                    <div className="text-center border-l border-slate-100">
                      <p className="text-lg font-black text-red-600">{analysisResult.conteo_riesgos.critico}</p>
                      <p className="text-[9px] font-bold text-red-600/70 uppercase">Crítico</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Dictamen del Experto</p>
                  <p className="text-slate-700 leading-relaxed italic">&quot;{analysisResult.resumen}&quot;</p>
                </div>
              </div>

              {/* Risks List (Full) */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 flex items-center">
                  <LucideShieldAlert className="mr-2 text-red-600" />
                  Análisis Detallado de Riesgos
                </h3>
                
                {analysisResult.riesgos.map((riesgo: any, index: number) => (
                  <div key={index} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-bold text-slate-900">{riesgo.titulo}</h4>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          riesgo.gravedad.toLowerCase() === 'crítico' ? 'bg-red-600 text-white' : 
                          riesgo.gravedad.toLowerCase() === 'alto' ? 'bg-orange-100 text-orange-600' :
                          riesgo.gravedad.toLowerCase() === 'medio' ? 'bg-amber-100 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {riesgo.gravedad}
                        </span>
                      </div>
                      <p className="text-slate-600 mb-6">{riesgo.explicacion}</p>
                      
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Cláusula Original</p>
                          <p className="text-sm text-slate-700 italic">&quot;{riesgo.clausula_original}&quot;</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2">
                            <LucideCheckCircle className="text-emerald-500" size={20} />
                          </div>
                          <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Redacción Sugerida (Blindada)</p>
                          <p className="text-sm text-emerald-900 font-medium leading-relaxed">{riesgo.redaccion_alternativa}</p>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 text-center text-slate-500 text-sm"
        >
          Desarrollado por <a href="https://nexusai.cl/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold hover:underline">NexusAI Group</a> | Todos los derechos reservados
        </motion.footer>
      </div>
    </motion.main>
  );
}
