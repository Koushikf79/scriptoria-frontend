import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { scene } = await req.json();
    if (!scene) {
      return new Response(JSON.stringify({ error: "Scene data is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a world-class cinematographer and storyboard artist. Given a scene description, create 6 detailed cinematic visual prompt variations. Each variation should describe a different camera angle/treatment: Wide Shot, Close-up, Low Angle, Top Angle, Day Lighting, Night Lighting. Use the generate_storyboard tool.`,
          },
          {
            role: "user",
            content: `Create 6 cinematic storyboard variations for this scene:\n\nLocation: ${scene.location}\nTime: ${scene.time_of_day}\nCharacters: ${scene.characters?.join(", ")}\nDescription: ${scene.description}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_storyboard",
              description: "Generate 6 cinematic storyboard prompt variations",
              parameters: {
                type: "object",
                properties: {
                  variations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        angle: { type: "string", description: "Wide Shot, Close-up, Low Angle, Top Angle, Day Lighting, or Night Lighting" },
                        prompt: { type: "string", description: "Detailed visual prompt describing the shot" },
                        camera: { type: "string", description: "Camera movement type" },
                        lens: { type: "string", description: "Lens suggestion" },
                        lighting: { type: "string", description: "Lighting setup" },
                        mood: { type: "string", description: "Emotional mood" },
                        composition: { type: "string", description: "Composition notes" },
                      },
                      required: ["angle", "prompt", "camera", "lens", "lighting", "mood", "composition"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["variations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_storyboard" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429 || status === 402) {
        return new Response(JSON.stringify({ error: status === 429 ? "Rate limited" : "Payment required" }), {
          status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ variations: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("storyboard-generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
