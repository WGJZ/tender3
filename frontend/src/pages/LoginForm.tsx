import React, { useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { Box, styled, TextField, Typography, Link } from '@mui/material';

// create a custom button container
const StyledButtonContainer = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(217, 217, 217, 0.4)',
  borderRadius: '1.5vw',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'rgba(217, 217, 217, 0.5)',
  },
  transition: 'all 0.3s ease',
}));

// create a custom input box style
const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(217, 217, 217, 0.4)',
    borderRadius: '1.5vw',
    '& fieldset': {
      border: 'none',
    },
    '&:hover fieldset': {
      border: 'none',
    },
    '&.Mui-focused fieldset': {
      border: 'none',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#000',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 200,
  },
  '& .MuiOutlinedInput-input': {
    color: '#000',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 200,
    fontSize: 'clamp(16px, 2vw, 24px)',
  },
});

const ButtonText = styled('div')({
  color: '#000000',
  fontSize: 'clamp(16px, 2vw, 24px)',
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 200,
  whiteSpace: 'nowrap',
});

const ErrorText = styled(Typography)({
  color: '#ff0000',
  fontSize: 'clamp(14px, 1.5vw, 18px)',
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 200,
  marginTop: '1vh',
});

const LoginForm = () => {
  const navigate = useNavigate();
  const { userType } = useParams();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.username || !formData.password) {
      setError('Enter the username and password for your account');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting login with:', {
        username: formData.username,
        user_type: userType?.toUpperCase()
      });

      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          user_type: userType?.toUpperCase()
        }),
      });

      const data = await response.json();
      console.log('Login response data:', data);

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Store authentication data
      localStorage.setItem('token', data.token);
      
      // Store user type based on the login path
      const currentUserType = userType?.toUpperCase() || '';
      localStorage.setItem('userType', currentUserType);
      
      // For company users, get company ID from user profile
      if (currentUserType === 'COMPANY') {
        try {
          const profileResponse = await fetch('http://localhost:8000/api/companies/profile/', {
            headers: {
              'Authorization': `Bearer ${data.token}`
            }
          });
          
          console.log('Profile response:', await profileResponse.clone().text());
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('Company profile data:', profileData);
            
            if (profileData.id) {
              localStorage.setItem('companyId', profileData.id.toString());
            } else {
              throw new Error('Company profile not found');
            }
          } else {
            throw new Error('Failed to fetch company profile');
          }
        } catch (error) {
          console.error('Error fetching company profile:', error);
          setError('Failed to fetch company profile. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      // Redirect based on user type
      switch (currentUserType) {
        case 'CITY':
          navigate('/city');
          break;
        case 'ADMIN':
          navigate('/admin');
          break;
        case 'COMPANY':
          navigate('/company');
          break;
        default:
          setError('Invalid user type');
          return;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(180deg, #37CAFB 0%, #217895 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          width: '90%',
          height: '90vh',
          display: 'flex',
          flexDirection: {
            xs: 'column',
            md: 'row'
          },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2vw',
        }}
      >
        {/* left icon */}
        <Box
          sx={{
            width: { xs: '70%', md: '40%' },
            aspectRatio: '1/1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img
            src="/icon1.png"
            alt="City Buildings"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </Box>

        {/* right form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: { xs: '90%', md: '45%' },
            display: 'flex',
            flexDirection: 'column',
            gap: '2vh',
          }}
        >
          <ButtonText sx={{ fontSize: 'clamp(24px, 3vw, 36px)' }}>
            {userType?.toUpperCase()}
          </ButtonText>

          <StyledTextField
            fullWidth
            label="USERNAME"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            error={!!error}
          />

          <StyledTextField
            fullWidth
            type="password"
            label="PASSWORD"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={!!error}
          />

          {error && <ErrorText>{error}</ErrorText>}
          
          {/* Login button - full width for both city and company */}
          <StyledButtonContainer
            onClick={handleSubmit}
            sx={{
              width: '100%',
              height: '5vh',
              minHeight: '40px',
            }}
          >
            <ButtonText>LOGIN</ButtonText>
          </StyledButtonContainer>
          
          {/* Only show registration link for company users */}
          {userType === 'company' && (
            <Box sx={{ 
              mt: 2, 
              width: '100%',
              textAlign: 'center',
              backgroundColor: 'rgba(217, 217, 217, 0.4)',
              borderRadius: '1.5vw',
              padding: '10px',
            }}>
              <ButtonText sx={{ fontSize: 'clamp(14px, 1.5vw, 20px)' }}>
                Don't have an account?{' '}
                <RouterLink 
                  to="/register/company" 
                  style={{ 
                    color: '#000000',
                    textDecoration: 'underline',
                    fontWeight: 'bold',
                  }}
                >
                  Register as Company
                </RouterLink>
              </ButtonText>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default LoginForm; 