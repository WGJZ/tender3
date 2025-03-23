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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';

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

interface TenderResult {
  id: string;
  tender_id: string;
  tender_title: string;
  category: string;
  budget: string;
  close_date: string;
  winning_company: string;
  winning_bid_amount: string;
  participated: boolean;
  your_result: 'WON' | 'LOST' | 'N/A';
}

interface Bid {
  id: string;
  company_name: string;
  bidding_price: number;
  submission_date: string;
  status: 'ACCEPTED' | 'REJECTED' | 'PENDING';
  tender_id: string;
  tender_title: string;
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

const TenderResults: React.FC = () => {
  const navigate = useNavigate();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTender, setSelectedTender] = useState<string | null>(null);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth');
          return;
        }

        const response = await fetch('http://localhost:8000/api/bids/all/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch bids');
        }

        const data = await response.json();
        setBids(data);
      } catch (error) {
        console.error('Error fetching bids:', error);
        setError('Failed to load bids. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, [navigate]);

  const groupedBids = bids.reduce((acc, bid) => {
    if (!acc[bid.tender_id]) {
      acc[bid.tender_id] = {
        tender_title: bid.tender_title,
        bids: []
      };
    }
    acc[bid.tender_id].bids.push(bid);
    return acc;
  }, {} as { [key: string]: { tender_title: string, bids: Bid[] } });

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
              alt="Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </ImageContainer>
          <Typography variant="h4" sx={{ color: '#217895', fontFamily: 'Outfit', fontWeight: 300 }}>
            Tender Results
          </Typography>
        </TopSection>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <HeaderSection>
          <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 400 }}>
            All Tender Results
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </HeaderSection>

        {Object.entries(groupedBids).map(([tenderId, { tender_title, bids: tenderBids }]) => (
          <Box key={tenderId} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#217895' }}>
              {tender_title}
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Company</TableCell>
                    <TableCell>Bid Amount (EUR)</TableCell>
                    <TableCell>Submission Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tenderBids.map((bid) => (
                    <TableRow 
                      key={bid.id}
                      sx={{
                        backgroundColor: bid.status === 'ACCEPTED' ? 'rgba(76, 175, 80, 0.1)' : 'inherit'
                      }}
                    >
                      <TableCell>{bid.company_name}</TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}

        {Object.keys(groupedBids).length === 0 && (
          <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
            No tender results available.
          </Typography>
        )}
      </ContentWrapper>
    </PageContainer>
  );
};

export default TenderResults; 