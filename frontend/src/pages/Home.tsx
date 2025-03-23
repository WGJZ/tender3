import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, styled } from '@mui/material';

// create a custom button container
const StyledButtonContainer = styled(Box)(({ theme }) => ({
  width: '30vw',
  maxWidth: '456px',
  minWidth: '280px',
  height: '6vh',
  minHeight: '60px',
  maxHeight: '83px',
  backgroundColor: '#D9D9D9',
  borderRadius: '22px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#CCCCCC',
  },
  transition: 'all 0.3s ease',
}));

// create a custom text style
const ButtonText = styled('div')(({ theme }) => ({
  color: '#000000',
  fontSize: 'clamp(10px, 4vw, 30px)', // responsive font size
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 200,  // use a thinner font weight
  whiteSpace: 'nowrap',
  opacity: 0.85,    // slightly reduce opacity to make text look lighter
  letterSpacing: '0.02em', // add a bit of letter spacing to make text more elegant
}));

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        position: 'relative',
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
          maxWidth: '1512px',
          height: '90%',
          maxHeight: '982px',
          display: 'flex',
          flexDirection: {
            xs: 'column', // in small screens, arrange vertically
            md: 'row'     // in medium and larger screens, arrange horizontally
          },
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: '2rem', md: '4rem' },
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
          {/* CITY button */}
          <StyledButtonContainer 
            onClick={() => navigate('/login/city')}
            sx={{
              alignSelf: { xs: 'center', md: 'flex-start' }
            }}
          >
            <ButtonText>CITY</ButtonText>
          </StyledButtonContainer>

          {/* COMPANY button */}
          <StyledButtonContainer 
            onClick={() => navigate('/login/company')}
            sx={{
              alignSelf: { xs: 'center', md: 'flex-start' }
            }}
          >
            <ButtonText>COMPANY</ButtonText>
          </StyledButtonContainer>

          {/* CITIZEN button */}
          <StyledButtonContainer 
            onClick={() => navigate('/citizen')}
            sx={{
              alignSelf: { xs: 'center', md: 'flex-start' }
            }}
          >
            <ButtonText>CITIZEN</ButtonText>
          </StyledButtonContainer>
        </Box>
      </Box>
    </Box>
  );
};

export default Home; 