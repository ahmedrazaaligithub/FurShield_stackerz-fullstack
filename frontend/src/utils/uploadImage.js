import axios from 'axios';
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dwrtj67eh";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "furshield_products";
console.log('Cloudinary Config:', {
  CLOUD_NAME,
  UPLOAD_PRESET,
  envCloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  envPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
});
export const uploadImageToCloudinary = async (image)=> {
  const formData = new FormData();
  formData.append('file', image);
  formData.append('upload_preset', UPLOAD_PRESET);
  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    formData
  );
  console.log('Cloudinary upload response:', response.data);
  return response.data;
};