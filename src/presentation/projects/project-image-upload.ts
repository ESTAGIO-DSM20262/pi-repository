export const PROJECT_IMAGE_UPLOAD_ENABLED = false

export interface UploadedProjectImage {
  url: string
}

export async function uploadProjectImage(_file: File): Promise<UploadedProjectImage> {
  throw new Error('O envio de imagens ainda não está disponível.')
}
