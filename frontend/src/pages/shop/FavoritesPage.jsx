import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { favoritesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { HeartIcon, ShoppingBagIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import FavoriteButton from '../../components/common/FavoriteButton';
export default function FavoritesPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const limit = 12;
  const { data, isLoading, error } = useQuery({
    queryKey: ['favorites', page],
    queryFn: () => favoritesAPI.getFavorites({ page, limit }),
    enabled: !!user,
    select: (data) => data.data
  });
  const favorites = data?.favorites || [];
  const pagination = data?.pagination || {};
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarSolidIcon key={i} className="h-4 w-4 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarIcon className="h-4 w-4 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <StarSolidIcon className="h-4 w-4 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <StarIcon key={i} className="h-4 w-4 text-gray-300" />
        );
      }
    }
    return stars;
  };
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <HeartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to view your favorites</p>
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
          >
            Login Now
          </Link>
        </div>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error loading favorites</div>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <HeartIcon className="h-12 w-12 text-red-500 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Favorites
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            {favorites.length > 0 
              ? `You have ${pagination.total || favorites.length} favorite products`
              : 'Start adding products to your favorites'
            }
          </p>
        </div>
        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto">
              <ShoppingBagIcon className="h-20 w-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No favorite products yet</h3>
              <p className="text-gray-600 mb-8">Start adding products to your favorites to see them here</p>
              <Link
                to="/shop"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              >
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          <>
            {}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {favorites.map((favorite) => {
                const product = favorite.product;
                if (!product) return null;
                return (
                  <div key={favorite._id} className="group">
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
                      {}
                      <div className="relative aspect-square overflow-hidden">
                        <Link to={`/shop/product/${product._id}`}>
                          <img
                            src={product.images?.[0] || '/placeholder-product.jpg'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                        {}
                        <div className="absolute top-3 right-3">
                          <FavoriteButton 
                            productId={product._id}
                            className="bg-white/90 backdrop-blur-sm shadow-lg"
                          />
                        </div>
                        {}
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <div className="absolute top-3 left-3">
                            <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                              {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
                            </span>
                          </div>
                        )}
                      </div>
                      {}
                      <div className="p-6">
                        <Link to={`/shop/product/${product._id}`}>
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                        {}
                        {product.ratings?.average > 0 && (
                          <div className="flex items-center mb-3">
                            <div className="flex items-center">
                              {renderStars(product.ratings.average)}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              ({product.ratings.count})
                            </span>
                          </div>
                        )}
                        {}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-gray-900">
                              ${product.price}
                            </span>
                            {product.compareAtPrice && product.compareAtPrice > product.price && (
                              <span className="text-lg text-gray-500 line-through">
                                ${product.compareAtPrice}
                              </span>
                            )}
                          </div>
                        </div>
                        {}
                        <div className="mb-4">
                          {product.inventory?.quantity > 0 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              In Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                              Out of Stock
                            </span>
                          )}
                        </div>
                        {}
                        <Link
                          to={`/shop/product/${product._id}`}
                          className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold"
                        >
                          View Product
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-4 py-2 rounded-lg ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.pages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}