import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, ChevronDown, LocateFixed, MapPin, MessageCircle, Minus, Navigation, Send, Sparkles, UserRound, X } from "lucide-react";

import { getAssistantHealth, getLocations, sendAssistantMessage } from "../services/api";
import { useMapActions } from "../contexts/MapActionContext";
import FavoriteButton from "./FavoriteButton";
import ShareLocationButton from "./ShareLocationButton";

const WELCOME_TEXT = "Hello! I'm your AI Campus Assistant. I can help you find departments, buildings, facilities and directions around your campus. What are you looking for today?";
const SUGGESTIONS = [
  "Where is the Computer Department?",
  "Find the nearest canteen",
  "Show all laboratories",
  "How can I reach the library?",
  "Where is the administration office?",
];

function newConversationId() {
  return globalThis.crypto?.randomUUID?.() || `wayfinder-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeMessage(role, content, extra = {}) {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, role, content, createdAt: new Date(), ...extra };
}

function getLocationError(error) {
  if (error?.code === 1) return "Location access was denied. Pick a campus place below and I’ll search from there.";
  if (error?.code === 2) return "Your location could not be determined. Pick a campus place below instead.";
  if (error?.code === 3) return "The location request timed out. Try again or pick a campus place below.";
  return "I couldn’t get your location. Pick a campus place below instead.";
}

function LocationResult({ location, onShowMap }) {
  return (
    <article className="ai-location-card">
      <div className="ai-location-icon"><MapPin size={15} aria-hidden="true" /></div>
      <div className="ai-location-copy">
        <strong>{location.name}</strong>
        <span>{location.category}{location.distance_meters != null ? ` · ${location.distance_meters < 1000 ? `${location.distance_meters} m` : `${(location.distance_meters / 1000).toFixed(1)} km`} away` : ""}</span>
      </div>
      <FavoriteButton location={location} className="ai-favorite-button" />
      <ShareLocationButton location={location} className="ai-share-button" />
      <div className="ai-location-actions">
        <button type="button" onClick={() => onShowMap(location)} aria-label={`Show ${location.name} on map`}>Map</button>
        <Link to={`/locations/${location.id}`} aria-label={`View ${location.name} details`}>Details</Link>
      </div>
    </article>
  );
}

export default function AIChatWidget() {
  const navigate = useNavigate();
  const { dispatchMapAction } = useMapActions();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => [makeMessage("assistant", WELCOME_TEXT, { suggestions: SUGGESTIONS })]);
  const [conversationId] = useState(newConversationId);
  const [serviceStatus, setServiceStatus] = useState("checking");
  const [lastUserPosition, setLastUserPosition] = useState(null);
  const [lastManualStart, setLastManualStart] = useState(null);
  const [activeLocationRequest, setActiveLocationRequest] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationOptions, setLocationOptions] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [selectedManualId, setSelectedManualId] = useState("");
  const conversationRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;
    getAssistantHealth()
      .then(({ data }) => { if (active && data.available) setServiceStatus("online"); })
      .catch(() => { if (active) setServiceStatus("offline"); });
    return () => { active = false; };
  }, [isOpen]);

  useEffect(() => {
    conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, isOpen, isMinimized]);

  async function sendMessage(rawText, options = {}) {
    const text = rawText.trim();
    if (!text || (isLoading && !options.allowWhileLoading)) return;
    const { appendUser = true, userLocation = null, userLocationId = null, userLocationName = null } = options;
    setIsOpen(true);
    setIsMinimized(false);
    setInput("");
    setActiveLocationRequest(null);
    setShowLocationPicker(false);

    const userMessage = appendUser ? makeMessage("user", text) : null;
    if (userMessage) setMessages((current) => [...current, userMessage]);
    const history = [...messages, ...(userMessage ? [userMessage] : [])]
      .filter((message) => message.role === "user" || message.id !== messages[0]?.id)
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));
    const positionIntent = /\b(near|nearby|nearest|closest|around me|route to|directions to|take me|how can i reach)\b/i.test(text);
    const storedStart = userLocation || (positionIntent ? lastUserPosition : null);
    const storedManual = userLocationId ? null : (positionIntent ? lastManualStart : null);
    setIsLoading(true);
    try {
      const { data } = await sendAssistantMessage({
        message: text,
        conversation_id: conversationId,
        conversation_history: history,
        user_location: storedStart,
        user_location_id: userLocationId || storedManual?.id || null,
        user_location_name: userLocationName || storedManual?.name || null,
      });
      setServiceStatus("online");
      if (data.map_action?.type === "clear_selection") {
        dispatchMapAction(data.map_action);
        navigate("/map");
      }
      if (data.map_action) {
        setActiveLocationRequest(data.map_action.type === "request_location" ? { text, action: data.map_action } : null);
      }
      setMessages((current) => [...current, makeMessage("assistant", data.answer, { response: data, requestText: text })]);
    } catch (error) {
      const detail = error.response?.data?.detail;
      setServiceStatus("offline");
      setMessages((current) => [...current, makeMessage("assistant", detail || "I can’t reach the campus assistant right now. Check that the WayFinder API is running, then retry your message.", { error: true, retryText: text })]);
    } finally {
      setIsLoading(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }

  function openMapAction(action, response) {
    if (!action || action.type === "request_location") return;
    dispatchMapAction({ ...action, route: response?.route || null });
    setIsOpen(false);
    navigate("/map");
  }

  function requestCurrentLocation(message) {
    if (!navigator.geolocation) {
      setMessages((current) => [...current, makeMessage("assistant", "Location isn’t available in this browser. Pick a campus place below and I’ll continue.", { requestText: message })]);
      setActiveLocationRequest({ text: message, action: { type: "request_location" } });
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = { latitude: coords.latitude, longitude: coords.longitude };
        setLastUserPosition(point);
        sendMessage(message, { appendUser: false, userLocation: point, allowWhileLoading: true });
      },
      (error) => {
        setIsLoading(false);
        setMessages((current) => [...current, makeMessage("assistant", getLocationError(error), { requestText: message })]);
        setActiveLocationRequest({ text: message, action: { type: "request_location" } });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  async function showManualLocationPicker() {
    setShowLocationPicker(true);
    if (locationOptions.length || locationsLoading) return;
    setLocationsLoading(true);
    try {
      const { data } = await getLocations();
      setLocationOptions(data);
      if (data.length) setSelectedManualId(String(data[0].id));
    } catch {
      setMessages((current) => [...current, makeMessage("assistant", "I couldn’t load the campus place list. You can still retry your GPS request or open the map and choose a starting place there.")]);
    } finally {
      setLocationsLoading(false);
    }
  }

  function continueFromManualPlace() {
    const place = locationOptions.find((item) => String(item.id) === selectedManualId);
    if (!place || !activeLocationRequest) return;
    const placeStart = { id: place.id, name: place.name };
    setLastManualStart(placeStart);
    sendMessage(activeLocationRequest.text, { appendUser: false, userLocationId: place.id, userLocationName: place.name });
  }

  function showLocationOnMap(location) {
    openMapAction({ type: "show_location", location_id: location.id, location_ids: [location.id] });
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="ai-assistant-root">
      {!isOpen && (
        <button type="button" className="ai-chat-launcher" onClick={() => { setIsOpen(true); setIsMinimized(false); }} aria-label="Open WayFinder AI assistant">
          <Sparkles size={20} aria-hidden="true" />
          <span>Ask WayFinder AI</span>
          <span className="ai-launcher-pulse" aria-hidden="true" />
        </button>
      )}

      {isOpen && (
        <section className={`ai-chat-panel${isMinimized ? " is-minimized" : ""}`} role="dialog" aria-label="WayFinder AI campus assistant">
          <header className="ai-chat-header">
            <span className="ai-brand-icon"><Bot size={20} aria-hidden="true" /></span>
            <div className="ai-chat-heading">
              <strong>WayFinder AI</strong>
              <span className={`ai-service-status ${serviceStatus}`}><i />{serviceStatus === "offline" ? "Connection issue" : serviceStatus === "checking" ? "Connecting…" : "Online · Campus guide"}</span>
            </div>
            <div className="ai-chat-header-actions">
              <button type="button" onClick={() => setIsMinimized((value) => !value)} aria-label={isMinimized ? "Expand assistant" : "Minimize assistant"}><Minus size={17} aria-hidden="true" /></button>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close assistant"><X size={18} aria-hidden="true" /></button>
            </div>
          </header>

          {!isMinimized && (
            <>
              <div className="ai-chat-messages" ref={conversationRef} aria-live="polite" aria-relevant="additions text">
                {messages.map((message) => (
                  <div className={`ai-message-row ${message.role === "user" ? "from-user" : "from-assistant"}`} key={message.id}>
                    <span className="ai-message-avatar" aria-hidden="true">{message.role === "user" ? <UserRound size={14} /> : <Sparkles size={14} />}</span>
                    <div className="ai-message-content-wrap">
                      <div className={`ai-message-bubble ${message.error ? "has-error" : ""}`}>
                        <p>{message.content}</p>
                        {message.response?.route && (
                          <div className="ai-route-result">
                            <div><span>Total walk</span><strong>{message.response.route.distance_meters} m</strong></div>
                            <div><span>Estimated time</span><strong>~{message.response.route.walking_minutes} min</strong></div>
                            <ol>{message.response.route.directions.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}</ol>
                          </div>
                        )}
                      </div>
                      <time>{new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(message.createdAt)}</time>

                      {message.response?.locations?.length > 0 && (
                        <div className="ai-location-results">
                          {message.response.locations.slice(0, 5).map((location) => <LocationResult key={location.id} location={location} onShowMap={showLocationOnMap} />)}
                        </div>
                      )}

                      {message.response?.map_action && message.response.map_action.type !== "request_location" && message.response.map_action.type !== "clear_selection" && (
                        <button type="button" className="ai-map-action" onClick={() => openMapAction(message.response.map_action, message.response)}>
                          {message.response.map_action.type === "filter_category" ? <><MapPin size={15} /> Browse {message.response.map_action.category} on map</> : message.response.map_action.type === "show_route" ? <><Navigation size={15} /> Open route on map</> : <><MapPin size={15} /> Show on campus map</>}
                          <span aria-hidden="true">↗</span>
                        </button>
                      )}

                      {message.response?.map_action?.type === "request_location" && (
                        <div className="ai-location-request">
                          <button type="button" onClick={() => requestCurrentLocation(message.requestText)}><LocateFixed size={15} /> Use my location</button>
                          <button type="button" onClick={() => { setActiveLocationRequest({ text: message.requestText, action: message.response.map_action }); showManualLocationPicker(); }}>Choose a campus place</button>
                        </div>
                      )}

                      {message.error && <button type="button" className="ai-retry-button" onClick={() => sendMessage(message.retryText)}>Retry message</button>}
                      {message.suggestions?.length > 0 && (
                        <div className="ai-suggestion-list">
                          {message.suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => sendMessage(suggestion)}>{suggestion}</button>)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && <div className="ai-message-row from-assistant"><span className="ai-message-avatar"><Sparkles size={14} /></span><div className="ai-typing" aria-label="WayFinder AI is thinking"><i /><i /><i /><span>Checking campus information…</span></div></div>}
              </div>

              {showLocationPicker && activeLocationRequest && (
                <div className="ai-manual-picker">
                  <label htmlFor="ai-campus-start">Search from a campus place</label>
                  <div className="ai-manual-picker-row">
                    {locationsLoading ? <span>Loading campus places…</span> : (
                      <select id="ai-campus-start" value={selectedManualId} onChange={(event) => setSelectedManualId(event.target.value)}>
                        {locationOptions.map((place) => <option value={place.id} key={place.id}>{place.name}</option>)}
                      </select>
                    )}
                    <button type="button" onClick={continueFromManualPlace} disabled={locationsLoading || !selectedManualId}>Continue</button>
                  </div>
                </div>
              )}

              <form className="ai-chat-composer" onSubmit={handleSubmit}>
                <textarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about a place or route…" aria-label="Message WayFinder AI" rows={1} maxLength={1000} disabled={isLoading} />
                <button type="submit" disabled={isLoading || !input.trim()} aria-label="Send message"><Send size={17} aria-hidden="true" /></button>
                <span className="ai-chat-hint">Enter to send · Shift+Enter for a new line</span>
              </form>
            </>
          )}
          {isMinimized && <button type="button" className="ai-minimized-reopen" onClick={() => setIsMinimized(false)}><MessageCircle size={17} /> Continue conversation <ChevronDown size={15} /></button>}
        </section>
      )}
    </div>
  );
}
