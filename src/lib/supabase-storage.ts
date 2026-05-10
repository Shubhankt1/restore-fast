import { createClient } from "@supabase/supabase-js";

import { AppError } from "./errors";

function requireStorageEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;

  if (!supabaseUrl || !anonKey || !bucket) {
    throw new AppError(
      "Supabase storage is not configured",
      500,
      "INTERNAL_ERROR",
    );
  }

  return { supabaseUrl, anonKey, bucket };
}

export async function uploadPunchItemPhoto(input: {
  punchItemId: string;
  file: File;
}): Promise<string> {
  const { supabaseUrl, anonKey, bucket } = requireStorageEnv();
  const client = createClient(supabaseUrl, anonKey);
  const extension = input.file.name.includes(".")
    ? input.file.name.slice(input.file.name.lastIndexOf(".")).toLowerCase()
    : "";
  const storagePath = `punch-items/${input.punchItemId}/${crypto.randomUUID()}${extension}`;

  const { error } = await client.storage
    .from(bucket)
    .upload(storagePath, input.file, {
      contentType: input.file.type || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    throw new AppError(
      "Failed to upload punch item photo",
      502,
      "INTERNAL_ERROR",
      error.message,
    );
  }

  const { data } = client.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}
