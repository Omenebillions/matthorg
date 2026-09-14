/**
 * Helper to upload files to Cloudflare R2 via our proxy server
 */

export async function uploadFileToR2(file: File): Promise<string> {
  try {
    // 1. Get presigned URL from our backend
    const presignRes = await fetch('/api/storage/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    });

    if (!presignRes.ok) {
      const errorData = await presignRes.json();
      throw new Error(errorData.error || 'Failed to get upload URL');
    }

    const { uploadUrl, publicUrl } = await presignRes.json();

    // 2. Upload file directly to R2 using the presigned URL
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error('Failed to upload file to storage');
    }

    // 3. Return the public URL for storing in database
    return publicUrl;
  } catch (err: any) {
    console.error('File upload error:', err);
    throw err;
  }
}

export async function uploadPdfToR2(blob: Blob, fileName: string): Promise<string> {
  return uploadFileToR2(new File([blob], fileName, { type: 'application/pdf' }));
}
