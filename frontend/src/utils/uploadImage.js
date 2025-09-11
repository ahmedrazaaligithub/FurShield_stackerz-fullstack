import axios from 'axios';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "diopvbr2u";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "survey_images";

export const uploadImageToCloudinary = async (image)=> {
  const formData = new FormData();
  formData.append('file', image);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    formData
  );
  console.log(response.data);
  
  return response.data;
};