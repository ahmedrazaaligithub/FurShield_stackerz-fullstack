import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { 
  StarIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import ReviewModal from './ReviewModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'
export default function ReviewList({ product }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [deletingReview, setDeletingReview] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['product-reviews', product._id, currentPage],
    queryFn: () => reviewAPI.getProductReviews(product._id, { page: currentPage, limit: 10 }),
    staleTime: 30000
  })
  const reviews = reviewsData?.data?.data?.reviews || []
  const stats = reviewsData?.data?.data?.stats || { averageRating: 0, totalReviews: 0, distribution: {} }
  const pagination = reviewsData?.data?.data?.pagination || {}
  const handleWriteReview = () => {
    if (!user) {
      toast.error('Please login to write a review')
      return
    }
    setEditingReview(null)
    setShowReviewModal(true)
  }
  const handleEditReview = (review) => {
    setEditingReview(review)
    setShowReviewModal(true)
  }
  const handleDeleteReview = (review) => {
    setDeletingReview(review)
  }
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating ? (
            <StarSolidIcon key={star} className="h-4 w-4 text-yellow-400" />
          ) : (
            <StarIcon key={star} className="h-4 w-4 text-gray-300" />
          )
        ))}
      </div>
    )
  }
  const renderRatingDistribution = () => {
    const { distribution, totalReviews } = stats
    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[rating] || 0
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
          return (
            <div key={rating} className="flex items-center space-x-3 text-sm">
              <span className="w-8 text-gray-600">{rating}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-gray-600 text-right">{count}</span>
            </div>
          )
        })}
      </div>
    )
  }
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  return (
    <div className="mt-12 border-t pt-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
        <button
          onClick={handleWriteReview}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
        >
          Write a Review
        </button>
      </div>
      {stats.totalReviews > 0 ? (
        <>
          {}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {}
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {stats.averageRating}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(stats.averageRating))}
                </div>
                <p className="text-gray-600">
                  Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                </p>
              </div>
              {}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Rating Breakdown</h3>
                {renderRatingDistribution()}
              </div>
            </div>
          </div>
          {}
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {review.user?.avatar ? (
                      <img
                        src={review.user.avatar}
                        alt={review.user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-12 h-12 text-gray-400" />
                    )}
                    <div>
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-gray-900">
                          {review.user?.name || 'Anonymous'}
                        </h4>
                        {review.verified && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {}
                  {user && user.id === review.user?._id && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditReview(review)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit review"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete review"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <h5 className="font-semibold text-gray-900 mb-2">{review.title}</h5>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
              </div>
            ))}
          </div>
          {}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <div className="text-gray-400 mb-4">
            <StarIcon className="h-16 w-16 mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">No reviews yet. Be the first to review this product!</p>
          <button
            onClick={handleWriteReview}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            Write a Review
          </button>
        </div>
      )}
      {}
      {showReviewModal && (
        <ReviewModal
          product={product}
          review={editingReview}
          onClose={() => {
            setShowReviewModal(false)
            setEditingReview(null)
          }}
        />
      )}
      {}
      {deletingReview && (
        <DeleteConfirmModal
          review={deletingReview}
          onClose={() => setDeletingReview(null)}
          onConfirm={() => {
            queryClient.invalidateQueries(['product-reviews', product._id])
            setDeletingReview(null)
          }}
        />
      )}
    </div>
  )
}