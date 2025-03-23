import React, { useState, useEffect } from 'react';
import {
  Box,
  styled,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  CircularProgress,
  Alert,
  Menu,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { formatDate } from '../../utils/dateUtils';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const PageContainer = styled('div')({
  width: '100%',
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #37CAFB 0%, #217895 100%)',
  display: 'flex',
  justifyContent: 'center',
  padding: '2vh 0',
});

const ContentWrapper = styled('div')({
  width: '90%',
  maxWidth: '1200px',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '20px',
  padding: '2rem',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
});

const TopSection = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '2rem',
});

const HeaderSection = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
});

const StyledCard = styled(Card)({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
  },
});

const CardTitle = styled(Typography)({
  fontSize: '1.2rem',
  fontWeight: 600,
  marginBottom: '0.5rem',
});

const ImageContainer = styled('div')({
  width: '150px',
  height: '150px',
  borderRadius: '50%',
  overflow: 'hidden',
  marginBottom: '1rem',
});

interface Tender {
  id: string;
  title: string;
  description: string;
  budget: string;
  category: string;
  status: string;
  notice_date: string;
  submission_deadline: string;
}

const CityDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [filteredTenders, setFilteredTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tenderToDelete, setTenderToDelete] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth/city');
          return;
        }

        const response = await fetch('http://localhost:8000/api/tenders/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tenders');
        }

        const data = await response.json();
        setTenders(data);
        setFilteredTenders(data);
      } catch (error) {
        console.error('Error fetching tenders:', error);
        setError('Failed to load tenders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTenders();
  }, [navigate]);

  useEffect(() => {
    let result = tenders;

    // Apply status filter
    if (filter !== 'ALL') {
      result = result.filter(tender => tender.status === filter);
    }

    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(tender => 
        tender.title.toLowerCase().includes(term) || 
        tender.description.toLowerCase().includes(term)
      );
    }

    setFilteredTenders(result);
  }, [tenders, filter, searchTerm]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleNewTender = () => {
    navigate('/city/new-tender');
  };

  const handleViewDetails = (tenderId: string) => {
    navigate(`/city/tenders/${tenderId}`);
  };

  const handleDelete = (tenderId: string) => {
    setTenderToDelete(tenderId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!tenderToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth/city');
        return;
      }
      
      const response = await fetch(`http://localhost:8000/api/tenders/${tenderToDelete}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete tender');
      }
      
      // Update local state
      setTenders(prev => prev.filter(tender => tender.id !== tenderToDelete));
      
      setActionSuccess('Tender deleted successfully');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting tender:', error);
      setError('Failed to delete tender. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeleteDialogOpen(false);
      setTenderToDelete(null);
    }
  };

  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>, tenderId: string) => {
    setStatusAnchorEl(event.currentTarget);
    setSelectedTenderId(tenderId);
  };

  const handleStatusMenuClose = () => {
    setStatusAnchorEl(null);
    setSelectedTenderId(null);
  };

  const updateTenderStatus = async (status: string) => {
    if (!selectedTenderId) return;
    
    try {
      setStatusUpdateLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/api/tenders/${selectedTenderId}/update-status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tender status');
      }

      // Update the local state
      setTenders(prevTenders =>
        prevTenders.map(tender =>
          tender.id === selectedTenderId ? { ...tender, status } : tender
        )
      );

      setSnackbarMessage(`Tender status updated to ${status}`);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error updating tender status:', error);
      setSnackbarMessage('Failed to update tender status');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setStatusUpdateLoading(false);
      handleStatusMenuClose();
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentWrapper>
        <TopSection>
          <ImageContainer>
            <img
              src="/icon1.png"
              alt="City Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </ImageContainer>
          <Typography variant="h4" sx={{ color: '#217895', fontFamily: 'Outfit', fontWeight: 300 }}>
            City Administration Dashboard
          </Typography>
        </TopSection>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {actionSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {actionSuccess}
          </Alert>
        )}

        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent>
                <CardTitle variant="h6">Create New Tender</CardTitle>
                <Typography variant="body2" color="text.secondary">
                  Start a new tender process by creating a detailed tender notice.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  startIcon={<AddIcon />} 
                  variant="contained" 
                  color="primary"
                  onClick={handleNewTender}
                >
                  Create New Tender
                </Button>
              </CardActions>
            </StyledCard>
          </Grid>
        </Grid>

        <HeaderSection>
          <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 400 }}>
            Manage Tenders
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              select
              label="Filter by Status"
              value={filter}
              onChange={handleFilterChange}
              size="small"
              sx={{ minWidth: '150px' }}
            >
              <MenuItem value="ALL">All Tenders</MenuItem>
              <MenuItem value="OPEN">Open</MenuItem>
              <MenuItem value="CLOSED">Closed</MenuItem>
              <MenuItem value="AWARDED">Awarded</MenuItem>
            </TextField>
            <TextField
              label="Search"
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
              sx={{ minWidth: '200px' }}
            />
          </Box>
        </HeaderSection>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Budget</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Deadline</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTenders.map((tender) => (
                <TableRow key={tender.id}>
                  <TableCell>{tender.title}</TableCell>
                  <TableCell>€{tender.budget}</TableCell>
                  <TableCell>{tender.category}</TableCell>
                  <TableCell>{formatDate(tender.submission_deadline)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={tender.status} 
                      color={
                        tender.status === 'OPEN' ? 'success' : 
                        tender.status === 'AWARDED' ? 'primary' : 'default'
                      }
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewDetails(tender.id)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDelete(tender.id)}
                      >
                        Delete
                      </Button>
                      <IconButton
                        size="small"
                        onClick={(e) => handleStatusMenuOpen(e, tender.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTenders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No tenders found. Try changing your filters or create a new tender.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </ContentWrapper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this tender? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={statusAnchorEl}
        open={Boolean(statusAnchorEl)}
        onClose={handleStatusMenuClose}
      >
        <MenuItem 
          onClick={() => updateTenderStatus('OPEN')}
          disabled={statusUpdateLoading}
        >
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Mark as Open</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => updateTenderStatus('CLOSED')}
          disabled={statusUpdateLoading}
        >
          <ListItemIcon>
            <BlockIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Mark as Closed</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => updateTenderStatus('AWARDED')}
          disabled={statusUpdateLoading}
        >
          <ListItemIcon>
            <EmojiEventsIcon fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>Mark as Awarded</ListItemText>
        </MenuItem>
      </Menu>
    </PageContainer>
  );
};

export default CityDashboard; 