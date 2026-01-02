import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  CircularProgress,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

import { apiService } from '../services/api';

function Batches() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openRevokeDialog, setOpenRevokeDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch batches
  const { data: batches, isLoading } = useQuery(
    ['batches', page, rowsPerPage, statusFilter],
    () => apiService.getBatches({
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    {
      keepPreviousData: true,
    }
  );

  // Create batch mutation
  const createBatchMutation = useMutation(
    (data) => apiService.createBatch(data),
    {
      onSuccess: () => {
        toast.success('Batch created successfully');
        queryClient.invalidateQueries('batches');
        setOpenCreateDialog(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create batch');
      },
    }
  );

  // Revoke batch mutation
  const revokeBatchMutation = useMutation(
    ({ batchId, reason }) => apiService.revokeBatch(batchId, reason),
    {
      onSuccess: () => {
        toast.success('Batch revoked successfully');
        queryClient.invalidateQueries('batches');
        setOpenRevokeDialog(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to revoke batch');
      },
    }
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreateBatch = (formData) => {
    createBatchMutation.mutate(formData);
  };

  const handleRevokeBatch = (reason) => {
    revokeBatchMutation.mutate({
      batchId: selectedBatch.batch_id,
      reason,
    });
  };

  const getStatusChip = (status) => {
    const statusColors = {
      active: 'success',
      revoked: 'error',
      expired: 'warning',
    };

    return (
      <Chip
        label={status.toUpperCase()}
        color={statusColors[status] || 'default'}
        size="small"
      />
    );
  };

  const batchList = batches?.data || [];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Batches
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your pharmaceutical batches and authentication codes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
          sx={{ py: 1.5, px: 3 }}
        >
          Create Batch
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="revoked">Revoked</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              {batchList.length} batches found
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Batches Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Batch ID</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Total Units</TableCell>
                <TableCell>Codes Generated</TableCell>
                <TableCell>Verified</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : batchList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No batches found
                  </TableCell>
                </TableRow>
              ) : (
                batchList.map((batch) => (
                  <TableRow key={batch.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {batch.batch_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{batch.product_name}</Typography>
                      {batch.product_code && (
                        <Typography variant="caption" color="text.secondary">
                          {batch.product_code}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{batch.total_units}</TableCell>
                    <TableCell>{batch.code_count || 0}</TableCell>
                    <TableCell>{batch.verified_count || 0}</TableCell>
                    <TableCell>{getStatusChip(batch.status)}</TableCell>
                    <TableCell>
                      {format(new Date(batch.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/batches/${batch.batch_id}`)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      {batch.status === 'active' && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedBatch(batch);
                            setOpenRevokeDialog(true);
                          }}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={batches?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Create Batch Dialog */}
      <CreateBatchDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        onSubmit={handleCreateBatch}
        loading={createBatchMutation.isLoading}
      />

      {/* Revoke Batch Dialog */}
      <RevokeBatchDialog
        open={openRevokeDialog}
        onClose={() => setOpenRevokeDialog(false)}
        onSubmit={handleRevokeBatch}
        batch={selectedBatch}
        loading={revokeBatchMutation.isLoading}
      />

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16, display: { md: 'none' } }}
        onClick={() => setOpenCreateDialog(true)}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}

// Create Batch Dialog Component
function CreateBatchDialog({ open, onClose, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    batch_id: '',
    product_name: '',
    product_code: '',
    strength: '',
    form: '',
    packaging: '',
    expiry_date: '',
    manufacturing_date: '',
    total_units: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      batch_id: '',
      product_name: '',
      product_code: '',
      strength: '',
      form: '',
      packaging: '',
      expiry_date: '',
      manufacturing_date: '',
      total_units: '',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Batch</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Batch ID"
                name="batch_id"
                value={formData.batch_id}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Product Name"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Code"
                name="product_code"
                value={formData.product_code}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Strength"
                name="strength"
                value={formData.strength}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Form"
                name="form"
                value={formData.form}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Packaging"
                name="packaging"
                value={formData.packaging}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                name="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={handleChange}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Manufacturing Date"
                name="manufacturing_date"
                type="date"
                value={formData.manufacturing_date}
                onChange={handleChange}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Total Units"
                name="total_units"
                type="number"
                value={formData.total_units}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Creating...' : 'Create Batch'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Revoke Batch Dialog Component
function RevokeBatchDialog({ open, onClose, onSubmit, batch, loading }) {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    onSubmit(reason);
    setReason('');
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Revoke Batch</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Are you sure you want to revoke batch <strong>{batch?.batch_id}</strong>?
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          This action will invalidate all authentication codes in this batch.
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Reason for revocation"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          margin="normal"
          placeholder="Enter reason for revoking this batch..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Revoking...' : 'Revoke Batch'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default Batches;