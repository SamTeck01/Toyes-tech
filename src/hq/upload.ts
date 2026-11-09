import { supabase } from "@/lib/supabase";

/**
 * Shrink a photo on the device before uploading (max 1200px, JPEG ~80%), so uploads are quick and
 * cheap on mobile data. A 6 MB phone photo usually ends up around 150–300 KB.
 */
export const compressImage = (file: File, max = 1200, quality = 0.8): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("This browser can't process photos."));
      ctx.fillStyle = "#fff"; // transparent PNGs get a white background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't read that photo."))), "image/jpeg", quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file isn't a photo we can read. Try a JPG or PNG."));
    };
    img.src = url;
  });

/** Upload a product photo and return its public web address. */
export const uploadProductPhoto = async (file: File, storeId: string | null) => {
  if (!supabase) throw new Error("Not connected.");
  if (!file.type.startsWith("image/")) throw new Error("Please choose a photo.");
  const blob = await compressImage(file);
  const path = `${storeId ?? "shared"}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from("product-images").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) throw new Error(/failed to fetch|network/i.test(error.message) ? "No internet. Connect and try the photo again." : error.message);
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
};
