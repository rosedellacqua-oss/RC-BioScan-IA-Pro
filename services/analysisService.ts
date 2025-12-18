
import { GoogleGenAI } from "@google/genai";
import { AnamneseData, CapillaryImage, ArsenalConfig, UserMode, RecommendationMode } from "../types";

export async function analyzeCapillaryData(
  anamnese: AnamneseData,
  images: CapillaryImage[],
  arsenal: ArsenalConfig,
  mode: UserMode
) {
  // Always create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Updated to gemini-3-pro-preview for complex reasoning task as per guidelines.
  const model = "gemini-3-pro-preview";
  
  const systemInstruction = `
    Aja como um especialista em Tricologia e Cosmetologia Capilar Avançada.
    Seu objetivo é gerar um diagnóstico cosmético detalhado e personalizado.
    
    DIRETRIZES DE FORMATO (CRÍTICO - WHATSAPP FRIENDLY):
    - PROIBIDO usar Markdown (não use asteriscos **, hashtags #, traços ---, ou underlines __).
    - O relatório deve ser TEXTO SIMPLES E LIMPO.
    - Use separadores visuais com caracteres simples: ────────────────────────────────
    - Títulos de seções devem estar em CAIXA ALTA (ex: ANÁLISE TÉCNICA, CRONOGRAMA CAPILAR – 4 SEMANAS).
    - Deixe uma linha em branco entre cada bloco/seção.
    - Use o caractere "–" para listas internas do cronograma e "•" para outros pontos.
    - Se o usuário for ${mode}, use linguagem ${mode === 'CLIENTE' ? 'simples e orientativa' : 'técnica e profunda'}.

    DIRETRIZES DE CONTEÚDO:
    - Não diagnostique doenças. Se houver queda intensa ou lesões, recomende dermatologista.
    - Analise risco químico, fragilidade, elasticidade e porosidade baseando-se no histórico.
    - O relatório deve estar no idioma Português (Brasil).
    
    ESTRUTURA DO RELATÓRIO:
    1. IDENTIFICAÇÃO
    2. RESUMO DO DIAGNÓSTICO COSMÉTICO
    3. MAPEAMENTO POR ZONAS
    4. ALERTAS E RISCOS
    5. CONDUTA RECOMENDADA
    6. CRONOGRAMA CAPILAR – 4 SEMANAS
       Para cada semana, você DEVE seguir exatamente este formato:
       
       SEMANA [X]
       Tratamento: [Tipo de Tratamento, ex: Nutrição]
       – Shampoo: [Marca + Nome do Produto]
       – Máscara: [Marca + Nome do Produto]
       – Condicionador (se houver): [Marca + Nome do Produto]
       – Leave-in / Protetor térmico: [Marca + Nome do Produto]
       – Óleo ou finalizador (se houver): [Marca + Nome do Produto]
       
    7. RECOMENDAÇÕES DE PRODUTOS
    8. MENSAGEM FINAL
    9. RODAPÉ OBRIGATÓRIO (Insira exatamente o texto abaixo ao final):
    
    ────────────────────────────────
    Este diagnóstico foi realizado com tecnologia RC-BioScan IA Pro
    Inteligência Artificial desenvolvida por Rosemary Costa – CABELO IA
    Pioneira no Brasil em Inteligência Artificial aplicada à Beleza
    www.cabeloia.com.br
    WhatsApp: +55 11 92102-2430

    REGRAS DE MARCAS:
    - Modo A: Recomende apenas produtos REAIS da marca "${arsenal.fixedBrand}". Não misture com outras marcas.
    - Modo B: Recomende produtos das marcas autorizadas: ${arsenal.allowedBrands.join(', ')}.
    - Modo C: Não indique marcas, apenas categorias (Hidratação, Nutrição, etc) e tipos de produto.
    - CRÍTICO: Nunca invente nomes de produtos ou SKUs. Indique "Marca + Categoria + Tipo".
  `;

  const prompt = `
    CLIENTE: ${anamnese.name}
    TELEFONE: ${anamnese.phone}
    HISTÓRICO QUÍMICO: ${anamnese.chemicalHistory.join(', ')}
    QUEIXAS: ${anamnese.complaints.join(', ')}
    USO DE CALOR: ${anamnese.heatUsage}
    SENSIBILIDADE: ${anamnese.scalpSensitivity ? 'Sim' : 'Não'}
    NOTAS: ${anamnese.professionalNotes}
    
    IMAGENS MAPEADAS: ${images.map(img => img.zone).join(', ')}
    
    Gere o diagnóstico completo agora seguindo rigorosamente as diretrizes de formato de texto simples (sem Markdown) e organizando o cronograma conforme solicitado.
  `;

  try {
    const parts: any[] = [{ text: prompt }];
    
    // Add images for context
    images.forEach(img => {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: img.base64.split(',')[1]
        }
      });
    });

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw new Error("Falha na análise. Verifique sua conexão ou tente novamente.");
  }
}
