import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Paper,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from '@mui/material';
import {
  PlayArrow,
  Science,
  Calculate,
  Info,
  ExpandMore,
  Add,
  Delete,
} from '@mui/icons-material';

// Context
import { useAppContext } from '../context/AppContext';

// LCI Data structure
const LCI_DATA = {
  aluminium: {
    primary: { carbon: 10, energy: 150, water: 50, depletion: 0.8 },
    recycled: { carbon: 0.5, energy: 5, water: 2, depletion: 0.1 },
    transport: { truck: 0.0001, rail: 0.00005, ship: 0.00002 },
    energyMix: { grid: 1.0, solar: 0.2, gas: 1.2 },
    process: { smelting: 1.2, casting: 1.0, rolling: 1.1, extrusion: 1.3 },
  },
  copper: {
    primary: { carbon: 3.5, energy: 40, water: 25, depletion: 0.7 },
    recycled: { carbon: 0.3, energy: 4, water: 1.5, depletion: 0.05 },
    transport: { truck: 0.0001, rail: 0.00005, ship: 0.00002 },
    energyMix: { grid: 1.0, solar: 0.2, gas: 1.2 },
    process: { smelting: 1.2, casting: 1.0, rolling: 1.1, extrusion: 1.3 },
  },
  steel: {
    primary: { carbon: 2.3, energy: 20, water: 15, depletion: 0.5 },
    recycled: { carbon: 0.2, energy: 3, water: 1, depletion: 0.03 },
    transport: { truck: 0.0001, rail: 0.00005, ship: 0.00002 },
    energyMix: { grid: 1.0, solar: 0.2, gas: 1.2 },
    process: { smelting: 1.2, casting: 1.0, rolling: 1.1, extrusion: 1.3 },
  },
};

interface MaterialConfig {
  id: string;
  material: string;
  quantity: number;
  unit: string;
  sources: Array<{
    type: 'primary' | 'recycled';
    percentage: number;
    transportMode: 'truck' | 'rail' | 'ship';
    transportDistance: number;
  }>;
  processSteps: string[];
  energyMix: 'grid' | 'solar' | 'gas';
}

interface EndOfLifeScenario {
  reuse: number;
  recycle: number;
  disposal: number;
}

const LCAAnalysis: React.FC = () => {
  const { addAnalysisToHistory } = useAppContext();
  
  const [materials, setMaterials] = useState<MaterialConfig[]>([]);
  const [productLifespan, setProductLifespan] = useState<number>(10);
  const [eolScenario, setEolScenario] = useState<EndOfLifeScenario>({
    reuse: 20,
    recycle: 60,
    disposal: 20,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  // Add new material configuration
  const addMaterial = () => {
    const newMaterial: MaterialConfig = {
      id: Date.now().toString(),
      material: 'aluminium',
      quantity: 1,
      unit: 'kg',
      sources: [{
        type: 'primary',
        percentage: 100,
        transportMode: 'truck',
        transportDistance: 100,
      }],
      processSteps: ['smelting'],
      energyMix: 'grid',
    };
    setMaterials([...materials, newMaterial]);
  };

  // Remove material configuration
  const removeMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  // Update material configuration
  const updateMaterial = (id: string, updates: Partial<MaterialConfig>) => {
    setMaterials(materials.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  // Add source to material
  const addSource = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      const newSource = {
        type: 'primary' as const,
        percentage: 0,
        transportMode: 'truck' as const,
        transportDistance: 100,
      };
      updateMaterial(materialId, {
        sources: [...material.sources, newSource]
      });
    }
  };

  // Remove source from material
  const removeSource = (materialId: string, sourceIndex: number) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      const newSources = material.sources.filter((_, index) => index !== sourceIndex);
      updateMaterial(materialId, { sources: newSources });
    }
  };

  // Update source in material
  const updateSource = (materialId: string, sourceIndex: number, updates: any) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      const newSources = material.sources.map((source, index) => 
        index === sourceIndex ? { ...source, ...updates } : source
      );
      updateMaterial(materialId, { sources: newSources });
    }
  };

  // Validate material configuration
  const validateMaterial = (material: MaterialConfig): string[] => {
    const errors: string[] = [];
    
    if (material.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }
    
    const totalPercentage = material.sources.reduce((sum, source) => sum + source.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.1) {
      errors.push('Source percentages must sum to 100%');
    }
    
    return errors;
  };

  // Validate end-of-life scenario
  const validateEolScenario = (): string[] => {
    const errors: string[] = [];
    const total = eolScenario.reuse + eolScenario.recycle + eolScenario.disposal;
    
    if (Math.abs(total - 100) > 0.1) {
      errors.push('End-of-life percentages must sum to 100%');
    }
    
    return errors;
  };

  // Run LCA Analysis with Python Backend
  const runAnalysis = async () => {
    // Validate all materials
    const allErrors: string[] = [];
    materials.forEach((material, index) => {
      const errors = validateMaterial(material);
      errors.forEach(error => allErrors.push(`Material ${index + 1}: ${error}`));
    });
    
    // Validate end-of-life scenario
    const eolErrors = validateEolScenario();
    allErrors.push(...eolErrors);
    
    if (allErrors.length > 0) {
      alert('Please fix the following errors:\n' + allErrors.join('\n'));
      return;
    }
    
    if (materials.length === 0) {
      alert('Please add at least one material configuration');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Prepare data for each material and send to Python backend
      const materialAnalyses = await Promise.all(
        materials.map(async (material) => {
          // Calculate weighted averages for sources
          const totalMass = material.quantity;
          let avgRecycledContent = 0;
          let avgTransportDistance = 0;
          
          material.sources.forEach(source => {
            const proportion = source.percentage / 100;
            if (source.type === 'recycled') {
              avgRecycledContent += proportion;
            }
            avgTransportDistance += source.transportDistance * proportion;
          });

          // Prepare data for Python API
          const apiData = {
            material: material.material.charAt(0).toUpperCase() + material.material.slice(1),
            quantity: material.quantity,
            route: avgRecycledContent > 0.5 ? 'Secondary' : 'Primary',
            year: 2024,
            country: 'Global',
            energy_MJ_per_kg: getEnergyByMaterial(material.material),
            mining_energy_MJ_per_kg: getMiningEnergyByMaterial(material.material),
            smelting_energy_MJ_per_kg: getSmeltingEnergyByMaterial(material.material),
            refining_energy_MJ_per_kg: getRefiningEnergyByMaterial(material.material),
            fabrication_energy_MJ_per_kg: getFabricationEnergyByMaterial(material.material),
            recycled_content_frac: avgRecycledContent,
            recycling_efficiency_frac: getRecyclingEfficiencyByMaterial(material.material),
            recycled_output_kg_per_kg: avgRecycledContent,
            loop_closing_potential_USD_per_kg: 0.2,
            reuse_potential_score: eolScenario.reuse / 100,
            repairability_score: Math.min(productLifespan / 20, 1),
            product_lifetime_years: productLifespan,
            end_of_life_route: getEndOfLifeRoute(),
            transport_distance_km: avgTransportDistance,
            transport_mode: material.sources[0]?.transportMode || 'Truck',
            electricity_grid_renewable_pct: getGridRenewablePercent(material.energyMix),
            renewable_electricity_frac: getRenewableFraction(material.energyMix),
            material_criticality_score: getCriticalityScore(material.material),
            economic_value_USD_per_kg: getEconomicValue(material.material),
            circularity_index_default: 0.5,
            missing_data_flag: 0,
            V_kg: material.quantity,
            recovered_kg: material.quantity * (eolScenario.reuse + eolScenario.recycle) / 100,
            W_kg: material.quantity,
            LFI: Math.min(productLifespan / 10, 1),
            lifespan_clipped: Math.min(productLifespan, 50),
            F: productLifespan / 10,
            MCI_raw: 0
          };

          // Call Python API
          const response = await fetch('http://localhost:5000/api/calculate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData),
          });

          if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
          }

          const result = await response.json();
          return {
            material: material.material,
            quantity: material.quantity,
            apiResult: result.results,
            carbon: result.results.environmental_impacts.co2_emissions,
            energy: result.results.environmental_impacts.energy_consumption,
            water: result.results.environmental_impacts.water_usage,
            depletion: 0, // Not provided by current API
          };
        })
      );

      // Aggregate results
      const totalCarbon = materialAnalyses.reduce((sum, m) => sum + m.carbon, 0);
      const totalEnergy = materialAnalyses.reduce((sum, m) => sum + m.energy, 0);
      const totalWater = materialAnalyses.reduce((sum, m) => sum + m.water, 0);
      const totalDepletion = materialAnalyses.reduce((sum, m) => sum + m.depletion, 0);

      // Use MCI from the most significant material (by quantity)
      const primaryMaterial = materialAnalyses.reduce((prev, current) => 
        prev.quantity > current.quantity ? prev : current
      );
      
      const mciScore = primaryMaterial.apiResult.mci_score;
      const allRecommendations = materialAnalyses.flatMap(m => m.apiResult.recommendations);

      // Calculate overall circularity metrics
      const totalMass = materials.reduce((sum, m) => sum + m.quantity, 0);
      const recycledMass = materials.reduce((sum, material) => {
        return sum + material.sources.reduce((sourceSum, source) => {
          return sourceSum + (source.type === 'recycled' ? material.quantity * source.percentage / 100 : 0);
        }, 0);
      }, 0);

      const recycledContent = totalMass > 0 ? (recycledMass / totalMass) * 100 : 0;
      const recoveryRate = eolScenario.reuse + eolScenario.recycle;

      // Generate grade based on MCI
      let grade = 'F';
      if (mciScore >= 90) grade = 'A+';
      else if (mciScore >= 80) grade = 'A';
      else if (mciScore >= 70) grade = 'B+';
      else if (mciScore >= 60) grade = 'B';
      else if (mciScore >= 50) grade = 'C+';
      else if (mciScore >= 40) grade = 'C';
      else if (mciScore >= 30) grade = 'D';

      const analysisResults = {
        totalImpacts: {
          carbon: totalCarbon,
          energy: totalEnergy,
          water: totalWater,
          depletion: totalDepletion,
        },
        materialResults: materialAnalyses,
        circularityMetrics: {
          recycledContent,
          recoveryRate,
          circularityIndex: mciScore,
          grade,
        },
        recommendations: [...new Set(allRecommendations)], // Remove duplicates
      };

      setResults(analysisResults);
      
      // Save to global context for dashboard and reports
      addAnalysisToHistory(analysisResults);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please make sure the Python backend is running on http://localhost:5000');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper functions for material properties
  const getEnergyByMaterial = (material: string): number => {
    const energyMap: Record<string, number> = {
      aluminium: 150, aluminum: 150, copper: 40, steel: 25
    };
    return energyMap[material.toLowerCase()] || 25;
  };

  const getMiningEnergyByMaterial = (material: string): number => {
    const energyMap: Record<string, number> = {
      aluminium: 50, aluminum: 50, copper: 15, steel: 8
    };
    return energyMap[material.toLowerCase()] || 8;
  };

  const getSmeltingEnergyByMaterial = (material: string): number => {
    const energyMap: Record<string, number> = {
      aluminium: 60, aluminum: 60, copper: 15, steel: 10
    };
    return energyMap[material.toLowerCase()] || 10;
  };

  const getRefiningEnergyByMaterial = (material: string): number => {
    const energyMap: Record<string, number> = {
      aluminium: 25, aluminum: 25, copper: 8, steel: 5
    };
    return energyMap[material.toLowerCase()] || 5;
  };

  const getFabricationEnergyByMaterial = (material: string): number => {
    const energyMap: Record<string, number> = {
      aluminium: 15, aluminum: 15, copper: 2, steel: 2
    };
    return energyMap[material.toLowerCase()] || 2;
  };

  const getRecyclingEfficiencyByMaterial = (material: string): number => {
    const efficiencyMap: Record<string, number> = {
      aluminium: 0.95, aluminum: 0.95, copper: 0.98, steel: 0.90
    };
    return efficiencyMap[material.toLowerCase()] || 0.85;
  };

  const getEndOfLifeRoute = (): string => {
    if (eolScenario.recycle > 50) return 'Recycled';
    if (eolScenario.reuse > 30) return 'Reused';
    return 'Disposed';
  };

  const getGridRenewablePercent = (energyMix: string): number => {
    const renewableMap: Record<string, number> = {
      solar: 100, grid: 35, gas: 0
    };
    return renewableMap[energyMix] || 35;
  };

  const getRenewableFraction = (energyMix: string): number => {
    return getGridRenewablePercent(energyMix) / 100;
  };

  const getCriticalityScore = (material: string): number => {
    const criticalityMap: Record<string, number> = {
      aluminium: 0.3, aluminum: 0.3, copper: 0.4, steel: 0.1
    };
    return criticalityMap[material.toLowerCase()] || 0.2;
  };

  const getEconomicValue = (material: string): number => {
    const valueMap: Record<string, number> = {
      aluminium: 2.5, aluminum: 2.5, copper: 8.5, steel: 0.8
    };
    return valueMap[material.toLowerCase()] || 1.0;
  };

  // Generate recommendations based on analysis
  const generateRecommendations = (recycledContent: number, recoveryRate: number, lifespan: number, grade: string): string[] => {
    const recommendations: string[] = [];
    
    if (recycledContent < 30) {
      recommendations.push('Increase recycled content to reduce environmental impact');
    }
    
    if (recoveryRate < 70) {
      recommendations.push('Improve end-of-life planning for better material recovery');
    }
    
    if (lifespan < 10) {
      recommendations.push('Design for longer product lifespan to improve circularity');
    }
    
    if (grade === 'C' || grade === 'D' || grade === 'F') {
      recommendations.push('Consider redesigning the product with circular economy principles');
    }
    
    recommendations.push('Optimize transportation routes to reduce carbon footprint');
    recommendations.push('Consider renewable energy sources for manufacturing processes');
    
    return recommendations;
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 2 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        LCA Analysis Tool
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Configure your materials and analyze their environmental impact and circularity
      </Typography>

      <Box display="flex" gap={3} sx={{ height: 'calc(100vh - 200px)' }}>
        {/* Configuration Panel */}
        <Box flex={1} sx={{ overflow: 'auto' }}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Material Configuration</Typography>
                <Button
                  startIcon={<Add />}
                  onClick={addMaterial}
                  variant="outlined"
                  size="small"
                >
                  Add Material
                </Button>
              </Box>

              {materials.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Add materials to start your LCA analysis
                </Alert>
              )}

              {materials.map((material) => (
                <Accordion key={material.id} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                      <Typography variant="h6">
                        {material.material.charAt(0).toUpperCase() + material.material.slice(1)} - {material.quantity} {material.unit}
                      </Typography>
                      <Box flexGrow={1} />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMaterial(material.id);
                        }}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      {/* Basic Material Info */}
                      <Box display="flex" gap={2}>
                        <FormControl sx={{ minWidth: 200 }}>
                          <InputLabel>Material Type</InputLabel>
                          <Select
                            value={material.material}
                            label="Material Type"
                            onChange={(e) => updateMaterial(material.id, { material: e.target.value })}
                          >
                            <MenuItem value="aluminium">Aluminium</MenuItem>
                            <MenuItem value="copper">Copper</MenuItem>
                            <MenuItem value="steel">Steel</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          label="Quantity"
                          type="number"
                          value={material.quantity}
                          onChange={(e) => updateMaterial(material.id, { quantity: parseFloat(e.target.value) || 0 })}
                          inputProps={{ min: 0, step: 0.1 }}
                          sx={{ minWidth: 150 }}
                        />
                      </Box>

                      {/* Material Sources */}
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          Material Sources
                        </Typography>
                        {material.sources.map((source, sourceIndex) => (
                          <Paper key={sourceIndex} sx={{ p: 2, mb: 1 }}>
                            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Type</InputLabel>
                                <Select
                                  value={source.type}
                                  label="Type"
                                  onChange={(e) => updateSource(material.id, sourceIndex, { type: e.target.value })}
                                >
                                  <MenuItem value="primary">Primary</MenuItem>
                                  <MenuItem value="recycled">Recycled</MenuItem>
                                </Select>
                              </FormControl>
                              <TextField
                                size="small"
                                label="Percentage"
                                type="number"
                                value={source.percentage}
                                onChange={(e) => updateSource(material.id, sourceIndex, { percentage: parseFloat(e.target.value) || 0 })}
                                inputProps={{ min: 0, max: 100 }}
                                sx={{ width: 100 }}
                              />
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Transport</InputLabel>
                                <Select
                                  value={source.transportMode}
                                  label="Transport"
                                  onChange={(e) => updateSource(material.id, sourceIndex, { transportMode: e.target.value })}
                                >
                                  <MenuItem value="truck">Truck</MenuItem>
                                  <MenuItem value="rail">Rail</MenuItem>
                                  <MenuItem value="ship">Ship</MenuItem>
                                </Select>
                              </FormControl>
                              <TextField
                                size="small"
                                label="Distance (km)"
                                type="number"
                                value={source.transportDistance}
                                onChange={(e) => updateSource(material.id, sourceIndex, { transportDistance: parseFloat(e.target.value) || 0 })}
                                inputProps={{ min: 0 }}
                                sx={{ width: 120 }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => removeSource(material.id, sourceIndex)}
                                color="error"
                                disabled={material.sources.length === 1}
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          </Paper>
                        ))}
                        <Button
                          startIcon={<Add />}
                          onClick={() => addSource(material.id)}
                          size="small"
                          variant="outlined"
                        >
                          Add Source
                        </Button>
                      </Box>

                      {/* Process Configuration */}
                      <Box display="flex" gap={2}>
                        <FormControl sx={{ minWidth: 150 }}>
                          <InputLabel>Energy Mix</InputLabel>
                          <Select
                            value={material.energyMix}
                            label="Energy Mix"
                            onChange={(e) => updateMaterial(material.id, { energyMix: e.target.value as any })}
                          >
                            <MenuItem value="grid">Grid Mix</MenuItem>
                            <MenuItem value="solar">Solar</MenuItem>
                            <MenuItem value="gas">Natural Gas</MenuItem>
                          </Select>
                        </FormControl>
                        <FormControl sx={{ minWidth: 150 }}>
                          <InputLabel>Primary Process</InputLabel>
                          <Select
                            value={material.processSteps[0] || 'smelting'}
                            label="Primary Process"
                            onChange={(e) => updateMaterial(material.id, { processSteps: [e.target.value] })}
                          >
                            <MenuItem value="smelting">Smelting</MenuItem>
                            <MenuItem value="casting">Casting</MenuItem>
                            <MenuItem value="rolling">Rolling</MenuItem>
                            <MenuItem value="extrusion">Extrusion</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}

              <Divider sx={{ my: 3 }} />

              {/* Product Configuration */}
              <Typography variant="h6" gutterBottom>
                Product Configuration
              </Typography>
              <TextField
                label="Product Lifespan (years)"
                type="number"
                value={productLifespan}
                onChange={(e) => setProductLifespan(parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: 0.5 }}
                sx={{ width: 200, mb: 2 }}
              />

              <Divider sx={{ my: 3 }} />

              {/* End-of-Life Scenario */}
              <Typography variant="h6" gutterBottom>
                End-of-Life Scenario (%)
              </Typography>
              <Box display="flex" gap={2} mb={3}>
                <TextField
                  label="Reuse"
                  type="number"
                  value={eolScenario.reuse}
                  onChange={(e) => setEolScenario({...eolScenario, reuse: parseFloat(e.target.value) || 0})}
                  inputProps={{ min: 0, max: 100 }}
                  sx={{ width: 100 }}
                />
                <TextField
                  label="Recycle"
                  type="number"
                  value={eolScenario.recycle}
                  onChange={(e) => setEolScenario({...eolScenario, recycle: parseFloat(e.target.value) || 0})}
                  inputProps={{ min: 0, max: 100 }}
                  sx={{ width: 100 }}
                />
                <TextField
                  label="Disposal"
                  type="number"
                  value={eolScenario.disposal}
                  onChange={(e) => setEolScenario({...eolScenario, disposal: parseFloat(e.target.value) || 0})}
                  inputProps={{ min: 0, max: 100 }}
                  sx={{ width: 100 }}
                />
              </Box>

              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  startIcon={isAnalyzing ? <Science /> : <PlayArrow />}
                  onClick={runAnalysis}
                  disabled={isAnalyzing || materials.length === 0}
                  size="large"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Run LCA Analysis'}
                </Button>
                <IconButton onClick={() => setHelpOpen(true)}>
                  <Info />
                </IconButton>
              </Box>

              {isAnalyzing && (
                <Box mt={2}>
                  <LinearProgress />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Calculating environmental impacts and circularity metrics...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Results Panel */}
        <Box flex={1} sx={{ overflow: 'auto' }}>
          {results ? (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Analysis Results
                </Typography>

                {/* Overall Metrics */}
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.main', color: 'white' }}>
                  <Typography variant="h4" align="center">
                    Sustainability Grade: {results.circularityMetrics.grade}
                  </Typography>
                  <Typography variant="body2" align="center">
                    Circularity Index: {results.circularityMetrics.circularityIndex.toFixed(1)}%
                  </Typography>
                </Paper>

                {/* Environmental Impacts */}
                <Typography variant="h6" gutterBottom>
                  Total Environmental Impact
                </Typography>
                <Box display="flex" gap={1} mb={3} flexWrap="wrap">
                  <Paper sx={{ p: 2, textAlign: 'center', minWidth: 100 }}>
                    <Typography variant="h6" color="error">
                      {results.totalImpacts.carbon.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      kg CO₂-eq
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: 'center', minWidth: 100 }}>
                    <Typography variant="h6" color="warning.main">
                      {results.totalImpacts.energy.toFixed(1)}
                    </Typography>
                    <Typography variant="body2">
                      MJ
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: 'center', minWidth: 100 }}>
                    <Typography variant="h6" color="info.main">
                      {results.totalImpacts.water.toFixed(1)}
                    </Typography>
                    <Typography variant="body2">
                      L
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: 'center', minWidth: 100 }}>
                    <Typography variant="h6" color="text.secondary">
                      {(results.totalImpacts.depletion * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">
                      Depletion
                    </Typography>
                  </Paper>
                </Box>

                {/* Material Breakdown */}
                <Typography variant="h6" gutterBottom>
                  Material Breakdown
                </Typography>
                {results.materialResults.map((result: any, index: number) => (
                  <Paper key={index} sx={{ p: 2, mb: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {result.material.charAt(0).toUpperCase() + result.material.slice(1)} ({result.quantity} kg)
                    </Typography>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      <Typography variant="body2">CO₂: {result.carbon.toFixed(2)} kg</Typography>
                      <Typography variant="body2">Energy: {result.energy.toFixed(1)} MJ</Typography>
                      <Typography variant="body2">Water: {result.water.toFixed(1)} L</Typography>
                      <Typography variant="body2">Depletion: {(result.depletion * 100).toFixed(1)}%</Typography>
                    </Box>
                  </Paper>
                ))}

                {/* Circularity Metrics */}
                <Typography variant="h6" gutterBottom mt={2}>
                  Circularity Metrics
                </Typography>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body1">
                    Recycled Content: {results.circularityMetrics.recycledContent.toFixed(1)}%
                  </Typography>
                  <Typography variant="body1">
                    End-of-Life Recovery: {results.circularityMetrics.recoveryRate.toFixed(1)}%
                  </Typography>
                </Paper>

                {/* Recommendations */}
                <Typography variant="h6" gutterBottom>
                  Recommendations
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {results.recommendations.map((rec: string, index: number) => (
                      <li key={index}>
                        <Typography variant="body2">{rec}</Typography>
                      </li>
                    ))}
                  </ul>
                </Paper>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Box textAlign="center" py={4}>
                  <Calculate sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Configure materials and run analysis to see results
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

      {/* Help Dialog */}
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="md">
        <DialogTitle>LCA Analysis Tool Help</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            This tool helps you perform Life Cycle Assessment (LCA) analysis for metal products with multiple materials.
          </Typography>
          <Typography paragraph>
            <strong>Material Configuration:</strong> Add multiple materials and configure their sources, quantities, and processing parameters.
          </Typography>
          <Typography paragraph>
            <strong>Sources:</strong> Each material can have multiple sources (primary/recycled) with different percentages, transport modes, and distances.
          </Typography>
          <Typography paragraph>
            <strong>End-of-Life:</strong> Define how your product will be handled at the end of its life (reuse, recycle, disposal).
          </Typography>
          <Typography paragraph>
            The analysis calculates environmental impacts and circularity metrics, providing a sustainability grade and actionable recommendations.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LCAAnalysis;