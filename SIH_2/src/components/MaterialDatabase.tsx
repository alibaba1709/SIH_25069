import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  Tab,
  Tabs,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Edit, Delete, BarChart, Timeline, Assessment } from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';

// Context
import { useAppContext } from '../context/AppContext';

interface Material {
  id: number;
  name: string;
  category: string;
  density: number;
  recyclability: number;
  energyIntensity: number;
  co2Factor: number;
}

const MaterialDatabase: React.FC = () => {
  const { materials, addMaterial } = useAppContext();
  const [currentTab, setCurrentTab] = useState(0);
  
  // Convert context materials to component format
  const materialsList = materials.map((material, index) => ({
    id: index + 1,
    name: material.name,
    category: material.category,
    density: material.properties.density,
    recyclability: material.properties.recyclability * 100,
    energyIntensity: material.properties.energyIntensity,
    co2Factor: material.properties.carbonFootprint,
  }));

  // Enhanced material data with additional properties for better analysis
  const enhancedMaterials = materialsList.length > 0 ? materialsList : [
    {
      id: 1,
      name: 'Aluminium',
      category: 'Non-ferrous',
      density: 2.70,
      recyclability: 95,
      energyIntensity: 150,
      co2Factor: 8.24,
      conductivity: 37,
      strength: 310,
      cost: 2.5,
      availability: 85,
    },
    {
      id: 2,
      name: 'Steel',
      category: 'Ferrous',
      density: 7.85,
      recyclability: 85,
      energyIntensity: 25,
      co2Factor: 2.29,
      conductivity: 10,
      strength: 400,
      cost: 0.8,
      availability: 95,
    },
    {
      id: 3,
      name: 'Copper',
      category: 'Non-ferrous',
      density: 8.96,
      recyclability: 90,
      energyIntensity: 42,
      co2Factor: 3.84,
      conductivity: 59,
      strength: 220,
      cost: 8.5,
      availability: 70,
    },
    {
      id: 4,
      name: 'Titanium',
      category: 'Non-ferrous',
      density: 4.51,
      recyclability: 75,
      energyIntensity: 286,
      co2Factor: 35.2,
      conductivity: 2,
      strength: 900,
      cost: 30,
      availability: 40,
    },
    {
      id: 5,
      name: 'Plastic (PET)',
      category: 'Polymer',
      density: 1.38,
      recyclability: 60,
      energyIntensity: 84,
      co2Factor: 2.9,
      conductivity: 0,
      strength: 55,
      cost: 1.5,
      availability: 90,
    },
    {
      id: 6,
      name: 'Carbon Fiber',
      category: 'Composite',
      density: 1.60,
      recyclability: 30,
      energyIntensity: 183,
      co2Factor: 26.5,
      conductivity: 0,
      strength: 4000,
      cost: 150,
      availability: 30,
    },
  ];

  const [open, setOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setOpen(true);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingMaterial(null);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Ferrous':
        return 'primary';
      case 'Non-ferrous':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Material Database & Analytics
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddMaterial}
        >
          Add Material
        </Button>
      </Box>

      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(_, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Material Database" icon={<Timeline />} />
          <Tab label="Property Analysis" icon={<BarChart />} />
          <Tab label="Environmental Impact" icon={<Assessment />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {currentTab === 0 && (
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Material Properties & Environmental Data
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Material</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Density (g/cm³)</TableCell>
                    <TableCell>Recyclability (%)</TableCell>
                    <TableCell>Energy Intensity (MJ/kg)</TableCell>
                    <TableCell>CO₂ Factor (kg/kg)</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {enhancedMaterials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {material.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={material.category}
                          color={getCategoryColor(material.category) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{material.density}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {material.recyclability}%
                          <Box
                            ml={1}
                            width={40}
                            height={4}
                            bgcolor={material.recyclability > 80 ? 'success.main' : 'warning.main'}
                            borderRadius={2}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{material.energyIntensity}</TableCell>
                      <TableCell>{material.co2Factor}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => handleEditMaterial(material)}
                          startIcon={<Edit />}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Delete />}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Property Analysis Tab */}
      {currentTab === 1 && (
        <Box>
          <Box display="flex" gap={3} flexWrap="wrap">
            {/* Recyclability vs Energy Intensity Scatter Chart */}
            <Box flex="1" minWidth="500px">
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recyclability vs Energy Intensity
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={enhancedMaterials}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="energyIntensity" name="Energy Intensity" unit=" MJ/kg" />
                      <YAxis dataKey="recyclability" name="Recyclability" unit="%" />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle2">{data.name}</Typography>
                                <Typography variant="body2">Energy: {data.energyIntensity} MJ/kg</Typography>
                                <Typography variant="body2">Recyclability: {data.recyclability}%</Typography>
                              </Paper>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter name="Materials" dataKey="recyclability" fill="#8884d8" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            {/* Material Properties Radar Chart */}
            <Box flex="1" minWidth="400px">
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Material Properties Comparison
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={enhancedMaterials.slice(0, 4).map(material => ({
                      material: material.name,
                      recyclability: material.recyclability,
                      strength: ((material as any).strength || 0) / 10, // Normalize for radar
                      availability: (material as any).availability || 50,
                      costEfficiency: 100 - ((material as any).cost || 10), // Inverse cost for positive display
                    }))}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="material" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="Properties" dataKey="recyclability" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Density Comparison Bar Chart */}
          <Box mt={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Material Density & CO₂ Factor Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={enhancedMaterials}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="density" fill="#8884d8" name="Density (g/cm³)" />
                    <Bar yAxisId="right" dataKey="co2Factor" fill="#82ca9d" name="CO₂ Factor (kg/kg)" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Environmental Impact Tab */}
      {currentTab === 2 && (
        <Box>
          <Box display="flex" gap={3} flexWrap="wrap">
            {/* Environmental Impact Summary */}
            <Box flex="1" minWidth="500px">
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Environmental Impact Score
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={enhancedMaterials.map(material => ({
                      name: material.name,
                      impact: (material.energyIntensity * 0.3 + material.co2Factor * 10 + (100 - material.recyclability)) / 3,
                      recyclability: material.recyclability,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="impact" stroke="#ff7300" strokeWidth={3} name="Environmental Impact Score" />
                      <Line type="monotone" dataKey="recyclability" stroke="#00ff00" strokeWidth={2} name="Recyclability %" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            {/* Sustainability Metrics */}
            <Box flex="1" minWidth="400px">
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sustainability Metrics
                  </Typography>
                  <Box>
                    {enhancedMaterials.slice(0, 4).map((material, index) => (
                      <Box key={index} mb={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          {material.name}
                        </Typography>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Typography variant="body2" sx={{ minWidth: 120 }}>
                            Recyclability:
                          </Typography>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <div style={{
                              width: '100%',
                              backgroundColor: '#e0e0e0',
                              borderRadius: '4px',
                              height: '8px',
                            }}>
                              <div style={{
                                width: `${material.recyclability}%`,
                                backgroundColor: material.recyclability > 80 ? '#4caf50' : material.recyclability > 60 ? '#ff9800' : '#f44336',
                                height: '100%',
                                borderRadius: '4px',
                              }} />
                            </div>
                          </Box>
                          <Typography variant="body2" sx={{ minWidth: 40 }}>
                            {material.recyclability}%
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <Typography variant="body2" sx={{ minWidth: 120 }}>
                            Energy Efficiency:
                          </Typography>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <div style={{
                              width: '100%',
                              backgroundColor: '#e0e0e0',
                              borderRadius: '4px',
                              height: '8px',
                            }}>
                              <div style={{
                                width: `${Math.max(0, 100 - (material.energyIntensity / 3))}%`,
                                backgroundColor: material.energyIntensity < 50 ? '#4caf50' : material.energyIntensity < 150 ? '#ff9800' : '#f44336',
                                height: '100%',
                                borderRadius: '4px',
                              }} />
                            </div>
                          </Box>
                          <Typography variant="body2" sx={{ minWidth: 40 }}>
                            {Math.round(Math.max(0, 100 - (material.energyIntensity / 3)))}%
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMaterial ? 'Edit Material' : 'Add New Material'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Material Name"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Category"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Density (g/cm³)"
            type="number"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Recyclability (%)"
            type="number"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Energy Intensity (MJ/kg)"
            type="number"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="CO₂ Factor (kg/kg)"
            type="number"
            fullWidth
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleClose}>
            {editingMaterial ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaterialDatabase;
