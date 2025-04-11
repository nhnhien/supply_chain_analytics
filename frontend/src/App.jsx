
// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Các trang
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Forecast from './pages/Forecast';
import Reorder from './pages/Reorder';
import Upload from './pages/Upload';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analyze" element={<Analysis />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/reorder" element={<Reorder />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;