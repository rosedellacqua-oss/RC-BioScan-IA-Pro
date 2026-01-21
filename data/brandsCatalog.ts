
export const BRAND_BLOCKS = {
  PREMIUM: [
    'Kérastase', 'Joico', 'Redken', 'Wella Professionals', 'Schwarzkopf Professional', 
    'Truss', 'L’Oréal Professionnel', 'Keune', 'Alfaparf Milano', 'Braé', 'Avlon', 
    'Sebastian', 'Senscience'
  ],
  MEDIA: [
    'Wella Invigo', 'Amend', 'Lowell', 'Itallian Hair Tech', 'Cadiveu Professional',
    'Let Me Be Pro', 'Richée Professional', 'Inoar Profissional', 'Aquaflora', 
    'Unicaher', 'Aneethun'
  ],
  ACESSIVEL: [
    'Forever Liss', 'Salon Line Professional', 'Inoar (linhas populares)', 
    'Felps Professional', 'Lola Cosmetics'
  ],
  BOTANICA: [
    'Grendha Ativos Bio', 'Amazônica Care', 'Arvências Cosméticos Naturais', 
    'Ativo Natural', 'Ato Fito Cosméticos'
  ]
};

export const CAPILLARY_ZONES = [
  'Frontal', 'Têmporas / Laterais', 'Topo / Vértice', 'Coroa', 
  'Nuca / Occipital', 'Comprimento (meio)', 'Pontas', 
  'Couro cabeludo 1', 'Couro cabeludo 2', 'Extra'
];

// Catálogo de produtos reais brasileiros (uso profissional)
// Organizados em COMBOS por marca para facilitar a escolha consistente
export const REAL_PRODUCTS_CATALOG = {
  // COMBOS COMPLETOS POR MARCA
  COMBOS_KERASTASE: {
    NUTRITIVE: {
      tipo: 'Hidratação e Nutrição',
      shampoo: 'Kérastase Nutritive Bain Satin Shampoo',
      mascara: 'Kérastase Nutritive Masquintense',
      condicionador: 'Kérastase Nutritive Lait Vital Condicionador',
      leavein: 'Kérastase Nutritive Nectar Thermique'
    },
    RESISTANCE: {
      tipo: 'Reconstrução',
      shampoo: 'Kérastase Résistance Bain Force Architecte',
      mascara: 'Kérastase Résistance Masque Force Architecte',
      leavein: 'Kérastase Résistance Ciment Thermique'
    }
  },
  
  COMBOS_WELLA: {
    FUSION: {
      tipo: 'Reconstrução',
      shampoo: 'Wella Professionals Fusion Intense Repair Shampoo',
      mascara: 'Wella Professionals Fusion Intense Repair Mask',
      condicionador: 'Wella Professionals Fusion Intense Repair Conditioner',
      leavein: 'Wella Professionals EIMI Thermal Image'
    },
    OIL_REFLECTIONS: {
      tipo: 'Nutrição e Brilho',
      shampoo: 'Wella Professionals Oil Reflections Luminous Reveal Shampoo',
      mascara: 'Wella Professionals Oil Reflections Luminous Instant Mask',
      oleo: 'Wella Professionals Oil Reflections Light Luminous Oil'
    },
    INVIGO_NUTRI: {
      tipo: 'Hidratação',
      shampoo: 'Wella Professionals Invigo Nutri-Enrich Shampoo',
      mascara: 'Wella Professionals Invigo Nutri-Enrich Deep Nourishing Mask',
      condicionador: 'Wella Professionals Invigo Nutri-Enrich Conditioner'
    }
  },
  
  COMBOS_TRUSS: {
    USO_PROFISSIONAL: {
      hidratacao: {
        shampoo: 'Truss Uso Profissional Shampoo Hidratante',
        mascara: 'Truss Uso Profissional Máscara Ultra Hidratante',
        leavein: 'Truss Uso Profissional Spray Leave-in'
      },
      reconstrucao: {
        shampoo: 'Truss Uso Profissional Shampoo Reconstrutor',
        mascara: 'Truss Uso Profissional Máscara de Reconstrução',
        ampola: 'Truss Uso Profissional Ampola de Reconstrução'
      },
      nutricao: {
        shampoo: 'Truss Uso Profissional Shampoo Nutritivo',
        mascara: 'Truss Uso Profissional Máscara de Nutrição Intensiva',
        oleo: 'Truss Glossy Spray Finalizador'
      }
    }
  },
  
  COMBOS_AMEND: {
    GOLD_BLACK: {
      hidratacao: {
        shampoo: 'Amend Gold Black Shampoo Hidratante',
        mascara: 'Amend Gold Black Máscara Hidratante Intensiva',
        leavein: 'Amend Gold Black Leave-in Protetor Térmico'
      },
      nutricao: {
        shampoo: 'Amend Gold Black Shampoo Nutritivo',
        mascara: 'Amend Gold Black Máscara Restauradora',
        oleo: 'Amend Millenar Óleos Indianos Óleo Finalizador'
      }
    },
    MILLENAR: {
      shampoo: 'Amend Millenar Óleos Marroquinos Shampoo',
      mascara: 'Amend Millenar Óleos Marroquinos Máscara',
      oleo: 'Amend Millenar Óleos Marroquinos Sérum'
    }
  },
  
  COMBOS_BRAE: {
    BOND_ANGEL: {
      tipo: 'Reconstrução Pós-Química',
      shampoo: 'Braé Bond Angel Shampoo Pós-Química',
      mascara: 'Braé Bond Angel Máscara Reconstrução',
      ampola: 'Braé Bond Angel Ampola de Reconstrução Plex'
    },
    DIVINE: {
      tipo: 'Hidratação Anti-Frizz',
      shampoo: 'Braé Divine Shampoo Hidratante Anti-Frizz',
      mascara: 'Braé Divine Máscara Hidratante Anti-Frizz',
      leavein: 'Braé Divine Leave-in Antiemborrachamento',
      protetor: 'Braé Divine Protetor Térmico'
    }
  },
  
  COMBOS_LOWELL: {
    COMPLEX_CARE: {
      tipo: 'Reconstrução',
      shampoo: 'Lowell Complex Care Shampoo Reconstrutor',
      mascara: 'Lowell Complex Care Máscara Reconstrutora',
      ampola: 'Lowell Banho de Verniz Ampola'
    },
    PRACAXI: {
      tipo: 'Hidratação',
      shampoo: 'Lowell Extrato de Pracaxi Shampoo Hidratante',
      mascara: 'Lowell Extrato de Pracaxi Máscara Hidratante',
      leavein: 'Lowell Protect Care Leave-in Protetor Térmico'
    },
    LISO_SUPREMO: {
      tipo: 'Nutrição',
      shampoo: 'Lowell Liso Supremo Shampoo',
      mascara: 'Lowell Liso Supremo Máscara',
      oleo: 'Lowell Oil Care Óleo Reparador'
    }
  },
  
  COMBOS_FOREVER_LISS: {
    DESMAIA_CABELO: {
      tipo: 'Hidratação',
      shampoo: 'Forever Liss Professional Desmaia Cabelo Shampoo',
      mascara: 'Forever Liss Professional Desmaia Cabelo Máscara',
      leavein: 'Forever Liss Professional Desmaia Cabelo Leave-in',
      protetor: 'Forever Liss Professional Desmaia Cabelo Termo Ativado'
    }
  },
  
  COMBOS_SALON_LINE: {
    SOS_CACHOS: {
      tipo: 'Hidratação para Cachos',
      shampoo: 'Salon Line S.O.S Cachos Shampoo',
      mascara: 'Salon Line S.O.S Cachos Máscara de Hidratação',
      leavein: 'Salon Line S.O.S Cachos Ativador de Cachos'
    },
    MEU_LISO: {
      tipo: 'Hidratação para Lisos',
      shampoo: 'Salon Line Meu Liso Shampoo',
      mascara: 'Salon Line Meu Liso Máscara',
      leavein: 'Salon Line Meu Liso #Leve Leave-in'
    }
  },
  
  COMBOS_CADIVEU: {
    BURITI: {
      tipo: 'Nutrição Natural',
      shampoo: 'Cadiveu Professional Buriti Shampoo',
      mascara: 'Cadiveu Professional Buriti Máscara'
    },
    SOL_DO_RIO: {
      tipo: 'Hidratação Tropical',
      shampoo: 'Cadiveu Professional Sol do Rio Shampoo',
      mascara: 'Cadiveu Professional Sol do Rio Máscara'
    }
  },

  // LISTA INDIVIDUAL (mantida para referência)
  HIDRATACAO: {
    shampoos: [
      'Kérastase Nutritive Bain Satin Shampoo',
      'Truss Uso Profissional Shampoo Hidratante',
      'Amend Millenar Óleos Marroquinos Shampoo',
      'Lowell Extrato de Pracaxi Shampoo Hidratante',
      'Braé Divine Shampoo Hidratante Anti-Frizz',
      'Forever Liss Professional Desmaia Cabelo Shampoo',
      'Salon Line S.O.S Cachos Shampoo',
      'Inoar Argan Oil Shampoo System'
    ],
    mascaras: [
      'Kérastase Nutritive Masquintense',
      'Truss Uso Profissional Máscara Ultra Hidratante',
      'Amend Gold Black Máscara Hidratante Intensiva',
      'Lowell Extrato de Pracaxi Máscara Hidratante',
      'Braé Divine Máscara Hidratante Anti-Frizz',
      'Forever Liss Professional Desmaia Cabelo Máscara',
      'Salon Line S.O.S Cachos Máscara de Hidratação',
      'Cadiveu Professional Sol do Rio Máscara'
    ],
    leavein: [
      'Kérastase Nutritive Nectar Thermique',
      'Truss Uso Profissional Spray Leave-in',
      'Forever Liss Professional Desmaia Cabelo Leave-in',
      'Lowell Protect Care Leave-in Protetor Térmico',
      'Braé Divine Leave-in Antiemborrachamento',
      'Salon Line Meu Liso #Leve Leave-in'
    ]
  },
  NUTRICAO: {
    shampoos: [
      'Wella Professionals Oil Reflections Luminous Reveal Shampoo',
      'Truss Uso Profissional Shampoo Nutritivo',
      'Amend Gold Black Shampoo Nutritivo',
      'Lowell Liso Supremo Shampoo',
      'Cadiveu Professional Buriti Shampoo'
    ],
    mascaras: [
      'Wella Professionals Oil Reflections Luminous Instant Mask',
      'Truss Uso Profissional Máscara de Nutrição Intensiva',
      'Amend Gold Black Máscara Restauradora',
      'Lowell Liso Supremo Máscara',
      'Cadiveu Professional Buriti Máscara'
    ],
    oleos: [
      'Wella Professionals Oil Reflections Light Luminous Oil',
      'Truss Glossy Spray Finalizador',
      'Lowell Oil Care Óleo Reparador',
      'Amend Millenar Óleos Indianos Óleo Finalizador'
    ]
  },
  RECONSTRUCAO: {
    shampoos: [
      'Wella Professionals Fusion Intense Repair Shampoo',
      'Truss Uso Profissional Shampoo Reconstrutor',
      'Braé Bond Angel Shampoo Pós-Química',
      'Lowell Complex Care Shampoo Reconstrutor',
      'Cadiveu Professional Essentials Shampoo Força'
    ],
    mascaras: [
      'Wella Professionals Fusion Intense Repair Mask',
      'Truss Uso Profissional Máscara de Reconstrução',
      'Braé Bond Angel Máscara Reconstrução',
      'Lowell Complex Care Máscara Reconstrutora',
      'Forever Liss Professional Desmaia Cabelo Máscara Reconstrução'
    ],
    ampolas: [
      'Truss Uso Profissional Ampola de Reconstrução',
      'Braé Bond Angel Ampola de Reconstrução Plex',
      'Lowell Banho de Verniz Ampola'
    ]
  },
  PROTETORES_TERMICOS: [
    'Wella Professionals EIMI Thermal Image Protetor Térmico',
    'Truss Uso Profissional Thermal Defense',
    'Lowell Protect Care Protetor Térmico',
    'Braé Divine Protetor Térmico',
    'Forever Liss Professional Desmaia Cabelo Termo Ativado'
  ]
};

