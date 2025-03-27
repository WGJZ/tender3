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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  SelectChangeEvent,
  Tabs,
  Tab,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
  winner_id?: string;
  winner_name?: string;
  winning_bid?: string;
  award_date?: string;
  winner_date?: string;
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

const CitizenView: React.FC = () => {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [filteredTenders, setFilteredTenders] = useState<Tender[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOnlyOpenTenders, setShowOnlyOpenTenders] = useState(false);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
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
  const [selectedTab, setSelectedTab] = useState(0);
  const [tenderHistory, setTenderHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get fresh data with cache buster to prevent stale data
      const cacheBuster = `?cacheBust=${new Date().getTime()}`;
      const response = await fetch(`http://localhost:8000/api/tenders/${cacheBuster}`);
      
      if (response.ok) {
        const data = await response.json();
        setTenders(data);
        setFilteredTenders(data);
        console.log(`Loaded ${data.length} tenders from API`);
      } else {
        console.error('Failed to fetch tenders:', response.status, response.statusText);
        setError('Failed to load tenders. Please try again later.');
        setTenders([]);
        setFilteredTenders([]);
      }
    } catch (error) {
      console.error('Error fetching tenders:', error);
      setError('Error connecting to server. Please check your connection and try again.');
      setTenders([]);
      setFilteredTenders([]);
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
        String(tender.id).toLowerCase().includes(search.toLowerCase()) || 
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

  const handleViewDetails = async (tender: any) => {
    try {
    console.log('Selected tender details:', tender);
    
      // set selected tender
      setSelectedTender(tender);
      
      if (tender.status === 'AWARDED') {
        // if tender has been awarded, try to get winner info
        await fetchWinnerInfo(Number(tender.id));
      } else {
        console.log('Tender is not awarded yet.');
      }
      
      // open details dialog
      setOpenDetailsDialog(true);
    } catch (error) {
      console.error('Error handling tender details:', error);
      setError('Failed to load tender details. Please try again.');
    }
  };

  // add a function to try to get winner info
  const fetchWinnerInfo = async (tenderId: number) => {
    try {
      // Use the public winner endpoint for citizen view
      const cacheBuster = `?cacheBust=${new Date().getTime()}`;
      const endpoint = `http://localhost:8000/api/tenders/${tenderId}/winner${cacheBuster}`;
      
      console.log(`Fetching winner info from ${endpoint}`);
      
      const headers: HeadersInit = {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      };
      
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(endpoint, { headers });
      
      if (response.ok) {
        const winnerData = await response.json();
        console.log('Fetched winner info:', winnerData);
        
        // Check each property that might contain winner information
        if (winnerData) {
          // Update the selectedTender with winner information
          setSelectedTender(prevTender => {
            if (!prevTender) return prevTender;
            
            // Get contact email from company data if available
            const contactEmail = winnerData.company_email || winnerData.contact_email || winnerData.email;
            
            return {
              ...prevTender,
              winner_name: winnerData.company_name || 'Unknown',
              winning_bid: winnerData.bidding_price ? winnerData.bidding_price.toString() : '0',
              award_date: winnerData.awarded_at || new Date().toISOString(),
              contact_email: contactEmail // Add contact email from winning company
            };
          });
        } else {
          console.log('No winner data returned from API');
        }
      } else {
        console.error(`Failed to fetch winner info: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching winner info:', error);
    }
  };

  // Function to fetch winner info from bids if direct winner info fails
  const fetchWinnerInfoFromBids = async (tenderId: number) => {
    // This implementation can be removed or simplified as needed
  };

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setSelectedCategory(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleLogin = (userType: string) => {
    navigate(`/auth/${userType}`);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    
    // If the history tab is selected and we haven't loaded history yet, fetch it
    if (newValue === 1 && selectedTender && tenderHistory.length === 0) {
      fetchTenderHistory(Number(selectedTender.id));
    }
  };
  
  // Function to fetch tender history from the API
  const fetchTenderHistory = async (tenderId: number) => {
    try {
      setLoadingHistory(true);
      const cacheBuster = `?cacheBust=${new Date().getTime()}`;
      const endpoint = `http://localhost:8000/api/tenders/${tenderId}/history/${cacheBuster}`;
      
      console.log(`Fetching tender history from ${endpoint}`);
      
      const headers: HeadersInit = {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      };
      
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(endpoint, { headers });
      
      if (response.ok) {
        const historyData = await response.json();
        console.log('Fetched tender history:', historyData);
        
        // Sort history by date (newest first)
        const sortedHistory = historyData.sort((a: any, b: any) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        
        setTenderHistory(sortedHistory);
      } else {
        console.log(`Could not fetch tender history: ${response.status} ${response.statusText}`);
        // No fallback to sample data anymore
        setTenderHistory([]);
      }
    } catch (error) {
      console.error('Error fetching tender history:', error);
      // No fallback to sample data anymore
      setTenderHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Helper function to format field changes for display
  const formatFieldChange = (historyItem: any) => {
    const { field_name, old_value, new_value, action } = historyItem;
    
    if (action === "CREATE") {
      return "Tender was created";
    }

    if (!field_name) {
      return "Tender was updated";
    }

    // Format specific field changes nicely
    switch (field_name) {
      case "status":
        return `Status changed from "${old_value || 'none'}" to "${new_value}"`;
      case "winner_id":
        return `Winner was selected (ID: ${new_value})`;
      case "budget":
        return `Budget changed from ${old_value || 'not set'} to ${new_value}`;
      case "description":
        return `Description was updated`;
      case "requirements":
        return `Requirements were updated`;
      case "title":
        return `Title changed from "${old_value || 'none'}" to "${new_value}"`;
      case "submission_deadline":
        return `Submission deadline changed from ${formatDate(old_value) || 'not set'} to ${formatDate(new_value)}`;
      case "notice_date":
        return `Notice date changed from ${formatDate(old_value) || 'not set'} to ${formatDate(new_value)}`;
      case "winner_date":
        return `Winner announcement date changed from ${formatDate(old_value) || 'not set'} to ${formatDate(new_value)}`;
      case "construction_start":
        return `Construction start date changed from ${formatDate(old_value) || 'not set'} to ${formatDate(new_value)}`;
      case "construction_end":
        return `Construction end date changed from ${formatDate(old_value) || 'not set'} to ${formatDate(new_value)}`;
      default:
        const fieldLabel = field_name.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        return `${fieldLabel} changed from "${old_value || 'none'}" to "${new_value}"`;
    }
  };

  // Add a component to display award information more attractively
  interface AwardedInfoProps {
    tender: {
      id: number | string;
      status: string;
    };
  }

  interface WinnerInfo {
    winning_price: number;
    award_date: string;
    winner?: string;
    company_name?: string;
    contact_email?: string;
    phone?: string;
    address?: string;
    registration_number?: string;
    description?: string;
  }

  const AwardedInfo: React.FC<AwardedInfoProps> = ({ tender }) => {
    const [winnerInfo, setWinnerInfo] = useState<WinnerInfo | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const fetchWinnerInfo = async () => {
        if (tender.status !== 'AWARDED') return;
        
        try {
          setLoading(true);
          const response = await fetch(`http://localhost:8000/api/tenders/${tender.id}/winner/`);
          if (response.ok) {
            const data = await response.json();
            console.log("Winner data:", data);
            setWinnerInfo(data);
          }
        } catch (error) {
          console.error("Error fetching winner info:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchWinnerInfo();
    }, [tender.id, tender.status]);

    if (loading) {
      return <CircularProgress size={20} />;
    }

    if (!winnerInfo) {
      return null;
    }

    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mt: 2, 
          bgcolor: '#4caf50', 
          color: 'white',
          borderRadius: 2
        }}
      >
        <Typography variant="h6" gutterBottom>
          Awarded Information
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Winning Company</Typography>
            <Typography variant="body1">{winnerInfo.company_name || winnerInfo.winner}</Typography>
            
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2">Contact Email</Typography>
              <Typography variant="body2">{winnerInfo.contact_email}</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Winning Bid</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              €{winnerInfo.winning_price?.toLocaleString()}
            </Typography>
            
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2">Award Date</Typography>
              <Typography variant="body2">{formatDate(winnerInfo.award_date)}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
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
            Browse Tenders
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
            onChange={handleSearchChange}
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
              onChange={handleCategoryChange}
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
                <TableCell>Winner Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Details</TableCell>
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
                      {tender.winner_date ? formatDate(tender.winner_date) : "Not specified"}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={tender.status} 
                        color={
                          tender.status === 'OPEN' ? 'primary' : 
                          tender.status === 'AWARDED' ? 'success' : 'default'
                        } 
                        size="small" 
                      />
                      {tender.status === 'AWARDED' && tender.winner_name && tender.winner_name.trim() !== '' && (
                        <Chip 
                          label="Winner Selected" 
                          color="success" 
                          size="small" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleViewDetails(tender)}
                        size="small"
                      >
                        <InfoIcon />
                      </IconButton>
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
          open={openDetailsDialog} 
          onClose={() => {
            setOpenDetailsDialog(false);
            setSelectedTab(0); // Reset to first tab when closing
            setTenderHistory([]); // Clear history when closing
          }}
          maxWidth="md"
          fullWidth
          // Force refresh winner info when dialog opens
          TransitionProps={{
            onEnter: () => {
              if (selectedTender && selectedTender.status === 'AWARDED') {
                console.log('Dialog opened for awarded tender - refreshing winner info');
                fetchWinnerInfo(Number(selectedTender.id));
              }
            }
          }}
        >
          {selectedTender && (
            <>
              <DialogTitle>
                <Typography variant="h5" component="div">{selectedTender.title}</Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Chip 
                    label={selectedTender.status} 
                    color={
                      selectedTender.status === 'OPEN' ? 'primary' : 
                      selectedTender.status === 'AWARDED' ? 'success' : 'default'
                    } 
                    size="small"
                  />
                  <Chip 
                    label={CATEGORY_DISPLAY_NAMES[selectedTender.category] || selectedTender.category} 
                    color="primary" 
                    size="small"
                  />
                </Box>
              </DialogTitle>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                <Tabs value={selectedTab} onChange={handleTabChange} aria-label="tender details tabs">
                  <Tab label="Details" />
                  <Tab label="History" />
                </Tabs>
              </Box>
              <DialogContent dividers>
                {selectedTab === 0 ? (
                <Grid container spacing={3}>
                    {/* Existing detail content */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Description</Typography>
                    <Typography paragraph>{selectedTender.description}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Budget</Typography>
                    <Typography>€{selectedTender.budget}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>City</Typography>
                    <Typography>{selectedTender.city || 'Not specified'}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Notice Date</Typography>
                    <Typography>{formatDate(selectedTender.notice_date)}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Submission Deadline</Typography>
                    <Typography>
                      {formatDate(selectedTender.submission_deadline)}
                      {isDeadlinePassed(selectedTender.submission_deadline) && (
                        <Chip 
                          size="small" 
                          label="Passed" 
                          color="default" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Requirements</Typography>
                    <Typography>{selectedTender.requirements || 'No specific requirements provided.'}</Typography>
                  </Grid>
                  
                    {/* Display awarded information for awarded tenders */}
                  {selectedTender.status === 'AWARDED' && (
                    <AwardedInfo tender={selectedTender} />
                  )}

                    {/* Public notice */}
                    <Grid item xs={12}>
                <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTender.status === 'OPEN' ? 
                      'This is a public view. The tender is currently open for bids.' : 
                      selectedTender.status === 'AWARDED' ?
                      'This tender has been awarded. The winning bid is displayed above.' :
                      'This tender is no longer accepting bids.'}
                  </Typography>
                </Box>
                    </Grid>
                  </Grid>
                ) : (
                  // History tab content
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">Tender Change History</Typography>
                      <Button 
                        startIcon={<RefreshIcon />} 
                        size="small" 
                        onClick={() => {
                          if (selectedTender) {
                            console.log('Manually refreshing history');
                            setTenderHistory([]);
                            setLoadingHistory(true);
                            fetchTenderHistory(Number(selectedTender.id));
                          }
                        }}
                        disabled={loadingHistory}
                      >
                        Refresh History
                      </Button>
                    </Box>
                    
                    {loadingHistory ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : tenderHistory.length > 0 ? (
                      <TableContainer component={Paper} variant="outlined">
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell width="20%">Date</TableCell>
                              <TableCell width="60%">Change</TableCell>
                              <TableCell width="20%">User</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {tenderHistory.map((history, index) => (
                              <TableRow key={index} hover>
                                <TableCell>{formatDate(history.timestamp)}</TableCell>
                                <TableCell>
                                  {formatFieldChange(history)}
                                  {history.field_name === "description" && (
                                    <Box sx={{ mt: 1, p: 1, fontSize: '0.85rem', bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Old:</Typography> 
                                      <Typography variant="caption" sx={{ display: 'block', mb: 1, whiteSpace: 'pre-wrap' }}>
                                        {history.old_value || '(empty)'}
                                      </Typography>
                                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>New:</Typography>
                                      <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'pre-wrap' }}>
                                        {history.new_value}
                                      </Typography>
                                    </Box>
                                  )}
                                  {history.field_name === "requirements" && (
                                    <Box sx={{ mt: 1, p: 1, fontSize: '0.85rem', bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Old:</Typography> 
                                      <Typography variant="caption" sx={{ display: 'block', mb: 1, whiteSpace: 'pre-wrap' }}>
                                        {history.old_value || '(empty)'}
                                      </Typography>
                                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>New:</Typography>
                                      <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'pre-wrap' }}>
                                        {history.new_value}
                                      </Typography>
                                    </Box>
                                  )}
                                </TableCell>
                                <TableCell>{history.user || 'System'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Alert severity="info">No history records found for this tender.</Alert>
                    )}
                    
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        This history shows all changes made to the tender since its creation, providing detailed information 
                        about what exactly was modified to ensure complete transparency in the procurement process.
                      </Typography>
                    </Box>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => {
                  setOpenDetailsDialog(false);
                  setSelectedTab(0); // Reset to first tab when closing
                  setTenderHistory([]); // Clear history when closing
                }}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </ContentWrapper>
    </PageContainer>
  );
};

export default CitizenView; 