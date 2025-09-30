# RE-SOURCE - Lifecycle Assessment Platform

A comprehensive React-based LCA (Life Cycle Assessment) platform for analyzing material circularity and sustainability metrics.

## 🌱 Project Overview

RE-SOURCE is an advanced sustainability analytics platform that helps organizations assess the environmental impact and circularity potential of materials through comprehensive data visualization and analysis.

## 📁 Project Structure

```
SIH_25069/
├── .github/
│   └── copilot-instructions.md    # GitHub Copilot configuration
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx           # Main analytics dashboard with charts
│   │   ├── LCAAnalysis.tsx         # LCA calculation interface
│   │   ├── MaterialDatabase.tsx    # Enhanced material database with visualizations
│   │   ├── Reports.tsx             # Report generation component
│   │   └── Settings.tsx            # Application settings
│   ├── context/
│   │   └── AppContext.tsx          # React Context for state management
│   ├── styles/
│   │   └── scrolling.css           # Custom styling
│   ├── assets/
│   │   └── react.svg               # React logo
│   ├── App.tsx                     # Main application component
│   ├── App.css                     # Application styles
│   ├── main.tsx                    # Application entry point
│   └── index.css                   # Global styles
├── backend/
│   ├── app.py                      # Flask API server
│   └── requirements.txt            # Python dependencies
├── public/
│   └── vite.svg                    # Vite logo
├── package.json                    # Node.js dependencies
├── package-lock.json               # Locked dependency versions
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript configuration
├── index.html                      # HTML template
├── start_backend.bat               # Backend startup script
├── test-integration.js             # Integration tests
└── README.md                       # Project documentation
```

## 🚀 Features

### 📊 Enhanced Dashboard
- **Real-time Analytics**: Live charts showing circularity trends
- **Multiple Chart Types**: Line, Pie, Bar, and Area charts
- **Material Distribution**: Visual breakdown of material composition
- **Environmental Impact**: Sustainability scoring and metrics

### 🗃️ Advanced Material Database
- **Three-Tab Interface**: 
  - Material Data table
  - Property Analysis with scatter charts
  - Environmental Impact visualization
- **Interactive Charts**: Radar charts for property comparison
- **Filtering & Search**: Advanced material filtering capabilities

### 🔬 LCA Analysis
- **MCI Calculations**: Material Circularity Indicator scoring
- **Real-time Processing**: Flask backend with instant calculations
- **Data Integration**: Seamless frontend-backend communication

### 📈 Comprehensive Reporting
- **Export Capabilities**: Generate detailed sustainability reports
- **Visual Analytics**: Chart-based insights and trends
- **Professional UI**: Material-UI components with sustainability theme

## 🛠️ Technology Stack

### Frontend
- **React 18+** with TypeScript
- **Material-UI v5** for professional UI components
- **Recharts** for advanced data visualizations
- **Vite** for fast development and building
- **React Context API** for state management

### Backend
- **Python Flask** for API server
- **Environmental calculations** and MCI processing
- **CORS enabled** for cross-origin requests

## ⚡ Quick Start

### Prerequisites
- Node.js 16+
- Python 3.8+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/alibaba1709/SIH_25069.git
   cd SIH_25069
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Setup backend environment**
   ```bash
   cd backend
   python -m venv circularity_env
   circularity_env\Scripts\activate  # Windows
   # source circularity_env/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   # Option 1: Use the startup script
   start_backend.bat
   
   # Option 2: Manual startup
   cd backend
   circularity_env\Scripts\activate
   python app.py
   ```

2. **Start the frontend development server**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5174
   - Backend API: http://localhost:5000

## 🧪 Testing

Run integration tests:
```bash
node test-integration.js
```

## 📝 API Documentation

### Backend Endpoints
- `GET /` - Health check
- `POST /api/calculate` - Calculate MCI scores
- `GET /api/materials` - Get material database

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is part of the SIH 2025 competition.

## 🏆 SIH 2025 Project

**Team**: SIH_25069  
**Platform**: RE-SOURCE - Lifecycle Assessment Platform  
**Focus**: Sustainable material analysis and circularity assessment