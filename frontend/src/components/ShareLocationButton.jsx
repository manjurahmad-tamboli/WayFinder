import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, MapPinned, Share2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useMapActions } from "../contexts/MapActionContext";
import { copyTextToClipboard, formatLocationCoordinates, makeLocationShareUrl } from "../services/shareUtils";

export default function ShareLocationButton({ location, className = "", showLabel = false, size = 17 }) {
  const navigate = useNavigate();
  const { dispatchMapAction } = useMapActions();
  const [isOpen, setIsOpen] = useState(false);
  const [copyError, setCopyError] = useState("");
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const locationId = Number(location?.id);
  const canShare = Number.isSafeInteger(locationId) && locationId > 0;
  const shareUrl = canShare ? makeLocationShareUrl(locationId) : "";
  const coordinates = formatLocationCoordinates(location);

  useEffect(() => {
    if (!isOpen) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") closeDialog();
    }
    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  function closeDialog() {
    setIsOpen(false);
    setCopyError("");
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  async function copyValue(value, successMessage) {
    const copied = await copyTextToClipboard(value);
    if (copied) {
      setCopyError("");
      toast.success(successMessage);
      return;
    }
    setCopyError("Clipboard access was blocked. Select the text above and copy it manually.");
    toast.error("Could not copy automatically");
  }

  async function shareWithDevice() {
    if (typeof navigator.share !== "function") {
      const copied = await copyTextToClipboard(shareUrl);
      if (copied) {
        setCopyError("");
        toast.success("Sharing is unavailable here; the link was copied");
      } else {
        setCopyError("Sharing and clipboard access are unavailable. Select the link above and copy it manually.");
        toast.error("Could not share this location");
      }
      return;
    }

    try {
      await navigator.share({
        title: location.name,
        text: `Find ${location.name} on the WayFinder campus map.`,
        url: shareUrl,
      });
      toast.success("Location shared");
      closeDialog();
    } catch (error) {
      if (error?.name !== "AbortError") toast.error("Could not share this location");
    }
  }

  function openOnMap() {
    if (!canShare) return;
    dispatchMapAction({ type: "show_location", location_id: locationId, location_ids: [locationId] });
    setIsOpen(false);
    navigate(`/map?focus=${locationId}`);
    toast.success(`${location.name} opened on the map`);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`share-location-trigger${showLabel ? " has-label" : ""} ${className}`.trim()}
        aria-label={`Share ${location?.name || "location"}`}
        title={`Share ${location?.name || "location"}`}
        disabled={!canShare}
        onClick={(event) => { event.stopPropagation(); setCopyError(""); setIsOpen(true); }}
      >
        <Share2 size={size} aria-hidden="true" />
        {showLabel && <span>Share</span>}
      </button>

      {isOpen && createPortal(
        <div className="share-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
          <section className="share-location-dialog" role="dialog" aria-modal="true" aria-labelledby="share-location-title">
            <header className="share-dialog-header">
              <div>
                <p className="eyebrow">Share a campus place</p>
                <h2 id="share-location-title">{location.name}</h2>
              </div>
              <button ref={closeRef} type="button" className="share-dialog-close" onClick={closeDialog} aria-label="Close share dialog"><X size={18} /></button>
            </header>

            <label className="share-dialog-label" htmlFor={`share-url-${locationId}`}>Location link</label>
            <input
              id={`share-url-${locationId}`}
              className="share-dialog-value"
              type="text"
              readOnly
              value={shareUrl}
              onFocus={(event) => event.target.select()}
              aria-label="Shareable location URL"
            />

            {coordinates && (
              <>
                <label className="share-dialog-label" htmlFor={`share-coordinates-${locationId}`}>Coordinates</label>
                <input
                  id={`share-coordinates-${locationId}`}
                  className="share-dialog-value"
                  type="text"
                  readOnly
                  value={coordinates}
                  onFocus={(event) => event.target.select()}
                  aria-label="Location coordinates"
                />
              </>
            )}

            {copyError && <p className="share-dialog-error" role="alert">{copyError}</p>}

            <div className="share-dialog-actions">
              <button type="button" className="share-dialog-action" onClick={() => copyValue(shareUrl, "Location link copied")}><Copy size={16} /> Copy link</button>
              {coordinates && <button type="button" className="share-dialog-action" onClick={() => copyValue(coordinates, "Coordinates copied")}><Copy size={16} /> Copy coordinates</button>}
              <button type="button" className="share-dialog-action is-primary" onClick={shareWithDevice}><Share2 size={16} /> Share</button>
              <button type="button" className="share-dialog-action is-map" onClick={openOnMap}><MapPinned size={16} /> Open on map</button>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
