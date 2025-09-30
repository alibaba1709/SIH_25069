import React, { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import { Recycling } from '@mui/icons-material';

// Context
import { AppProvider } from './context/AppContext';

// Components
import Dashboard from './components/Dashboard';
import LCAAnalysis from './components/LCAAnalysis';
import MaterialDatabase from './components/MaterialDatabase';
import Reports from './components/Reports';
import Settings from './components/Settings';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Green for sustainability
    },
    secondary: {
      main: '#558b2f',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{
        height: '100%',
        display: value === index ? 'flex' : 'none',
        flexDirection: 'column'
      }}
      {...other}
    >
      {value === index && (
        <Box sx={{ 
          p: 2,
          height: '100%',
          overflow: 'auto',
          flex: 1
        }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <AppProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ 
          width: '100vw', 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          margin: 0,
          padding: 0,
          overflow: 'hidden'
        }}>
          <AppBar position="static" elevation={2} sx={{ flexShrink: 0 }}>
            <Toolbar>
              <Recycling sx={{ mr: 2 }} />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                RE-SOURCE - Lifecycle Assessment Platform
              </Typography>
            </Toolbar>
          </AppBar>

          <Paper elevation={1} sx={{ 
            width: '100%', 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            margin: 0,
            borderRadius: 0
          }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                flexShrink: 0
              }}
            >
              <Tab label="Dashboard" />
              <Tab label="LCA Analysis" />
              <Tab label="Material Database" />
              <Tab label="Reports" />
              <Tab label="Settings" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Dashboard />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <LCAAnalysis />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <MaterialDatabase />
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <Reports />
            </TabPanel>
            <TabPanel value={tabValue} index={4}>
              <Settings />
            </TabPanel>
          </Paper>
        </Box>
      </ThemeProvider>
    </AppProvider>
  );
}

export default App;
