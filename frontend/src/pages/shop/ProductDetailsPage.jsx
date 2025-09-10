import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productAPI, cartAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  ArrowLeftIcon,
  ShoppingCartIcon,
  HeartIcon,
  StarIcon,
  MinusIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'

export default function ProductDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  const { data: product, isLoading, error } = useQuery({
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

  const adjustQuantity = (change) => {
    setQuantity(prev => Math.max(1, Math.min(prev + change, productData?.stock || 1)))
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/shop')}
          className="btn btn-ghost p-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <nav className="text-sm text-gray-500">
            <span>Shop</span> / <span className="capitalize">{productData.category}</span> / <span className="text-gray-900">{productData.name}</span>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
            {productData.images?.[selectedImage] ? (
              <img
                src={productData.images[selectedImage]}
                alt={productData.name}
                className="h-96 w-full object-cover object-center"
              />
            ) : (
              <div className="h-96 w-full bg-gray-200 flex items-center justify-center">
                <ShoppingCartIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>
          
          {productData.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {productData.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    'aspect-w-1 aspect-h-1 w-full overflow-hidden rounded border-2',
                    selectedImage === index ? 'border-primary-500' : 'border-gray-200'
                  )}
                >
                  <img
                    src={image}
                    alt={`${productData.name} ${index + 1}`}
                    className="h-20 w-full object-cover object-center"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <span className="badge badge-primary mb-2">{productData.category}</span>
            <h1 className="text-3xl font-bold text-gray-900">{productData.name}</h1>
            
            {productData.rating && (
              <div className="flex items-center mt-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < Math.floor(productData.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {productData.rating} ({productData.reviewCount || 0} reviews)
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-gray-900">${productData.price}</span>
              {productData.originalPrice && productData.originalPrice > productData.price && (
                <>
                  <span className="text-lg text-gray-500 line-through">${productData.originalPrice}</span>
                  <span className="badge badge-success">
                    {Math.round((1 - productData.price / productData.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={cn(
                'text-sm',
                productData.stock > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {productData.stock > 0 ? `${productData.stock} in stock` : 'Out of stock'}
              </span>
              {productData.stock > 0 && productData.stock <= 5 && (
                <span className="text-sm text-orange-600">• Only {productData.stock} left!</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{productData.description}</p>
          </div>

          {productData.features?.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Features</h3>
              <ul className="space-y-1">
                {productData.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {productData.stock > 0 && (
            <div className="space-y-4">
              <div>
                <label className="label">Quantity</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => adjustQuantity(-1)}
                    disabled={quantity <= 1}
                    className="btn btn-outline p-2"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="text-lg font-medium w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => adjustQuantity(1)}
                    disabled={quantity >= productData.stock}
                    className="btn btn-outline p-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {addToCartMutation.isPending ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <ShoppingCartIcon className="h-4 w-4 mr-2" />
                  )}
                  Add to Cart
                </button>
                
                <button className="btn btn-outline">
                  <HeartIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {productData.specifications && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Specifications</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <dl className="grid grid-cols-1 gap-2">
                  {Object.entries(productData.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <dt className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                      <dd className="text-sm text-gray-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
        <div className="text-center py-8 text-gray-500">
          Related products will be displayed here
        </div>
      </div>
    </div>
  )
}
