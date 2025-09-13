const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}
export const LoadingSpinner = ({ size = 'md', className, ...props }) => {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className || ''}`}
      {...props}
    />
  )
}
export const LoadingDots = ({ className }) => {
  return (
    <div className={`flex space-x-1 ${className || ''}`}>
      <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
    </div>
  )
}
export const LoadingOverlay = ({ children, loading, className }) => {
  return (
    <div className={`relative ${className || ''}`}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </div>
  )
}