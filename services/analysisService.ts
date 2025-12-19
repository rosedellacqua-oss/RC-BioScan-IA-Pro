import { AnamneseData, CapillaryImage, ArsenalConfig, UserMode } from "../types";

export async function analyzeCapillaryData(
  anamnese: AnamneseData,
  images: CapillaryImage[],
  arsenal: ArsenalConfig,
  mode: UserMode
) {
  const systemInstruction = `
    Aja como um especialista em Tricologia e Cosmetologia Capilar Avançada.
    Seu objetivo é gerar um diagnóstico cosmético detalhado e personalizado.
    
    DIRETRIZES DE FORMATO (CRÍTICO - WHATSAPP FRIENDLY):
    - PROIBIDO usar Markdown (não use asteriscos, hashtags, traços ou underlines).
    - O relatório deve ser TEXTO SIMPLES E LIMPO.
    - Use separadores visuais: ────────────────────────────────
    - Títulos em CAIXA ALTA.
    - Se o usuário for ${mode}, use linguagem ${mode === 'CLIENTE' ? 'simples' : 'técnica'}.

    DIRETRIZES DE CONTEÚDO:
    - Analise risco químico e porosidade baseando-se no histórico.
    - O relatório deve estar em Português (Brasil).
    
    ESTRUTURA: 1. IDENTIFICAÇÃO, 2. RESUMO, 3. MAPEAMENTO, 4. ALERTAS, 5. CONDUTA, 6. CRONOGRAMA – 4 SEMANAS, 7. RECOMENDAÇÕES, 8. MENSAGEM FINAL, 9. RODAPÉ.

    RODAPÉ OBRIGATÓRIO:
    ────────────────────────────────
    Este diagnóstico foi realizado com tecnologia RC-BioScan IA Pro
    Inteligência Artificial desenvolvida por Rosemary Costa – CABELO IA
    Pioneira no Brasil em Inteligência Artificial aplicada à Beleza
    www.cabeloia.com.br
    WhatsApp: +55 11 92102-2430

    REGRAS DE MARCAS:
    - Modo A: Apenas produtos REAIS da marca "${arsenal.fixedBrand}".
    - Modo B: Marcas autorizadas: ${arsenal.allowedBrands.join(', ')}.
    - Modo C: Apenas categorias, sem marcas.
  `;

  const prompt = `
    CLIENTE: ${anamnese.name}
    HISTÓRICO: ${anamnese.chemicalHistory.join(', ')}
    QUEIXAS: ${anamnese.complaints.join(', ')}
    NOTAS: ${anamnese.professionalNotes}
    IMAGENS: ${images.map(img => img.zone).join(', ')}
    Gere o diagnóstico completo agora.
  `;

  try {
    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          ...images.map(img => ({
            inlineData: {
              mimeType: "image/jpeg",
              data: img.base64.split(',')[1]
            }
          }))
        ]
      }],
      generationConfig: { temperature: 0.7 },
      systemInstruction: { parts: [{ text: systemInstruction }] }
    };

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Erro na comunicação com a IA");
    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw new Error("Falha na análise. Tente novamente.");
  }
}
