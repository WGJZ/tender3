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
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';

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

const ImageContainer = styled('div')({
  width: '150px',
  height: '150px',
  borderRadius: '50%',
  overflow: 'hidden',
  marginBottom: '1rem',
});

const HeaderSection = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
});

interface Bid {
  id: string;
  tender_id: string;
  tender_title: string;
  bidding_price: string;
  submission_date: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  document_url?: string;
  tender_deadline: string; // Added field to check if deadline has passed
  additional_notes?: string;
}

const MyBids: React.FC = () => {
  const navigate = useNavigate();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [bidDetails, setBidDetails] = useState<Bid | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editedPrice, setEditedPrice] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    fetchMyBids();
  }, [navigate]);

  const fetchMyBids = async () => {
    try {
      setLoading(true);
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

      if (!response.ok) {
        throw new Error('Failed to fetch your bids');
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        // For each bid, get the corresponding tender to check deadline
        const bidsWithDeadline = await Promise.all(
          data.map(async (bid) => {
            try {
              const tenderResponse = await fetch(`http://localhost:8000/api/tenders/${bid.tender_id}/`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (tenderResponse.ok) {
                const tenderData = await tenderResponse.json();
                return {
                  ...bid,
                  tender_deadline: tenderData.submission_deadline,
                };
              }
              return bid;
            } catch (error) {
              console.error(`Error fetching tender for bid ${bid.id}:`, error);
              return bid;
            }
          })
        );
        
        setBids(bidsWithDeadline);
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
      setError('Failed to load your bids. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const isDeadlinePassed = (deadline?: string) => {
    if (!deadline) return true; // If no deadline info, assume it's passed
    return new Date(deadline) < new Date();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'Winner';
      case 'REJECTED':
        return 'Not Selected';
      default:
        return 'Pending';
    }
  };

  const handleEdit = (bid: Bid) => {
    setSelectedBid(bid);
    setEditedPrice(bid.bidding_price);
    setEditedNotes(bid.additional_notes || '');
    setEditDialogOpen(true);
  };

  const handleDelete = (bid: Bid) => {
    setSelectedBid(bid);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (bid: Bid) => {
    setBidDetails(bid);
    setDetailsDialogOpen(true);
  };

  const confirmEdit = async () => {
    if (!selectedBid) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth/company');
        return;
      }
      
      const response = await fetch(`http://localhost:8000/api/bids/${selectedBid.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidding_price: editedPrice,
          additional_notes: editedNotes,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update bid');
      }
      
      // Update local state
      setBids(prev => prev.map(bid => 
        bid.id === selectedBid.id 
          ? { ...bid, bidding_price: editedPrice, additional_notes: editedNotes } 
          : bid
      ));
      
      setActionSuccess('Bid updated successfully');
      setTimeout(() => setActionSuccess(''), 3000);
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating bid:', error);
      setError('Failed to update bid. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const confirmDelete = async () => {
    if (!selectedBid) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth/company');
        return;
      }
      
      const response = await fetch(`http://localhost:8000/api/bids/${selectedBid.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete bid');
      }
      
      // Update local state
      setBids(prev => prev.filter(bid => bid.id !== selectedBid.id));
      
      setActionSuccess('Bid deleted successfully');
      setTimeout(() => setActionSuccess(''), 3000);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting bid:', error);
      setError('Failed to delete bid. Please try again.');
      setTimeout(() => setError(''), 3000);
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
            My Submitted Bids
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
          <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 400 }}>
            {bids.length} Bid{bids.length !== 1 ? 's' : ''} Submitted
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/company')}
          >
            Back to Dashboard
          </Button>
        </HeaderSection>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tender Title</TableCell>
                <TableCell>Bid Amount (EUR)</TableCell>
                <TableCell>Submission Date</TableCell>
                <TableCell>Deadline</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bids.map((bid) => {
                const deadlinePassed = isDeadlinePassed(bid.tender_deadline);
                
                return (
                  <TableRow key={bid.id}>
                    <TableCell>{bid.tender_title}</TableCell>
                    <TableCell>€{bid.bidding_price}</TableCell>
                    <TableCell>{formatDate(bid.submission_date)}</TableCell>
                    <TableCell>
                      {bid.tender_deadline ? formatDate(bid.tender_deadline) : 'Unknown'}
                      {deadlinePassed ? (
                        <Chip 
                          size="small" 
                          label="Closed" 
                          color="default" 
                          sx={{ ml: 1 }} 
                        />
                      ) : (
                        <Chip 
                          size="small" 
                          label="Open" 
                          color="success" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(bid.status)}
                        color={getStatusColor(bid.status) as 'success' | 'error' | 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleViewDetails(bid)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {!deadlinePassed && (
                          <>
                            <Tooltip title="Edit Bid">
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleEdit(bid)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Delete Bid">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDelete(bid)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {bids.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    You haven't submitted any bids yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </ContentWrapper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Bid</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Tender: {selectedBid?.tender_title}
          </Typography>
          
          <TextField
            label="Bid Amount (EUR)"
            type="number"
            fullWidth
            value={editedPrice}
            onChange={(e) => setEditedPrice(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          
          <TextField
            label="Additional Notes"
            multiline
            rows={4}
            fullWidth
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={confirmEdit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your bid for "{selectedBid?.tender_title}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Delete Bid
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bid Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)}>
        <DialogTitle>Bid Details</DialogTitle>
        <DialogContent>
          {bidDetails && (
            <Box sx={{ minWidth: '400px' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {bidDetails.tender_title}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Bid Amount</Typography>
                <Typography variant="body1">€{bidDetails.bidding_price}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Submission Date</Typography>
                <Typography variant="body1">{formatDate(bidDetails.submission_date)}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Tender Deadline</Typography>
                <Typography variant="body1">
                  {bidDetails.tender_deadline ? formatDate(bidDetails.tender_deadline) : 'Unknown'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                <Chip 
                  label={getStatusLabel(bidDetails.status)}
                  color={getStatusColor(bidDetails.status) as 'success' | 'error' | 'warning'}
                  size="small"
                />
              </Box>
              
              {bidDetails.additional_notes && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">Additional Notes</Typography>
                  <Typography variant="body1">{bidDetails.additional_notes}</Typography>
                </Box>
              )}
              
              {bidDetails.document_url && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">Documents</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    href={bidDetails.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ mt: 1 }}
                  >
                    View Document
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default MyBids; 