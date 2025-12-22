import { AnamneseData, CapillaryImage, ArsenalConfig, UserMode } from "../types";

/**
 * RC-BioScan Image Pipeline (Vercel-safe)
 * - Downscale aggressively to reduce payload (base64 gets huge fast)
 * - Convert to JPEG
 * - Keep AI-readable detail with high-quality interpolation
 */

const MAX_DIMENSION = 800;      // aggressive because you said even 1 image fails
const JPEG_QUALITY = 0.40;      // 0.35–0.50 is usually the sweet spot for AI + Vercel

async function compressImageToJpeg(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Keep aspect ratio
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Always output JPEG to reduce size
        const compressed = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function extractBase64(dataUrl: string): string {
  // "data:image/jpeg;base64,AAAA..." -> "AAAA..."
  const parts = dataUrl.split(",");
  return parts.length > 1 ? parts[1] : dataUrl;
}

function buildSystemInstruction(arsenal: ArsenalConfig): string {
  const fixedBrand = (arsenal?.fixedBrand || "").trim();

  // Keep it compact (tokens matter, also reduces chance of exceeding limits)
  return `
You are an expert in advanced trichology and cosmetic haircare.
Output language: Portuguese (Brazil).
Output format: plain text only (WhatsApp-friendly). Do NOT use Markdown.
Use separators exactly like: ────────────────────────────────

Brand rule:
- If a fixed brand is selected, recommend ONLY real products from that brand.
- If no brand is selected, recommend only categories (shampoo/mask/leave-in/oil etc.), no product names.

Safety:
- Do not diagnose diseases.
- If signs suggest medical causes (severe shedding, lesions, severe inflammation), recommend a dermatologist.

Footer (ALWAYS include exactly at the end):
Este diagnóstico foi realizado com tecnologia RC-BioScan IA Pro
Inteligência Artificial desenvolvida por Rosemary Costa – CABELO IA
Pioneira no Brasil em Inteligência Artificial aplicada à Beleza
www.cabeloia.com.br
WhatsApp: +55 11 92102-2430
`.trim();
}

function buildPrompt(
  anamnese: AnamneseData,
  images: CapillaryImage[],
  arsenal: ArsenalConfig,
  mode: UserMode
): string {
  const fixedBrand = (arsenal?.fixedBrand || "").trim();
  const zones = images.map((i) => i.zone).filter(Boolean).join(", ");

  return `
MODE: ${mode}
BRAND_SELECTED: ${fixedBrand ? fixedBrand : "NONE"}

CLIENT_NAME: ${anamnese.name || ""}
COMPLAINTS: ${(anamnese.complaints || []).join(", ")}
CHEMICAL_HISTORY: ${(anamnese.chemicalHistory || []).join(", ")}
HEAT_USAGE: ${(anamnese.heatUsage || "")}
SCALP_SENSITIVITY: ${anamnese.scalpSensitivity ? "YES" : "NO"}
NOTES: ${(anamnese.notes || "")}
IMAGE_ZONES: ${zones}

TASK:
1) Generate a cosmetic (non-medical) diagnosis based on history + images.
2) Provide: Identification, Cosmetic summary, Zone mapping, Alerts/Risks, Recommended conduct.
3) Provide a 4-week schedule organized by treatment type, clearly labeled:
   HIDRATAÇÃO / NUTRIÇÃO / RECONSTRUÇÃO / COURO CABELUDO
   For each treatment, list:
   – Shampoo:
   – Mask:
   – Conditioner (if applicable):
   – Leave-in / Heat protectant:
   – Oil / Finisher (if applicable):
4) Keep it WhatsApp-ready: plain text, separators, and blank lines between sections.
5) Always include the footer at the end.
`.trim();
}

export async function analyzeCapillaryData(
  anamnese: AnamneseData,
  images: CapillaryImage[],
  arsenal: ArsenalConfig,
  mode: UserMode
) {
  // 1) Compress images (client-side) to reduce payload drastically
  const compressedImages = await Promise.all(
    (images || []).map(async (img) => ({
      ...img,
      base64: await compressImageToJpeg(img.base64),
    }))
  );

  // 2) Build prompt + system instruction
  const systemInstruction = buildSystemInstruction(arsenal);
  const prompt = buildPrompt(anamnese, compressedImages, arsenal, mode);

  // 3) Build multipart content (text + inline images)
  const parts: any[] = [{ text: prompt }];

  for (const img of compressedImages) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: extractBase64(img.base64),
      },
    });
  }

  // 4) Payload (common format used by Gemini REST/serverless wrappers)
  const payload = {
    contents: [{ role: "user", parts }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
  };

  // 5) Call your serverless endpoint
  const response = await fetch("/api/analisar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // 6) Robust error handling (very important on Vercel)
  let result: any = null;
  try {
    result = await response.json();
  } catch {
    const raw = await response.text().catch(() => "");
    throw new Error(`API returned non-JSON response (status ${response.status}): ${raw || "empty"}`);
  }

  if (!response.ok) {
    const msg =
      result?.error?.message ||
      result?.message ||
      `API error (status ${response.status})`;
    throw new Error(msg);
  }

  const text =
    result?.candidates?.[0]?.content?.parts?.find((p: any) => typeof p?.text === "string")?.text ||
    result?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Empty diagnosis response from model.");
  }

  return text;
}
