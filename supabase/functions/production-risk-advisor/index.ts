import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const fallbackPayload = {
	primary_cost_drivers: [],
	hidden_cost_drivers: [],
	optimization_strategies: [],
	optimized_budget_projection: {
		telugu: 0,
		bollywood: 0,
		hollywood: 0,
		korean: 0,
		general: 0,
	},
	total_savings_percentage: 0,
	quality_tradeoff_assessment: "Insufficient data to assess quality trade-offs.",
};

serve(async (req) => {
	if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

	try {
		const { scene_breakdown, budget_projection, star_tier, target_market } = await req.json();

		if (!scene_breakdown || !Array.isArray(scene_breakdown)) {
			return new Response(JSON.stringify({ error: "scene_breakdown array is required" }), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		if (!budget_projection || typeof budget_projection !== "object") {
			return new Response(JSON.stringify({ error: "budget_projection object is required" }), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
		if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

		const scene_breakdown_json = JSON.stringify(scene_breakdown).slice(0, 20000);
		const budget_projection_json = JSON.stringify(budget_projection).slice(0, 10000);

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
							"You are a senior film production economist and pre-production strategist specializing in global cinema markets (Telugu, Bollywood, Hollywood, Korean, General). Your task is to analyze structured screenplay scene data and existing deterministic budget outputs, then identify primary cost drivers, explain reasons for cost escalation, suggest production optimizations, estimate optimized budget projections, and maintain realism according to industry standards. You must return STRICT JSON matching the tool schema. Do not return free text. Do not include explanations outside the JSON structure.",
					},
					{
						role: "user",
						content: `You are given:\n\n1. Scene Breakdown Array:\n${scene_breakdown_json}\n\n2. Deterministic Budget Projection (Existing Engine):\n${budget_projection_json}\n\n3. Selected Star Tier:\n${star_tier || "B"}\n\n4. Target Market:\n${target_market || "general"}\n\nAnalyze this data and:\n\n- Identify top cost-driving elements\n- Explain why each increases cost\n- Suggest optimization strategies that do NOT reduce cinematic impact significantly\n- Estimate optimized budgets for all 5 markets\n- Calculate potential savings percentage\n- Provide risk trade-offs of optimization\n\nBe realistic to film production economics.\nDo not reduce quality unrealistically.\nAssume professional production standards.\n\nReturn strictly structured JSON.",
					},
				],
				tools: [
					{
						type: "function",
						function: {
							name: "evaluate_budget_optimization",
							description: "Analyzes budget drivers and suggests optimization strategies",
							parameters: {
								type: "object",
								properties: {
									primary_cost_drivers: {
										type: "array",
										items: {
											type: "object",
											properties: {
												category: { type: "string" },
												impact_level: { type: "number" },
												reason: { type: "string" },
											},
											required: ["category", "impact_level", "reason"],
											additionalProperties: false,
										},
									},
									hidden_cost_drivers: {
										type: "array",
										items: { type: "string" },
									},
									optimization_strategies: {
										type: "array",
										items: {
											type: "object",
											properties: {
												strategy: { type: "string" },
												implementation_notes: { type: "string" },
												expected_savings_percentage: { type: "number" },
											},
											required: ["strategy", "implementation_notes", "expected_savings_percentage"],
											additionalProperties: false,
										},
									},
									optimized_budget_projection: {
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
									total_savings_percentage: {
										type: "number",
									},
									quality_tradeoff_assessment: {
										type: "string",
									},
								},
								required: [
									"primary_cost_drivers",
									"optimization_strategies",
									"optimized_budget_projection",
									"total_savings_percentage",
								],
								additionalProperties: false,
							},
						},
					},
				],
				tool_choice: { type: "function", function: { name: "evaluate_budget_optimization" } },
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

		return new Response(JSON.stringify(fallbackPayload), {
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	} catch (e) {
		console.error("production-risk-advisor error:", e);
		return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	}
});
