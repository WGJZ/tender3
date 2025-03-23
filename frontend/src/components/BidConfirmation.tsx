import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Divider,
  styled,
  Alert
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { formatDate } from '../utils/dateUtils';

const ConfirmationPaper = styled(Paper)(({ theme }) => ({
  padding: '2rem',
  marginBottom: '1rem',
  borderRadius: '10px',
  border: '1px solid #e0e0e0',
}));

interface BidConfirmationProps {
  open: boolean;
  onClose: () => void;
  bidData: {
    tender_title: string;
    bidding_price: number;
    submission_date: string;
    tender_id: string;
    company_name?: string;
    confirmation_code?: string;
  };
  onConfirm: () => void;
}

const BidConfirmation: React.FC<BidConfirmationProps> = ({
  open,
  onClose,
  bidData,
  onConfirm
}) => {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirm = () => {
    setIsConfirmed(true);
    onConfirm();
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        sx: { width: '100%', maxWidth: 600, borderRadius: '10px' }
      }}
    >
      <DialogTitle sx={{ backgroundColor: '#f5f5f5', py: 2 }}>
        <Box display="flex" alignItems="center" gap={1}>
          {isConfirmed && <CheckCircleOutlineIcon color="success" />}
          <Typography variant="h6">
            {isConfirmed ? 'Bid Submitted Successfully' : 'Confirm Your Bid'}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        {isConfirmed ? (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              Your bid has been successfully submitted.
            </Alert>
            
            <ConfirmationPaper elevation={0}>
              <Typography variant="h6" gutterBottom>
                Bid Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Tender:</Typography>
                  <Typography variant="body1">{bidData.tender_title}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Bid Amount:</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatPrice(bidData.bidding_price)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Submission Date:</Typography>
                  <Typography variant="body1">{formatDate(bidData.submission_date)}</Typography>
                </Box>
                
                {bidData.confirmation_code && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Confirmation Code:</Typography>
                    <Typography variant="body1" fontFamily="monospace">
                      {bidData.confirmation_code}
                    </Typography>
                  </Box>
                )}
              </Box>
            </ConfirmationPaper>
            
            <Typography variant="body2" color="text.secondary" align="center">
              Please save this confirmation for your records.
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography paragraph>
              Please review your bid details before confirming:
            </Typography>
            
            <ConfirmationPaper elevation={0}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Tender:</Typography>
                  <Typography variant="body1">{bidData.tender_title}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Bid Amount:</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatPrice(bidData.bidding_price)}
                  </Typography>
                </Box>
              </Box>
            </ConfirmationPaper>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              By submitting this bid, you agree to the terms and conditions of the tender.
            </Alert>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        {isConfirmed ? (
          <Button onClick={onClose} variant="contained" color="primary">
            Close
          </Button>
        ) : (
          <>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleConfirm} variant="contained" color="primary">
              Confirm Bid
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BidConfirmation; 