import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import CampusMap from '../components/CampusMap'
import { LocationDetailSkeleton } from '../components/Skeletons'
import useDelayedLoading from '../hooks/useDelayedLoading'
import { getLocation, getImageUrl } from '../services/api'

export default function LocationDetails() {
  const { id } = useParams()

  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const showLoading = useDelayedLoading(loading)

  useEffect(() => {
    let active = true
    setLocation(null)
    setLoading(true)
    setError('')

    getLocation(id)
      .then(({ data }) => {
        if (active) setLocation(data)
      })
      .catch(() => {
        if (active) setError('This location could not be found.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [id])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-bold text-white">{error}</h1>
        <Link className="accent-text mt-4 inline-block font-semibold" to="/map">
          Back to map
        </Link>
      </div>
    )
  }

  if (loading) {
    return showLoading ? <LocationDetailSkeleton /> : <div aria-busy="true" className="min-h-[65vh]" />
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:py-14">

      <Link className="accent-text text-sm font-semibold hover:text-white" to="/map">
        ← Back to map
      </Link>

      <div className="surface-card mt-4 overflow-hidden md:grid md:grid-cols-2">

       <img
  className="h-72 w-full object-cover md:h-full"
  src={getImageUrl(location.image)}
  alt={location.name}
      />

        <div className="p-6 sm:p-7">
          <p className="eyebrow !text-[0.7rem] !tracking-[0.14em]">
            {location.category}
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            {location.name}
          </h1>

          <p className="silver-text mt-4 leading-7">
            {location.description}
          </p>

          <dl className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm text-slate-300">
            <div>
              <dt className="font-semibold text-white">Opening hours</dt>
              <dd className="muted-text mt-1">{location.opening_hours}</dd>
            </div>

            <div>
              <dt className="font-semibold text-white">Coordinates</dt>
              <dd className="muted-text mt-1">
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </dd>
            </div>
          </dl>

          <Link
            to={`/map?destination=${location.id}`}
            onClick={() => toast.success('Choose a starting point to navigate')}
            className="button-primary mt-6 inline-flex min-h-11 items-center px-5 py-2"
          >
            Navigate here
          </Link>
        </div>

      </div>

      <div className="mt-7">
        <CampusMap locations={[location]} selectedLocationId={location.id} />
      </div>

    </section>
  )
}
