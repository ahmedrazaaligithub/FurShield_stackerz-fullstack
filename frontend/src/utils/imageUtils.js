const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Get the full URL for an image
 * @param {string} imagePath - The image path from database (e.g., "/uploads/profiles/123.jpg" or "/public/default-avatar.svg")
 * @returns {string} - Full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return `${API_BASE_URL}/public/default-avatar.svg`;
  }
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it starts with /, it's a relative path from server root
  if (imagePath.startsWith('/')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  
  // Otherwise, assume it's a filename and default to profiles folder
  return `${API_BASE_URL}/uploads/profiles/${imagePath}`;
};

/**
 * Get avatar URL with fallback to default
 * @param {string} avatarPath - User avatar path
 * @returns {string} - Avatar URL
 */
export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath || avatarPath === 'default-avatar.png' || avatarPath === '/public/default-avatar.svg') {
    return `${API_BASE_URL}/public/default-avatar.svg`;
  }
  return getImageUrl(avatarPath);
};

/**
 * Get pet image URL
 * @param {string} imagePath - Pet image path
 * @returns {string} - Pet image URL
 */
export const getPetImageUrl = (imagePath) => {
  if (!imagePath) {
    return `${API_BASE_URL}/public/default-avatar.svg`; // Could create a default pet image
  }
  return getImageUrl(imagePath);
};

/**
 * Get product image URL
 * @param {string} imagePath - Product image path
 * @returns {string} - Product image URL
 */
export const getProductImageUrl = (imagePath) => {
  if (!imagePath) {
    return `${API_BASE_URL}/public/default-avatar.svg`; // Could create a default product image
  }
  return getImageUrl(imagePath);
};

/**
 * Handle image upload and return the correct path
 * @param {File} file - File to upload
 * @param {string} type - Upload type ('profile', 'pet', 'product')
 * @returns {Promise<string>} - Uploaded image URL
 */
export const uploadImage = async (file, type = 'temp') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/upload/single`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    const data = await response.json();
    
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.error || 'Upload failed');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};
