import { AnamneseData, CapillaryImage, ArsenalConfig, UserMode } from "../types";

const MAX_DIMENSION = 800; 
const JPEG_QUALITY = 0.4; 

async function compressImageToJpeg(base64Str: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;
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
        if (!ctx) return resolve(base64Str);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      } catch { resolve(base64Str); }
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
}

export async function analyzeCapillaryData(
  anamnese: AnamneseData,
  images: CapillaryImage[],
  arsenal: ArsenalConfig,
  mode: UserMode
) {
  const compressedImages = await Promise.all(
    (images || []).map(async (img) => ({
      ...img,
      base64: await compressImageToJpeg(img.base64),
    }))
  );

  const systemInstruction = `
    ACT AS AN EXPERT TRICHOLOGIST. 
    ALWAYS RESPOND IN PORTUGUESE (BRAZIL).
    FORMAT: PLAIN TEXT, NO MARKDOWN, USE SEPARATORS: ────────────────────────────────
    FOOTER: RC-BioScan IA Pro - Developed by Rosemary Costa.
  `;

  const prompt = `
    CLIENT: ${anamnese.name}
    COMPLAINTS: ${(anamnese.complaints || []).join(", ")}
    HISTORY: ${(anamnese.chemicalHistory || []).join(", ")}
    IMAGES: ${compressedImages.map((i) => i.zone).join(", ")}
  `;

  const parts: any[] = [{ text: prompt }];
  for (const img of compressedImages) {
    const b64Data = img.base64.split(",")[1];
    parts.push({
      inline_data: {
        mime_type: "image/jpeg",
        data: b64Data,
      },
    });
  }

  const payload = {
    contents: [{ role: "user", parts }],
    system_instruction: { parts: [{ text: systemInstruction }] },
  };

  try {
    const response = await fetch("/api/analisar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "API Error");
    
    return result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw new Error("Diagnosis failed: " + error.message);
  }
}
