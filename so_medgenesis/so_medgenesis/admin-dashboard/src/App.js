import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Batches from './pages/Batches';
import BatchDetail from './pages/BatchDetail.js';
import VerificationHistory from './pages/VerificationHistory.js';
import Alerts from './pages/Alerts.js';
import Settings from './pages/Settings.js';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1E40AF',
    },
    secondary: {
      main: '#3B82F6',
    },
    background: {
      default: '#F8FAFC',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected route component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/batches" element={<Batches />} />
        <Route path="/batches/:batchId" element={<BatchDetail />} />
        <Route path="/verification-history" element={<VerificationHistory />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

// function App() {
//   return (
//     <ThemeProvider theme={theme}>
//       <CssBaseline />
//       <QueryClientProvider client={queryClient}>
//         <AuthProvider>
//           <Router>
//             <AppRoutes />
//             <ToastContainer
//               position="top-right"
//               autoClose={5000}
//               hideProgressBar={false}
//               newestOnTop={false}
//               closeOnClick
//               rtl={false}
//               pauseOnFocusLoss
//               draggable
//               pauseOnHover
//             />
//           </Router>
//         </AuthProvider>
//       </QueryClientProvider>
//     </ThemeProvider>
//   );
// }
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <AppRoutes />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
export default App;