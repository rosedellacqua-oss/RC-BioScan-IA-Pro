
export enum UserMode {
  CLIENTE = 'CLIENTE',
  PROFISSIONAL = 'PROFISSIONAL'
}

export enum AppStep {
  WELCOME = 0,
  ANAMNESE = 1,
  IMAGES = 2,
  ARSENAL = 3,
  ANALYSIS = 4,
  REPORT = 5
}

export interface AnamneseData {
  name: string;
  phone: string;
  chemicalHistory: string[];
  heatUsage: 'Baixo' | 'Médio' | 'Alto';
  complaints: string[];
  scalpSensitivity: boolean;
  professionalNotes: string;
}

export interface CapillaryImage {
  id: string;
  url: string;
  base64: string;
  zone: string;
}

export interface Brand {
  name: string;
  level: string;
}

export enum RecommendationMode {
  FIXED = 'A',
  LIBRARY = 'B',
  NO_BRAND = 'C'
}

export interface ArsenalConfig {
  mode: RecommendationMode;
  fixedBrand?: string;
  allowedLevels: string[];
  allowedBrands: string[];
}
