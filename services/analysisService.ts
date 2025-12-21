
import { AnamneseData, CapillaryImage, ArsenalConfig, UserMode } from "../types";

// This function reduces image size while keeping quality for the AI
async function compressImage(base64Str: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1500; 
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_WIDTH) {
          width *= MAX_WIDTH / height;
          height = MAX_WIDTH;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7)); 
    };
  });
}

export async function analyzeCapillaryData(
  anamnese: AnamneseData,
  images: CapillaryImage[],
  arsenal: ArsenalConfig,
  mode: UserMode
) {
  // Step 1: Compress high-resolution images
  const compressedImages = await Promise.all(
    images.map(async (img) => ({
      ...img,
      base64: await compressImage(img.base64)
    }))
  );

  const systemInstruction = `
    Aja como um especialista em Tricologia e Cosmetologia Capilar Avançada.
    DIRETRIZES: 
    - Use linguagem ${mode === 'CLIENTE' ? 'simples' : 'técnica'}.
    - Relatório em Português (Brasil).
    - PROIBIDO Markdown. Use separadores: ────────────────────────────────
    RODAPÉ:
    Este diagnóstico foi realizado com tecnologia RC-BioScan IA Pro
    Inteligência Artificial desenvolvida por Rosemary Costa – CABELO IA
    www.cabeloia.com.br
  `;

  const prompt = `
    CLIENTE: ${anamnese.name}
    HISTÓRICO: ${anamnese.chemicalHistory.join(', ')}
    QUEIXAS: ${anamnese.complaints.join(', ')}
    IMAGENS: ${compressedImages.map(img => img.zone).join(', ')}
    Gere o diagnóstico completo agora.
  `;

  try {
    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          ...compressedImages.map(img => ({
            inlineData: {
              mimeType: "image/jpeg",
              data: img.base64.split(',')[1]
            }
          }))
        ]
      }],
      systemInstruction: { parts: [{ text: systemInstruction }] }
    };

    const response = await fetch('/api/analisar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("API Connection Error");
    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("Falha ao processar imagens pesadas. Tente novamente.");
  }
}
