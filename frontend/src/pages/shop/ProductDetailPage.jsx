import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productAPI, cartAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  ShoppingCartIcon,
  HeartIcon,
  StarIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productAPI.getProduct(id)
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
    addToCartMutation.mutate({ productId: id, quantity })
  }
  const handleBuyNow = () => {
    addToCartMutation.mutate({ productId: id, quantity }, {
      onSuccess: () => {
        navigate('/checkout')
      }
    })
  }
  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= (productData?.inventory?.quantity || 10)) {
      setQuantity(newQuantity)
    }
  }
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites')
  }
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  const productData = product?.data?.data
  if (!productData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <button onClick={() => navigate('/shop')} className="btn btn-primary mt-4">
          Back to Shop
        </button>
      </div>
    )
  }
  const inStock = productData.inventory?.quantity > 0
  const discount = productData.compareAtPrice ? 
    Math.round(((productData.compareAtPrice - productData.price) / productData.compareAtPrice) * 100) : 0
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <button onClick={() => navigate('/shop')} className="hover:text-gray-900 flex items-center">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Shop
        </button>
        <span>/</span>
        <span>{productData.category?.name || 'Products'}</span>
        <span>/</span>
        <span className="text-gray-900">{productData.name}</span>
      </nav>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {}
        <div className="space-y-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
            {productData.images && productData.images.length > 0 ? (
              <img
                src={productData.images[selectedImage]}
                alt={productData.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCartIcon className="h-24 w-24 text-gray-400" />
              </div>
            )}
          </div>
          {}
          {productData.images && productData.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {productData.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${productData.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        {}
        <div className="space-y-6">
          {}
          <div>
            <div className="flex items-start justify-between">
              <h1 className="text-3xl font-bold text-gray-900">{productData.name}</h1>
              <button
                onClick={toggleFavorite}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                {isFavorite ? (
                  <HeartIconSolid className="h-6 w-6 text-red-500" />
                ) : (
                  <HeartIcon className="h-6 w-6 text-gray-400" />
                )}
              </button>
            </div>
            {}
            <div className="flex items-center mt-2 space-x-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <StarIconSolid
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(productData.ratings?.average || 0)
                        ? 'text-yellow-400'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">
                ({productData.ratings?.count || 0} reviews)
              </span>
            </div>
            {}
            <div className="mt-4 flex items-baseline space-x-3">
              <span className="text-3xl font-bold text-gray-900">
                ${productData.price}
              </span>
              {productData.compareAtPrice && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    ${productData.compareAtPrice}
                  </span>
                  <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>
          </div>
          {}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">
              {productData.description || 'No description available'}
            </p>
          </div>
          {}
          <div className="border-t border-b py-4 space-y-2">
            {productData.brand && (
              <div className="flex justify-between">
                <span className="text-gray-600">Brand</span>
                <span className="font-medium">{productData.brand}</span>
              </div>
            )}
            {productData.sku && (
              <div className="flex justify-between">
                <span className="text-gray-600">SKU</span>
                <span className="font-medium">{productData.sku}</span>
              </div>
            )}
            {productData.weight && (
              <div className="flex justify-between">
                <span className="text-gray-600">Weight</span>
                <span className="font-medium">{productData.weight} kg</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Availability</span>
              <span className={`font-medium ${inStock ? 'text-green-600' : 'text-red-600'}`}>
                {inStock ? `In Stock (${productData.inventory?.quantity} available)` : 'Out of Stock'}
              </span>
            </div>
          </div>
          {}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">Quantity:</span>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 min-w-[50px] text-center">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= (productData.inventory?.quantity || 10)}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || addToCartMutation.isPending}
                className="flex-1 btn btn-outline btn-lg disabled:opacity-50"
              >
                {addToCartMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!inStock || addToCartMutation.isPending}
                className="flex-1 btn btn-primary btn-lg disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>
          </div>
          {}
          <div className="space-y-3 pt-4">
            <div className="flex items-center space-x-3 text-gray-600">
              <TruckIcon className="h-5 w-5" />
              <span>Free shipping on orders over $50</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600">
              <ShieldCheckIcon className="h-5 w-5" />
              <span>30-day return policy</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600">
              <CheckIcon className="h-5 w-5" />
              <span>100% authentic products</span>
            </div>
          </div>
          {}
          {productData.vendor && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600">
                Sold by: <span className="font-medium text-gray-900">{productData.vendor.name}</span>
              </p>
            </div>
          )}
        </div>
      </div>
      {}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
          <button className="btn btn-primary mt-4">Write a Review</button>
        </div>
      </div>
    </div>
  )
}