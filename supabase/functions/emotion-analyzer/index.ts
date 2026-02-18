import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { scenes } = await req.json();
    if (!scenes || !Array.isArray(scenes)) {
      return new Response(JSON.stringify({ error: "Scenes array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const sceneSummaries = scenes.map((s: any) =>
      `Scene ${s.scene_number}: ${s.location} (${s.time_of_day}) - ${s.description}`
    ).join("\n");

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
            content: "You are an emotion analyst for cinema. Analyze each scene's emotional content and classify emotions. Use the extract_emotions tool.",
          },
          {
            role: "user",
            content: `Analyze emotions for each scene:\n\n${sceneSummaries}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_emotions",
              description: "Extract emotion scores for each scene",
              parameters: {
                type: "object",
                properties: {
                  emotions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        scene_number: { type: "number" },
                        joy: { type: "number", description: "0-10" },
                        sadness: { type: "number", description: "0-10" },
                        anger: { type: "number", description: "0-10" },
                        fear: { type: "number", description: "0-10" },
                        surprise: { type: "number", description: "0-10" },
                        tension: { type: "number", description: "0-10" },
                        overall_intensity: { type: "number", description: "0-10" },
                      },
                      required: ["scene_number", "joy", "sadness", "anger", "fear", "surprise", "tension", "overall_intensity"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["emotions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_emotions" } },
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

    return new Response(JSON.stringify({ emotions: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("emotion-analyzer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
