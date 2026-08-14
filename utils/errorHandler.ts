declare const __DEV__: boolean;

export const handleAsyncError = (context: string, error: unknown): void => {
  const message =
    error instanceof Error ? error.message : String(error);
  console.error(`[${context}] ${message}`);
  if (__DEV__) {
    console.error('[Debug detail]', error);
  }
};
