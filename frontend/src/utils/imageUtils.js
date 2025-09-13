const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return `${API_BASE_URL}/public/default-avatar.svg`;
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  if (imagePath.startsWith('/')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  return `${API_BASE_URL}/uploads/profiles/${imagePath}`;
};
export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath || avatarPath === 'default-avatar.png' || avatarPath === '/public/default-avatar.svg') {
    return `${API_BASE_URL}/public/default-avatar.svg`;
  }
  return getImageUrl(avatarPath);
};
export const getPetImageUrl = (imagePath) => {
  if (!imagePath) {
    return `${API_BASE_URL}/public/default-avatar.svg`; 
  }
  return getImageUrl(imagePath);
};
export const getProductImageUrl = (imagePath) => {
  if (!imagePath) {
    return `${API_BASE_URL}/public/default-avatar.svg`; 
  }
  return getImageUrl(imagePath);
};
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