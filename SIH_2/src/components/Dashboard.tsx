import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  Paper,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  Refresh,
  Timeline,
  Recycling,
  Nature,
  TrendingDown,
  BarChart,
  PieChart,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  Area,
  AreaChart,
} from 'recharts';
import { useAppContext } from '../context/AppContext';

const Dashboard: React.FC = () => {
  const { currentAnalysis, analysisHistory, materials, reports } = useAppContext();

  const totalAnalyses = analysisHistory.length;
  const avgCircularityIndex = analysisHistory.length > 0
    ? analysisHistory.reduce((sum, analysis) => sum + analysis.circularityMetrics.circularityIndex, 0) / analysisHistory.length
    : 0;
  
  const avgCarbonReduction = analysisHistory.length > 0
    ? analysisHistory.reduce((sum, analysis) => sum + analysis.totalImpacts.carbon, 0) / analysisHistory.length
    : 0;

  const completedReports = reports.filter(r => r.status === 'Completed').length;
  const avgSustainabilityScore = reports.length > 0
    ? reports.reduce((sum, report) => sum + report.score, 0) / reports.length
    : 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Sustainability Dashboard
        </Typography>
        <IconButton color="primary">
          <Refresh />
        </IconButton>
      </Box>

      {currentAnalysis && (
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
          <Typography variant="h6" gutterBottom>
            Current Analysis: {currentAnalysis.projectName || 'Active Project'}
          </Typography>
          <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
            <Box textAlign="center">
              <Typography variant="h3" color="primary">
                {currentAnalysis.circularityMetrics.circularityIndex.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Circularity Index
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      <Box display="flex" gap={2} mb={4} flexWrap="wrap">
        <Box flex="1" minWidth="250px">
          <Card elevation={3}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Analyses
              </Typography>
              <Typography variant="h4">{totalAnalyses}</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box flex="1" minWidth="250px">
          <Card elevation={3}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Avg Circularity Index
              </Typography>
              <Typography variant="h4">{avgCircularityIndex.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box flex="1" minWidth="250px">
          <Card elevation={3}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Carbon Impact
              </Typography>
              <Typography variant="h4">{avgCarbonReduction.toFixed(1)} kg CO</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box flex="1" minWidth="250px">
          <Card elevation={3}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Sustainability Score
              </Typography>
              <Typography variant="h4">{avgSustainabilityScore.toFixed(1)}/10</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Analytics Charts Section */}
      <Box display="flex" gap={3} mb={4} flexWrap="wrap">
        {/* Circularity Index Trend Chart */}
        <Box flex="1" minWidth="500px">
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUp sx={{ mr: 1 }} />
                <Typography variant="h6">Circularity Index Trend</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analysisHistory.map((analysis, index) => ({
                  name: `Analysis ${index + 1}`,
                  mci: analysis.circularityMetrics.circularityIndex,
                  recycledContent: analysis.circularityMetrics.recycledContent,
                  recoveryRate: analysis.circularityMetrics.recoveryRate,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="mci" stroke="#1976d2" strokeWidth={3} name="MCI Score %" />
                  <Line type="monotone" dataKey="recycledContent" stroke="#4caf50" strokeWidth={2} name="Recycled Content %" />
                  <Line type="monotone" dataKey="recoveryRate" stroke="#ff9800" strokeWidth={2} name="Recovery Rate %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Material Distribution Chart */}
        <Box flex="1" minWidth="400px">
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <PieChart sx={{ mr: 1 }} />
                <Typography variant="h6">Material Distribution</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={(() => {
                      const materialCounts: Record<string, number> = {};
                      analysisHistory.forEach(analysis => {
                        analysis.materialResults.forEach(result => {
                          materialCounts[result.material] = (materialCounts[result.material] || 0) + 1;
                        });
                      });
                      return Object.entries(materialCounts).map(([material, count]) => ({
                        name: material,
                        value: count,
                      }));
                    })()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(() => {
                      const materialCounts: Record<string, number> = {};
                      analysisHistory.forEach(analysis => {
                        analysis.materialResults.forEach(result => {
                          materialCounts[result.material] = (materialCounts[result.material] || 0) + 1;
                        });
                      });
                      const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
                      return Object.entries(materialCounts).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ));
                    })()}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Environmental Impact Charts */}
      <Box display="flex" gap={3} mb={4} flexWrap="wrap">
        {/* Carbon Impact Bar Chart */}
        <Box flex="1" minWidth="500px">
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Nature sx={{ mr: 1 }} />
                <Typography variant="h6">Environmental Impact Analysis</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={analysisHistory.slice(-5).map((analysis, index) => ({
                  name: `Analysis ${analysisHistory.length - 4 + index}`,
                  carbon: analysis.totalImpacts.carbon,
                  energy: analysis.totalImpacts.energy,
                  water: analysis.totalImpacts.water,
                  depletion: analysis.totalImpacts.depletion,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="carbon" fill="#f44336" name="Carbon (kg CO₂)" />
                  <Bar dataKey="energy" fill="#ff9800" name="Energy (MJ)" />
                  <Bar dataKey="water" fill="#2196f3" name="Water (L)" />
                  <Bar dataKey="depletion" fill="#9c27b0" name="Depletion (kg Sb eq)" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Sustainability Score Area Chart */}
        <Box flex="1" minWidth="400px">
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Assessment sx={{ mr: 1 }} />
                <Typography variant="h6">Sustainability Score Trend</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reports.map((report, index) => ({
                  name: `Report ${index + 1}`,
                  score: report.score,
                  target: 8, // Target sustainability score
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="score" stroke="#4caf50" fill="#4caf50" fillOpacity={0.6} name="Actual Score" />
                  <Line type="monotone" dataKey="target" stroke="#ff5722" strokeDasharray="5 5" name="Target Score" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box display="flex" gap={3} flexWrap="wrap">
        <Box flex="1" minWidth="400px">
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Analyses
              </Typography>
              {analysisHistory.length > 0 ? (
                <List>
                  {analysisHistory.slice(0, 5).map((analysis, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <Timeline />
                        </Avatar>
                        <ListItemText
                          primary={analysis.projectName || 'Analysis ' + (index + 1)}
                          secondary={'MCI: ' + analysis.circularityMetrics.circularityIndex.toFixed(1) + '%  ' + analysis.materialResults.length + ' materials'}
                        />
                        <Chip
                          label={analysis.circularityMetrics.grade}
                          size="small"
                          color={analysis.circularityMetrics.grade === 'A' ? 'success' : analysis.circularityMetrics.grade === 'B' ? 'warning' : 'error'}
                        />
                      </ListItem>
                      {index < Math.min(analysisHistory.length - 1, 4) && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary" textAlign="center" py={3}>
                  No analyses yet. Start your first LCA analysis!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box flex="1" minWidth="400px">
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Overview
              </Typography>
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Material Database</Typography>
                  <Typography variant="body2">{materials.length} materials</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((materials.length / 10) * 100, 100)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Completed Reports</Typography>
                  <Typography variant="body2">{completedReports}/{reports.length}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={reports.length > 0 ? (completedReports / reports.length) * 100 : 0}
                  sx={{ height: 8, borderRadius: 4 }}
                  color="success"
                />
              </Box>

              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Average MCI Score</Typography>
                  <Typography variant="body2">{avgCircularityIndex.toFixed(1)}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={avgCircularityIndex}
                  sx={{ height: 8, borderRadius: 4 }}
                  color="warning"
                />
              </Box>

              {currentAnalysis && currentAnalysis.recommendations.length > 0 && (
                <Box>
                  <Typography variant="body2" fontWeight="bold" mb={1}>
                    Current Recommendations:
                  </Typography>
                  {currentAnalysis.recommendations.slice(0, 3).map((rec, index) => (
                    <Typography key={index} variant="body2" color="textSecondary" mb={0.5}>
                       {rec}
                    </Typography>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
