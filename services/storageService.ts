// Firebase Storage service for managing lesion images
import { 
  ref, 
  uploadString, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Upload a base64 image to Firebase Storage
 * @param userId - The user ID to organize files
 * @param base64Image - Base64 encoded image data URL
 * @param filename - Optional filename (auto-generated if not provided)
 * @returns Download URL of the uploaded image
 */
export const uploadLesionImage = async (
  userId: string, 
  base64Image: string, 
  filename?: string
): Promise<string> => {
  try {
    // Generate filename if not provided
    const imageName = filename || `lesion_${Date.now()}.jpg`;
    const imagePath = `lesions/${userId}/${imageName}`;
    
    // Create a reference to the file location
    const imageRef = ref(storage, imagePath);
    
    // Upload the base64 string
    // Firebase handles the data URL format (data:image/jpeg;base64,...)
    await uploadString(imageRef, base64Image, 'data_url');
    
    // Get the download URL
    const downloadURL = await getDownloadURL(imageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Erro ao fazer upload da imagem');
  }
};

/**
 * Delete an image from Firebase Storage
 * @param imageUrl - The full download URL or storage path of the image
 */
export const deleteLesionImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the path from the URL if it's a full URL
    let imagePath = imageUrl;
    
    if (imageUrl.includes('firebasestorage.googleapis.com')) {
      // Parse the URL to get the path
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      if (pathMatch) {
        imagePath = decodeURIComponent(pathMatch[1]);
      }
    }
    
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw error - image might already be deleted
    console.warn('Failed to delete image, continuing anyway');
  }
};

/**
 * Upload patient profile image
 */
export const uploadPatientImage = async (
  userId: string,
  base64Image: string,
  filename?: string
): Promise<string> => {
  try {
    const imageName = filename || `patient_${Date.now()}.jpg`;
    const imagePath = `patients/${userId}/${imageName}`;
    
    const imageRef = ref(storage, imagePath);
    await uploadString(imageRef, base64Image, 'data_url');
    
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading patient image:', error);
    throw new Error('Erro ao fazer upload da imagem do paciente');
  }
};

/**
 * Convert a base64 image to a smaller thumbnail (client-side resize)
 * This can help reduce storage costs and improve performance
 */
export const createThumbnail = (
  base64Image: string, 
  maxWidth: number = 300, 
  maxHeight: number = 300
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64
      const thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.7);
      resolve(thumbnailBase64);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = base64Image;
  });
};
