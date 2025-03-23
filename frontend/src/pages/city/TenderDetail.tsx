import React, { useState, useEffect } from 'react';
import {
  Box,
  styled,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';

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

const ImageContainer = styled('div')({
  width: '150px',
  height: '150px',
  borderRadius: '50%',
  overflow: 'hidden',
  marginBottom: '1rem',
  '& svg': {
    width: '100%', 
    height: '100%',
    viewBox: '0 0 24 24',
  }
});

const TenderInfoCard = styled(Paper)({
  padding: '1.5rem',
  marginBottom: '2rem',
  borderRadius: '10px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
});

interface Tender {
  id: string;
  title: string;
  description: string;
  budget: string;
  category: string;
  requirements: string;
  notice_date: string;
  submission_deadline: string;
  status: 'OPEN' | 'CLOSED' | 'AWARDED';
}

interface Bid {
  id: string;
  company_name: string;
  company_id: string;
  company_details?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    description: string;
  };
  company_profile?: {
    company_name: string;
    contact_email: string;
    phone_number?: string;
    address?: string;
    registration_number: string;
    description?: string;
  };
  bidding_price: number;
  documents: string;
  additional_notes: string;
  submission_date: string;
  status: string;
  is_winner?: boolean;
}

const TenderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { tenderId } = useParams<{ tenderId: string }>();
  const [tender, setTender] = useState<Tender | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmationDialog, setConfirmationDialog] = useState(false);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [companyDetailsOpen, setCompanyDetailsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);
  const [userType, setUserType] = useState<'CITY' | 'COMPANY'>('CITY');

  useEffect(() => {
    // Get user type from local storage
    const storedUserType = localStorage.getItem('userType');
    if (storedUserType && (storedUserType === 'CITY' || storedUserType === 'COMPANY')) {
      setUserType(storedUserType as 'CITY' | 'COMPANY');
    }
    
    const fetchTenderAndBids = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth/city');
          return;
        }

        // Fetch tender details
        const tenderResponse = await fetch(`http://localhost:8000/api/tenders/${tenderId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!tenderResponse.ok) {
          throw new Error('Failed to fetch tender details');
        }

        const tenderData = await tenderResponse.json();
        setTender(tenderData);

        // For company users, get bids directly from my_bids
        if (storedUserType === 'COMPANY') {
          try {
            // Fetch all user's bids first
            const myBidsResponse = await fetch('http://localhost:8000/api/bids/my_bids/', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            
            if (myBidsResponse.ok) {
              const allBids = await myBidsResponse.json();
              // Filter to find bids for this tender
              const bidsForTender = allBids.filter((bid: any) => 
                bid.tender_id === Number(tenderId)
              );
              
              if (bidsForTender.length > 0) {
                console.log('Company bids for this tender:', bidsForTender);
                setBids(bidsForTender);
                return; // Skip the standard bids fetch below
              }
            }
          } catch (error) {
            console.error('Error fetching company bids:', error);
            // Continue with normal flow
          }
        }

        try {
          // Standard approach to fetch bids for this tender
          const bidsResponse = await fetch(`http://localhost:8000/api/tenders/${tenderId}/bids/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (bidsResponse.ok) {
            const bidsData = await bidsResponse.json();
            console.log('Bids data:', bidsData);
            setBids(bidsData);
          } else {
            console.error('Failed to fetch bids:', bidsResponse.status);
            // Don't throw error for bid fetching - we still have tender data
          }
        } catch (bidError) {
          console.error('Error fetching bids:', bidError);
          // Don't throw for bid errors
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load tender details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTenderAndBids();
  }, [tenderId, navigate]);

  const handleSelectWinner = (bid: Bid) => {
    setSelectedBid(bid);
    setConfirmationDialog(true);
  };

  const confirmSelectWinner = async () => {
    if (!selectedBid) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth/city');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/bids/${selectedBid.id}/select_winner/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to select winner');
      }

      // Update local state
      setBids(prev => prev.map(bid => ({
        ...bid,
        status: bid.id === selectedBid.id ? 'ACCEPTED' : 'REJECTED',
        is_winner: bid.id === selectedBid.id
      })));

      if (tender) {
        setTender({
          ...tender,
          status: 'AWARDED'
        });
      }

      setActionSuccess('Winner selected successfully!');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (error) {
      console.error('Error selecting winner:', error);
      setError('Failed to select winner. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setConfirmationDialog(false);
    }
  };

  const handleViewCompanyDetails = (bid: Bid) => {
    console.log("Company bid details (full object):", JSON.stringify(bid, null, 2));
    console.log("Company profile:", bid.company_profile);
    
    // Extract all possible company details from various structures
    const normalizedCompany = {
      name: bid.company_name || 
            bid.company_details?.name || 
            'Not provided',
      email: bid.company_profile?.contact_email || 
             (bid as any).contact_email || 
             (bid as any).company_details?.email || 
             'Not provided',
      phone: bid.company_profile?.phone_number || 
             (bid as any).phone_number || 
             (bid as any).company_details?.phone || 
             'Not provided',
      address: bid.company_profile?.address || 
               (bid as any).address || 
               (bid as any).company_details?.address || 
               'Not provided',
      description: (bid.company_profile?.description !== null && bid.company_profile?.description !== undefined) 
                    ? bid.company_profile.description 
                    : (bid as any).description !== null && (bid as any).description !== undefined
                      ? (bid as any).description
                      : (bid as any).company_details?.description !== null && (bid as any).company_details?.description !== undefined
                        ? (bid as any).company_details?.description 
                        : 'No description provided.'
    };
    
    console.log("Normalized company data:", JSON.stringify(normalizedCompany, null, 2));
    
    setSelectedCompany(normalizedCompany);
    setCompanyDetailsOpen(true);
  };

  const handleViewDocument = (documentUrl: string) => {
    setDocumentPreviewUrl(documentUrl);
    setDocumentPreviewOpen(true);
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
            Tender Details
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

        <HeaderSection>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/city')}
          >
            Back to Dashboard
          </Button>
        </HeaderSection>

        {tender && (
          <TenderInfoCard>
            <Typography variant="h5" sx={{ mb: 2, fontFamily: 'Outfit', fontWeight: 400 }}>
              {tender.title}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Budget</Typography>
                <Typography variant="body1">€{tender.budget}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Category</Typography>
                <Typography variant="body1">{tender.category}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                <Chip 
                  label={tender.status} 
                  color={
                    tender.status === 'OPEN' ? 'success' : 
                    tender.status === 'AWARDED' ? 'primary' : 'default'
                  }
                  size="small" 
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Notice Date</Typography>
                <Typography variant="body1">{formatDate(tender.notice_date)}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Submission Deadline</Typography>
                <Typography variant="body1">{formatDate(tender.submission_deadline)}</Typography>
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">Description</Typography>
              <Typography variant="body1" paragraph>{tender.description}</Typography>
            </Box>
            
            {tender.requirements && (
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Requirements</Typography>
                <Typography variant="body1">{tender.requirements}</Typography>
              </Box>
            )}
          </TenderInfoCard>
        )}

        <Typography variant="h6" sx={{ mt: 4, mb: 2, fontFamily: 'Outfit', fontWeight: 400 }}>
          {userType === 'CITY' ? `Submitted Bids (${bids.length})` : 'Your Submitted Bid'}
        </Typography>

        {bids.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Company</TableCell>
                  <TableCell>Bid Amount (EUR)</TableCell>
                  <TableCell>Submission Date</TableCell>
                  <TableCell>Status</TableCell>
                  {userType === 'CITY' && (
                    <TableCell align="center">Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {bids.map((bid) => (
                  <TableRow key={bid.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<BusinessIcon />}
                          onClick={() => handleViewCompanyDetails(bid)}
                        >
                          {userType === 'COMPANY' ? 'Your Company' : bid.company_name}
                        </Button>
                        {bid.documents && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DescriptionIcon />}
                            onClick={() => handleViewDocument(bid.documents)}
                          >
                            Document
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>€{bid.bidding_price}</TableCell>
                    <TableCell>{formatDate(bid.submission_date)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={bid.status} 
                        color={
                          bid.status === 'ACCEPTED' ? 'success' : 
                          bid.status === 'REJECTED' ? 'error' : 'warning'
                        }
                        size="small" 
                      />
                    </TableCell>
                    {userType === 'CITY' && (
                      <TableCell align="center">
                        {tender && tender.status !== 'AWARDED' && (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handleSelectWinner(bid)}
                          >
                            Select as Winner
                          </Button>
                        )}
                        {bid.is_winner && (
                          <Typography variant="body2" color="primary">
                            Selected Winner
                          </Typography>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography>
              {userType === 'COMPANY' 
                ? "You haven't submitted any bids for this tender yet." 
                : "No bids have been submitted for this tender yet."}
            </Typography>
          </Paper>
        )}
      </ContentWrapper>

      <Dialog
        open={confirmationDialog}
        onClose={() => setConfirmationDialog(false)}
        aria-labelledby="winner-confirmation-title"
        disableEnforceFocus
        disableAutoFocus
      >
        <DialogTitle id="winner-confirmation-title">Confirm Winner Selection</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to select the bid from {selectedBid?.company_name} as the winner?
            This will close the tender and notify all participating companies.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={confirmSelectWinner}>
            Confirm Selection
          </Button>
        </DialogActions>
      </Dialog>

      {/* Company Details Dialog */}
      <Dialog 
        open={companyDetailsOpen} 
        onClose={() => setCompanyDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedCompany && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="primary" />
              Contact Information
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>Company</Typography>
                <Typography>{selectedCompany.name || 'Not provided'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>Contact Information</Typography>
                <Typography><strong>Email:</strong> {selectedCompany.email || 'Not provided'}</Typography>
                <Typography><strong>Phone:</strong> {selectedCompany.phone || 'Not provided'}</Typography>
                <Typography><strong>Address:</strong> {selectedCompany.address || 'Not provided'}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>Company Description</Typography>
                <Typography paragraph>{selectedCompany.description || 'No description provided.'}</Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCompanyDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog 
        open={documentPreviewOpen} 
        onClose={() => setDocumentPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          {documentPreviewUrl ? (
            documentPreviewUrl.endsWith('.pdf') ? (
              <iframe 
                src={`http://localhost:8000${documentPreviewUrl}`}
                style={{ width: '100%', height: '70vh' }}
                title="Document Preview"
              />
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <img 
                  src={`http://localhost:8000${documentPreviewUrl}`}
                  alt="Document Preview"
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                />
              </Box>
            )
          ) : (
            <Typography>No document available to preview.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentPreviewOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            color="primary"
            href={`http://localhost:8000${documentPreviewUrl}`}
            target="_blank"
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default TenderDetail; 