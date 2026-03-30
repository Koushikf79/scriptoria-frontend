import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { scenes, modifications } = await req.json();
    if (!scenes || !Array.isArray(scenes)) {
      return new Response(JSON.stringify({ error: "Scenes array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const sceneDigest = scenes
      .map((scene: any) =>
        `Scene ${scene.scene_number}: action=${scene.action_intensity}, emotion=${scene.emotional_intensity}, complexity=${scene.production_complexity}, dominant=${scene.dominant_emotion || "unknown"}`,
      )
      .join("\n")
      .slice(0, 15000);

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
            content:
              "You are a cinematic strategy simulator. Simulate what-if narrative adjustments and their impact on audience emotion, market viability, and budget direction. Use simulate_narrative_adjustment tool only.",
          },
          {
            role: "user",
            content: `Simulate narrative adjustments with these modifications:\n${JSON.stringify(modifications || {}, null, 2)}\n\nOriginal scenes:\n${sceneDigest}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "simulate_narrative_adjustment",
              description: "Simulate narrative and production impact from screenplay modifications",
              parameters: {
                type: "object",
                properties: {
                  adjusted_emotion_curve: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        scene_number: { type: "number" },
                        joy: { type: "number" },
                        sadness: { type: "number" },
                        anger: { type: "number" },
                        fear: { type: "number" },
                        surprise: { type: "number" },
                        tension: { type: "number" },
                        overall_intensity: { type: "number" },
                        dominant_emotion: { type: "string" },
                        emotional_shift_from_previous: { type: "number" },
                        audience_engagement_probability: { type: "number" },
                        pacing_score: { type: "number" },
                      },
                      required: [
                        "scene_number",
                        "joy",
                        "sadness",
                        "anger",
                        "fear",
                        "surprise",
                        "tension",
                        "overall_intensity",
                        "dominant_emotion",
                        "emotional_shift_from_previous",
                        "audience_engagement_probability",
                        "pacing_score",
                      ],
                      additionalProperties: false,
                    },
                  },
                  adjusted_budget_projection: {
                    type: "object",
                    properties: {
                      telugu: { type: "number" },
                      bollywood: { type: "number" },
                      hollywood: { type: "number" },
                      korean: { type: "number" },
                      general: { type: "number" },
                    },
                    required: ["telugu", "bollywood", "hollywood", "korean", "general"],
                    additionalProperties: false,
                  },
                  market_viability_shift: {
                    type: "object",
                    properties: {
                      telugu: { type: "number" },
                      bollywood: { type: "number" },
                      hollywood: { type: "number" },
                      korean: { type: "number" },
                      general: { type: "number" },
                    },
                    required: ["telugu", "bollywood", "hollywood", "korean", "general"],
                    additionalProperties: false,
                  },
                  narrative_strength_delta: { type: "number" },
                },
                required: [
                  "adjusted_emotion_curve",
                  "adjusted_budget_projection",
                  "market_viability_shift",
                  "narrative_strength_delta",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "simulate_narrative_adjustment" } },
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
      return new Response(toolCall.function.arguments, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        adjusted_emotion_curve: [],
        adjusted_budget_projection: { telugu: 0, bollywood: 0, hollywood: 0, korean: 0, general: 0 },
        market_viability_shift: { telugu: 0, bollywood: 0, hollywood: 0, korean: 0, general: 0 },
        narrative_strength_delta: 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("what-if-simulator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
