import React, { useState, useEffect } from 'react';
import {
  Box,
  styled,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

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
  maxWidth: '800px',
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

interface CompanyData {
  company_name: string;
  contact_email: string;
  phone_number: string;
  address: string;
  registration_number: string;
  description: string;
}

const CompanyProfile: React.FC = () => {
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState<CompanyData>({
    company_name: '',
    contact_email: '',
    phone_number: '',
    address: '',
    registration_number: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    // In a real app, this would fetch the profile from the API
    // For now, we'll simulate loading company data
    setLoading(true);
    setTimeout(() => {
      setCompanyData({
        company_name: 'ABC Construction Ltd',
        contact_email: 'contact@abcconstruction.com',
        phone_number: '+1 (555) 123-4567',
        address: '123 Business St, City, Country',
        registration_number: 'REG123456789',
        description: 'Leading construction company with 20 years of experience in commercial and residential projects.',
      });
      setLoading(false);
    }, 1000);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    // In a real app, this would send the updated profile to the API
    // For now, we'll just simulate a successful update
    setSuccess('Profile updated successfully');
    setEditing(false);
    setTimeout(() => {
      setSuccess('');
    }, 3000);
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
            Company Profile
          </Typography>
        </TopSection>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Company Name"
              name="company_name"
              value={companyData.company_name}
              onChange={handleChange}
              fullWidth
              disabled={!editing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Registration Number"
              name="registration_number"
              value={companyData.registration_number}
              onChange={handleChange}
              fullWidth
              disabled={!editing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Contact Email"
              name="contact_email"
              value={companyData.contact_email}
              onChange={handleChange}
              fullWidth
              disabled={!editing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Phone Number"
              name="phone_number"
              value={companyData.phone_number}
              onChange={handleChange}
              fullWidth
              disabled={!editing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Address"
              name="address"
              value={companyData.address}
              onChange={handleChange}
              fullWidth
              disabled={!editing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Company Description"
              name="description"
              value={companyData.description}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
              disabled={!editing}
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/company')}
          >
            Back to Dashboard
          </Button>
          
          {editing ? (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </Box>
          ) : (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </Box>
      </ContentWrapper>
    </PageContainer>
  );
};

export default CompanyProfile; 