import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Các trang
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Forecast from './pages/Forecast';
import Reorder from './pages/Reorder';
import Upload from './pages/Upload';

// ⚙️ Tạo client query
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<Analysis />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/reorder" element={<Reorder />} />
            <Route path="/upload" element={<Upload />} />
            {/* Redirect tất cả các đường dẫn không xác định về dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
