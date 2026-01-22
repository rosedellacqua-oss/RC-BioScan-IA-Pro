             {/* Print Footer - only visible when printing */}
             <div className="hidden print:block print-footer" style={{position: 'fixed', bottom: 0, left: 0, width: '100%', textAlign: 'left', fontSize: '11px', color: '#555', padding: '8px 24px'}}>
               <span>https://rc-bio-scan-ia-pro.vercel.app</span>
             </div>

import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserMode, AppStep, AnamneseData, CapillaryImage, ArsenalConfig, RecommendationMode 
} from './types';
import { analyzeCapillaryData } from './services/analysisService';
import { BRAND_BLOCKS, CAPILLARY_ZONES } from './data/brandsCatalog';

// UI Components
const Header: React.FC = () => (
  <header className="p-6 flex justify-between items-center border-b border-yellow-500/20 glass sticky top-0 z-50 no-print">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center shadow-lg shadow-orange-500/20">
        <span className="text-white font-bold text-xl">RC</span>
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight font-['Playfair_Display']">RC-BioScan <span className="text-amber-500">IA PRO</span></h1>
        <p className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold">Mapeamento Capilar Inteligente</p>
      </div>
    </div>
  </header>
);

const Footer: React.FC = () => (
  <footer className="p-8 mt-12 border-t border-yellow-500/10 text-center text-slate-500 text-sm no-print">
    <p>Relatório gerado pelo sistema profissional RC-BioScan IA</p>
    <p className="mt-1">Inteligência Artificial desenvolvida por <span className="text-amber-500">Rosemary Costa – CABELO IA</span></p>
    <p className="mt-2 text-xs">www.cabeloia.com.br | WhatsApp: +55 11 92102-2430</p>
  </footer>
);

// High-Tech Hair Circuit SVG Component
const ScannerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.2" />
        <stop offset="50%" stopColor="#D4AF37" stopOpacity="1" />
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.2" />
      </linearGradient>
    </defs>
    {/* Flowing Hair Strands */}
    <path d="M40 160C80 160 120 40 160 40" stroke="url(#hairGradient)" strokeWidth="6" strokeLinecap="round" />
    <path d="M55 170C95 170 135 50 175 50" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" strokeDasharray="4 4" opacity="0.6" />
    <path d="M25 150C65 150 105 30 145 30" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeDasharray="10 5" opacity="0.4" />
    
    {/* Circuitry Branches */}
    <g stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round">
      <path d="M100 100 L130 130 H160" />
      <circle cx="165" cy="130" r="3" fill="#D4AF37" />
      
      <path d="M85 115 L60 140 H30" />
      <circle cx="25" cy="140" r="3" fill="#D4AF37" />
      
      <path d="M115 85 L140 60 H170" />
      <circle cx="175" cy="60" r="3" fill="#D4AF37" />
      
      <path d="M70 70 L40 40 V20" />
      <circle cx="40" cy="15" r="3" fill="#D4AF37" />
    </g>

    {/* Center Node */}
    <circle cx="100" cy="100" r="5" fill="#D4AF37" className="animate-pulse" />
  </svg>
);

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.WELCOME);
  const [mode, setMode] = useState<UserMode>(UserMode.CLIENTE);
  
  // State for data
  const [anamnese, setAnamnese] = useState<AnamneseData>({
    name: '',
    phone: '',
    professionalName: '',
    chemicalHistory: [],
    heatUsage: 'Médio',
    complaints: [],
    scalpSensitivity: false,
    professionalNotes: ''
  });
  
  const [images, setImages] = useState<CapillaryImage[]>([]);
  const [arsenal, setArsenal] = useState<ArsenalConfig>({
    mode: RecommendationMode.LIBRARY,
    allowedLevels: ['PREMIUM'],
    allowedBrands: [],
  });
  
  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const startAnalysis = async () => {
    setIsLoading(true);
    setStep(AppStep.ANALYSIS);
    try {
      const result = await analyzeCapillaryData(anamnese, images, arsenal, mode);
      setReport(result || '');
      setStep(AppStep.REPORT);
    } catch (error) {
      alert("Erro na análise: " + error);
      setStep(AppStep.ARSENAL);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 10) {
      alert("Máximo de 10 imagens permitido.");
      return;
    }

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImages(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          url: URL.createObjectURL(file),
          base64: base64,
          zone: 'Extra'
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const updateImageZone = (id: string, zone: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, zone } : img));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(report);
    alert("Relatório copiado para a área de transferência!");
  };

  const sendToWhatsapp = () => {
    const text = encodeURIComponent(report);
    window.open(`https://wa.me/5511921022430?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Step Indicator */}
        {step !== AppStep.WELCOME && step !== AppStep.REPORT && step !== AppStep.ANALYSIS && (
          <div className="mb-8 flex justify-between items-center px-2">
            {[AppStep.ANAMNESE, AppStep.IMAGES, AppStep.ARSENAL].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2 flex-1 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 ${step >= s ? 'gold-gradient text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {s}
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-tighter ${step >= s ? 'text-amber-500' : 'text-slate-600'}`}>
                  {s === 1 ? 'Anamnese' : s === 2 ? 'Imagens' : 'Arsenal'}
                </span>
                {s < 3 && <div className={`absolute h-[2px] w-full left-1/2 top-4 -z-0 ${step > s ? 'bg-amber-500' : 'bg-slate-800'}`}></div>}
              </div>
            ))}
          </div>
        )}

        {/* STEP 0: WELCOME */}
        {step === AppStep.WELCOME && (
          <div className="flex flex-col items-center text-center py-12 animate-in fade-in duration-1000">
            <div className="relative w-72 h-72 mb-10 group">
              <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
              <div className="absolute inset-0 border-2 border-yellow-500/30 rounded-full flex items-center justify-center p-4 glass overflow-hidden shadow-2xl">
                {/* Custom Inline SVG for Futuristic Bio-Scanner */}
                <ScannerIcon className="w-full h-full p-8 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
                <div className="scanner-line"></div>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold mb-4 gold-text">Diagnóstico de Alta Precisão</h2>
            <p className="text-slate-400 max-w-md mb-12 text-lg">Selecione o modo de atendimento para iniciar o mapeamento inteligente com Inteligência Artificial.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
              <button 
                onClick={() => { setMode(UserMode.CLIENTE); setStep(AppStep.ANAMNESE); }}
                className="group p-8 glass rounded-3xl border border-white/5 hover:border-blue-500/50 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-1">Versão Cliente</h3>
                <p className="text-slate-500 text-sm">Linguagem simples e orientativa para o consumidor final.</p>
              </button>

              <button 
                onClick={() => { setMode(UserMode.PROFISSIONAL); setStep(AppStep.ANAMNESE); }}
                className="group p-8 glass rounded-3xl border border-yellow-500/10 hover:border-yellow-500/50 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 text-amber-500 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.82.557l-.21.21a2 2 0 00-.547 1.022l-.477 2.387a2 2 0 001.557 2.365l2.387.477c.48.096.975-.05 1.332-.387l.21-.21a2 2 0 011.022-.547l2.387-.477a2 2 0 012.365 1.557l.477 2.387a2 2 0 002.365 1.557l2.387-.477a2 2 0 001.022-.547l.21-.21a2 2 0 00.547-1.022l.477-2.387a2 2 0 00-1.557-2.365l-2.387-.477z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-1">Versão Profissional</h3>
                <p className="text-slate-500 text-sm">Linguagem técnica detalhada para tricologistas e cabeleireiros.</p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: ANAMNESE */}
        {step === AppStep.ANAMNESE && (
          <div className="glass rounded-3xl p-8 border border-white/5 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold gold-text">Anamnese Capilar</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Nome da Cliente</label>
                <input 
                  type="text" 
                  value={anamnese.name}
                  onChange={e => setAnamnese({...anamnese, name: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="Ex: Maria Silva"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Telefone</label>
                <input 
                  type="tel" 
                  value={anamnese.phone}
                  onChange={e => setAnamnese({...anamnese, phone: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Nome do Profissional</label>
                <input 
                  type="text" 
                  value={anamnese.professionalName}
                  onChange={e => setAnamnese({...anamnese, professionalName: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="Ex: Rosemary Costa"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs uppercase tracking-wider text-slate-500 font-bold block">Histórico Químico</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['Coloração', 'Descoloração', 'Progressiva', 'Relaxamento', 'Alisamento', 'Tonalizante', 'Botox', 'Nenhuma'].map(item => (
                  <label key={item} className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-amber-500"
                      checked={anamnese.chemicalHistory.includes(item)}
                      onChange={e => {
                        const next = e.target.checked 
                          ? [...anamnese.chemicalHistory, item]
                          : anamnese.chemicalHistory.filter(h => h !== item);
                        setAnamnese({...anamnese, chemicalHistory: next});
                      }}
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs uppercase tracking-wider text-slate-500 font-bold block">Queixa Principal</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['Ressecamento', 'Quebra', 'Frizz', 'Opacidade', 'Elasticidade', 'Oleosidade', 'Coceira', 'Caspa', 'Queda'].map(item => (
                  <label key={item} className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-amber-500"
                      checked={anamnese.complaints.includes(item)}
                      onChange={e => {
                        const next = e.target.checked 
                          ? [...anamnese.complaints, item]
                          : anamnese.complaints.filter(c => c !== item);
                        setAnamnese({...anamnese, complaints: next});
                      }}
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-xs uppercase tracking-wider text-slate-500 font-bold block">Uso de Calor</label>
                <div className="flex gap-2">
                  {['Baixo', 'Médio', 'Alto'].map(lvl => (
                    <button 
                      key={lvl}
                      onClick={() => setAnamnese({...anamnese, heatUsage: lvl as any})}
                      className={`flex-1 py-3 rounded-xl border transition-all font-bold ${anamnese.heatUsage === lvl ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-900/50 border-slate-700 text-slate-500'}`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs uppercase tracking-wider text-slate-500 font-bold block">Sensibilidade do Couro</label>
                <div className="flex gap-2">
                  {[true, false].map(val => (
                    <button 
                      key={String(val)}
                      onClick={() => setAnamnese({...anamnese, scalpSensitivity: val})}
                      className={`flex-1 py-3 rounded-xl border transition-all font-bold ${anamnese.scalpSensitivity === val ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-900/50 border-slate-700 text-slate-500'}`}
                    >
                      {val ? 'Sim' : 'Não'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Observações Profissionais</label>
              <textarea 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors h-32 resize-none"
                placeholder="Detalhes adicionais, percepção tátil, etc..."
                value={anamnese.professionalNotes}
                onChange={e => setAnamnese({...anamnese, professionalNotes: e.target.value})}
              ></textarea>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={() => setStep(AppStep.IMAGES)}
                disabled={!anamnese.name}
                className="px-8 py-4 gold-gradient rounded-2xl font-bold text-white shadow-xl shadow-orange-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:grayscale"
              >
                Próximo Passo
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: IMAGENS */}
        {step === AppStep.IMAGES && (
          <div className="glass rounded-3xl p-8 border border-white/5 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold gold-text">Mapeamento Multi-Zonas</h2>
              <span className="text-slate-500 text-sm font-bold">{images.length}/10 Imagens</span>
            </div>

            {images.length === 0 ? (
              <div className="border-2 border-dashed border-slate-800 rounded-3xl py-20 flex flex-col items-center gap-4 bg-slate-900/20">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-600">
                   <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-slate-500 font-medium">Arraste ou selecione as fotos do scanner</p>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden" 
                  id="img-upload" 
                />
                <label htmlFor="img-upload" className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors text-sm font-bold">
                  Selecionar Imagens
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {images.map(img => (
                  <div key={img.id} className="glass p-3 rounded-2xl border border-white/5 flex gap-4 items-center">
                    <img src={img.url} className="w-20 h-20 rounded-xl object-cover" alt="Scan" />
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Zona Mapeada</label>
                      <select 
                        value={img.zone}
                        onChange={e => updateImageZone(img.id, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs py-2 px-2"
                      >
                        {CAPILLARY_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                      </select>
                    </div>
                    <button onClick={() => removeImage(img.id)} className="p-2 text-red-500/50 hover:text-red-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
                {images.length < 10 && (
                  <label htmlFor="img-upload" className="border-2 border-dashed border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 bg-slate-900/10 cursor-pointer hover:bg-slate-900/30 transition-all">
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="img-upload" />
                    <span className="text-amber-500 text-2xl">+</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Adicionar Foto</span>
                  </label>
                )}
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <button onClick={() => setStep(AppStep.ANAMNESE)} className="px-8 py-4 bg-slate-900 rounded-2xl font-bold text-slate-500 border border-slate-800">Voltar</button>
              <button 
                onClick={() => setStep(AppStep.ARSENAL)} 
                disabled={images.length === 0}
                className="px-8 py-4 gold-gradient rounded-2xl font-bold text-white shadow-xl shadow-orange-500/20 disabled:opacity-50"
              >
                Próximo Passo
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ARSENAL */}
        {step === AppStep.ARSENAL && (
          <div className="glass rounded-3xl p-8 border border-white/5 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold gold-text">Arsenal de Produtos</h2>
            
            <div className="flex gap-4 p-1 bg-slate-900 rounded-2xl border border-slate-800">
              {[
                { id: RecommendationMode.FIXED, label: 'Modo A (Marca Fixa)' },
                { id: RecommendationMode.LIBRARY, label: 'Modo B (Biblioteca)' },
                { id: RecommendationMode.NO_BRAND, label: 'Modo C (Sem Marcas)' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setArsenal({...arsenal, mode: opt.id as RecommendationMode})}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${arsenal.mode === opt.id ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* MODO A: MARCA FIXA */}
            {arsenal.mode === RecommendationMode.FIXED && (
              <div className="space-y-4 animate-in fade-in">
                <p className="text-slate-400 text-sm">O sistema recomendará apenas produtos de uma única marca específica.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.values(BRAND_BLOCKS).flat().sort().map(brand => (
                    <button 
                      key={brand}
                      onClick={() => setArsenal({...arsenal, fixedBrand: brand})}
                      className={`p-3 text-left rounded-xl text-xs font-medium border transition-all ${arsenal.fixedBrand === brand ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-slate-800 bg-slate-900/30 text-slate-500'}`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MODO B: BIBLIOTECA */}
            {arsenal.mode === RecommendationMode.LIBRARY && (
              <div className="space-y-6 animate-in fade-in">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Níveis Autorizados</label>
                  <div className="flex flex-wrap gap-2">
                    {['PREMIUM', 'MEDIA', 'ACESSIVEL', 'BOTANICA'].map(lvl => (
                      <button 
                        key={lvl}
                        onClick={() => {
                          const next = arsenal.allowedLevels.includes(lvl) 
                            ? arsenal.allowedLevels.filter(l => l !== lvl)
                            : [...arsenal.allowedLevels, lvl];
                          setArsenal({...arsenal, allowedLevels: next});
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${arsenal.allowedLevels.includes(lvl) ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-800 text-slate-500'}`}
                      >
                        {lvl === 'PREMIUM' ? 'Premium' : lvl === 'MEDIA' ? 'Média Performance' : lvl === 'ACESSIVEL' ? 'Acessível' : 'Botânica/Vegana'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] uppercase font-bold text-slate-500">Marcas Autorizadas</label>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                     {arsenal.allowedLevels.length === 0 ? (
                       <p className="col-span-full text-slate-600 italic text-sm py-8 text-center">Selecione ao menos um nível acima.</p>
                     ) : (
                       Object.entries(BRAND_BLOCKS)
                        .filter(([key]) => arsenal.allowedLevels.includes(key))
                        .map(([_, brands]) => brands.map(brand => (
                          <label key={brand} className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 accent-blue-500"
                              checked={arsenal.allowedBrands.includes(brand)}
                              onChange={e => {
                                const next = e.target.checked 
                                  ? [...arsenal.allowedBrands, brand]
                                  : arsenal.allowedBrands.filter(b => b !== brand);
                                setArsenal({...arsenal, allowedBrands: next});
                              }}
                            />
                            <span className="text-[11px] font-medium">{brand}</span>
                          </label>
                        )))
                     )}
                   </div>
                </div>
              </div>
            )}

            {/* MODO C: SEM MARCA */}
            {arsenal.mode === RecommendationMode.NO_BRAND && (
              <div className="p-8 text-center space-y-4 glass rounded-2xl bg-slate-900/20 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                </div>
                <h3 className="font-bold text-slate-400">Foco em Categorias</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">Neste modo, o diagnóstico indicará apenas o tipo de tratamento necessário (ex: Máscara Nutritiva), sem citar marcas específicas.</p>
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <button onClick={() => setStep(AppStep.IMAGES)} className="px-8 py-4 bg-slate-900 rounded-2xl font-bold text-slate-500 border border-slate-800">Voltar</button>
              <button 
                onClick={startAnalysis}
                className="px-8 py-4 gold-gradient rounded-2xl font-bold text-white shadow-xl shadow-orange-500/20"
              >
                Gerar Diagnóstico
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: ANALYSIS (LOADING) */}
        {step === AppStep.ANALYSIS && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
             <div className="relative w-48 h-48 mb-12">
               <div className="absolute inset-0 border-4 border-amber-500/10 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin"></div>
               <div className="absolute inset-4 glass rounded-full flex items-center justify-center overflow-hidden">
                 <ScannerIcon className="w-full h-full p-6 opacity-40 contrast-125 saturate-100" />
                 <div className="scanner-line"></div>
               </div>
             </div>
             <h2 className="text-2xl font-bold gold-text animate-pulse">Processando Bio-Mapeamento</h2>
             <p className="text-slate-500 mt-4 text-center max-w-xs">Nossa IA está analisando as zonas capilares e cruzando dados com o arsenal selecionado...</p>
          </div>
        )}

        {/* STEP 5: REPORT */}
        {step === AppStep.REPORT && (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
             {/* Print Header - only visible when printing */}
             <div className="hidden print:block print-header">
               <div className="flex items-center justify-center gap-3 mb-2">
                 <div className="w-10 h-10 rounded-full" style={{background: 'linear-gradient(135deg, #d4af37 0%, #f97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px'}}>RC</div>
                 <div>
                   <div style={{fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 'bold'}}>RC-BioScan <span style={{color: '#f59e0b'}}>IA PRO</span></div>
                   <div style={{fontSize: '10px', letterSpacing: '2px', color: '#3b82f6', textTransform: 'uppercase'}}>Mapeamento Capilar Inteligente</div>
                 </div>
               </div>
             </div>

             <div className="glass rounded-3xl p-8 border border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 no-print">
                  <div className="bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase px-2 py-1 rounded border border-amber-500/20">
                    Diagnóstico Finalizado
                  </div>
               </div>
               
               <div className="prose prose-invert max-w-none">
                 <div className="whitespace-pre-wrap font-mono text-sm text-slate-300 leading-relaxed report-content">
                   {report}
                 </div>
               </div>
             </div>

             {/* Print Footer removido para não exibir link/contato no PDF */}

             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-12 no-print">
               <button 
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-3 p-4 bg-slate-900 rounded-2xl font-bold text-sm border border-slate-800 hover:bg-slate-800 transition-all"
               >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                 Copiar WhatsApp
               </button>
               <button 
                onClick={sendToWhatsapp}
                className="flex items-center justify-center gap-3 p-4 bg-green-600 rounded-2xl font-bold text-sm text-white hover:bg-green-500 transition-all shadow-lg shadow-green-600/20"
               >
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.187-2.59-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.512-2.96-2.626-.088-.113-.718-.951-.718-1.812 0-.86.444-1.282.605-1.454.161-.173.348-.215.462-.215.115 0 .23 0 .331.005.105.004.247-.04.385.295.144.348.49.1.597 1.1.288 0 .543-.11.691-.11.148 0 .296.035.424.23.128.195.424.96.462 1.035.038.075.064.163.013.264-.051.101-.077.163-.154.253-.077.089-.161.198-.231.266-.07.069-.144.143-.062.285.083.143.366.603.787 1.004.542.518 1.001.68 1.144.75.144.07.23.058.314-.04.085-.098.361-.422.457-.566.096-.144.192-.121.324-.073l1.247.587c.132.062.22.092.271.176.05.084.05 1.1.05 1.1zm8.569-2.416c0 6.627-5.373 12-12 12s-12-5.373-12-12 5.373-12 12-12 12 5.373 12 12zm-1 0c0-6.075-4.925-11-11-11s-11 4.925-11 11 4.925 11 11 11 11-4.925 11-11z"/></svg>
                 Enviar p/ WhatsApp
               </button>
               <button 
                onClick={() => window.print()}
                className="flex items-center justify-center gap-3 p-4 bg-slate-900 rounded-2xl font-bold text-sm border border-slate-800 hover:bg-slate-800 transition-all"
               >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 Baixar PDF
               </button>
               <button 
                onClick={() => setStep(AppStep.WELCOME)}
                className="flex items-center justify-center gap-3 p-4 bg-slate-900 rounded-2xl font-bold text-sm border border-slate-800 hover:bg-slate-800 transition-all col-span-full"
               >
                 Novo Diagnóstico
               </button>
             </div>
          </div>
        )}

      </main>

      <Footer />

      {/* Persistence Floating CTA for long forms */}
      {step === AppStep.ANAMNESE && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <button 
            onClick={() => setStep(AppStep.IMAGES)}
            className="w-14 h-14 gold-gradient rounded-full shadow-2xl flex items-center justify-center text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
