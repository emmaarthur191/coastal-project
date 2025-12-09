// File Upload Handler
class FileUploadHandler {
  static validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported');
    }

    return true;
  }

  static async uploadFile(file, onProgress) {
    this.validateFile(file);

    // Simulate upload progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress?.(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));

      // In a real implementation, this would upload to your server
      // For now, we'll simulate a successful upload
      setTimeout(() => {
        resolve({
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        });
      }, 2000);
    });
  }
}

export default FileUploadHandler;