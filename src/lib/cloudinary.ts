import { v2 as cloudinary } from "cloudinary";

let _configured = false;

function configure() {
  if (_configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  _configured = true;
}

/**
 * Upload an image from a URL to Cloudinary.
 * Returns the secure Cloudinary URL.
 */
export async function uploadFromUrl(imageUrl: string, folder = "products"): Promise<string> {
  configure();
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder,
    resource_type: "image",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });
  return result.secure_url;
}

/**
 * Upload a base64-encoded image to Cloudinary.
 * Returns the secure Cloudinary URL.
 */
export async function uploadFromBase64(base64Data: string, folder = "products"): Promise<string> {
  configure();
  const result = await cloudinary.uploader.upload(base64Data, {
    folder,
    resource_type: "image",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });
  return result.secure_url;
}

/**
 * Delete an image from Cloudinary by its public ID.
 */
export async function deleteImage(publicId: string): Promise<void> {
  configure();
  await cloudinary.uploader.destroy(publicId);
}
