import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  OfflineBolt,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { useQuery } from 'react-query';

import { api } from '../services/api';

function Dashboard() {
  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery(
    'dashboard-stats',
    () => api.get('/stats/dashboard?days=30').then(res => res.data),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Mock data for charts
  const verificationTrendData = [
    { date: '2025-01-01', authentic: 120, suspicious: 5, invalid: 3 },
    { date: '2025-01-02', authentic: 135, suspicious: 8, invalid: 2 },
    { date: '2025-01-03', authentic: 145, suspicious: 6, invalid: 4 },
    { date: '2025-01-04', authentic: 160, suspicious: 9, invalid: 1 },
    { date: '2025-01-05', authentic: 175, suspicious: 7, invalid: 3 },
    { date: '2025-01-06', authentic: 190, suspicious: 5, invalid: 2 },
    { date: '2025-01-07', authentic: 210, suspicious: 8, invalid: 4 },
  ];

  const verificationStatusData = [
    { name: 'Authentic', value: 1245, color: '#059669' },
    { name: 'Suspicious', value: 89, color: '#D97706' },
    { name: 'Invalid', value: 34, color: '#DC2626' },
    { name: 'Expired', value: 12, color: '#6B7280' },
  ];

  const topProductsData = [
    { name: 'Paracetamol 500mg', verifications: 245, confidence: 98.5 },
    { name: 'Ibuprofen 400mg', verifications: 198, confidence: 97.2 },
    { name: 'Aspirin 75mg', verifications: 156, confidence: 99.1 },
    { name: 'Amoxicillin 500mg', verifications: 134, confidence: 96.8 },
    { name: 'Metformin 500mg', verifications: 112, confidence: 98.9 },
  ];

  if (statsLoading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  const summary = stats?.data?.summary || {};

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of your pharmaceutical authentication system
        </Typography>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Total Verifications
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 600 }}>
                {summary.total_verifications || 1380}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                +12.5% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Authentic Products
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 600, color: 'success.main' }}>
                {summary.authentic_count || 1245}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {(((summary.authentic_count || 1245) / (summary.total_verifications || 1380)) * 100).toFixed(1)}% success rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Suspicious
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {summary.suspicious_count || 89}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Potential counterfeit detected
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <OfflineBolt sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Offline Verifications
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 600, color: 'info.main' }}>
                {summary.offline_count || 156}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Limited connectivity mode
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Verification Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                Verification Trend (Last 7 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={verificationTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="authentic" stroke="#059669" strokeWidth={2} />
                  <Line type="monotone" dataKey="suspicious" stroke="#D97706" strokeWidth={2} />
                  <Line type="monotone" dataKey="invalid" stroke="#DC2626" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Verification Status Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                Verification Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={verificationStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {verificationStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Products and Recent Activity */}
      <Grid container spacing={3}>
        {/* Top Products */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                Top Products by Verifications
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProductsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="verifications" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                Recent Activity
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { product: 'Paracetamol 500mg', status: 'authentic', time: '2 minutes ago' },
                  { product: 'Ibuprofen 400mg', status: 'suspicious', time: '5 minutes ago' },
                  { product: 'Aspirin 75mg', status: 'authentic', time: '8 minutes ago' },
                  { product: 'Amoxicillin 500mg', status: 'invalid', time: '12 minutes ago' },
                  { product: 'Metformin 500mg', status: 'authentic', time: '15 minutes ago' },
                ].map((activity, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderRadius: 1, backgroundColor: 'grey.50' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {activity.product}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.time}
                      </Typography>
                    </Box>
                    <Chip
                      label={activity.status}
                      size="small"
                      color={
                        activity.status === 'authentic' ? 'success' :
                        activity.status === 'suspicious' ? 'warning' : 'error'
                      }
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;