import { Link } from 'react-router-dom'
import { getImageUrl } from '../services/api'

export default function LocationCard({ location }) {
  return (
    <article className="location-card-enter surface-card surface-card-hover overflow-hidden">

      <img
        className="h-36 w-full object-cover"
        src={getImageUrl(location.image)}
        alt={location.name}
      />

      <div className="p-4">
        <p className="eyebrow mb-1 !text-[0.68rem] !tracking-[0.14em]">
          {location.category}
        </p>

        <h3 className="font-bold text-white">
          {location.name}
        </h3>

        <p className="muted-text mt-1 line-clamp-2 text-sm leading-6">
          {location.description}
        </p>

        <Link
          className="accent-text mt-3 inline-block text-sm font-bold hover:text-white"
          to={`/locations/${location.id}`}
        >
          View details →
        </Link>
      </div>

    </article>
  )
}
