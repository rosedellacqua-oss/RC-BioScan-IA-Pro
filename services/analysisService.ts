import { AnamneseData, CapillaryImage, ArsenalConfig, UserMode } from "../types";

// Utilitário para compressão de imagem
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;
async function compressImageToJpeg(dataUrl: string): Promise<string> {
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
        if (!ctx) return resolve(dataUrl);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        let quality = JPEG_QUALITY;
        let compressed = canvas.toDataURL("image/jpeg", quality);
        const TARGET_SIZE = 3.5 * 1024 * 1024;
        const MAX_ATTEMPTS = 5;
        let attempts = 0;
        while (compressed.length > TARGET_SIZE && quality > 0.3 && attempts < MAX_ATTEMPTS) {
          quality -= 0.1;
          compressed = canvas.toDataURL("image/jpeg", quality);
          attempts++;
        }
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
  const parts = dataUrl.split(",");
  return parts.length > 1 ? parts[1] : dataUrl;
}

// Função para construir o prompt do sistema
function buildSystemInstruction(arsenal: ArsenalConfig): string {
  const fixedBrand = (arsenal?.fixedBrand || "").trim();
  const allowedBrands = (arsenal?.allowedBrands || []).filter(b => b).map(b => b.trim()).filter(b => b.length > 0);
  let brandBlock = "";
  if (fixedBrand) {
    brandBlock = `
╔═══════════════════════════════════════════════════════════════╗
║ MARCA OBRIGATÓRIA SELECIONADA PELO CLIENTE: ${fixedBrand}
║ VOCÊ DEVE USAR EXCLUSIVAMENTE PRODUTOS DESTA MARCA!
║ NÃO USE NENHUMA OUTRA MARCA EM TODO O CRONOGRAMA!
╚═══════════════════════════════════════════════════════════════╝
`;
  } else if (allowedBrands.length > 0) {
    brandBlock = `
╔═══════════════════════════════════════════════════════════════╗
║ MARCAS AUTORIZADAS SELECIONADAS PELO CLIENTE: ${allowedBrands.join(", ")}
║ VOCÊ DEVE USAR EXCLUSIVAMENTE PRODUTOS DESSAS MARCAS!
║ NÃO USE NENHUMA OUTRA MARCA EM TODO O CRONOGRAMA!
╚═══════════════════════════════════════════════════════════════╝
`;
  }
  return `
Você é um especialista em tricologia avançada e cosmetologia capilar profissional.
${brandBlock}

REGRAS CRÍTICAS (NÃO VIOLAR):
1. NÃO diagnostique doenças. Apenas análise cosmética.
2. Se identificar: queda intensa, lesões, inflamação severa, coceira persistente → SEMPRE recomende avaliação dermatológica.
3. NUNCA invente nomes de produtos ou SKUs que não existem.
4. Use APENAS produtos REAIS de marcas profissionais brasileiras autorizadas.
5. **REGRA DE OURO DO CRONOGRAMA**: SEMPRE cite o nome COMPLETO do produto (Marca + Linha + Nome). NUNCA use apenas categoria genérica.
6. NO CRONOGRAMA: É PROIBIDO usar apenas "Shampoo Hidratante", "Máscara de Reconstrução", etc.
7. NO CRONOGRAMA: É OBRIGATÓRIO usar "Kérastase Nutritive Bain Satin", "Truss Máscara de Reconstrução", etc.
8. **REGRA MARCA ÚNICA OU AUTORIZADA**: TODO O CRONOGRAMA (4 semanas) deve usar produtos de UMA ÚNICA MARCA ou das MARCAS AUTORIZADAS SELECIONADAS PELO CLIENTE. ${fixedBrand ? `A marca selecionada é ${fixedBrand}` : allowedBrands.length > 0 ? `As marcas autorizadas são: ${allowedBrands.join(", ")}` : 'Se escolher Wella, as 4 semanas devem ser Wella. Se escolher Kérastase, as 4 semanas devem ser Kérastase'}.
9. **REGRA COMBO/KIT**: Cada semana deve usar produtos da MESMA LINHA. Se escolher Wella Fusion na Semana 1, TODOS os produtos daquela semana devem ser Wella Fusion.
10. **VARIAÇÃO DE LINHAS**: Varie as LINHAS da marca ${fixedBrand ? fixedBrand : allowedBrands.length > 0 ? allowedBrands.join(" ou ") : 'escolhida'} conforme o tipo de tratamento (ex: Semana 1 = Wella Fusion, Semana 2 = Wella Oil Reflections, Semana 3 = Wella Invigo). NUNCA mude de marca entre semanas.

EXEMPLOS CORRETOS:
✅ "Wella Professionals Oil Reflections Luminous Reveal Shampoo"
✅ "Wella Professionals Fusion Intense Repair Mask"
✅ "Wella Professionals Invigo Color Brilliance Shampoo"
✅ "Wella Professionals EIMI Thermal Image Protetor Térmico"
✅ "Kérastase Nutritive Bain Satin Shampoo"
✅ "Kérastase Nutritive Masquintense"
✅ "Truss Uso Profissional Máscara de Reconstrução"
✅ "Truss Uso Profissional Shampoo Hidratante"
✅ "Amend Gold Black Máscara Hidratante Intensiva"
✅ "Braé Bond Angel Shampoo Pós-Química"
✅ "Lowell Protect Care Protetor Térmico"
✅ "Forever Liss Professional Desmaia Cabelo Leave-in"
✅ "Salon Line S.O.S Cachos Máscara de Hidratação"

EXEMPLOS PROIBIDOS (nunca faça isso):
❌ "Shampoo Hidratante"
❌ "Máscara de Reconstrução"
❌ "Leave-in nutritivo"
❌ "Protetor térmico"

EXEMPLO DE CRONOGRAMA CORRETO - MARCA ÚNICA (WELLA):
✅ SEMANA 1 - Reconstrução:
   - Shampoo: Wella Professionals Fusion Intense Repair Shampoo
   - Máscara: Wella Professionals Fusion Intense Repair Mask
   - Leave-in: Wella Professionals EIMI Thermal Image

✅ SEMANA 2 - Nutrição:
   - Shampoo: Wella Professionals Oil Reflections Luminous Reveal Shampoo
   - Máscara: Wella Professionals Oil Reflections Luminous Instant Mask
   - Óleo: Wella Professionals Oil Reflections Light Luminous Oil

✅ SEMANA 3 - Hidratação:
   - Shampoo: Wella Professionals Invigo Nutri-Enrich Shampoo
   - Máscara: Wella Professionals Invigo Nutri-Enrich Deep Nourishing Mask
   - Condicionador: Wella Professionals Invigo Nutri-Enrich Conditioner

✅ SEMANA 4 - Nutrição:
   - Shampoo: Wella Professionals Oil Reflections Luminous Reveal Shampoo
   - Máscara: Wella Professionals Oil Reflections Luminous Instant Mask
   - Leave-in: Wella Professionals EIMI Thermal Image

EXEMPLOS DE CRONOGRAMAS ERRADOS (NUNCA FAÇA):
❌ Semana 1 com Kérastase + Semana 2 com Wella (marcas diferentes)
❌ Semana 1 com Truss + Semana 3 com Amend (marcas diferentes)
❌ Misturar qualquer marca entre as 4 semanas

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

LINHAS REAIS DA SALON LINE PROFESSIONAL:
- S.O.S Cachos (hidratação para cabelos cacheados e crespos)
- Meu Liso (controle de frizz e disciplina)
- Tratamento Intensivo (reconstrução e nutrição)
- Bomba (crescimento e fortalecimento)

LINHAS REAIS DA FOREVER LISS:
- Desmaia Cabelo (hidratação e controle de frizz)
- Ácido Hialurônico (hidratação intensa)
- Argan Oil (nutrição e brilho)
- Professional Liss (alisamento e disciplina)
- Cachos & Crespos (definição e hidratação)
- Extreme Repair (reconstrução profunda)

MARCAS BRASILEIRAS PROFISSIONAIS AUTORIZADAS:
PREMIUM: Kérastase, Joico, Redken, Wella Professionals, Schwarzkopf Professional, Truss, L'Oréal Professionnel, Keune, Alfaparf Milano, Braé, Avlon, Sebastian, Senscience
MÉDIA: Wella Invigo, Amend, Lowell, Itallian Hair Tech, Cadiveu Professional, Let Me Be Pro, Richée Professional, Inoar Profissional, Aquaflora, Unicaher, Aneethun
ACESSÍVEL: Forever Liss Professional, Salon Line Professional, Inoar (linhas populares), Felps Professional, Lola Cosmetics
BOTÂNICA/NATURAL: Grendha Ativos Bio, Amazônica Care, Arvências Cosméticos Naturais, Ativo Natural

EXEMPLOS DE PRODUTOS COMPLETOS REAIS (sempre neste formato):
✅ "Kérastase Nutritive Bain Satin Shampoo"
✅ "Truss Uso Profissional Máscara de Reconstrução"
✅ "Amend Gold Black Máscara Restauradora"
✅ "Lowell Protect Care Protetor Térmico"
✅ "Braé Bond Angel Shampoo Pós-Química"
✅ "Forever Liss Professional Desmaia Cabelo Leave-in"
✅ "Salon Line S.O.S Cachos Ativador de Cachos"

MARCAS PROIBIDAS (varejo massivo não profissional): Skala, Niely, TRESemmé, Yamasterol, Elseve varejo, Dove

MODO DE RECOMENDAÇÃO:
${fixedBrand 
  ? `╔═══════════════════════════════════════════════════════════════╗
║ ATENÇÃO: MARCA OBRIGATÓRIA SELECIONADA = "${fixedBrand}"
║ TODAS AS 4 SEMANAS DEVEM TER APENAS PRODUTOS ${fixedBrand}!
║ PROIBIDO USAR QUALQUER OUTRA MARCA!
╚═══════════════════════════════════════════════════════════════╝

INSTRUÇÕES PARA MARCA FIXA "${fixedBrand}":
- TODO O CRONOGRAMA (4 semanas completas) deve ter EXCLUSIVAMENTE produtos ${fixedBrand}
- NUNCA mencione, sugira ou use produtos de outras marcas
- Liste SEMPRE: ${fixedBrand} [Linha] [Nome do Produto]
- Exemplo correto: "${fixedBrand} Nutritive Bain Satin Shampoo"
- Varie as LINHAS do ${fixedBrand} conforme o tratamento
- Se ${fixedBrand} não tiver uma linha específica, use a linha mais próxima disponível da marca

EXEMPLO DE CRONOGRAMA CORRETO USANDO APENAS ${fixedBrand}:

SEMANA 1 - Reconstrução:
– Shampoo: ${fixedBrand} [Linha de Reconstrução] Shampoo
– Máscara: ${fixedBrand} [Linha de Reconstrução] Máscara
– Leave-in: ${fixedBrand} [Protetor Térmico]

SEMANA 2 - Nutrição:
– Shampoo: ${fixedBrand} [Linha Nutritiva] Shampoo
– Máscara: ${fixedBrand} [Linha Nutritiva] Máscara
– Óleo: ${fixedBrand} [Óleo/Finalizador]

SEMANA 3 - Hidratação:
– Shampoo: ${fixedBrand} [Linha Hidratante] Shampoo
– Máscara: ${fixedBrand} [Linha Hidratante] Máscara
– Leave-in: ${fixedBrand} [Leave-in Hidratante]

SEMANA 4 - Nutrição:
– Shampoo: ${fixedBrand} [Linha Nutritiva] Shampoo
– Máscara: ${fixedBrand} [Linha Nutritiva] Máscara
– Finalizador: ${fixedBrand} [Finalizador]

REPETINDO: USE APENAS ${fixedBrand} EM TODAS AS 4 SEMANAS!`
  : `SEM MARCA ESPECÍFICA SELECIONADA:
     - OBRIGATÓRIO: Escolha marcas profissionais brasileiras reais
     - Liste SEMPRE o nome COMPLETO do produto com marca
     - Exemplo: "Kérastase Nutritive Bain Satin Shampoo"
     - Exemplo: "Truss Uso Profissional Máscara de Reconstrução"
     - NUNCA use apenas categoria genérica como "Shampoo Hidratante"
     - Todo o cronograma deve usar UMA ÚNICA marca escolhida`
}

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
${fixedBrand ? `
════════════════════════════════════════════════════════════
⚠️ MARCA OBRIGATÓRIA SELECIONADA PELO CLIENTE: ${fixedBrand}
⚠️ USE APENAS PRODUTOS ${fixedBrand} EM TODO O CRONOGRAMA!
⚠️ PROIBIDO USAR OUTRAS MARCAS!
════════════════════════════════════════════════════════════

ANTES DE RESPONDER:
1. Leia esta marca: ${fixedBrand}
2. Memorize: USAR APENAS ${fixedBrand}
3. Verifique: NO CRONOGRAMA, TODAS as 4 semanas devem ter APENAS ${fixedBrand}
4. NÃO USE: Wella, Kérastase, Truss, Amend, Lowell, ou qualquer marca que NÃO seja ${fixedBrand}

` : ''}

MODE: ${mode}
BRAND_SELECTED: ${fixedBrand ? `***${fixedBrand}*** (OBRIGATÓRIO - NÃO USAR OUTRAS MARCAS)` : "NONE"}

CLIENT_NAME: ${anamnese.name || ""}
COMPLAINTS: ${(anamnese.complaints || []).join(", ")}
CHEMICAL_HISTORY: ${(anamnese.chemicalHistory || []).join(", ")}
HEAT_USAGE: ${(anamnese.heatUsage || "")}
SCALP_SENSITIVITY: ${anamnese.scalpSensitivity ? "YES" : "NO"}
NOTES: ${(anamnese.professionalNotes || "")}
IMAGE_ZONES: ${zones}

${fixedBrand ? `
════════════════════════════════════════════════════════════
LEMBRETE CRÍTICO: Você DEVE usar APENAS ${fixedBrand}
NÃO use Wella, Kérastase, ou qualquer outra marca!
TODAS as 4 semanas = ${fixedBrand} produtos
════════════════════════════════════════════════════════════
` : ''}

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
[IMPORTANTE: Não repita a mesma zona. Cada zona deve aparecer apenas UMA vez]

ALERTAS E RISCOS
────────────────────────────────
[Liste APENAS os riscos REAIS identificados. Seja específico e direto. Se identificar sinais médicos (queda intensa, lesões, inflamação severa), recomende dermatologista]

CONDUTA RECOMENDADA
────────────────────────────────
[Protocolo de tratamento em 2-3 linhas diretas. Foque no essencial]

${fixedBrand ? `
════════════════════════════════════════════════════════════
⚠️⚠️⚠️ ATENÇÃO CRÍTICA ⚠️⚠️⚠️
MARCA SELECIONADA: ${fixedBrand}
USE APENAS ${fixedBrand} NO CRONOGRAMA ABAIXO!
NÃO USE: Wella, Kérastase, Truss, Amend, ou QUALQUER outra marca!
USE SOMENTE: ${fixedBrand}
════════════════════════════════════════════════════════════
` : ''}

CRONOGRAMA CAPILAR – 4 SEMANAS
────────────────────────────────
${fixedBrand ? `
╔══════════════════════════════════════════════════════════════════╗
║ ⚠️ MARCA SELECIONADA PELO CLIENTE: ${fixedBrand}
║ ⚠️ USE APENAS ${fixedBrand} NAS 4 SEMANAS!
║ ⚠️ PROIBIDO: Usar qualquer outra marca
║ ⚠️ OBRIGATÓRIO: ${fixedBrand} [Linha] [Nome do Produto]
╚══════════════════════════════════════════════════════════════════╝
` : ''}
[ATENÇÃO CRÍTICA: NUNCA use apenas categoria genérica. SEMPRE liste marca + linha + nome do produto]
[PROIBIDO: "Shampoo Hidratante", "Máscara de Reconstrução"]
[OBRIGATÓRIO: "${fixedBrand || 'Marca'} Linha Nome do Produto"]

**REGRA MARCA ÚNICA - CRÍTICO**: TODO O CRONOGRAMA (4 semanas) deve usar ${fixedBrand ? `EXCLUSIVAMENTE ${fixedBrand}` : 'UMA ÚNICA MARCA'}.
${fixedBrand ? `- ✅ CORRETO: Semanas 1, 2, 3 e 4 com ${fixedBrand} (variando apenas as LINHAS)
- ❌ ERRADO: Usar qualquer marca diferente de ${fixedBrand}` : `- ✅ CORRETO: Semanas 1, 2, 3 e 4 com Wella (variando linhas: Fusion, Oil Reflections, Invigo)
- ✅ CORRETO: Semanas 1, 2, 3 e 4 com Kérastase (variando linhas: Nutritive, Résistance)
- ❌ ERRADO: Semana 1 Wella + Semana 2 Kérastase (NUNCA mude de marca)
- ❌ ERRADO: Semana 1 Truss + Semana 3 Amend (NUNCA mude de marca)`}

SEMANA 1
Tratamento: [TIPO: Hidratação/Nutrição/Reconstrução]
Objetivo: [Descrever objetivo específico desta semana]
[COERÊNCIA CRÍTICA: Se o tratamento é RECONSTRUÇÃO, use linha de reconstrução. Se é NUTRIÇÃO, use linha nutritiva. Se é HIDRATAÇÃO, use linha hidratante.]
${fixedBrand ? `[MARCA OBRIGATÓRIA: ${fixedBrand}]` : ''}
– Shampoo: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - linha deve bater com tipo de tratamento]
– Máscara: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - mesma linha do shampoo]
– Condicionador: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - mesma linha, se aplicável]
– Leave-in / Protetor térmico: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - mesma marca]
– Óleo ou finalizador: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - mesma marca, se aplicável]

SEMANA 2
Tratamento: [TIPO: Hidratação/Nutrição/Reconstrução]
Objetivo: [Descrever objetivo específico desta semana]
${fixedBrand ? `[MARCA OBRIGATÓRIA: ${fixedBrand}]` : ''}
– Shampoo: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - linha coerente com tipo de tratamento]
– Máscara: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - mesma linha do shampoo]
– Condicionador: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - mesma linha, se aplicável]
– Leave-in / Protetor térmico: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - mesma marca]
– Óleo ou finalizador: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - mesma marca, se aplicável]

SEMANA 3
Tratamento: [TIPO: Hidratação/Nutrição/Reconstrução]
Objetivo: [Descrever objetivo específico desta semana]
${fixedBrand ? `[MARCA OBRIGATÓRIA: ${fixedBrand}]` : ''}
– Shampoo: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - linha coerente com tipo de tratamento]
– Máscara: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - mesma linha do shampoo]
– Condicionador: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - mesma linha, se aplicável]
– Leave-in / Protetor térmico: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - mesma marca]
– Óleo ou finalizador: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - mesma marca do combo, se aplicável]

SEMANA 4
Tratamento: [TIPO: Hidratação/Nutrição/Reconstrução]
Objetivo: [Descrever objetivo específico desta semana]
${fixedBrand ? `[MARCA OBRIGATÓRIA: ${fixedBrand}]` : ''}
– Shampoo: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - linha coerente com tipo de tratamento]
– Máscara: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - mesma linha do shampoo]
– Condicionador: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - mesma linha, se aplicável]
– Leave-in / Protetor térmico: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - mesma marca]
– Óleo ou finalizador: [${fixedBrand || 'Marca'} + Linha + Nome COMPLETO - mesma marca, se aplicável]

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
  // Debug: verificar se a marca está sendo passada
  console.log('🔍 ARSENAL CONFIG:', JSON.stringify(arsenal, null, 2));
  console.log('🔍 MARCA SELECIONADA:', arsenal?.fixedBrand || 'NENHUMA');
  
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
  
  // Debug: mostrar parte do prompt
  console.log('🔍 INÍCIO DO PROMPT:', prompt.substring(0, 500));

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

  // 4) Payload (v1beta com gemini-1.5-flash-latest suporta systemInstruction)
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

  // Validação: verificar se a IA respeitou a marca selecionada
  if (arsenal?.fixedBrand) {
    const brandLower = arsenal.fixedBrand.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Procurar por outras marcas premium no texto (possíveis violações)
    const otherBrands = ['wella', 'kérastase', 'kerastase', 'truss', 'loreal', 'joico', 'redken', 'schwarzkopf'];
    const foundOtherBrand = otherBrands.find(b => 
      b !== brandLower.replace(/\s+/g, '') && 
      textLower.includes(b)
    );
    
    if (foundOtherBrand) {
      console.warn(`⚠️ ALERTA: IA usou marca ${foundOtherBrand} mas deveria usar apenas ${arsenal.fixedBrand}`);
      console.warn('Texto retornado:', text.substring(0, 1000));
    }
  }

  return text;
}
