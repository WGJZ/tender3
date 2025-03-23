import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, styled } from '@mui/material';

const PageContainer = styled('div')({
  width: '100%',
  height: '100vh',
  overflow: 'hidden',
  display: 'flex',
  justifyContent: 'center',
});

const MainContent = styled('div')({
  width: '100%',
  height: '100%',
  background: 'linear-gradient(180deg, rgb(55.89, 202.64, 251.55) 0%, rgb(33.22, 120.47, 149.55) 100%)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2vh 2vw',
});

const ContentWrapper = styled('div')({
  width: '90%',
  height: '90%',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '2vw',
  '@media (max-width: 1200px)': {
    flexDirection: 'column',
    justifyContent: 'center',
  },
});

const LeftSection = styled('div')({
  flex: '0 0 40%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  '@media (max-width: 1200px)': {
    flex: '0 0 30%',
  },
});

const RightSection = styled('div')({
  flex: '0 0 50%',
  display: 'flex',
  flexDirection: 'column',
  gap: '2vh',
  '@media (max-width: 1200px)': {
    flex: '0 0 60%',
    width: '100%',
  },
});

const ButtonBase = styled('div')({
  backgroundColor: 'rgba(217, 217, 217, 0.9)',
  borderRadius: '1.5vw',
  width: '100%',
  height: 'clamp(50px, 8vh, 80px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(217, 217, 217, 1)',
    transform: 'scale(1.02)',
  },
});

const ButtonText = styled('div')({
  color: '#000000',
  fontFamily: 'Outfit, sans-serif',
  fontSize: 'clamp(16px, 2.5vw, 38px)',
  fontWeight: 300,
  whiteSpace: 'nowrap',
});

const TitleText = styled('div')({
  color: '#fbfbff',
  fontFamily: 'Outfit, sans-serif',
  fontSize: 'clamp(40px, 6vw, 130px)',
  fontWeight: 900,
  marginTop: '2vh',
  textAlign: 'center',
});

const CityDashboard = () => {
  const navigate = useNavigate();

  const buttons = [
    { text: 'NEW TENDER', path: '/city/new-tender' },
    { text: 'MODIFY TENDER', path: '/city/modify-tender' },
    { text: 'BROWSE TENDER', path: '/city/browse-tender' },
    { text: 'SELECT WINNER TENDER', path: '/city/select-winner' },
  ];

  return (
    <PageContainer>
      <MainContent>
        <ContentWrapper>
          <LeftSection>
            <Box
              sx={{
                width: '100%',
                maxWidth: '500px',
                aspectRatio: '1',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <img
                src="/icon1.png"
                alt="Building amico"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
            <TitleText>CITY</TitleText>
          </LeftSection>

          <RightSection>
            {buttons.map((button, index) => (
              <ButtonBase
                key={index}
                onClick={() => navigate(button.path)}
              >
                <ButtonText>{button.text}</ButtonText>
              </ButtonBase>
            ))}
          </RightSection>
        </ContentWrapper>
      </MainContent>
    </PageContainer>
  );
};

export default CityDashboard; 