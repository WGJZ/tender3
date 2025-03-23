import React from 'react';
import { styled } from '@mui/material';
import { useLocation } from 'react-router-dom';
import GlobalTimestamp from './GlobalTimestamp';
import Navigation from './Navigation';

const TimestampContainer = styled('div')({
  position: 'fixed',
  top: '10px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1100,
  color: '#000',
  fontSize: '0.9rem',
  fontFamily: 'Outfit',
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
  padding: '4px 12px',
  borderRadius: '4px',
});

const LayoutContainer = styled('div')({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
});

// Content wrapper with proper spacing for navigation
const ContentWrapper = styled('div')<{ hasNavigation: boolean }>(({ hasNavigation }) => ({
  flex: 1,
  paddingTop: hasNavigation ? '56px' : 0, // Add top padding only when navigation is present
}));

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Pages where navigation should not be shown
  const isAuthOrLoginPage = location.pathname === '/' || 
                 location.pathname.includes('/auth') ||
                 location.pathname.includes('/login');
  
  // Different text color based on page background
  const textColor = isAuthOrLoginPage ? '#fff' : '#000';
  // Different background for better contrast
  const bgColor = isAuthOrLoginPage ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.7)';
  // Add text shadow only on gradient background pages
  const textShadow = isAuthOrLoginPage ? '0px 0px 3px rgba(0,0,0,0.3)' : 'none';

  return (
    <LayoutContainer>
      {/* Always show timestamp centered on all pages */}
      <TimestampContainer
        style={{ 
          color: textColor, 
          backgroundColor: bgColor,
          textShadow: textShadow
        }}
      >
        <GlobalTimestamp />
      </TimestampContainer>
      
      {/* Show navigation only on non-auth and non-login pages */}
      {!isAuthOrLoginPage && <Navigation />}
      
      {/* Main content with proper spacing */}
      <ContentWrapper hasNavigation={!isAuthOrLoginPage}>
        {children}
      </ContentWrapper>
    </LayoutContainer>
  );
};

export default Layout;