import React, { useState } from 'react';
import {
  Box,
  styled,
  TextField,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Grid,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const PageContainer = styled('div')({
  width: '100%',
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #37CAFB 0%, #217895 100%)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2vh 0',
});

const FormContainer = styled(Paper)({
  width: '90%',
  maxWidth: '800px',
  padding: '2rem',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '20px',
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

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  company_name: string;
  contact_email: string;
  phone_number: string;
  address: string;
  registration_number: string;
  description: string;
}

const CompanyRegister: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    confirmPassword: '',
    company_name: '',
    contact_email: '',
    phone_number: '',
    address: '',
    registration_number: '',
    description: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear field-specific error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate username
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Validate company name
    if (!formData.company_name) {
      newErrors.company_name = 'Company name is required';
    }
    
    // Validate email
    if (!formData.contact_email) {
      newErrors.contact_email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = 'Email is invalid';
    }
    
    // Validate registration number
    if (!formData.registration_number) {
      newErrors.registration_number = 'Registration number is required';
    }
    
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Prepare data object that matches exactly what the backend expects
      const registrationData = {
        username: formData.username,
        password: formData.password,
        user_type: 'COMPANY',
        company_profile: {
          company_name: formData.company_name,
          contact_email: formData.contact_email,
          phone_number: formData.phone_number || null,
          address: formData.address || null,
          registration_number: formData.registration_number,
          description: formData.description || null,
        }
      };
      
      console.log('Sending registration data:', JSON.stringify(registrationData));
      
      // First check if the server is running
      try {
        const serverCheckResponse = await fetch('http://localhost:8000/api/', { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Server check response:', serverCheckResponse.status);
      } catch (error) {
        throw new Error('Unable to connect to the server. Please make sure the backend server is running.');
      }
      
      const response = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });
      
      let responseData;
      try {
        responseData = await response.json();
        console.log('Registration response:', response.status, responseData);
      } catch (error) {
        console.error('Error parsing response:', error);
        throw new Error('Invalid response from server. Please check the backend logs.');
      }
      
      if (response.ok) {
        // Navigate to login page on success
        alert('Registration successful! Please login with your new account.');
        navigate('/auth/company');
      } else {
        // Handle different types of errors
        if (responseData.detail) {
          setError(responseData.detail);
        } else if (responseData.errors) {
          // Handle field-specific errors
          const serverFieldErrors: Record<string, string> = {};
          Object.entries(responseData.errors).forEach(([key, value]) => {
            serverFieldErrors[key] = Array.isArray(value) ? value[0] : String(value);
          });
          setFieldErrors(serverFieldErrors);
        } else {
          setError('Registration failed: ' + (responseData.message || 'Please check the server logs for details.'));
        }
        
        // Log full error for debugging
        console.error('Registration error details:', responseData);
      }
    } catch (error) {
      console.error('Network error during registration:', error);
      setError(error instanceof Error ? error.message : 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PageContainer>
      <FormContainer>
        <TopSection>
          <ImageContainer>
            <img
              src="/icon1.png"
              alt="Company Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </ImageContainer>
          <Typography variant="h4" sx={{ color: '#217895', fontFamily: 'Outfit', fontWeight: 300 }}>
            Company Registration
          </Typography>
        </TopSection>
        
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                fullWidth
                required
                error={!!fieldErrors.username}
                helperText={fieldErrors.username}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Company Name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                fullWidth
                required
                error={!!fieldErrors.company_name}
                helperText={fieldErrors.company_name}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                required
                error={!!fieldErrors.password}
                helperText={fieldErrors.password}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                fullWidth
                required
                error={!!fieldErrors.confirmPassword}
                helperText={fieldErrors.confirmPassword}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Email"
                name="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={handleChange}
                fullWidth
                required
                error={!!fieldErrors.contact_email}
                helperText={fieldErrors.contact_email}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Registration Number"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                fullWidth
                required
                error={!!fieldErrors.registration_number}
                helperText={fieldErrors.registration_number}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                fullWidth
                error={!!fieldErrors.phone_number}
                helperText={fieldErrors.phone_number}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                fullWidth
                error={!!fieldErrors.address}
                helperText={fieldErrors.address}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Company Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
                placeholder="Provide a brief description of your company, services, and background"
                error={!!fieldErrors.description}
                helperText={fieldErrors.description}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button 
              variant="outlined" 
              color="primary"
              component={RouterLink}
              to="/auth/company"
              disabled={loading}
            >
              Back to Login
            </Button>
            
            <Button 
              type="submit"
              variant="contained" 
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </Box>
        </form>
      </FormContainer>
    </PageContainer>
  );
};

export default CompanyRegister; 