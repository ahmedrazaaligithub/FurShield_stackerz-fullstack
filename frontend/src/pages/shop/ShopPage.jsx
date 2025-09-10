import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { productAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'

const ProductCard = ({ product }) => (
  <Link to={`/shop/product/${product._id}`} className="block">
    <div className="card hover:shadow-glow transition-all duration-300 group">
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-48 w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
            <ShoppingBagIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">${product.price}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
            )}
          </div>
          
          {product.rating && (
            <div className="flex items-center">
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <span className="badge badge-primary text-xs">{product.category}</span>
          <span className={cn(
            'text-xs',
            product.stock > 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </span>
        </div>
      </div>
    </div>
  </Link>
)

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', { search: searchQuery, category: categoryFilter, sort: sortBy }],
    queryFn: () => productAPI.getProducts({
      search: searchQuery || undefined,
      category: categoryFilter || undefined,
      sort: sortBy
    })
  })

  const categories = [
    'Food & Treats',
    'Toys',
    'Health & Wellness',
    'Grooming',
    'Accessories',
    'Beds & Furniture',
    'Training',
    'Travel'
  ]

  const filteredProducts = products?.data?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pet Shop</h1>
          <p className="text-gray-600 mt-1">
            Everything your pet needs, delivered to your door
          </p>
        </div>
        <Link to="/shop/cart" className="btn btn-primary">
          <ShoppingBagIcon className="h-4 w-4 mr-2" />
          View Cart
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input lg:w-48"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input lg:w-48"
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="rating">Sort by Rating</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">Failed to load products</p>
          <p className="text-gray-600">Please try again later</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || categoryFilter ? 'No products found' : 'No products available'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || categoryFilter 
              ? 'Try adjusting your search or filters'
              : 'Check back later for new products'
            }
          </p>
        </div>
      ) : (
        <>
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FunnelIcon className="h-4 w-4" />
              <span>Filtered by: {categoryFilter || 'All'}</span>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </>
      )}

      {/* Featured Categories */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className="p-4 text-center border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">{category}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
