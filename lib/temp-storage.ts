// temp-storage.ts
// Este es un almacenamiento en memoria para el MVP.
// En un entorno de producción, esto debería ser reemplazado por una base de datos (Firestore, Redis) o Firebase Storage.

interface TempDocument {
  base64Data: string;
  mimeType: string;
  fileName: string;
  email: string;
}

const tempDocuments = new Map<string, TempDocument>();

export function storeTempDocument(commerceOrder: string, document: TempDocument) {
  tempDocuments.set(commerceOrder, document);
}

export function getTempDocument(commerceOrder: string): TempDocument | undefined {
  return tempDocuments.get(commerceOrder);
}

export function deleteTempDocument(commerceOrder: string) {
  tempDocuments.delete(commerceOrder);
}
