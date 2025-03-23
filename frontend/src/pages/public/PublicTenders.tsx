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
  Button,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

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

const SearchContainer = styled(Box)({
  display: 'flex',
  gap: '1rem',
  marginBottom: '2rem',
  alignItems: 'center',
  flexWrap: 'wrap',
});

const TopSection = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '2rem',
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
  budget: string;
  category: string;
  notice_date: string;
  submission_deadline: string;
  status: string;
  description: string;
  city: string;
  contact_email: string;
  requirements: string;
}

const CATEGORY_DISPLAY_NAMES: { [key: string]: string } = {
  'CONSTRUCTION': 'Construction',
  'INFRASTRUCTURE': 'Infrastructure',
  'SERVICES': 'Services',
  'TECHNOLOGY': 'Technology',
  'HEALTHCARE': 'Healthcare',
  'EDUCATION': 'Education',
  'TRANSPORTATION': 'Transportation',
  'ENVIRONMENT': 'Environment',
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const PublicTenders: React.FC = () => {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [filteredTenders, setFilteredTenders] = useState<Tender[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOnlyOpenTenders, setShowOnlyOpenTenders] = useState(true);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [categories] = useState<string[]>([
    'CONSTRUCTION',
    'INFRASTRUCTURE',
    'SERVICES',
    'TECHNOLOGY',
    'HEALTHCARE',
    'EDUCATION',
    'TRANSPORTATION',
    'ENVIRONMENT',
  ]);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      setLoading(true);
      
      // Public API endpoint - no auth required
      const response = await fetch('http://localhost:8000/api/tenders/public/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tenders');
      }

      const data = await response.json();
      setTenders(data);
    } catch (error) {
      console.error('Error fetching tenders:', error);
      setError('Failed to load tenders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (allTenders: Tender[], search: string, category: string, onlyOpen: boolean) => {
    let filtered = allTenders;
    
    // Filter by status if only open tenders should be shown
    if (onlyOpen) {
      filtered = filtered.filter(tender => tender.status === 'OPEN');
    }
    
    // Filter by category if selected
    if (category) {
      filtered = filtered.filter(tender => tender.category === category);
    }
    
    // Filter by search term
    if (search) {
      filtered = filtered.filter(tender =>
        tender.title.toLowerCase().includes(search.toLowerCase()) ||
        tender.id.toLowerCase().includes(search.toLowerCase()) ||
        tender.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setFilteredTenders(filtered);
  };

  useEffect(() => {
    applyFilters(tenders, searchTerm, selectedCategory, showOnlyOpenTenders);
  }, [searchTerm, selectedCategory, showOnlyOpenTenders, tenders]);

  const isDeadlinePassed = (deadline: string): boolean => {
    return new Date(deadline) < new Date();
  };

  const handleViewDetails = (tender: Tender) => {
    navigate(`/tenders/${tender.id}`);
  };

  const handleLogin = (userType: string) => {
    navigate(`/auth/${userType}`);
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
            Public Tenders
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => handleLogin('city')}
            >
              City Login
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => handleLogin('company')}
            >
              Company Login
            </Button>
          </Box>
        </TopSection>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <SearchContainer>
          <TextField
            placeholder="Search by title or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl sx={{ minWidth: '200px', flexGrow: 0.5 }}>
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

          <Button 
            variant="outlined" 
            startIcon={<FilterListIcon />}
            onClick={() => setShowOnlyOpenTenders(!showOnlyOpenTenders)}
            sx={{ 
              height: '56px',
              backgroundColor: showOnlyOpenTenders ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
              borderColor: showOnlyOpenTenders ? 'primary.main' : 'grey.400'
            }}
          >
            {showOnlyOpenTenders ? 'Showing Open Only' : 'Showing All Statuses'}
          </Button>
        </SearchContainer>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Budget (EUR)</TableCell>
                <TableCell>Deadline</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTenders.map((tender) => {
                const deadlinePassed = isDeadlinePassed(tender.submission_deadline);
                
                return (
                  <TableRow key={tender.id}>
                    <TableCell>{tender.id}</TableCell>
                    <TableCell>{tender.title}</TableCell>
                    <TableCell>{CATEGORY_DISPLAY_NAMES[tender.category] || tender.category}</TableCell>
                    <TableCell>€{tender.budget}</TableCell>
                    <TableCell>
                      {formatDate(tender.submission_deadline)}
                      {deadlinePassed && (
                        <Chip 
                          size="small" 
                          label="Passed" 
                          color="default" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={tender.status} 
                        color={
                          tender.status === 'OPEN' ? 'success' : 
                          tender.status === 'CLOSED' ? 'warning' : 
                          tender.status === 'AWARDED' ? 'info' : 'default'
                        } 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => handleViewDetails(tender)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredTenders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No tenders found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Tender Details Dialog */}
        <Dialog 
          open={detailsOpen} 
          onClose={() => setDetailsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedTender && (
            <>
              <DialogTitle>{selectedTender.title}</DialogTitle>
              <DialogContent>
                <Box sx={{ mb: 3 }}>
                  <Chip 
                    label={selectedTender.status} 
                    color={
                      selectedTender.status === 'OPEN' ? 'success' : 
                      selectedTender.status === 'CLOSED' ? 'warning' : 
                      selectedTender.status === 'AWARDED' ? 'info' : 'default'
                    } 
                    sx={{ mr: 1 }}
                  />
                  <Chip 
                    label={CATEGORY_DISPLAY_NAMES[selectedTender.category] || selectedTender.category} 
                    color="primary" 
                  />
                </Box>

                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Description</Typography>
                <Typography paragraph>{selectedTender.description}</Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Budget</Typography>
                    <Typography>€{selectedTender.budget}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>City</Typography>
                    <Typography>{selectedTender.city || 'Not specified'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Notice Date</Typography>
                    <Typography>{formatDate(selectedTender.notice_date)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Submission Deadline</Typography>
                    <Typography>{formatDate(selectedTender.submission_deadline)}</Typography>
                  </Box>
                </Box>

                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Requirements</Typography>
                <Typography paragraph>{selectedTender.requirements || 'No specific requirements provided.'}</Typography>

                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Contact</Typography>
                <Typography>{selectedTender.contact_email || 'No contact information provided.'}</Typography>

                <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    To submit a bid for this tender, please log in or register as a company.
                  </Typography>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDetailsOpen(false)}>Close</Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => handleLogin('company')}
                >
                  Login to Bid
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </ContentWrapper>
    </PageContainer>
  );
};

export default PublicTenders; 