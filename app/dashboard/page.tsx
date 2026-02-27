export default function DashboardPage() {

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      <p className="mt-2 text-lg text-slate-600">
        Bienvenido a <strong className="font-semibold text-slate-800">Auditoría Legal AI</strong>, tu asistente experto para analizar contratos bajo la normativa chilena.
      </p>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-slate-900">Áreas Legales Cubiertas:</h2>
        <ul className="mt-4 grid grid-cols-1 gap-4 text-slate-700 md:grid-cols-2 lg:grid-cols-3">
          <li className="flex items-center">
            <span className="mr-2 text-emerald-500">•</span> Código Civil
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-emerald-500">•</span> Código de Comercio
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-emerald-500">•</span> Ley 19.496 (Protección al Consumidor)
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-emerald-500">•</span> Ley de Arriendo
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-emerald-500">•</span> Ley Devuélveme mi Casa
          </li>
          <li className="flex items-center">
            <span className="mr-2 text-emerald-500">•</span> Otras normativas relevantes
          </li>
        </ul>
      </div>

      <div className="mt-10">
        <a
          href="/dashboard/upload"
          className="inline-flex items-center rounded-xl bg-slate-900 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-slate-800 active:scale-95"
        >
          Iniciar nueva auditoría
        </a>
      </div>

    </div>
  );

}