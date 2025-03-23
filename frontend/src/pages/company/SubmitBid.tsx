import React, { useState, useEffect } from 'react';
import {
  Box,
  styled,
  TextField,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// Style components to match the city dashboard design
const PageContainer = styled('div')({
  width: '100%',
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #37CAFB 0%, #217895 100%)',
  display: 'flex',
  justifyContent: 'center',
  padding: '2vh 0',
});

const MainContent = styled('div')({
  width: '90%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: '2vh',
});

const FormContainer = styled('div')({
  width: '100%',
  maxWidth: '800px',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '20px',
  padding: '2rem',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
});

const BidDetailsContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
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

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: '#1976d2',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#1976d2',
    },
  },
});

const UploadBox = styled('div')({
  border: '2px dashed #1976d2',
  borderRadius: '10px',
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'background-color 0.3s',
  '&:hover': {
    backgroundColor: 'rgba(25, 118, 210, 0.05)',
  },
});

interface BidFormData {
  tenderId: string;
  biddingPrice: string;
  applicationDocument: File | null;
  additionalNotes: string;
}

const SubmitBid: React.FC = () => {
  const navigate = useNavigate();
  const { tenderId } = useParams<{ tenderId: string }>();
  const [formData, setFormData] = useState<BidFormData>({
    tenderId: tenderId || '',
    biddingPrice: '',
    applicationDocument: null,
    additionalNotes: '',
  });
  const [tenderDetails, setTenderDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchTenderDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth/company');
          return;
        }

        if (!tenderId) {
          setError('Tender ID is missing');
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:8000/api/tenders/${tenderId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tender details');
        }

        const data = await response.json();
        setTenderDetails(data);
      } catch (error) {
        console.error('Error fetching tender details:', error);
        setError('Failed to load tender details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTenderDetails();
  }, [tenderId, navigate]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFormData({
        ...formData,
        applicationDocument: event.target.files[0],
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      if (!formData.biddingPrice) {
        setError('Please enter a bidding price');
        return;
      }

      if (!formData.applicationDocument) {
        setError('Please upload application documents');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth/company');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('tender', formData.tenderId);
      formDataToSend.append('bidding_price', formData.biddingPrice);
      formDataToSend.append('documents', formData.applicationDocument);
      
      if (formData.additionalNotes) {
        formDataToSend.append('additional_notes', formData.additionalNotes);
      }

      console.log('Submitting bid with the following data:');
      console.log('Tender ID:', formData.tenderId);
      console.log('Bidding Price:', formData.biddingPrice);
      console.log('Document:', formData.applicationDocument.name);
      console.log('Additional Notes:', formData.additionalNotes || 'None');

      const response = await fetch('http://localhost:8000/api/bids/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        let errorDetail = 'Failed to submit bid';
        try {
          const errorData = await response.json();
          console.error('Error response from server:', errorData);
          errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          const errorText = await response.text();
          console.error('Error response text:', errorText);
        }
        throw new Error(errorDetail);
      }

      const responseData = await response.json();
      console.log('Bid submission response:', responseData);

      setSuccess(true);
      setTimeout(() => {
        navigate('/company/my-bids');
      }, 3000);
    } catch (error) {
      console.error('Error submitting bid:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while submitting your bid');
    } finally {
      setConfirmOpen(false);
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
      <MainContent>
        <TopSection>
          <ImageContainer>
            <img
              src="/icon1.png"
              alt="Company Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </ImageContainer>
          <Typography variant="h4" sx={{ color: 'white', fontFamily: 'Outfit', fontWeight: 300 }}>
            Submit Bid for Tender
          </Typography>
        </TopSection>

        <FormContainer>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Your bid has been submitted successfully! Redirecting...
            </Alert>
          )}

          {tenderDetails && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ mb: 2, fontFamily: 'Outfit', fontWeight: 400 }}>
                Tender Details
              </Typography>
              <Typography><strong>Title:</strong> {tenderDetails.title}</Typography>
              <Typography><strong>Budget:</strong> €{tenderDetails.budget}</Typography>
              <Typography><strong>Deadline:</strong> {new Date(tenderDetails.submission_deadline).toLocaleString()}</Typography>
            </Box>
          )}

          <BidDetailsContainer>
            <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 400 }}>
              Bid Information
            </Typography>

            <StyledTextField
              label="Bidding Price (EUR)"
              type="number"
              fullWidth
              value={formData.biddingPrice}
              onChange={(e) => setFormData({ ...formData, biddingPrice: e.target.value })}
              required
              disabled={success}
            />

            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Application Documents
              </Typography>
              <input
                accept=".pdf,.doc,.docx,.zip"
                id="application-document-upload"
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                disabled={success}
              />
              <label htmlFor="application-document-upload">
                <UploadBox>
                  <CloudUploadIcon sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
                  <Typography align="center">
                    {formData.applicationDocument 
                      ? `Selected file: ${formData.applicationDocument.name}` 
                      : 'Click to upload your application documents (.pdf, .doc, .docx, .zip)'}
                  </Typography>
                </UploadBox>
              </label>
            </Box>

            <StyledTextField
              label="Additional Notes"
              multiline
              rows={4}
              fullWidth
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              disabled={success}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/company')}
                disabled={success}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={() => setConfirmOpen(true)}
                disabled={!formData.biddingPrice || !formData.applicationDocument || success}
              >
                Submit Bid
              </Button>
            </Box>
          </BidDetailsContainer>
        </FormContainer>
      </MainContent>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Bid Submission</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you sure you want to submit this bid? You won't be able to change it after submission.
          </Typography>
          <Typography><strong>Bidding Price:</strong> €{formData.biddingPrice}</Typography>
          <Typography><strong>Documents:</strong> {formData.applicationDocument?.name}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Confirm Submission</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default SubmitBid; 