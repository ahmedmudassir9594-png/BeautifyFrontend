import { buildApiUrl, request } from '@/services/api/client';

type ImageUploadResponse = {
  imageUrl?: string | null;
  relativeUrl?: string | null;
};

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request<ImageUploadResponse | null>('/uploads/image', {
    method: 'POST',
    body: formData,
  });
  const imageUrl = response && (response.imageUrl?.trim() || response.relativeUrl?.trim());

  if (!imageUrl) {
    throw new Error('The server uploaded the image but did not return an image URL.');
  }

  return /^https?:\/\//i.test(imageUrl) ? imageUrl : buildApiUrl(imageUrl);
}
