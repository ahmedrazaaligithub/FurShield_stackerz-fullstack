import { Link } from 'react-router-dom'
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <div className="text-9xl font-bold text-primary-600 mb-4">404</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Page not found
          </h1>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        <div className="space-y-4">
          <Link
            to="/"
            className="btn btn-primary btn-lg w-full"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Go home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn btn-outline btn-lg w-full"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Go back
          </button>
        </div>
        <div className="pt-8">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🐾</span>
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">PetCare</span>
          </div>
        </div>
      </div>
    </div>
  )
}