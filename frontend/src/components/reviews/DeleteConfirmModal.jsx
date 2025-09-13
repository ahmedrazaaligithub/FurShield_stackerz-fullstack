import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewAPI } from '../../services/api'
import { 
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
export default function DeleteConfirmModal({ review, onClose, onConfirm }) {
  const queryClient = useQueryClient()
  const deleteReviewMutation = useMutation({
    mutationFn: () => reviewAPI.deleteReview(review._id),
    onSuccess: () => {
      toast.success('Review deleted successfully!')
      onConfirm()
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete review')
    }
  })
  const handleDelete = () => {
    deleteReviewMutation.mutate()
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {}
        <div className="bg-gradient-to-r from-red-500 to-pink-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Delete Review</h2>
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
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Are you sure?
              </h3>
              <p className="text-gray-600">
                This action cannot be undone. Your review will be permanently deleted.
              </p>
            </div>
          </div>
          {}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
          </div>
          {}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteReviewMutation.isPending}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {deleteReviewMutation.isPending ? 'Deleting...' : 'Delete Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}