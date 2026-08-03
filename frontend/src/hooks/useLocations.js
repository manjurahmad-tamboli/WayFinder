import { useEffect, useState } from 'react'
import { getLocations } from '../services/api'

export default function useLocations(category) {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    setLoading(true)
    getLocations(category).then(({ data }) => setLocations(data)).catch(() => setError('Could not load campus locations. Is the API running?')).finally(() => setLoading(false))
  }, [category])
  return { locations, loading, error }
}
