import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import CampusMap from '../components/CampusMap'
import Loader from '../components/Loader'
import { getLocation, getImageUrl } from '../services/api'

export default function LocationDetails() {
  const { id } = useParams()

  const [location, setLocation] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getLocation(id)
      .then(({ data }) => setLocation(data))
      .catch(() => setError('This location could not be found.'))
  }, [id])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-bold">{error}</h1>
        <Link className="text-blue-700" to="/map">
          Back to map
        </Link>
      </div>
    )
  }

  if (!location) return <Loader />

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">

      <Link className="text-sm font-semibold text-blue-700" to="/map">
        ← Back to map
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm md:grid md:grid-cols-2">

       <img
  className="h-72 w-full object-cover md:h-full"
  src={getImageUrl(location.image)}
  alt={location.name}
      />

        <div className="p-7">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            {location.category}
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {location.name}
          </h1>

          <p className="mt-4 text-slate-600">
            {location.description}
          </p>

          <dl className="mt-6 space-y-3 text-sm">
            <div>
              <dt className="font-semibold">Opening hours</dt>
              <dd>{location.opening_hours}</dd>
            </div>

            <div>
              <dt className="font-semibold">Coordinates</dt>
              <dd>
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </dd>
            </div>
          </dl>

          <Link
            to={`/map?destination=${location.id}`}
            onClick={() => toast.success('Choose a starting point to navigate')}
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white"
          >
            Navigate here
          </Link>
        </div>

      </div>

      <div className="mt-7">
        <CampusMap locations={[location]} />
      </div>

    </section>
  )
}