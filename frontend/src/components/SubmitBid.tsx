import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Alert, Typography, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

interface SubmitBidProps {
  tenderId: number;
  onBidSubmitted?: () => void;
}

export default function SubmitBid({ tenderId, onBidSubmitted }: SubmitBidProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasBid, setHasBid] = useState(false);
  const [formData, setFormData] = useState({
    biddingPrice: '',
    additionalNotes: '',
    document: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    checkAuthenticationAndBid();
  }, [tenderId]);

  const checkAuthenticationAndBid = async () => {
      try {
      setLoading(true);
        const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
        const companyId = localStorage.getItem('companyId');

      console.log('Auth Check:', { token, userType, companyId }); // Debug log

      // Check if user is authenticated and is a company user
      if (!token) {
        setError('Please log in to submit a bid.');
        setIsAuthenticated(false);
        return;
      }

      if (userType !== 'COMPANY') {
        setError('Only company users can submit bids.');
        setIsAuthenticated(false);
        return;
      }

      if (!companyId) {
        setError('Company information not found. Please log in again.');
        setIsAuthenticated(false);
          return;
        }

      setIsAuthenticated(true);

      // Check for existing bid
        const response = await fetch('http://localhost:8000/api/bids/my_bids/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
        if (response.status === 401) {
          setError('Your session has expired. Please log in again.');
          setIsAuthenticated(false);
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('companyId');
          localStorage.removeItem('userType');
          return;
        }
        throw new Error('Failed to check bid status');
      }

      const bids = await response.json();
      const existingBid = bids.find((bid: any) => Number(bid.tender_id) === Number(tenderId));
      setHasBid(!!existingBid);
      } catch (err) {
        console.error('Error checking bid status:', err);
      setError('Failed to check bid status. Please try again.');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        document: e.target.files![0]
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token || !isAuthenticated) {
        setError('Authentication required. Please log in as a company user.');
        return;
      }

      if (!formData.biddingPrice || Number(formData.biddingPrice) <= 0) {
        setError('Please enter a valid bidding price');
        return;
      }

      if (!formData.document) {
        setError('Please upload a document');
        return;
      }

      const submitData = new FormData();
      submitData.append('tender', tenderId.toString());
      submitData.append('bidding_price', formData.biddingPrice);
      submitData.append('documents', formData.document);
      if (formData.additionalNotes) {
        submitData.append('additional_notes', formData.additionalNotes);
      }

      const response = await fetch('http://localhost:8000/api/bids/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Your session has expired. Please log in again.');
          setIsAuthenticated(false);
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('companyId');
          localStorage.removeItem('userType');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit bid');
      }

      setSuccess(true);
      setConfirmOpen(false);

      // Wait a moment before calling onBidSubmitted
      setTimeout(() => {
      if (onBidSubmitted) {
        onBidSubmitted();
      }
      }, 1500);
    } catch (err) {
      console.error('Error submitting bid:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error || 'Authentication required. Please log in as a company user.'}
      </Alert>
    );
  }

  if (hasBid) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        You have already submitted a bid for this tender.
      </Alert>
    );
  }

  if (success) {
    return (
      <Alert severity="success" sx={{ mt: 2 }}>
        Bid submitted successfully!
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Submit Bid
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        label="Bidding Price (€)"
        type="number"
        value={formData.biddingPrice}
        onChange={(e) => setFormData(prev => ({ ...prev, biddingPrice: e.target.value }))}
        fullWidth
        required
        disabled={isSubmitting}
        sx={{ mb: 2 }}
      />

      <input
        type="file"
        accept=".pdf,.doc,.docx,.zip"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="bid-document"
        disabled={isSubmitting}
      />
      <label htmlFor="bid-document">
        <Button
          component="span"
          variant="outlined"
          disabled={isSubmitting}
          sx={{ mb: 2 }}
        >
          {formData.document ? `Selected: ${formData.document.name}` : 'Upload Document'}
        </Button>
      </label>

      <TextField
        label="Additional Notes"
        multiline
        rows={4}
        value={formData.additionalNotes}
        onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
        fullWidth
        disabled={isSubmitting}
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        color="primary"
        onClick={() => setConfirmOpen(true)}
        disabled={isSubmitting || !formData.biddingPrice || !formData.document}
      >
        {isSubmitting ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Submitting...
          </>
        ) : (
          'Submit Bid'
        )}
      </Button>

      <Dialog open={confirmOpen} onClose={() => !isSubmitting && setConfirmOpen(false)}>
        <DialogTitle>Confirm Bid Submission</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you sure you want to submit this bid? You won't be able to modify it after submission.
          </Typography>
          <Typography><strong>Bidding Price:</strong> €{formData.biddingPrice}</Typography>
          <Typography><strong>Document:</strong> {formData.document?.name}</Typography>
          {formData.additionalNotes && (
            <Typography><strong>Additional Notes:</strong> {formData.additionalNotes}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmOpen(false)} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Submitting...
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 