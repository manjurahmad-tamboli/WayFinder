import { useEffect, useState } from 'react'
import { getLocations } from '../services/api'

export default function useLocations(category) {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getLocations(category)
      .then(({ data }) => {
        if (active) setLocations(data)
      })
      .catch(() => {
        if (active) setError('Could not load campus locations. Is the API running?')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [category])
  return { locations, loading, error }
}
