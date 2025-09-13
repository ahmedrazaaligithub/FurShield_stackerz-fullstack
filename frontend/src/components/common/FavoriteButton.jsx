import { useState } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoritesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
const FavoriteButton = ({ productId, className = '', size = 'md' }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: favoriteStatus, isLoading } = useQuery({
    queryKey: ['favorite-status', productId],
    queryFn: () => favoritesAPI.checkFavoriteStatus(productId),
    enabled: !!user && !!productId,
    select: (data) => data.data.isFavorite
  });
  const toggleFavoriteMutation = useMutation({
    mutationFn: () => favoritesAPI.toggleFavorite(productId),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['favorite-status', productId]);
      queryClient.invalidateQueries(['favorites']);
      queryClient.invalidateQueries(['favorites-count']);
      const message = data.data.isFavorite 
        ? 'Added to favorites!' 
        : 'Removed from favorites!';
      toast.success(message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update favorites');
    }
  });
  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to add favorites');
      return;
    }
    toggleFavoriteMutation.mutate();
  };
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };
  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };
  if (!user) {
    return null;
  }
  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading || toggleFavoriteMutation.isPending}
      className={`
        ${buttonSizeClasses[size]} 
        rounded-full hover:bg-gray-100 transition-colors 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={favoriteStatus ? 'Remove from favorites' : 'Add to favorites'}
    >
      {favoriteStatus ? (
        <HeartSolidIcon 
          className={`${sizeClasses[size]} text-red-500 transition-colors`} 
        />
      ) : (
        <HeartIcon 
          className={`${sizeClasses[size]} text-gray-400 hover:text-red-500 transition-colors`} 
        />
      )}
    </button>
  );
};
export default FavoriteButton;