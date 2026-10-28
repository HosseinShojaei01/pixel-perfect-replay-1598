import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const dataUrl = z.string().regex(/^data:image\/(jpeg|png|webp);base64,/).max(8_000_000);
const input = z.object({ portrait: dataUrl, references: z.array(dataUrl).min(1).max(4), consent: z.literal(true) });

export const aiResultSchema = z.object({
  summary: z.string(),
  comparisons: z.array(z.object({
    reference: z.number().int(),
    lighting: z.string(), pose: z.string(), composition: z.string(), color: z.string(),
    similarity: z.number().min(0).max(100),
  })),
});
export type AiResult = z.infer<typeof aiResultSchema>;

const INSTRUCTIONS = `You compare photographs ONLY by non-sensitive photographic attributes: lighting, pose/camera angle, composition/framing, and color grading/style.
Never mention or infer ethnicity, race, nationality, ancestry, genetics, age, gender, health, attractiveness or identity. Do not describe facial features.
Image 1 is the user's photo; following images are references numbered from 1.
Reply with JSON only: {"summary": string, "comparisons": [{"reference": number, "lighting": string, "pose": string, "composition": string, "color": string, "similarity": number 0-100}]}. Keep each field to one short sentence.`;

export const describeVisualSimilarity = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText } = await import("ai");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1", apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system: INSTRUCTIONS,
      messages: [{ role: "user", content: [
        { type: "text", text: `Compare the user's photo with ${data.references.length} reference photo(s). Return json.` },
        { type: "image", image: data.portrait },
        ...data.references.map((image) => ({ type: "image" as const, image })),
      ] }],
      providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", store: false } },
    });
    let text: string;
    try { text = await result.text; }
    catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 429) throw new Error("Too many requests — please wait a moment and try again.");
      if (status === 402) throw new Error("AI credits are used up. Add credits to continue.");
      throw new Error("The AI comparison failed. Please try again.");
    }
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = aiResultSchema.safeParse(JSON.parse(json || "null"));
    if (!parsed.success) throw new Error("The AI returned an unreadable answer. No result was invented.");
    return parsed.data;
  });
