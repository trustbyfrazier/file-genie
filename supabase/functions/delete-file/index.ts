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
    console.log("Delete function called");

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

    // Parse request body
    const { fileId } = await req.json();
    if (!fileId) {
      throw new Error("No fileId provided");
    }

    console.log("Deleting file:", fileId);

    // Get file metadata first
    const { data: fileData, error: fetchError } = await supabase
      .from("files")
      .select("*")
      .eq("file_id", fileId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      throw new Error("Failed to fetch file metadata");
    }

    if (!fileData) {
      throw new Error("File not found");
    }

    // Send delete request to n8n webhook
    const n8nWebhookUrl = Deno.env.get("N8N_DELETE_WEBHOOK_URL");
    if (!n8nWebhookUrl) {
      throw new Error("N8N delete webhook URL not configured");
    }

    console.log("Sending delete request to n8n...");

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileId: fileData.file_id,
        userId: fileData.user_id,
        friendlyName: fileData.friendly_name,
        originalFilename: fileData.original_filename,
        mimeType: fileData.mime_type,
        description: fileData.description,
      }),
    });

    const n8nResult = await n8nResponse.json();
    console.log("n8n response:", n8nResult);

    if (!n8nResponse.ok || !n8nResult.success) {
      throw new Error(n8nResult.error || "n8n delete processing failed");
    }

    // Only delete from Supabase if n8n succeeded
    console.log("n8n success, deleting from Supabase...");

    // Delete from storage
    const storagePath = `${user.id}/${fileId}`;
    const { error: storageError } = await supabase.storage
      .from("files")
      .remove([storagePath]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      // Continue anyway - the storage file might not exist
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("files")
      .delete()
      .eq("file_id", fileId)
      .eq("user_id", user.id);

    if (dbError) {
      console.error("Database delete error:", dbError);
      throw new Error("Failed to delete file from database");
    }

    console.log("Delete complete:", fileId);

    return new Response(
      JSON.stringify({ success: true, fileId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Delete error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
