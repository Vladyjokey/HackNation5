import type { LiteratureResult, ExperimentPlanData, NoveltySignal } from '../types'

const mockReferences = [
  {
    title: 'Optimization of Cryopreservation Protocols for Mammalian Cell Lines Using Trehalose-Based Solutions',
    authors: 'Chen et al.',
    journal: 'Cryobiology',
    year: 2023,
    url: 'https://pubmed.ncbi.nlm.nih.gov/example1',
    relevanceScore: 0.89,
  },
  {
    title: 'Comparative Analysis of Cryoprotectants in HeLa Cell Preservation',
    authors: 'Rodriguez et al.',
    journal: 'Cell and Tissue Banking',
    year: 2022,
    url: 'https://pubmed.ncbi.nlm.nih.gov/example2',
    relevanceScore: 0.82,
  },
  {
    title: 'Membrane Stabilization Mechanisms of Disaccharide Cryoprotectants',
    authors: 'Smith & Johnson',
    journal: 'Journal of Biological Chemistry',
    year: 2024,
    url: 'https://pubmed.ncbi.nlm.nih.gov/example3',
    relevanceScore: 0.75,
  },
]

export function simulateLiteratureSearch(hypothesis: string): LiteratureResult {
  // Simulate different results based on hypothesis content
  const lowerHypothesis = hypothesis.toLowerCase()
  
  let noveltySignal: NoveltySignal = 'similar-work-exists'
  let references = mockReferences.slice(0, 3)
  
  if (lowerHypothesis.includes('novel') || lowerHypothesis.includes('new approach')) {
    noveltySignal = 'not-found'
    references = []
  } else if (lowerHypothesis.includes('trehalose') || lowerHypothesis.includes('cryoprotectant')) {
    noveltySignal = 'similar-work-exists'
    references = mockReferences
  } else if (lowerHypothesis.includes('standard') || lowerHypothesis.includes('established')) {
    noveltySignal = 'exact-match-found'
    references = mockReferences.slice(0, 2)
  }

  const summaries: Record<NoveltySignal, string> = {
    'not-found': 'Your hypothesis appears to explore novel territory. While related concepts exist in the literature, no exact protocol matching your specific approach was found. Proceed with confidence that you may be contributing original research.',
    'similar-work-exists': 'Several related studies have investigated similar approaches. The references above provide valuable context and methodological guidance. Consider how your specific parameters or conditions differ from existing work.',
    'exact-match-found': 'This protocol closely matches existing published work. Review the references carefully to understand prior results and consider what unique contribution your study would make.',
  }

  return {
    noveltySignal,
    references,
    summary: summaries[noveltySignal],
  }
}

export function generateMockExperimentPlan(hypothesis: string): ExperimentPlanData {
  return {
    id: `plan-${Date.now()}`,
    title: 'Trehalose vs. Sucrose Cryoprotection Study in HeLa Cells',
    hypothesis,
    plainEnglish: 'Testing whether switching from sucrose to trehalose improves cell survival after freezing',
    protocol: [
      {
        id: 'step-1',
        stepNumber: 1,
        title: 'Cell Culture Preparation',
        description: 'Maintain HeLa cells in DMEM supplemented with 10% FBS and 1% penicillin-streptomycin at 37°C, 5% CO2. Expand to achieve 80-90% confluency in T75 flasks.',
        duration: '3-5 days',
        criticalNotes: 'Cells must be in log phase growth for optimal results',
        equipment: ['CO2 incubator', 'Biosafety cabinet', 'Inverted microscope'],
      },
      {
        id: 'step-2',
        stepNumber: 2,
        title: 'Harvest and Cell Counting',
        description: 'Trypsinize cells using 0.25% trypsin-EDTA for 3-5 minutes. Neutralize with complete medium, centrifuge at 300g for 5 minutes, and resuspend in PBS. Count using hemocytometer or automated counter.',
        duration: '30 minutes',
        criticalNotes: 'Avoid over-trypsinization to maintain membrane integrity',
        equipment: ['Centrifuge', 'Hemocytometer', 'Trypan blue'],
      },
      {
        id: 'step-3',
        stepNumber: 3,
        title: 'Cryoprotectant Solution Preparation',
        description: 'Prepare freezing media: Control - 10% DMSO + 90% FBS with 0.5M sucrose; Test - 10% DMSO + 90% FBS with 0.5M trehalose. Filter sterilize both solutions using 0.22μm filters.',
        duration: '45 minutes',
        criticalNotes: 'Prepare solutions fresh on day of use. Pre-chill to 4°C.',
        equipment: ['Analytical balance', 'Magnetic stirrer', '0.22μm filters'],
      },
      {
        id: 'step-4',
        stepNumber: 4,
        title: 'Cell Suspension and Aliquoting',
        description: 'Resuspend cells at 2×10^6 cells/mL in respective cryoprotectant solutions. Aliquot 1mL into pre-labeled cryovials. Prepare minimum 6 replicates per condition.',
        duration: '30 minutes',
        criticalNotes: 'Work quickly to minimize exposure time before freezing',
        equipment: ['Cryovials', 'Cryo-labels', 'Pipettes'],
      },
      {
        id: 'step-5',
        stepNumber: 5,
        title: 'Controlled-Rate Freezing',
        description: 'Place cryovials in Mr. Frosty or CoolCell container. Transfer to -80°C freezer for controlled cooling at ~1°C/minute for 24 hours, then transfer to liquid nitrogen for long-term storage.',
        duration: '24 hours',
        criticalNotes: 'Ensure isopropanol is fresh in Mr. Frosty container',
        equipment: ['Mr. Frosty container', '-80°C freezer', 'LN2 storage tank'],
      },
      {
        id: 'step-6',
        stepNumber: 6,
        title: 'Thawing and Viability Assessment',
        description: 'After 1-week storage, rapidly thaw vials in 37°C water bath. Dilute cells 1:10 in pre-warmed medium, centrifuge, and resuspend. Assess viability using trypan blue exclusion and flow cytometry with Annexin V/PI staining.',
        duration: '2 hours',
        criticalNotes: 'Thaw rapidly (< 2 minutes) to minimize ice crystal damage',
        equipment: ['Water bath', 'Flow cytometer', 'Annexin V-FITC kit'],
      },
    ],
    materials: [
      {
        id: 'mat-1',
        name: 'HeLa cells (ATCC CCL-2)',
        catalogNumber: 'CCL-2',
        supplier: 'ATCC',
        quantity: '1 vial',
        unitPrice: 499,
        totalPrice: 499,
        category: 'other',
      },
      {
        id: 'mat-2',
        name: 'DMEM, high glucose',
        catalogNumber: '11965092',
        supplier: 'Thermo Fisher',
        quantity: '500mL × 2',
        unitPrice: 28.50,
        totalPrice: 57,
        category: 'reagent',
      },
      {
        id: 'mat-3',
        name: 'Fetal Bovine Serum',
        catalogNumber: '10082147',
        supplier: 'Thermo Fisher',
        quantity: '500mL',
        unitPrice: 350,
        totalPrice: 350,
        category: 'reagent',
      },
      {
        id: 'mat-4',
        name: 'D-(+)-Trehalose dihydrate',
        catalogNumber: 'T9531',
        supplier: 'Sigma-Aldrich',
        quantity: '100g',
        unitPrice: 89,
        totalPrice: 89,
        category: 'reagent',
      },
      {
        id: 'mat-5',
        name: 'Sucrose, molecular biology grade',
        catalogNumber: 'S0389',
        supplier: 'Sigma-Aldrich',
        quantity: '500g',
        unitPrice: 45,
        totalPrice: 45,
        category: 'reagent',
      },
      {
        id: 'mat-6',
        name: 'DMSO, cell culture grade',
        catalogNumber: 'D2650',
        supplier: 'Sigma-Aldrich',
        quantity: '100mL',
        unitPrice: 75,
        totalPrice: 75,
        category: 'reagent',
      },
      {
        id: 'mat-7',
        name: 'Trypsin-EDTA (0.25%)',
        catalogNumber: '25200056',
        supplier: 'Thermo Fisher',
        quantity: '100mL',
        unitPrice: 35,
        totalPrice: 35,
        category: 'reagent',
      },
      {
        id: 'mat-8',
        name: 'Annexin V-FITC Apoptosis Kit',
        catalogNumber: 'V13242',
        supplier: 'Thermo Fisher',
        quantity: '50 tests',
        unitPrice: 425,
        totalPrice: 425,
        category: 'reagent',
      },
      {
        id: 'mat-9',
        name: 'Cryogenic Vials 2mL',
        catalogNumber: '5000-0020',
        supplier: 'Corning',
        quantity: '1 pack (100)',
        unitPrice: 95,
        totalPrice: 95,
        category: 'consumable',
      },
      {
        id: 'mat-10',
        name: 'Mr. Frosty Freezing Container',
        catalogNumber: '5100-0001',
        supplier: 'Thermo Fisher',
        quantity: '1 unit',
        unitPrice: 125,
        totalPrice: 125,
        category: 'equipment',
      },
    ],
    budget: {
      categories: [
        {
          name: 'Reagents',
          items: [],
          subtotal: 1076,
        },
        {
          name: 'Consumables',
          items: [],
          subtotal: 95,
        },
        {
          name: 'Equipment',
          items: [],
          subtotal: 125,
        },
        {
          name: 'Cell Lines',
          items: [],
          subtotal: 499,
        },
      ],
      total: 1795,
      currency: 'USD',
    },
    timeline: {
      totalDuration: '4 weeks',
      phases: [
        {
          id: 'phase-1',
          name: 'Cell Culture Expansion',
          duration: '1 week',
          startWeek: 1,
          endWeek: 1,
          dependencies: [],
          milestones: ['Cells at 80-90% confluency', 'Sufficient cell count achieved'],
        },
        {
          id: 'phase-2',
          name: 'Cryopreservation',
          duration: '3 days',
          startWeek: 2,
          endWeek: 2,
          dependencies: ['phase-1'],
          milestones: ['All samples frozen', 'Transferred to LN2'],
        },
        {
          id: 'phase-3',
          name: 'Storage Period',
          duration: '1 week',
          startWeek: 2,
          endWeek: 3,
          dependencies: ['phase-2'],
          milestones: ['Samples maintained at -196°C'],
        },
        {
          id: 'phase-4',
          name: 'Thawing & Analysis',
          duration: '1 week',
          startWeek: 4,
          endWeek: 4,
          dependencies: ['phase-3'],
          milestones: ['Viability data collected', 'Statistical analysis complete'],
        },
      ],
    },
    validation: [
      {
        id: 'val-1',
        metric: 'Post-thaw cell viability',
        targetValue: '≥15 percentage points higher in trehalose group',
        method: 'Trypan blue exclusion + Flow cytometry',
        successThreshold: 'p < 0.05, n ≥ 6 per group',
      },
      {
        id: 'val-2',
        metric: 'Apoptosis rate',
        targetValue: 'Lower Annexin V+ population in trehalose group',
        method: 'Annexin V-FITC/PI flow cytometry',
        successThreshold: 'Statistically significant reduction',
      },
      {
        id: 'val-3',
        metric: 'Membrane integrity',
        targetValue: 'Higher intact membrane percentage',
        method: 'PI exclusion',
        successThreshold: '≥10% improvement',
      },
    ],
    safetyConsiderations: [
      'DMSO is flammable and can enhance skin absorption of other chemicals - use appropriate PPE',
      'Liquid nitrogen handling requires cryogenic gloves and face shield',
      'Work with HeLa cells under BSL-2 conditions',
      'Dispose of biohazardous waste according to institutional guidelines',
    ],
    expectedOutcomes: [
      'Trehalose group shows ≥15% higher post-thaw viability vs sucrose control',
      'Reduced apoptosis markers in trehalose-preserved cells',
      'Better membrane integrity preservation with trehalose',
      'Data supporting trehalose as superior cryoprotectant for HeLa cells',
    ],
  }
}
