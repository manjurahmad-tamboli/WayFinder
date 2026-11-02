import { useEffect, useState } from 'react'
import { getLocations } from '../services/api'
import { useDistance } from '../contexts/DistanceContext'

export default function useLocations(category) {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { setReferenceLocations } = useDistance()
  useEffect(() => {
    let active = true
    setLoading(true)
    getLocations(category)
      .then(({ data }) => {
        if (!active) return
        setLocations(data)
        if (!setReferenceLocations(data) && category) {
          getLocations().then(({ data: allLocations }) => {
            if (active) setReferenceLocations(allLocations)
          }).catch(() => {})
        }
      })
      .catch(() => { if (active) setError('Could not load campus locations. Is the API running?') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [category, setReferenceLocations])
  return { locations, loading, error }
}
