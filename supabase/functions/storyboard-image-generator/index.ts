import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type StoryboardVariation = {
  angle: string;
  prompt: string;
  camera: string;
  lens: string;
  lighting: string;
  mood: string;
  composition: string;
};

const buildSvgFallbackDataUri = (angle: string, lighting: string, mood: string) => {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="768" height="448" viewBox="0 0 768 448">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="768" height="448" fill="url(#g)"/>
  <rect x="24" y="24" width="720" height="400" rx="14" fill="none" stroke="#334155" stroke-width="2"/>
  <text x="40" y="90" fill="#e2e8f0" font-size="34" font-family="Arial, sans-serif" font-weight="700">Storyboard Preview</text>
  <text x="40" y="150" fill="#93c5fd" font-size="24" font-family="Arial, sans-serif">Angle: ${angle.replace(/&/g, "and")}</text>
  <text x="40" y="190" fill="#cbd5e1" font-size="20" font-family="Arial, sans-serif">Lighting: ${lighting.replace(/&/g, "and")}</text>
  <text x="40" y="230" fill="#cbd5e1" font-size="20" font-family="Arial, sans-serif">Mood: ${mood.replace(/&/g, "and")}</text>
  <text x="40" y="390" fill="#64748b" font-size="16" font-family="Arial, sans-serif">AI image source unavailable, fallback preview generated.</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { scene, variations } = await req.json();
    if (!scene || !Array.isArray(variations)) {
      return new Response(JSON.stringify({ error: "scene and variations are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const images = await Promise.all(
      (variations as StoryboardVariation[]).map(async (variation, index) => {
        const characterList = Array.isArray(scene.characters) ? scene.characters.join(", ") : "cinematic characters";
        const prompt = [
          variation.prompt,
          scene.description || "cinematic scene",
          `location: ${scene.location || "unknown"}`,
          `time of day: ${scene.time_of_day || "unknown"}`,
          `characters: ${characterList}`,
          `camera angle: ${variation.angle}`,
          `camera movement: ${variation.camera}`,
          `lens: ${variation.lens}`,
          `lighting: ${variation.lighting}`,
          `mood: ${variation.mood}`,
          `composition: ${variation.composition}`,
          "cinematic storyboard frame, realistic film still, coherent composition",
        ]
          .join(", ")
          .slice(0, 520);

        const encodedPrompt = encodeURIComponent(prompt);
        const seed = `${scene.scene_number || 0}${index + 1}`;
        const urls = [
          `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=768&height=448&seed=${seed}&nologo=true`,
          `https://image.pollinations.ai/prompt/${encodedPrompt}?model=turbo&width=768&height=448&seed=${seed}&nologo=true`,
        ];

        for (const url of urls) {
          try {
            const imageResp = await fetch(url);
            if (imageResp.ok) {
              return { image_url: url };
            }
          } catch {
            // try next image source
          }
        }

        return {
          image_url: buildSvgFallbackDataUri(variation.angle, variation.lighting, variation.mood),
        };
      }),
    );

    return new Response(JSON.stringify({ images }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("storyboard-image-generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
