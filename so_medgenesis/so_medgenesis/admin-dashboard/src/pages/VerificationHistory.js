import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const VerificationHistory = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Verification History
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography>Verification history page - Under construction</Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default VerificationHistory;