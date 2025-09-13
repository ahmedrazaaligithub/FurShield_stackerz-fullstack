import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productAPI, cartAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { StarIcon, ShoppingCartIcon, MinusIcon, PlusIcon, ArrowLeftIcon, HeartIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import FavoriteButton from '../../components/common/FavoriteButton';
import toast from 'react-hot-toast';
import ReviewList from '../../components/reviews/ReviewList';
export default function ProductDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productAPI.getProduct(id),
    enabled: !!id
  })
  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity }) => cartAPI.addToCart(productId, quantity),
    onSuccess: () => {
      toast.success('Added to cart!')
      queryClient.invalidateQueries(['cart'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add to cart')
    }
  })
  const handleAddToCart = () => {
    if (!product?.data?.data) return;
    addToCartMutation.mutate({ productId: id, quantity })
  }
  const adjustQuantity = (change) => {
    if (!product?.data?.data) return;
    const productData = product.data.data;
    setQuantity(prev => Math.max(1, Math.min(prev + change, productData?.inventory?.quantity || 1)))
  }
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  if (error || !product?.data?.data) {
    return (
      <div className="text-center py-12">
        <ShoppingCartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
        <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/shop')}
          className="btn btn-primary"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Shop
        </button>
      </div>
    )
  }
  const productData = product.data.data
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/shop')}
            className="group flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
          </button>
          <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
            <nav className="text-sm text-gray-500">
              <span className="hover:text-blue-600 cursor-pointer transition-colors">Shop</span> 
              <span className="mx-2 text-gray-300">/</span> 
              <span className="capitalize hover:text-blue-600 cursor-pointer transition-colors">{productData.category?.name || 'Products'}</span> 
              <span className="mx-2 text-gray-300">/</span> 
              <span className="text-gray-900 font-medium">{productData.name}</span>
            </nav>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {}
        <div className="space-y-6">
          <div className="relative group">
            <div className="aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-2xl">
              {productData.images?.[selectedImage] ? (
                <img
                  src={productData.images[selectedImage]}
                  alt={productData.name}
                  className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <ShoppingCartIcon className="h-20 w-20 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {}
              <div className="absolute top-4 right-4">
                <FavoriteButton 
                  productId={productData._id} 
                  size="lg"
                  className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
                />
              </div>
            </div>
          </div>
          {productData.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {productData.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square w-full overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                    selectedImage === index 
                      ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${productData.name} ${index + 1}`}
                    className="h-full w-full object-cover object-center transition-transform duration-300 hover:scale-105"
                  />
                  {selectedImage === index && (
                    <div className="absolute inset-0 bg-blue-500/10"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200">
                {productData.category?.name || 'Product'}
              </span>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <HeartIcon className="h-6 w-6 text-gray-400 hover:text-red-500 transition-colors" />
              </button>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
              {productData.name}
            </h1>
            {productData.ratings?.average && (
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-5 w-5 transition-colors ${
                        i < Math.floor(productData.ratings?.average || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {productData.ratings?.average || 0}
                </span>
                <span className="text-sm text-gray-500">
                  ({productData.ratings?.count || 0} reviews)
                </span>
              </div>
            )}
          </div>
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 space-y-4">
            <div className="flex items-baseline space-x-4">
              <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ${productData.price}
              </span>
              {productData.originalPrice && productData.originalPrice > productData.price && (
                <>
                  <span className="text-xl text-gray-500 line-through">${productData.originalPrice}</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                    {Math.round((1 - productData.price / productData.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                productData.inventory?.quantity > 0 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  productData.inventory?.quantity > 0 ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span>
                  {productData.inventory?.quantity > 0 ? `${productData.inventory.quantity} in stock` : 'Out of stock'}
                </span>
              </div>
              {productData.inventory?.quantity > 0 && productData.inventory.quantity <= 5 && (
                <span className="text-sm font-medium text-orange-600 bg-orange-100 px-3 py-1 rounded-lg border border-orange-200">
                  Only {productData.inventory.quantity} left!
                </span>
              )}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
              Description
            </h3>
            <p className="text-gray-700 leading-relaxed text-lg">{productData.description}</p>
          </div>
          {productData.features?.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
                Key Features
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {productData.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3 bg-white rounded-lg p-3 shadow-sm border border-blue-100">
                    <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2"></div>
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {productData.inventory?.quantity > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100 space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">Quantity</label>
                <div className="flex items-center justify-center space-x-4 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <button
                    onClick={() => adjustQuantity(-1)}
                    disabled={quantity <= 1}
                    className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-300"
                  >
                    <MinusIcon className="h-5 w-5 text-gray-600" />
                  </button>
                  <span className="text-2xl font-bold text-gray-900 min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => adjustQuantity(1)}
                    disabled={quantity >= productData.inventory?.quantity}
                    className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-300"
                  >
                    <PlusIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending}
                  className="flex items-center justify-center px-8 py-4 bg-white border-2 border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {addToCartMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <ShoppingCartIcon className="h-6 w-6 mr-3" />
                      Add to Cart
                    </>
                  )}
                </button>
                <button className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl">
                  Buy Now
                </button>
              </div>
            </div>
          )}
          {productData.specifications && (
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
                Specifications
              </h3>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(productData.specifications).map(([key, value]) => (
                    <div key={key} className="flex flex-col space-y-1 p-3 bg-gray-50 rounded-lg">
                      <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{key}</dt>
                      <dd className="text-base font-medium text-gray-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        </div>
        </div>
        {}
        <ReviewList product={productData} />
      </div>
    </div>
  )
}