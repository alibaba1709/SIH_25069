import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Types for analysis data
export interface AnalysisResult {
  totalImpacts: {
    carbon: number;
    energy: number;
    water: number;
    depletion: number;
  };
  materialResults: Array<{
    material: string;
    quantity: number;
    apiResult?: any;
    carbon: number;
    energy: number;
    water: number;
    depletion: number;
  }>;
  circularityMetrics: {
    recycledContent: number;
    recoveryRate: number;
    circularityIndex: number;
    grade: string;
  };
  recommendations: string[];
  timestamp?: Date;
  projectName?: string;
}

export interface MaterialData {
  id: string;
  name: string;
  category: string;
  properties: {
    density: number;
    recyclability: number;
    carbonFootprint: number;
    energyIntensity: number;
  };
  lastAnalyzed?: Date;
  analysisCount: number;
}

export interface ReportData {
  id: string;
  name: string;
  type: 'LCA' | 'Circularity' | 'Environmental' | 'Full LCA' | 'Impact Assessment' | 'Sustainability Report' | 'Comparative LCA';
  createdAt: Date;
  date: string;
  status: 'Completed' | 'In Progress' | 'Draft';
  score: number;
  data: AnalysisResult;
  summary: string;
}

interface AppContextType {
  // Analysis data
  currentAnalysis: AnalysisResult | null;
  analysisHistory: AnalysisResult[];
  setCurrentAnalysis: (analysis: AnalysisResult | null) => void;
  addAnalysisToHistory: (analysis: AnalysisResult) => void;
  
  // Material database
  materials: MaterialData[];
  addMaterial: (material: MaterialData) => void;
  updateMaterial: (id: string, updates: Partial<MaterialData>) => void;
  
  // Reports
  reports: ReportData[];
  addReport: (report: ReportData) => void;
  
  // Dashboard stats
  getTotalAnalyses: () => number;
  getAverageCircularity: () => number;
  getTopMaterials: () => { material: string; count: number }[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [materials, setMaterials] = useState<MaterialData[]>([
    // Sample materials
    {
      id: 'steel-001',
      name: 'Carbon Steel',
      category: 'Steel',
      properties: {
        density: 7.85,
        recyclability: 0.9,
        carbonFootprint: 2.3,
        energyIntensity: 25
      },
      analysisCount: 0
    },
    {
      id: 'aluminum-001',
      name: 'Aluminum 6061',
      category: 'Aluminum',
      properties: {
        density: 2.7,
        recyclability: 0.95,
        carbonFootprint: 10.0,
        energyIntensity: 150
      },
      analysisCount: 0
    },
    {
      id: 'copper-001',
      name: 'Pure Copper',
      category: 'Copper',
      properties: {
        density: 8.96,
        recyclability: 0.98,
        carbonFootprint: 3.5,
        energyIntensity: 40
      },
      analysisCount: 0
    }
  ]);
  const [reports, setReports] = useState<ReportData[]>([]);

  const addAnalysisToHistory = (analysis: AnalysisResult) => {
    const analysisWithTimestamp = {
      ...analysis,
      timestamp: new Date(),
      projectName: `Analysis ${analysisHistory.length + 1}`
    };
    setAnalysisHistory(prev => [analysisWithTimestamp, ...prev]);
    setCurrentAnalysis(analysisWithTimestamp);
    
    // Update material analysis counts
    analysis.materialResults.forEach(result => {
      const material = materials.find(m => m.category.toLowerCase() === result.material.toLowerCase());
      if (material) {
        updateMaterial(result.material, {
          analysisCount: material.analysisCount + 1,
          lastAnalyzed: new Date()
        });
      }
    });
    
    // Auto-generate report
    const mciScore = analysis.circularityMetrics.circularityIndex;
    const newReport: ReportData = {
      id: `report-${Date.now()}`,
      name: `LCA Report - ${new Date().toLocaleDateString()}`,
      type: 'LCA',
      createdAt: new Date(),
      date: new Date().toLocaleDateString(),
      status: 'Completed',
      score: Math.round(mciScore / 10), // Convert MCI to 0-10 scale
      data: analysisWithTimestamp,
      summary: `Analysis of ${analysis.materialResults.length} materials with MCI score of ${analysis.circularityMetrics.circularityIndex.toFixed(1)}%`
    };
    setReports(prev => [newReport, ...prev]);
  };

  const addMaterial = (material: MaterialData) => {
    setMaterials(prev => [...prev, material]);
  };

  const updateMaterial = (id: string, updates: Partial<MaterialData>) => {
    setMaterials(prev => prev.map(material => 
      material.id === id || material.category.toLowerCase() === id.toLowerCase()
        ? { ...material, ...updates }
        : material
    ));
  };

  const addReport = (report: ReportData) => {
    setReports(prev => [report, ...prev]);
  };

  const getTotalAnalyses = () => analysisHistory.length;

  const getAverageCircularity = () => {
    if (analysisHistory.length === 0) return 0;
    const total = analysisHistory.reduce((sum, analysis) => sum + analysis.circularityMetrics.circularityIndex, 0);
    return total / analysisHistory.length;
  };

  const getTopMaterials = () => {
    const materialCounts: Record<string, number> = {};
    analysisHistory.forEach(analysis => {
      analysis.materialResults.forEach(result => {
        materialCounts[result.material] = (materialCounts[result.material] || 0) + 1;
      });
    });
    
    return Object.entries(materialCounts)
      .map(([material, count]) => ({ material, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const value: AppContextType = {
    currentAnalysis,
    analysisHistory,
    setCurrentAnalysis,
    addAnalysisToHistory,
    materials,
    addMaterial,
    updateMaterial,
    reports,
    addReport,
    getTotalAnalyses,
    getAverageCircularity,
    getTopMaterials
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
