import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { 
  XMarkIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
export default function ReviewModal({ product, review, onClose }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isEditing = !!review
  const [formData, setFormData] = useState({
    rating: review?.rating || 5,
    title: review?.title || '',
    comment: review?.comment || ''
  })
  const createReviewMutation = useMutation({
    mutationFn: (data) => reviewAPI.createReview(product._id, data),
    onSuccess: () => {
      toast.success('Review submitted successfully!')
      queryClient.invalidateQueries(['product-reviews', product._id])
      queryClient.invalidateQueries(['product', product._id])
      onClose()
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to submit review')
    }
  })
  const updateReviewMutation = useMutation({
    mutationFn: (data) => reviewAPI.updateReview(review._id, data),
    onSuccess: () => {
      toast.success('Review updated successfully!')
      queryClient.invalidateQueries(['product-reviews', product._id])
      queryClient.invalidateQueries(['product', product._id])
      onClose()
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update review')
    }
  })
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.comment.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    if (isEditing) {
      updateReviewMutation.mutate(formData)
    } else {
      createReviewMutation.mutate(formData)
    }
  }
  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }))
  }
  const isLoading = createReviewMutation.isPending || updateReviewMutation.isPending
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {isEditing ? 'Edit Review' : 'Write a Review'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        {}
        <div className="p-6">
          {}
          <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-xl">
            {product.images?.[0] && (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-600">${product.price}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    {star <= formData.rating ? (
                      <StarSolidIcon className="h-8 w-8 text-yellow-400" />
                    ) : (
                      <StarIcon className="h-8 w-8 text-gray-300 hover:text-yellow-400" />
                    )}
                  </button>
                ))}
                <span className="ml-3 text-sm text-gray-600">
                  {formData.rating} out of 5 stars
                </span>
              </div>
            </div>
            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Summarize your experience..."
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>
            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Tell others about your experience with this product..."
                rows={6}
                maxLength={1000}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.comment.length}/1000 characters
              </p>
            </div>
            {}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-medium text-blue-900 mb-2">Review Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Be honest and helpful to other customers</li>
                <li>• Focus on the product's features and quality</li>
                <li>• Avoid personal information or inappropriate content</li>
                <li>• Reviews are public and can be seen by everyone</li>
              </ul>
            </div>
            {}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title.trim() || !formData.comment.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Submitting...' : (isEditing ? 'Update Review' : 'Submit Review')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}