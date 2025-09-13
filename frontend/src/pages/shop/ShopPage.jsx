import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDownIcon, FunnelIcon, MagnifyingGlassIcon, ShoppingBagIcon, StarIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { getProductImageUrl } from '../../utils/imageUtils'
import { productAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { cn } from '../../utils/cn'
import { useDebounce } from '../../hooks/useDebounce'
const ProductCard = ({ product }) => (
  <Link to={`/shop/product/${product._id}`} className="block group">
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-2">
      {}
      <div className="relative aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {product.images?.[0] ? (
          <img
            src={getProductImageUrl(product.images[0])}
            alt={product.name}
            className="h-56 w-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="h-56 w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <ShoppingBagIcon className="h-16 w-16 text-gray-400" />
          </div>
        )}
        {}
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
          </div>
        )}
        {}
        <div className="absolute top-3 right-3">
          <span className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold shadow-lg',
            (product.inventory?.quantity || 0) > 0 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          )}>
            {(product.inventory?.quantity || 0) > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
        {}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      {}
      <div className="p-6 space-y-4">
        {}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border border-blue-200">
            {product.category?.name || 'No Category'}
          </span>
          {}
          {product.rating && (
            <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200">
              <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-semibold text-yellow-700">{product.rating}</span>
            </div>
          )}
        </div>
        {}
        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
          {product.name}
        </h3>
        {}
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{product.description}</p>
        {}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ${product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through bg-gray-100 px-2 py-1 rounded-lg">
                ${product.originalPrice}
              </span>
            )}
          </div>
          {}
          <div className="text-right">
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-lg',
              (product.inventory?.quantity || 0) > 0 
                ? 'text-green-700 bg-green-50 border border-green-200' 
                : 'text-red-700 bg-red-50 border border-red-200'
            )}>
              {(product.inventory?.quantity || 0) > 0 ? `${product.inventory.quantity} left` : 'Sold out'}
            </span>
          </div>
        </div>
        {}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pt-2">
          <div className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-xl text-center font-semibold text-sm shadow-lg">
            View Details
          </div>
        </div>
      </div>
    </div>
  </Link>
)
export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [categories, setCategories] = useState([])
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', { search: debouncedSearchQuery, category: categoryFilter, sort: sortBy }],
    queryFn: () => productAPI.getProducts({
      search: debouncedSearchQuery || undefined,
      category: categoryFilter || undefined,
      sort: sortBy
    }),
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 30000
  })
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/v1/products/categories')
      const data = await response.json()
      return data
    }
  })
  useEffect(() => {
    if (categoriesData?.success && categoriesData?.data) {
      setCategories(categoriesData.data)
    }
  }, [categoriesData])
  const filteredProducts = products?.data?.data || []
  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pet Shop</h1>
          <p className="text-gray-600 mt-1">
            Everything your pet needs, delivered to your door
          </p>
        </div>
        <Link to="/cart" className="btn btn-primary">
          <ShoppingBagIcon className="h-4 w-4 mr-2" />
          View Cart
        </Link>
      </div>
      {}
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
              <option key={category._id} value={category._id}>{category.name}</option>
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
      {}
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
          {}
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              {debouncedSearchQuery && (
                <span className="ml-2 text-blue-600 font-medium">
                  for "{debouncedSearchQuery}"
                </span>
              )}
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FunnelIcon className="h-4 w-4" />
              <span>
                {categoryFilter ? (
                  <>Category: {categories.find(cat => cat._id === categoryFilter)?.name || 'Unknown'}</>
                ) : (
                  'All Categories'
                )}
              </span>
            </div>
          </div>
          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </>
      )}
      {}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((category) => (
            <button
              key={category._id}
              onClick={() => setCategoryFilter(category._id)}
              className="p-4 text-center border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">{category.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}