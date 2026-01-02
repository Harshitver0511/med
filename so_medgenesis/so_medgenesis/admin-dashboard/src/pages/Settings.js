import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const Settings = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography>Settings page - Under construction</Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Settings;