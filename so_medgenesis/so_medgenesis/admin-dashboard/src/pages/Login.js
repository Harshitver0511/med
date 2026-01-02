import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { Lock, MedicalServices } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      setError(error.message || 'An error occurred during login');
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 3,
          }}
        >
          <MedicalServices sx={{ m: 1, fontSize: 48, color: 'primary.main' }} />
          <Typography component="h1" variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            MEDGENESIS
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Admin Dashboard
          </Typography>
          
          <Box sx={{ mt: 3, width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 600 }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <>
                    <Lock sx={{ mr: 1 }} />
                    Sign In
                  </>
                )}
              </Button>
            </form>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link href="#" variant="body2">
                Forgot password?
              </Link>
            </Box>
            
            {/* Demo credentials */}
            <Box sx={{ mt: 4, p: 2, backgroundColor: 'grey.100', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Demo Credentials:
              </Typography>
              <Typography variant="caption" display="block">
                Email: admin@medgenesis.com
              </Typography>
              <Typography variant="caption" display="block">
                Password: admin123
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;