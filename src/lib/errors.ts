export const errorMessage = (
  error: unknown,
  fallback = "An unexpected error occurred.",
) => (error instanceof Error && error.message ? error.message : fallback);

export const toError = (error: unknown, fallback: string) =>
  error instanceof Error ? error : new Error(fallback);

export const logError = (scope: string, message: string, error: unknown) => {
  console.error(`[${scope}] ${message}`, error);
};
