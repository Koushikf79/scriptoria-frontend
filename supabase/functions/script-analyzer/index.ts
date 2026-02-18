import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { script } = await req.json();
    if (!script || typeof script !== "string") {
      return new Response(JSON.stringify({ error: "Script text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Truncate very long scripts to avoid token limits
    const truncatedScript = script.length > 15000 ? script.slice(0, 15000) + "\n...[truncated]" : script;

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
            content: `You are a professional screenplay analyst. Analyze the given screenplay and extract structured scene data. You MUST use the extract_scenes tool to return the data.`,
          },
          {
            role: "user",
            content: `Analyze this screenplay and extract every scene with its details:\n\n${truncatedScript}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_scenes",
              description: "Extract structured scene data from a screenplay",
              parameters: {
                type: "object",
                properties: {
                  scenes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        scene_number: { type: "number", description: "Sequential scene number starting from 1" },
                        location: { type: "string", description: "Scene location e.g. 'Royal Palace - Throne Room'" },
                        time_of_day: { type: "string", description: "DAY, NIGHT, DAWN, DUSK, SUNSET, etc." },
                        characters: { type: "array", items: { type: "string" }, description: "Character names in the scene" },
                        action_intensity: { type: "number", description: "Action intensity 1-10" },
                        emotional_intensity: { type: "number", description: "Emotional intensity 1-10" },
                        production_complexity: { type: "number", description: "Production complexity 1-10" },
                        description: { type: "string", description: "Brief scene description" },
                      },
                      required: ["scene_number", "location", "time_of_day", "characters", "action_intensity", "emotional_intensity", "production_complexity", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["scenes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_scenes" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);
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

    return new Response(JSON.stringify({ scenes: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("script-analyzer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
