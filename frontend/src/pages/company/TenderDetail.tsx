import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  styled 
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { Tender } from '../../types/Tender';

// 替换 PageContainer 和 ContentWrapper 为自定义样式组件
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

interface Bid {
  id: number;
  company_id: number;
  amount: number;
  tender_id: number;
}

export default function TenderDetail() {
  const { tenderId } = useParams<{ tenderId: string }>();
  const [tender, setTender] = useState<Tender | null>(null);
  const [hasExistingBid, setHasExistingBid] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const currentCompanyId = Number(localStorage.getItem('companyId')); // 从localStorage获取公司ID

  // 获取tender详情
  useEffect(() => {
    const fetchTenderDetails = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/tenders/${tenderId}/`);
        if (response.ok) {
          const data = await response.json();
          setTender(data);
        }
      } catch (err) {
        console.error('Error fetching tender details:', err);
      }
    };

    if (tenderId) {
      fetchTenderDetails();
    }
  }, [tenderId]);

  // 检查是否已经提交过bid
  useEffect(() => {
    const checkExistingBid = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/tenders/${tenderId}/bids/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });
        
        if (response.ok) {
          const bids: Bid[] = await response.json();
          const existingBid = bids.find(bid => bid.company_id === currentCompanyId);
          setHasExistingBid(!!existingBid);
        }
      } catch (err) {
        console.error('Error checking existing bids:', err);
      }
    };

    if (tenderId && currentCompanyId) {
      checkExistingBid();
    }
  }, [tenderId, currentCompanyId]);

  const handleBidSubmit = async () => {
    if (hasExistingBid) {
      setError('Your company has already submitted a bid for this tender.');
      return;
    }

    if (!bidAmount || Number(bidAmount) <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/tenders/${tenderId}/bids/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount: Number(bidAmount),
          tender_id: Number(tenderId)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit bid');
      }

      setSuccess('Bid submitted successfully');
      setHasExistingBid(true);
      setBidAmount('');
    } catch (err) {
      console.error('Error submitting bid:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit bid');
    }
  };

  if (!tender) {
    return (
      <PageContainer>
        <ContentWrapper>
          <Typography>Loading tender details...</Typography>
        </ContentWrapper>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentWrapper>
        <Typography variant="h4" gutterBottom>
          {tender.title}
        </Typography>

        {hasExistingBid ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Your company has already submitted a bid for this tender.
          </Alert>
        ) : (
          tender.status === 'OPEN' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Submit Bid</Typography>
              <TextField
                type="number"
                label="Bid Amount (€)"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                fullWidth
                sx={{ mt: 1 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleBidSubmit}
                sx={{ mt: 1 }}
              >
                Submit Bid
              </Button>
            </Box>
          )
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </ContentWrapper>
    </PageContainer>
  );
} 