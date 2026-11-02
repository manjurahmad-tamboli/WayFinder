import { useEffect, useState } from 'react'
import { getLocations } from '../services/api'
import { useDistance } from '../contexts/DistanceContext'
import { getApiErrorMessage, isRequestCanceled } from '../services/apiErrors'

export default function useLocations(category) {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const { setReferenceLocations } = useDistance()
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setLoading(true)
    setError('')
    getLocations(category, { signal: controller.signal })
      .then(({ data }) => {
        if (!active || controller.signal.aborted) return
        setLocations(data)
        setReferenceLocations(data)
      })
      .catch((requestError) => {
        if (active && !controller.signal.aborted && !isRequestCanceled(requestError)) {
          setError(getApiErrorMessage(requestError, 'Campus locations could not be loaded.'))
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [category, retryCount, setReferenceLocations])
  return { locations, loading, error, retry: () => setRetryCount((count) => count + 1) }
}
