import React, { useState, useEffect } from 'react';
import {
  Box,
  styled,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatDate } from '../../utils/dateUtils';
import { deleteTender } from '../../utils/api';

const PageContainer = styled('div')({
  width: '100%',
  minHeight: '100vh',
  background: 'linear-gradient(180deg, rgb(55.89, 202.64, 251.55) 0%, rgb(33.22, 120.47, 149.55) 100%)',
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

const SearchContainer = styled(Box)({
  display: 'flex',
  gap: '1rem',
  marginBottom: '2rem',
  alignItems: 'center',
});

interface Tender {
  tender_id: string;
  title: string;
  description: string;
  budget: string;
  notice_date: string;
  close_date: string;
  winner_date: string;
  status: string;
  category: string;
  created_by: number;
}

const CATEGORY_DISPLAY_NAMES: { [key: string]: string } = {
  'CONSTRUCTION': 'Construction',
  'INFRASTRUCTURE': 'Infrastructure',
  'SERVICES': 'Services',
  'TECHNOLOGY': 'Technology',
  'HEALTHCARE': 'Healthcare',
  'EDUCATION': 'Education',
  'TRANSPORTATION': 'Transportation',
  'ENVIRONMENT': 'Environment'
};

const BrowseTender = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [filteredTenders, setFilteredTenders] = useState<Tender[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [userRole, setUserRole] = useState<string>('CITY'); // Default to CITY to enable delete
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedTenderId, setSelectedTenderId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [deleteSuccess, setDeleteSuccess] = useState<boolean>(false);
  const [categories] = useState<string[]>([
    'CONSTRUCTION',
    'INFRASTRUCTURE',
    'SERVICES',
    'TECHNOLOGY',
    'HEALTHCARE',
    'EDUCATION',
    'TRANSPORTATION',
    'ENVIRONMENT'
  ]);

  const fetchTenders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      console.log('Fetching tenders with token:', token?.substring(0, 10) + '...');
      
      const response = await fetch('http://localhost:8000/api/tenders/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      
      if (response.status === 401) {
        console.error('Authentication failed');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw API response:', JSON.stringify(data, null, 2));
        
        if (Array.isArray(data)) {
          const mappedData = data.map(item => ({
            tender_id: item.id.toString(),
            title: item.title || '',
            description: item.description || '',
            budget: item.budget || '0',
            notice_date: item.notice_date || '',
            close_date: item.submission_deadline || '',
            winner_date: item.winner_date || '',
            status: item.status || 'PENDING',
            category: item.category || 'General',
            created_by: item.created_by
          }));
          
          console.log('Mapped tender data:', mappedData);
          setTenders(mappedData);
          setFilteredTenders(mappedData);
        } else {
          console.error('Received data is not an array:', data);
        }
      } else {
        const errorData = await response.json();
        console.error('API error:', errorData);
      }
    } catch (error) {
      console.error('Error fetching tenders:', error);
    }
  };

  useEffect(() => {
    // Check if user is logged in and has token
    const token = localStorage.getItem('token');
    if (token) {
      // Get user type from local storage or decode from token
      // For now we'll force CITY to enable delete
      setUserRole('CITY');
    }
    
    fetchTenders();
  }, []);

  useEffect(() => {
    let filtered = tenders;
    
    if (selectedCategory) {
      filtered = filtered.filter(tender => tender.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(tender =>
        tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tender.tender_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTenders(filtered);
  }, [searchTerm, selectedCategory, tenders]);

  const handleDeleteClick = (tenderId: string) => {
    setSelectedTenderId(tenderId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:8000/api/tenders/${selectedTenderId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete tender');
      }

      // If deletion was successful, refresh the tender list
      await fetchTenders();
      setDeleteConfirmOpen(false);
      setSelectedTenderId('');
      
      // Show success message
      setDeleteSuccess(true);
    } catch (err) {
      console.error('Error deleting tender:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete tender');
    }
  };

  return (
    <PageContainer>
      <ContentWrapper>
        <Typography variant="h4" sx={{ mb: 4, color: '#000', fontFamily: 'Outfit', fontWeight: 300 }}>
          Browse Tenders ({filteredTenders.length})
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {deleteSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Tender successfully deleted.
          </Alert>
        )}

        <SearchContainer>
          <TextField
            placeholder="Search by title or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Filter by Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {CATEGORY_DISPLAY_NAMES[category]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </SearchContainer>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tender ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Notice Date</TableCell>
                <TableCell>Close Date</TableCell>
                <TableCell>Winner Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Category</TableCell>
                {userRole === 'CITY' && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTenders.map((tender) => (
                <TableRow key={tender.tender_id}>
                  <TableCell>{tender.tender_id}</TableCell>
                  <TableCell>{tender.title}</TableCell>
                  <TableCell>{formatDate(tender.notice_date)}</TableCell>
                  <TableCell>{formatDate(tender.close_date)}</TableCell>
                  <TableCell>{formatDate(tender.winner_date)}</TableCell>
                  <TableCell>{tender.status}</TableCell>
                  <TableCell>{CATEGORY_DISPLAY_NAMES[tender.category] || tender.category}</TableCell>
                  {userRole === 'CITY' && (
                    <TableCell>
                      <IconButton
                        onClick={() => handleDeleteClick(tender.tender_id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredTenders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={userRole === 'CITY' ? 8 : 7} align="center">
                    No tenders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this tender?</Typography>
            <Typography variant="caption" color="error">
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </ContentWrapper>
    </PageContainer>
  );
};

export default BrowseTender; 