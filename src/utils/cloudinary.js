// src/utils/cloudinary.js
export async function uploadToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", preset);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      console.error("Cloudinary upload failed", res.status);
      return null;
    }
    const data = await res.json();
    // data contains secure_url, original_filename, resource_type, etc.
    return data;
  } catch (e) {
    console.error("uploadToCloudinary", e);
    return null;
  }
}
