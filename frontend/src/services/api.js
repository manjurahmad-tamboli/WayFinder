import axios from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
})

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

export const getLocations = (category) =>
  api.get('/locations', {
    params: category ? { category } : {},
  })

export const getLocation = (id) =>
  api.get(`/locations/${id}`)

export const getCategories = () =>
  api.get('/categories')

export const searchLocations = (data) =>
  api.post('/search', data)

export const createRoute = (data) =>
  api.post('/route', data)

export const sendContact = (data) =>
  api.post('/contact', data)