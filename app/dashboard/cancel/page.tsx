import Link from "next/link";

export default function CancelPage() {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Pago Cancelado</h1>

      <p>
        Has anulado la transacción y no se ha realizado ningún cobro.
      </p>

      <Link
        href="/"
        style={{
          display: "inline-block",
          marginTop: 20,
          padding: "12px 20px",
          backgroundColor: "#111",
          color: "#fff",
          borderRadius: 8,
          textDecoration: "none"
        }}
      >
        Iniciar Nueva Auditoría
      </Link>
    </div>
  );
}