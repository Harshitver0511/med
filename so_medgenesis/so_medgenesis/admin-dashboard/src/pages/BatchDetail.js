import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const BatchDetail = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Batch Detail
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography>Batch detail page - Under construction</Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default BatchDetail;