const TECHNICAL_DETAIL = /(traceback|exception|stack|sqlalchemy|sqlite|postgres|mysql|api[_ -]?key|bearer\s|password|secret|\.py\b|\.js\b|[a-z]:\\|\/home\/|\/var\/)/i;

function safeDetail(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail !== "string") return "";
  const cleaned = detail.trim();
  if (!cleaned || cleaned.length > 240 || TECHNICAL_DETAIL.test(cleaned)) return "";
  return cleaned;
}

export function isRequestCanceled(error) {
  return error?.code === "ERR_CANCELED" || error?.name === "CanceledError" || error?.message === "canceled";
}

export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (isRequestCanceled(error)) return "";
  if (error?.userMessage && typeof error.userMessage === "string") return error.userMessage;

  const status = error?.response?.status;
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT" || error?.message === "timeout") {
    return "The request took too long. Check your connection and try again.";
  }
  if (status === 401) return "Please sign in again to continue.";
  if (status === 403) return "You don’t have permission to complete this action.";
  if (status === 404) return safeDetail(error) || "The requested location or page could not be found.";
  if (status === 422) return safeDetail(error) || "Please check the information and try again.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status === 408) return "The request timed out. Please try again.";
  if (status >= 500) return "WayFinder is having a server problem. Please try again shortly.";
  if (!error?.response) return "Could not reach WayFinder. Check your internet connection and try again.";
  return safeDetail(error) || fallback;
}
