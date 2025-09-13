import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cartAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  ShoppingCartIcon,
  TrashIcon,
  MinusIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'
const CartItem = ({ item, onUpdateQuantity, onRemove }) => (
  <div className="flex items-center space-x-4 p-4 border-b border-gray-200">
    <div className="flex-shrink-0">
      {item.product.images?.[0] ? (
        <img
          src={item.product.images[0]}
          alt={item.product.name}
          className="h-16 w-16 rounded-lg object-cover"
        />
      ) : (
        <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
          <ShoppingCartIcon className="h-6 w-6 text-gray-400" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-lg font-medium text-gray-900 truncate">{item.product.name}</h3>
      <p className="text-sm text-gray-600">{item.product.category}</p>
      <p className="text-lg font-bold text-gray-900 mt-1">${item.product.price}</p>
    </div>
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onUpdateQuantity(item.product._id, item.quantity - 1)}
        disabled={item.quantity <= 1}
        className="btn btn-outline p-1"
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <span className="text-lg font-medium w-8 text-center">{item.quantity}</span>
      <button
        onClick={() => onUpdateQuantity(item.product._id, item.quantity + 1)}
        disabled={item.quantity >= item.product.stock}
        className="btn btn-outline p-1"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
    <div className="text-right">
      <p className="text-lg font-bold text-gray-900">
        ${(item.product.price * item.quantity).toFixed(2)}
      </p>
      <button
        onClick={() => onRemove(item.product._id)}
        className="text-red-600 hover:text-red-800 mt-1"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  </div>
)
export default function CartPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartAPI.getCart
  })
  const updateQuantityMutation = useMutation({
    mutationFn: ({ productId, quantity }) => cartAPI.updateQuantity(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update quantity')
    }
  })
  const removeItemMutation = useMutation({
    mutationFn: cartAPI.removeFromCart,
    onSuccess: () => {
      toast.success('Item removed from cart')
      queryClient.invalidateQueries(['cart'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to remove item')
    }
  })
  const clearCartMutation = useMutation({
    mutationFn: cartAPI.clearCart,
    onSuccess: () => {
      toast.success('Cart cleared')
      queryClient.invalidateQueries(['cart'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to clear cart')
    }
  })
  const handleUpdateQuantity = (productId, quantity) => {
    if (quantity < 1) return
    updateQuantityMutation.mutate({ productId, quantity })
  }
  const handleRemoveItem = (productId) => {
    removeItemMutation.mutate(productId)
  }
  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCartMutation.mutate()
    }
  }
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  const cartData = cart?.data?.data
  const items = cartData?.items || []
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const tax = 0 
  const shipping = subtotal > 50 ? 0 : 9.99
  const total = subtotal + tax + shipping
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-1">
            {items.length} item{items.length !== 1 ? 's' : ''} in your cart
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClearCart}
            disabled={clearCartMutation.isPending}
            className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
          >
            {clearCartMutation.isPending ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <TrashIcon className="h-4 w-4 mr-2" />
            )}
            Clear Cart
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600 mb-6">Add some products to get started</p>
          <button
            onClick={() => navigate('/shop')}
            className="btn btn-primary"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Items</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <CartItem
                    key={item.product._id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
              </div>
              <div className="card-content space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {subtotal < 50 && (
                  <div className="text-sm text-gray-500">
                    Add ${(50 - subtotal).toFixed(2)} more for free shipping
                  </div>
                )}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/checkout')}
                  className="btn btn-primary w-full btn-lg"
                >
                  Proceed to Checkout
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Promo Code</h3>
              </div>
              <div className="card-content">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    className="input flex-1"
                  />
                  <button className="btn btn-outline">Apply</button>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/shop')}
              className="btn btn-outline w-full"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  )
}