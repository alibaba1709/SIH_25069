import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Divider,
  Alert,
} from '@mui/material';
import { Save, RestoreSharp } from '@mui/icons-material';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    // General Settings
    autoSave: true,
    notifications: true,
    darkMode: false,
    language: 'en',
    
    // Analysis Settings
    defaultUnit: 'metric',
    precision: 2,
    includeUncertainty: true,
    
    // Data Settings
    dataSource: 'ecoinvent',
    updateFrequency: 'weekly',
    cacheResults: true,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Save settings logic here
    console.log('Settings saved:', settings);
  };

  const handleReset = () => {
    // Reset to defaults
    setSettings({
      autoSave: true,
      notifications: true,
      darkMode: false,
      language: 'en',
      defaultUnit: 'metric',
      precision: 2,
      includeUncertainty: true,
      dataSource: 'ecoinvent',
      updateFrequency: 'weekly',
      cacheResults: true,
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {/* General Settings */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            General Settings
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoSave}
                  onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                />
              }
              label="Auto-save projects"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                />
              }
              label="Enable notifications"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.darkMode}
                  onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                />
              }
              label="Dark mode"
            />

            <FormControl sx={{ maxWidth: 200 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Analysis Settings */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Analysis Settings
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl sx={{ maxWidth: 200 }}>
              <InputLabel>Default Unit System</InputLabel>
              <Select
                value={settings.defaultUnit}
                onChange={(e) => handleSettingChange('defaultUnit', e.target.value)}
              >
                <MenuItem value="metric">Metric</MenuItem>
                <MenuItem value="imperial">Imperial</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Calculation Precision (decimal places)"
              type="number"
              value={settings.precision}
              onChange={(e) => handleSettingChange('precision', parseInt(e.target.value))}
              sx={{ maxWidth: 200 }}
              inputProps={{ min: 0, max: 10 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.includeUncertainty}
                  onChange={(e) => handleSettingChange('includeUncertainty', e.target.checked)}
                />
              }
              label="Include uncertainty analysis"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Data Settings */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Data Settings
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl sx={{ maxWidth: 200 }}>
              <InputLabel>Primary Data Source</InputLabel>
              <Select
                value={settings.dataSource}
                onChange={(e) => handleSettingChange('dataSource', e.target.value)}
              >
                <MenuItem value="ecoinvent">Ecoinvent</MenuItem>
                <MenuItem value="gabi">GaBi</MenuItem>
                <MenuItem value="idemat">IDEMAT</MenuItem>
                <MenuItem value="custom">Custom Database</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ maxWidth: 200 }}>
              <InputLabel>Update Frequency</InputLabel>
              <Select
                value={settings.updateFrequency}
                onChange={(e) => handleSettingChange('updateFrequency', e.target.value)}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="manual">Manual</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.cacheResults}
                  onChange={(e) => handleSettingChange('cacheResults', e.target.checked)}
                />
              }
              label="Cache calculation results"
            />
          </Box>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            About RE-SOURCE
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            Version 1.0.0
          </Typography>
          
          <Typography variant="body2" paragraph>
            RE-SOURCE is a comprehensive lifecycle assessment platform designed 
            for metal recycling and circular economy analysis. It provides advanced 
            tools for environmental impact assessment, sustainability scoring, and 
            optimization recommendations.
          </Typography>

          <Alert severity="info">
            For technical support or feature requests, please contact our development team.
          </Alert>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
        >
          Save Settings
        </Button>
        <Button
          variant="outlined"
          startIcon={<RestoreSharp />}
          onClick={handleReset}
        >
          Reset to Defaults
        </Button>
      </Box>
    </Box>
  );
};

export default Settings;
