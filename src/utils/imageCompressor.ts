/**
 * Client-side Image Compression Utility
 * Resizes and compresses payment receipt screenshots before uploading
 * to Firestore, ensuring documents remain well under Firestore's 1MB limit.
 */

export async function compressImage(
  input: File | string,
  maxWidth = 800,
  maxHeight = 1000,
  initialQuality = 0.70
): Promise<string> {
  // If input is string and already under 80KB, safe to return
  if (typeof input === 'string' && input.length < 80 * 1024) {
    return input;
  }

  // Ensure DOM is available
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return typeof input === 'string' && input.length < 250 * 1024 ? input : '';
  }

  return new Promise((resolve) => {
    const img = new Image();
    let objectUrl: string | null = null;

    // Only set crossOrigin for remote http/https images
    if (typeof input === 'string' && (input.startsWith('http://') || input.startsWith('https://'))) {
      img.crossOrigin = 'anonymous';
    }

    const cleanup = () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
        objectUrl = null;
      }
    };

    const emergencyFallback = () => {
      cleanup();
      if (typeof input === 'string') {
        // Only return if under 300KB, otherwise empty to prevent Firestore rejection
        if (input.length < 300 * 1024) {
          resolve(input);
        } else {
          console.warn('[ImageCompressor] Oversized input dropped to protect 1MB Firestore limit');
          resolve('');
        }
      } else {
        resolve('');
      }
    };

    img.onload = () => {
      try {
        cleanup();

        let width = img.width || 800;
        let height = img.height || 1000;

        // Maintain aspect ratio while bounding within maxWidth & maxHeight
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const bestRatio = Math.min(widthRatio, heightRatio);
          width = Math.max(1, Math.round(width * bestRatio));
          height = Math.max(1, Math.round(height * bestRatio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          emergencyFallback();
          return;
        }

        // Draw white background for transparent PNG receipts
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = initialQuality;
        let result = canvas.toDataURL('image/jpeg', quality);

        // Step-down quality loop to guarantee target size under 220KB
        while (result.length > 220 * 1024 && quality > 0.25) {
          quality -= 0.15;
          result = canvas.toDataURL('image/jpeg', quality);
        }

        // If still over 250KB, downscale canvas dimensions
        if (result.length > 250 * 1024) {
          const scaledCanvas = document.createElement('canvas');
          scaledCanvas.width = Math.max(100, Math.round(width * 0.65));
          scaledCanvas.height = Math.max(100, Math.round(height * 0.65));
          const sCtx = scaledCanvas.getContext('2d');
          if (sCtx) {
            sCtx.fillStyle = '#FFFFFF';
            sCtx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
            sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
            result = scaledCanvas.toDataURL('image/jpeg', 0.50);
          }
        }

        resolve(result);
      } catch (err) {
        console.warn('[ImageCompressor] Canvas processing warning:', err);
        emergencyFallback();
      }
    };

    img.onerror = () => {
      console.warn('[ImageCompressor] Image loading error');
      emergencyFallback();
    };

    try {
      if (typeof input === 'string') {
        img.src = input;
      } else {
        objectUrl = URL.createObjectURL(input);
        img.src = objectUrl;
      }
    } catch {
      emergencyFallback();
    }
  });
}
