import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
})

export const getLocations = (category) =>
  api.get('/locations', { params: category ? { category } : {} })

export const getLocation = (id) => api.get(`/locations/${id}`)
export const getCategories = () => api.get('/categories')
export const searchLocations = (data) => api.post('/search', data)
export const createRoute = (data) => api.post('/route', data)
export const sendContact = (data) => api.post('/contact', data)