import { AnamneseData, CapillaryImage, ArsenalConfig, UserMode } from "../types";

/**
 * RC-BioScan Image Pipeline (Vercel-safe)
 * - Downscale to balance quality and payload size
 * - Convert to JPEG with adaptive quality
 * - Target ~3.5 MB per image to stay under Vercel's 4.5 MB payload limit
 */

const MAX_DIMENSION = 1920;      // Higher resolution for better AI analysis
const JPEG_QUALITY = 0.85;       // Start with high quality, reduce if needed

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

        // Adaptive compression: start high, reduce if needed
        let quality = JPEG_QUALITY;
        let compressed = canvas.toDataURL("image/jpeg", quality);
        
        // Target: ~3.5 MB in base64
        const TARGET_SIZE = 3.5 * 1024 * 1024;
        const MAX_ATTEMPTS = 5;
        let attempts = 0;

        while (compressed.length > TARGET_SIZE && quality > 0.3 && attempts < MAX_ATTEMPTS) {
          quality -= 0.1;
          compressed = canvas.toDataURL("image/jpeg", quality);
          attempts++;
        }

        console.log(`Image compressed: ${(compressed.length / 1024 / 1024).toFixed(2)} MB, quality: ${(quality * 100).toFixed(0)}%`);
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

  return `
Você é um especialista em tricologia avançada e cosmetologia capilar profissional.

REGRAS CRÍTICAS (NÃO VIOLAR):
1. NÃO diagnostique doenças. Apenas análise cosmética.
2. Se identificar: queda intensa, lesões, inflamação severa, coceira persistente → SEMPRE recomende avaliação dermatológica.
3. NUNCA invente nomes de produtos ou SKUs que não existem.
4. Use APENAS produtos REAIS de marcas profissionais autorizadas.
5. SEMPRE cite o nome COMPLETO do produto (marca + linha + nome), NUNCA use apenas categoria genérica.

EXEMPLOS CORRETOS:
✅ "Wella Professionals Oil Reflections Luminous Reveal Shampoo"
✅ "Wella Professionals Fusion Intense Repair Mask"
✅ "Wella Professionals Invigo Color Brilliance Shampoo"
✅ "Wella Professionals EIMI Thermal Image Protetor Térmico"

EXEMPLOS PROIBIDOS:
❌ "Shampoo Hidratante"
❌ "Máscara de Reconstrução"
❌ "Leave-in nutritivo"

LINHAS REAIS DA WELLA PROFESSIONALS:
- Oil Reflections (nutrição e brilho)
- Fusion (reconstrução pós-química)
- Invigo (color brilliance, nutri-enrich, volume boost, blonde recharge, scalp balance)
- Elements (vegano/natural)
- EIMI (finalizadores e protetores térmicos)
- Koleston Perfect (coloração)

MARCAS AUTORIZADAS POR CATEGORIA:
PREMIUM: Kérastase, Joico, Redken, Wella Professionals, Schwarzkopf Professional, Truss, L'Oréal Professionnel, Keune, Alfaparf Milano, Braé, Avlon, Sebastian, Senscience
MÉDIA: Wella Invigo, Amend, Lowell, Itallian Hair Tech, Cadiveu Professional, Let Me Be Pro, Richée Professional, Inoar Profissional, Aquaflora, Unicaher, Aneethun
ACESSÍVEL: Forever Liss, Salon Line Professional, Inoar (linhas populares), Felps Professional, Lola Cosmetics
BOTÂNICA/NATURAL: Grendha Ativos Bio, Amazônica Care, Arvências Cosméticos Naturais, Ativo Natural, Ato Fito Cosméticos

MARCAS PROIBIDAS (varejo massivo): Skala, Niely, TRESemmé, Yamasterol, Elseve, Dove

MODO DE RECOMENDAÇÃO:
${fixedBrand ? `MARCA FIXA: Recomende APENAS produtos REAIS e COMPLETOS da marca "${fixedBrand}". Liste o nome EXATO de cada produto (ex: Wella Professionals Oil Reflections Luminous Reveal Shampoo).` : `SEM MARCA ESPECÍFICA: Recomende apenas CATEGORIAS e TIPOS sem citar marcas (ex: "Shampoo Hidratante", "Máscara de Reconstrução").`}

ANÁLISE OBRIGATÓRIA:
- Risco químico e integridade do fio
- Porosidade, elasticidade, fragilidade
- Condições do couro cabeludo
- Prioridade: integridade em cabelos sensibilizados

ESTILO DE ESCRITA:
- CONCISO e OBJETIVO
- Parágrafos curtos (2-4 linhas)
- Sem repetições desnecessárias
- Linguagem técnica mas clara
- Foque em informações acionáveis

LINGUAGEM: Português do Brasil
FORMATO: Texto simples para WhatsApp (SEM Markdown, SEM asteriscos, SEM emojis, SEM formatação)
SEPARADORES: Use ─ exatamente como mostrado no template
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
  const today = new Date().toLocaleDateString('pt-BR');
  const professionalName = anamnese.professionalName || "Profissional Responsável";
  const professionalPhone = "+55 11 92102-2430";

  return `
MODE: ${mode}
BRAND_SELECTED: ${fixedBrand ? fixedBrand : "NONE"}

CLIENT_NAME: ${anamnese.name || ""}
COMPLAINTS: ${(anamnese.complaints || []).join(", ")}
CHEMICAL_HISTORY: ${(anamnese.chemicalHistory || []).join(", ")}
HEAT_USAGE: ${(anamnese.heatUsage || "")}
SCALP_SENSITIVITY: ${anamnese.scalpSensitivity ? "YES" : "NO"}
NOTES: ${(anamnese.professionalNotes || "")}
IMAGE_ZONES: ${zones}

IMPORTANTE - FORMATO OBJETIVO E DIRETO:
- Texto CONCISO e PROFISSIONAL
- Evite repetições e explicações longas
- Foque em informações práticas e acionáveis
- Use parágrafos curtos e diretos

FORMATO DO RELATÓRIO (siga EXATAMENTE esta estrutura):

IDENTIFICAÇÃO
────────────────────────────────
Cliente: ${anamnese.name || "[Nome]"}
Telefone: ${anamnese.phone || "[Telefone]"}
Profissional Responsável: ${professionalName}
Data do Diagnóstico: ${today}

RESUMO DO DIAGNÓSTICO COSMÉTICO
────────────────────────────────
[Análise CONCISA (máximo 4 linhas). Identifique a condição capilar principal e necessidades imediatas. ${mode === 'PROFISSIONAL' ? 'Use termos técnicos' : 'Use linguagem simples'}]

MAPEAMENTO POR ZONAS
────────────────────────────────
[Liste OBJETIVAMENTE cada zona (${zones}). Uma linha por zona com observação direta]

ALERTAS E RISCOS
────────────────────────────────
[Liste APENAS os riscos REAIS identificados. Seja específico e direto. Se identificar sinais médicos (queda intensa, lesões, inflamação severa), recomende dermatologista]

CONDUTA RECOMENDADA
────────────────────────────────
[Protocolo de tratamento em 2-3 linhas diretas. Foque no essencial]

CRONOGRAMA CAPILAR – 4 SEMANAS
────────────────────────────────

SEMANA 1
Tratamento: [TIPO: Hidratação/Nutrição/Reconstrução]
Objetivo: [Descrever objetivo específico desta semana]
– Shampoo: [Nome EXATO do produto ${fixedBrand || 'da marca profissional'}]
– Máscara: [Nome EXATO do produto]
– Condicionador: [Nome EXATO do produto se aplicável]
– Leave-in / Protetor térmico: [Nome EXATO do produto]
– Óleo ou finalizador: [Nome EXATO do produto se aplicável]

SEMANA 2
Tratamento: [TIPO: Hidratação/Nutrição/Reconstrução]
Objetivo: [Descrever objetivo específico desta semana]
– Shampoo: [Nome EXATO do produto]
– Máscara: [Nome EXATO do produto]
– Condicionador: [Nome EXATO do produto se aplicável]
– Leave-in / Protetor térmico: [Nome EXATO do produto]
– Óleo ou finalizador: [Nome EXATO do produto se aplicável]

SEMANA 3
Tratamento: [TIPO: Hidratação/Nutrição/Reconstrução]
Objetivo: [Descrever objetivo específico desta semana]
– Shampoo: [Nome EXATO do produto]
– Máscara: [Nome EXATO do produto]
– Condicionador: [Nome EXATO do produto se aplicável]
– Leave-in / Protetor térmico: [Nome EXATO do produto]
– Óleo ou finalizador: [Nome EXATO do produto se aplicável]

SEMANA 4
Tratamento: [TIPO: Hidratação/Nutrição/Reconstrução]
Objetivo: [Descrever objetivo específico desta semana]
– Shampoo: [Nome EXATO do produto]
– Máscara: [Nome EXATO do produto]
– Condicionador: [Nome EXATO do produto se aplicável]
– Leave-in / Protetor térmico: [Nome EXATO do produto]
– Óleo ou finalizador: [Nome EXATO do produto se aplicável]

────────────────────────────────

RECOMENDAÇÕES DE PRODUTOS
────────────────────────────────
[Se aplicável, descreva as linhas e produtos recomendados de forma resumida]

${mode === 'PROFISSIONAL' ? `ACOMPANHAMENTO PROFISSIONAL RECOMENDADO
────────────────────────────────
Recomenda-se a realização de tratamento profissional em salão a cada 15 dias, com foco no equilíbrio do couro cabeludo, fortalecimento da fibra capilar e manutenção dos resultados obtidos com este protocolo.

Para acompanhamento da evolução do cabelo e do couro cabeludo, sugere-se a realização de um novo diagnóstico capilar após 30 dias, permitindo avaliar a resposta ao tratamento e ajustar o protocolo, se necessário.

` : ''}MENSAGEM FINAL
────────────────────────────────
${anamnese.name ? `${anamnese.name}, ` : ''}[Mensagem personalizada motivacional sobre o tratamento e resultados esperados. Reforce que está à disposição para dúvidas]

────────────────────────────────
Este diagnóstico foi realizado com tecnologia RC-BioScan IA App
Inteligência Artificial desenvolvida por Rosemary Costa – CABELO IA
Pioneira no Brasil em Inteligência Artificial aplicada à Beleza
www.cabeloia.com.br
WhatsApp: ${professionalPhone}
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

  // 4) Payload (v1beta com gemini-2.5-flash suporta systemInstruction)
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
