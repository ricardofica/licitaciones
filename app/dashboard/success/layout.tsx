'use client';

import React, { Suspense } from 'react';

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Cargando resultados de auditoría...</div>}>
      {children}
    </Suspense>
  );
}
