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
  Container,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import { formatDate } from '../../utils/dateUtils';
import FilterListIcon from '@mui/icons-material/FilterList';
import SubmitBid from '../../components/SubmitBid';
import RefreshIcon from '@mui/icons-material/Refresh';

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
  id: number;
  title: string;
  budget: string;
  category: string;
  notice_date: string;
  submission_deadline: string;
  status: string;
  description: string;
  requirements?: string;
  winner_date?: string;
}

interface MyBid {
  tender_id: number;
  status: string;
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

const BrowseTenders: React.FC = () => {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [filteredTenders, setFilteredTenders] = useState<Tender[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myBids, setMyBids] = useState<MyBid[]>([]);
  const [showOnlyOpenTenders, setShowOnlyOpenTenders] = useState(false);
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [winningBid, setWinningBid] = useState<any>(null);
  const [loadingWinner, setLoadingWinner] = useState(false);

  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    fetchTenders();
    fetchMyBids();
  }, [navigate]);

  const fetchTenders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth/company');
        return;
      }

      console.log('Fetching tenders with token:', token.substring(0, 10) + '...');
      
      // Add cache busting parameter
      const cacheBuster = `?cacheBust=${new Date().getTime()}`;
      const apiUrl = `http://localhost:8000/api/tenders/${cacheBuster}`;
      
      console.log(`Making API request to: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-cache'
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error(`API request failed with status: ${response.status}`);
        
        try {
          const errorText = await response.text();
          console.error('Error response:', errorText);
        } catch (e) {
          console.error('Could not read error response');
        }
        
        // Try one more time after a delay
        console.log('Retrying after 1 second...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const retryResponse = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          },
          cache: 'no-cache'
        });
        
        if (retryResponse.ok) {
          const data = await retryResponse.json();
          console.log('Retry successful, received data:', data);
          setTenders(data);
          setLoading(false);
          return;
        } else {
          console.error(`Retry failed with status ${retryResponse.status}`);
          throw new Error(`Failed to fetch tenders: ${retryResponse.status}`);
        }
      }

      try {
        const data = await response.json();
        console.log('Received data:', data);
        setTenders(data);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        console.error('Response was:', await response.text());
        throw new Error('Invalid JSON response');
      }
    } catch (error) {
      console.error('Error fetching tenders:', error);
      setError('Failed to load tenders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBids = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth/company');
        return;
      }

      const response = await fetch('http://localhost:8000/api/bids/my_bids/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          // Create a map of tender_id to bid status
          const bidMap = data.map((bid: any) => ({
            tender_id: bid.tender_id,
            status: bid.status
          }));
          setMyBids(bidMap);
        }
      }
    } catch (error) {
      console.error('Error fetching my bids:', error);
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
        tender.id.toString().includes(search.toLowerCase()) ||
        tender.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setFilteredTenders(filtered);
  };

  useEffect(() => {
    applyFilters(tenders, searchTerm, selectedCategory, showOnlyOpenTenders);
  }, [searchTerm, selectedCategory, showOnlyOpenTenders, tenders]);

  const handleViewDetails = (tender: Tender) => {
    setSelectedTender(tender);
    setDetailsOpen(true);
    
    // If tender is awarded, fetch the winning bid details
    if (tender.status === 'AWARDED') {
      fetchWinningBid(tender.id.toString());
    }
  };

  const hasBidForTender = (tenderId: number): boolean => {
    return myBids.some(bid => bid.tender_id === tenderId);
  };

  const getBidStatusForTender = (tenderId: number): string | null => {
    const bid = myBids.find(bid => bid.tender_id === tenderId);
    return bid ? bid.status : null;
  };

  const isDeadlinePassed = (deadline: string): boolean => {
    return new Date(deadline) < new Date();
  };

  const viewTenderDetails = (tenderId: number) => {
    navigate(`/tenders/${tenderId}`);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setWinningBid(null);
    setSelectedTender(null);
  };

  // Function to fetch winning bid information
  const fetchWinningBid = async (tenderId: string) => {
    try {
      setLoadingWinner(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
      
      // Add cache busting parameter
      const cacheBuster = `?cacheBust=${new Date().getTime()}`;
      const response = await fetch(`http://localhost:8000/api/tenders/${tenderId}/bids/${cacheBuster}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        console.error('Failed to fetch bids');
        return;
      }
      
      const bidsData = await response.json();
      
      // Find the winning bid
      const winner = bidsData.find((bid: any) => bid.is_winner === true);
      
      if (winner) {
        console.log('Found winning bid:', winner);
        setWinningBid(winner);
      } else {
        console.log('No winning bid found among bids');
        setWinningBid(null);
      }
    } catch (error) {
      console.error('Error fetching winning bid:', error);
    } finally {
      setLoadingWinner(false);
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
              alt="Company Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </ImageContainer>
          <Typography variant="h4" sx={{ color: '#217895', fontFamily: 'Outfit', fontWeight: 300 }}>
            All Available Tenders
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => {
              console.log("Forcing refresh of tenders data");
              fetchTenders();
            }}
            startIcon={<RefreshIcon />}
            sx={{ mb: 2, mt: 2 }}
          >
            Refresh Data
          </Button>
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

          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/company')}
            sx={{ height: '56px' }}
          >
            Back to Dashboard
          </Button>
        </SearchContainer>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tender ID</TableCell>
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
                const hasSubmittedBid = hasBidForTender(tender.id);
                const bidStatus = getBidStatusForTender(tender.id);
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
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => viewTenderDetails(tender.id)}
                        >
                          View Details
                        </Button>
                        {!hasSubmittedBid && tender.status === 'OPEN' && !deadlinePassed && (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handleViewDetails(tender)}
                          >
                            Submit Bid
                          </Button>
                        )}
                        {hasSubmittedBid && (
                          <Chip 
                            label={`Bid ${bidStatus === 'ACCEPTED' ? 'Won!' : bidStatus === 'REJECTED' ? 'Lost' : 'Submitted'}`}
                            color={
                              bidStatus === 'ACCEPTED' ? 'success' : 
                              bidStatus === 'REJECTED' ? 'error' : 
                              'default'
                            }
                            variant="outlined"
                            size="small"
                            onClick={() => navigate('/company/my-bids')}
                            sx={{ cursor: 'pointer' }}
                          />
                        )}
                      </Box>
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

        <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
          <DialogTitle>Tender Details</DialogTitle>
          <DialogContent>
            {selectedTender && (
              <>
                <Typography variant="h6">{selectedTender.title}</Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Description: {selectedTender.description}
                </Typography>
                <Typography>Budget: €{selectedTender.budget}</Typography>
                <Typography>Category: {CATEGORY_DISPLAY_NAMES[selectedTender.category] || selectedTender.category}</Typography>
                <Typography>Status: {selectedTender.status}</Typography>
                <Typography>
                  Submission Deadline: {formatDate(selectedTender.submission_deadline)}
                </Typography>
                {selectedTender.requirements && (
                  <Typography>Requirements: {selectedTender.requirements}</Typography>
                )}
                
                {/* Display winning bid information if tender is awarded */}
                {selectedTender.status === 'AWARDED' && (
                  <Box sx={{ mt: 3, mb: 2, border: '1px solid #2196f3', borderRadius: 1, p: 2, bgcolor: 'rgba(33, 150, 243, 0.05)' }}>
                    <Typography variant="h6" color="primary">
                      Winning Bid Information
                    </Typography>
                    
                    {loadingWinner ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : winningBid ? (
                      <>
                        <Typography>
                          <strong>Company:</strong> {winningBid.company_name}
                        </Typography>
                        <Typography>
                          <strong>Bid Amount:</strong> €{winningBid.bidding_price}
                        </Typography>
                        <Typography>
                          <strong>Awarded Date:</strong> {winningBid.awarded_at || selectedTender.winner_date ? 
                            formatDate(winningBid.awarded_at || selectedTender.winner_date) : 
                            'Not available'}
                        </Typography>
                        {winningBid.company_profile && (
                          <Box sx={{ mt: 1 }}>
                            <Typography><strong>Company Details:</strong></Typography>
                            <Box sx={{ pl: 2 }}>
                              {winningBid.company_profile.contact_email && (
                                <Typography>
                                  <strong>Contact:</strong> {winningBid.company_profile.contact_email}
                                </Typography>
                              )}
                              {winningBid.company_profile.description && (
                                <Typography>
                                  <strong>Description:</strong> {winningBid.company_profile.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        )}
                      </>
                    ) : (
                      <Typography>Winner information not available.</Typography>
                    )}
                  </Box>
                )}
                
                {selectedTender.status === 'OPEN' && 
                 !isDeadlinePassed(selectedTender.submission_deadline) &&
                 !hasBidForTender(selectedTender.id) && (
                  <Box sx={{ mt: 2 }}>
                    <SubmitBid 
                      tenderId={selectedTender.id}
                      onBidSubmitted={() => {
                        handleCloseDetails();
                        fetchTenders(); // Refresh the tenders list after submission
                      }}
                    />
                  </Box>
                )}

                {hasBidForTender(selectedTender.id) && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    You have already submitted a bid for this tender.
                    {getBidStatusForTender(selectedTender.id) === 'ACCEPTED' && (
                      <Typography color="success.main">
                        Your bid has been ACCEPTED! Congratulations!
                      </Typography>
                    )}
                    {getBidStatusForTender(selectedTender.id) === 'REJECTED' && (
                      <Typography color="error">
                        Unfortunately, your bid has been rejected.
                      </Typography>
                    )}
                  </Alert>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetails}>Close</Button>
          </DialogActions>
        </Dialog>
      </ContentWrapper>
    </PageContainer>
  );
};

export default BrowseTenders; 