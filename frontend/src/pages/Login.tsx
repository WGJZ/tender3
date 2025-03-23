import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Box, styled } from '@mui/material';

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

const ButtonText = styled('div')({
  color: '#000000',
  fontSize: 'clamp(10px, 4vw, 30px)',
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 200,
  whiteSpace: 'nowrap',
  opacity: 0.85,
  letterSpacing: '0.02em',
});

const Login = () => {
  const navigate = useNavigate();
  const { userType } = useParams();

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(180deg, #37CAFB 0%, #217895 100%)',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
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
          gap: '5vw',
        }}
      >
        {/* icon section */}
        <Box
          sx={{
            width: { xs: '70%', md: '40%' },
            maxWidth: '583px',
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

        {/* button section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: '1rem', md: '2rem' },
            width: { xs: '90%', md: '40%' },
          }}
        >
          {/* LOGIN button */}
          <StyledButtonContainer 
            onClick={() => navigate(`/auth/${userType}`)}
            sx={{
              width: '30vw',
              maxWidth: '456px',
              minWidth: '280px',
              height: '6vh',
              minHeight: '60px',
              maxHeight: '83px',
            }}
          >
            <ButtonText>LOGIN</ButtonText>
          </StyledButtonContainer>

          {/* BROWSE TENDER button */}
          <StyledButtonContainer
            onClick={() => navigate('/browse-tenders')}
            sx={{
              width: '30vw',
              maxWidth: '456px',
              minWidth: '280px',
              height: '6vh',
              minHeight: '60px',
              maxHeight: '83px',
            }}
          >
            <ButtonText>BROWSE TENDER</ButtonText>
          </StyledButtonContainer>
        </Box>
      </Box>
    </Box>
  );
};

export default Login; 