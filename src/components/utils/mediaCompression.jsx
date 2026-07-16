import Compressor from 'compressorjs';

// File size limits (in bytes)
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// Target sizes for compression
const TARGET_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB target
const TARGET_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB target

export const validateFileSize = (file, type) => {
  const limits = {
    video: MAX_VIDEO_SIZE,
    audio: MAX_AUDIO_SIZE,
    image: MAX_IMAGE_SIZE,
  };

  const limit = limits[type];
  if (!limit) return { valid: true };

  if (file.size > limit) {
    return {
      valid: false,
      message: `File size (${formatFileSize(file.size)}) exceeds the maximum allowed (${formatFileSize(limit)})`,
    };
  }

  return { valid: true };
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
      convertSize: TARGET_IMAGE_SIZE,
      success: (result) => {
        // Convert blob to file
        const compressedFile = new File([result], file.name, {
          type: result.type,
          lastModified: Date.now(),
        });
        resolve(compressedFile);
      },
      error: reject,
    });
  });
};

export const compressVideo = async (file, onProgress) => {
  // For videos, we'll use quality reduction
  // Note: True video compression requires server-side processing
  // This is a client-side workaround using canvas for video frames
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      // Set canvas size (reduce resolution if video is too large)
      const maxWidth = 1280;
      const maxHeight = 720;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // For now, we'll just return the original file with a warning
      // True compression requires server-side processing
      if (file.size > TARGET_VIDEO_SIZE) {
        console.warn(`Video file is large (${formatFileSize(file.size)}). Consider using external video hosting.`);
      }
      
      resolve(file);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video for compression'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

export const compressMedia = async (file, type, onProgress) => {
  // Validate file size first
  const validation = validateFileSize(file, type);
  if (!validation.valid) {
    throw new Error(validation.message);
  }
  
  // Compress based on type
  if (type === 'image') {
    return await compressImage(file);
  } else if (type === 'video') {
    return await compressVideo(file, onProgress);
  } else if (type === 'audio') {
    // Audio compression is limited on client-side
    // Just validate and return
    if (file.size > TARGET_VIDEO_SIZE) {
      console.warn(`Audio file is large (${formatFileSize(file.size)})`);
    }
    return file;
  }
  
  return file;
};