import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { scene_breakdown, star_tier, target_market, deterministic_budget } = await req.json();

    if (!scene_breakdown || !Array.isArray(scene_breakdown)) {
      return new Response(JSON.stringify({ error: "scene_breakdown array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const sceneJson = JSON.stringify(scene_breakdown).slice(0, 22000);
    const deterministicJson = JSON.stringify(deterministic_budget || {}).slice(0, 6000);

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
              "You are a senior film production economist. Estimate realistic production budgets for the selected market and star tier using structured scene data. Use estimate_budget_projection tool only. Return strict JSON matching the schema.",
          },
          {
            role: "user",
            content: `Estimate budget tiers using this input:\n\nScene Breakdown:\n${sceneJson}\n\nStar Tier: ${star_tier || "B"}\nTarget Market: ${target_market || "general"}\nDeterministic Reference Budget (for calibration only):\n${deterministicJson}\n\nRules:\n- Keep professional production standards\n- Avoid unrealistic quality cuts\n- Respect selected market economics and currency scale\n- Return low, mid, high totals, category breakdown, and cost drivers`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "estimate_budget_projection",
              description: "Estimate realistic budget tiers and breakdown for screenplay production",
              parameters: {
                type: "object",
                properties: {
                  total_low: { type: "number" },
                  total_mid: { type: "number" },
                  total_high: { type: "number" },
                  breakdown: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        low: { type: "number" },
                        mid: { type: "number" },
                        high: { type: "number" },
                      },
                      required: ["category", "low", "mid", "high"],
                      additionalProperties: false,
                    },
                  },
                  cost_drivers: {
                    type: "array",
                    items: { type: "string" },
                  },
                  confidence_score: { type: "number" },
                },
                required: ["total_low", "total_mid", "total_high", "breakdown", "cost_drivers"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "estimate_budget_projection" } },
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
      return new Response(toolCall.function.arguments, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        total_low: 0,
        total_mid: 0,
        total_high: 0,
        breakdown: [],
        cost_drivers: [],
        confidence_score: 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("ai-budget-estimator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
