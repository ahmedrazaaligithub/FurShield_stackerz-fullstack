import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  HeartIcon, 
  CalendarIcon, 
  ShoppingBagIcon,
  SparklesIcon,
  UserGroupIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
const features = [
  {
    name: 'Pet Management',
    description: 'Keep track of your pets health records, vaccinations, and important information.',
    icon: HeartIcon,
    color: 'text-primary-600'
  },
  {
    name: 'Vet Appointments',
    description: 'Book and manage appointments with verified veterinarians in your area.',
    icon: CalendarIcon,
    color: 'text-secondary-600'
  },
  {
    name: 'Pet Adoption',
    description: 'Find your perfect companion or help pets find loving homes.',
    icon: UserGroupIcon,
    color: 'text-accent-600'
  },
  {
    name: 'Pet Store',
    description: 'Shop for high-quality pet supplies, food, and accessories.',
    icon: ShoppingBagIcon,
    color: 'text-green-600'
  },
  {
    name: 'AI Assistant',
    description: 'Get instant answers to pet care questions from our AI-powered assistant.',
    icon: SparklesIcon,
    color: 'text-purple-600'
  },
  {
    name: 'Secure & Trusted',
    description: 'Your pets data is protected with enterprise-grade security.',
    icon: ShieldCheckIcon,
    color: 'text-blue-600'
  }
]
const stats = [
  { label: 'Happy Pet Owners', value: '10,000+' },
  { label: 'Verified Vets', value: '500+' },
  { label: 'Successful Adoptions', value: '2,500+' },
  { label: 'Pet Products', value: '5,000+' }
]
export default function HomePage() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🐾</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">PetCare</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="btn btn-primary"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn btn-ghost"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      {}
      <section className="relative py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Complete Care for Your
              <span className="text-primary-600 block">Beloved Pets</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Manage your pets health, book vet appointments, find adoption opportunities, 
              and shop for premium pet supplies - all in one secure platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user && (
                <Link
                  to="/register"
                  className="btn btn-primary btn-lg"
                >
                  Start Your Journey
                </Link>
              )}
              <Link
                to="/adoption"
                className="btn btn-outline btn-lg"
              >
                Browse Adoptions
              </Link>
            </div>
          </div>
        </div>
      </section>
      {}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything Your Pet Needs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform brings together all aspects of pet care 
              in one convenient, secure location.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="card p-8 hover:shadow-glow transition-all duration-300 group"
              >
                <div className={`inline-flex p-3 rounded-lg ${feature.color.replace('text-', 'bg-').replace('-600', '-100')} mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                  {feature.name}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Give Your Pet the Best Care?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of pet owners who trust PetCare for their pets wellbeing.
          </p>
          {!user && (
            <Link
              to="/register"
              className="btn bg-white text-primary-600 hover:bg-gray-50 btn-lg"
            >
              Get Started Today
            </Link>
          )}
        </div>
      </section>
      {}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🐾</span>
                </div>
                <span className="ml-2 text-xl font-bold">PetCare</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The complete platform for pet care, connecting pet owners with 
                veterinarians, adoption centers, and premium pet products.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/adoption" className="hover:text-white">Pet Adoption</Link></li>
                <li><Link to="/shop" className="hover:text-white">Pet Store</Link></li>
                <li>Vet Appointments</li>
                <li>AI Assistant</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PetCare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}