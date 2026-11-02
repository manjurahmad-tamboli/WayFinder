import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorNotice({ message, onRetry, retryLabel = "Try again", className = "" }) {
  return (
    <div className={`error-notice${className ? ` ${className}` : ""}`} role="alert">
      <AlertTriangle size={17} aria-hidden="true" />
      <p>{message}</p>
      {onRetry && <button type="button" onClick={onRetry}><RefreshCw size={14} /> {retryLabel}</button>}
    </div>
  );
}
