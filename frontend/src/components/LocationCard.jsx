import { Link } from 'react-router-dom'
import { getImageUrl } from '../services/api'

export default function LocationCard({ location }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">

      <img
        className="h-36 w-full object-cover"
        src={getImageUrl(location.image)}
        alt={location.name}
      />

      <div className="p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
          {location.category}
        </p>

        <h3 className="font-bold">
          {location.name}
        </h3>

        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
          {location.description}
        </p>

        <Link
          className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
          to={`/locations/${location.id}`}
        >
          View details →
        </Link>
      </div>

    </article>
  )
}