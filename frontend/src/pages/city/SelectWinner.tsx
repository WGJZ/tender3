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
});

interface Tender {
  id: string;
  title: string;
  budget: string;
  category: string;
  status: string;
  submission_deadline: string;
  bids_count?: number;
}

const SelectWinner: React.FC = () => {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth/city');
          return;
        }

        // Fetch all tenders first
        const response = await fetch('http://localhost:8000/api/tenders/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tenders');
        }

        const data = await response.json();
        
        // For each tender, check if it has bids
        const tendersWithBidInfo = await Promise.all(
          data.map(async (tender: Tender) => {
            try {
              const bidsResponse = await fetch(`http://localhost:8000/api/tenders/${tender.id}/bids/`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (bidsResponse.ok) {
                const bidsData = await bidsResponse.json();
                return {
                  ...tender,
                  bids_count: bidsData.length
                };
              }
              return {
                ...tender,
                bids_count: 0
              };
            } catch (error) {
              console.error(`Error fetching bids for tender ${tender.id}:`, error);
              return {
                ...tender,
                bids_count: 0
              };
            }
          })
        );
        
        // Filter tenders with bids
        const tendersWithBids = tendersWithBidInfo.filter((tender: Tender) => 
          tender.bids_count && tender.bids_count > 0 && tender.status !== 'AWARDED'
        );
        
        setTenders(tendersWithBids);
      } catch (error) {
        console.error('Error fetching tenders:', error);
        setError('Failed to load tenders with bids. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTenders();
  }, [navigate]);

  const viewBidsForTender = (tenderId: string) => {
    navigate(`/city/tenders/${tenderId}`);
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
            Select Winning Bids
          </Typography>
        </TopSection>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <HeaderSection>
          <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 400 }}>
            Tenders with Submitted Bids
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/city')}
          >
            Back to Dashboard
          </Button>
        </HeaderSection>

        {tenders.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Budget</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Deadline</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Bids</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tenders.map((tender) => (
                  <TableRow key={tender.id}>
                    <TableCell>{tender.title}</TableCell>
                    <TableCell>€{tender.budget}</TableCell>
                    <TableCell>{tender.category}</TableCell>
                    <TableCell>{formatDate(tender.submission_deadline)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={tender.status} 
                        color={tender.status === 'OPEN' ? 'success' : 'default'}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{tender.bids_count}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => viewBidsForTender(tender.id)}
                      >
                        View Bids
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography>No tenders with bids found. Either all tenders are already awarded or no bids have been submitted yet.</Typography>
          </Paper>
        )}
      </ContentWrapper>
    </PageContainer>
  );
};

export default SelectWinner; 