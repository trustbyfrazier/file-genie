import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Upload function called");

    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    console.log("User authenticated:", user.id);

    // Parse form data
    const formData = await req.formData();
    const friendlyName = formData.get("friendlyName") as string;
    const description = formData.get("description") as string;
    const originalFilename = formData.get("originalFilename") as string;
    const mimeType = formData.get("mimeType") as string;
    const file = formData.get("file") as File | null;
    const textContent = formData.get("textContent") as string | null;

    console.log("Received:", { friendlyName, originalFilename, mimeType, hasFile: !!file, hasText: !!textContent });

    // Generate file ID
    const fileId = crypto.randomUUID();

    // Prepare file content
    let fileBuffer: ArrayBuffer;
    let finalMimeType = mimeType;
    let finalFilename = originalFilename;

    if (file) {
      fileBuffer = await file.arrayBuffer();
    } else if (textContent) {
      // For text content, we'll send it as plain text to n8n
      // n8n can convert it to docx if needed
      const encoder = new TextEncoder();
      fileBuffer = encoder.encode(textContent).buffer as ArrayBuffer;
      finalMimeType = "text/plain";
      finalFilename = `${friendlyName}.txt`;
    } else {
      throw new Error("No file or text content provided");
    }

    console.log("Prepared file:", { fileId, size: fileBuffer.byteLength });

    // Send to n8n webhook
    const n8nWebhookUrl = Deno.env.get("N8N_UPLOAD_WEBHOOK_URL");
    if (!n8nWebhookUrl) {
      throw new Error("N8N webhook URL not configured");
    }

    console.log("Sending to n8n webhook...");

    const n8nFormData = new FormData();
    n8nFormData.append("fileId", fileId);
    n8nFormData.append("userId", user.id);
    n8nFormData.append("friendlyName", friendlyName);
    n8nFormData.append("description", description);
    n8nFormData.append("originalFilename", finalFilename);
    n8nFormData.append("mimeType", finalMimeType);
    n8nFormData.append("file", new Blob([fileBuffer], { type: finalMimeType }), finalFilename);

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      body: n8nFormData,
    });

    // Handle n8n response - may be empty or non-JSON
    const responseText = await n8nResponse.text();
    console.log("n8n raw response:", responseText);

    let n8nResult: { success?: boolean; error?: string; fileId?: string } = {};
    
    if (responseText) {
      try {
        n8nResult = JSON.parse(responseText);
      } catch {
        console.log("n8n returned non-JSON response, treating as success");
        // If n8n returns non-JSON but status is OK, treat as success
        if (n8nResponse.ok) {
          n8nResult = { success: true };
        } else {
          throw new Error(`n8n returned invalid response: ${responseText.substring(0, 100)}`);
        }
      }
    } else {
      // Empty response - check status code
      if (n8nResponse.ok) {
        console.log("n8n returned empty response with OK status, treating as success");
        n8nResult = { success: true };
      } else {
        throw new Error("n8n returned empty response with error status");
      }
    }

    console.log("n8n result:", n8nResult);

    if (!n8nResponse.ok || !n8nResult.success) {
      throw new Error(n8nResult.error || "n8n processing failed");
    }

    // Only save to Supabase if n8n succeeded
    console.log("n8n success, saving to Supabase...");

    // Upload to storage
    const storagePath = `${user.id}/${fileId}`;
    const { error: storageError } = await supabase.storage
      .from("files")
      .upload(storagePath, fileBuffer, {
        contentType: finalMimeType,
        upsert: false,
      });

    if (storageError) {
      console.error("Storage error:", storageError);
      throw new Error("Failed to upload file to storage");
    }

    // Save metadata to database
    const { error: dbError } = await supabase.from("files").insert({
      file_id: fileId,
      user_id: user.id,
      original_filename: finalFilename,
      friendly_name: friendlyName,
      description: description,
      mime_type: finalMimeType,
    });

    if (dbError) {
      console.error("Database error:", dbError);
      // Try to clean up storage
      await supabase.storage.from("files").remove([storagePath]);
      throw new Error("Failed to save file metadata");
    }

    console.log("Upload complete:", fileId);

    return new Response(
      JSON.stringify({ success: true, fileId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
