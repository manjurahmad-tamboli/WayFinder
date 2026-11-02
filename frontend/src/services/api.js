import axios from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Location data changes infrequently. Keep it briefly so route changes and
// page reloads can render from session cache instead of waiting on the API.
const CACHE_TTL_MS = 60_000
const memoryCache = new Map()
const pendingRequests = new Map()

function cachedGet(key, request) {
  const memoryEntry = memoryCache.get(key)
  if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
    return Promise.resolve({ data: memoryEntry.data })
  }

  try {
    const stored = JSON.parse(sessionStorage.getItem(`wayfinder:${key}`) || 'null')
    if (stored?.expiresAt > Date.now()) {
      memoryCache.set(key, stored)
      return Promise.resolve({ data: stored.data })
    }
  } catch {
    // Storage can be unavailable in private browsing; use the network instead.
  }

  if (pendingRequests.has(key)) return pendingRequests.get(key)

  const pending = request()
    .then((response) => {
      const entry = { data: response.data, expiresAt: Date.now() + CACHE_TTL_MS }
      memoryCache.set(key, entry)
      try {
        sessionStorage.setItem(`wayfinder:${key}`, JSON.stringify(entry))
      } catch {
        // The in-memory cache still helps during this app session.
      }
      return response
    })
    .finally(() => pendingRequests.delete(key))

  pendingRequests.set(key, pending)
  return pending
}

export const getImageUrl = (imagePath) => {
  if (!imagePath) return ''

  // Already a complete URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  const cleanPath = imagePath.replace(/^\/+/, '')

  // Backend returns /static/...
  if (cleanPath.startsWith('static/')) {
    return `${API_BASE_URL}/${cleanPath}`
  }

  // Backend returns images/...
  if (cleanPath.startsWith('images/')) {
    return `${API_BASE_URL}/static/${cleanPath}`
  }

  // Backend returns only filename
  return `${API_BASE_URL}/static/images/${cleanPath}`
}

export const getLocations = (category) => {
  const key = `locations:${category || 'all'}`
  return cachedGet(key, () =>
    api.get('/locations', {
      params: category ? { category } : {},
    })
  )
}

export const getLocation = (id) =>
  cachedGet(`location:${id}`, () => api.get(`/locations/${id}`))

export const getCategories = () =>
  cachedGet('categories', () => api.get('/categories'))

export const searchLocations = (data) =>
  api.post('/search', data)

export const createRoute = (data) =>
  api.post('/route', data)

export const sendContact = (data) =>
  api.post('/contact', data)
