import { useEffect, useState } from "react";

// Avoid flashing skeletons when cached or very fast requests finish immediately.
export default function useDelayedLoading(loading, delayMs = 140) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!loading) {
      setVisible(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, loading]);

  return visible;
}
