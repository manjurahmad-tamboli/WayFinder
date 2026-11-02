import axios from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
})

let allLocationsRequest = null

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
  if (category) return api.get('/locations', { params: { category } })
  if (!allLocationsRequest) {
    allLocationsRequest = api.get('/locations').finally(() => { allLocationsRequest = null })
  }
  return allLocationsRequest
}

export const getLocation = (id) =>
  api.get(`/locations/${id}`)

export const getCategories = () =>
  api.get('/categories')

export const getLocationAutocomplete = (query, { signal, limit = 8 } = {}) =>
  api.get('/locations/autocomplete', {
    params: { q: query, limit },
    signal,
  })

export const getCampusSearch = (query, { category, signal, limit = 12 } = {}) =>
  api.get('/locations/search', {
    params: { q: query, category, limit },
    signal,
  })

export const getNearbyLocations = ({ latitude, longitude, query, category, sortBy = 'distance', signal, limit = 10 }) =>
  api.get('/locations/nearby', {
    params: { latitude, longitude, q: query || undefined, category: category || undefined, sort_by: sortBy, limit },
    signal,
  })

export const searchLocations = (data) =>
  api.post('/search', data)

export const createRoute = (data) =>
  api.post('/route', data)

export const sendContact = (data) =>
  api.post('/contact', data)

export const sendAssistantMessage = (data) =>
  api.post('/api/ai/chat', data)

export const getAssistantHealth = () =>
  api.get('/api/ai/health')
