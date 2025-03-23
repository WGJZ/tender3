import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Breadcrumbs,
  Link,
  AppBar,
  Toolbar,
  Button,
  styled,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LogoutIcon from '@mui/icons-material/Logout';

const StyledAppBar = styled(AppBar)({
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  boxShadow: '0 2px 2px rgba(0,0,0,0.1)',
  position: 'fixed',
  top: '0px',
  zIndex: 900,
  height: '56px',
});

const StyledToolbar = styled(Toolbar)({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0 10px',
  minHeight: '56px',
  height: '56px',
});

const NavigationContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  overflow: 'hidden',
  flexShrink: 1,
  maxWidth: '80%',
});

// Map of routes to display names in English
const routeNames: { [key: string]: string } = {
  'city': 'City Dashboard',
  'new-tender': 'New Tender',
  'browse-tender': 'Browse Tenders',
  'modify-tender': 'Modify Tender',
  'select-winner': 'Select Winner',
  'company': 'Company Dashboard',
  'bid': 'Submit Bid',
  'my-bids': 'My Bids',
  'tenders': 'Tender Details',
};

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const handleNavigate = (index: number) => {
    const newPath = '/' + pathSegments.slice(0, index + 1).join('/');
    navigate(newPath);
  };

  const handleLogout = () => {
    // Get the user type from the current path
    const isCity = location.pathname.includes('/city');
    const isCompany = location.pathname.includes('/company');
    
    localStorage.removeItem('token');
    
    if (isCity) {
      navigate('/auth/city');
    } else if (isCompany) {
      navigate('/auth/company');
    } else {
      navigate('/'); // Fallback to homepage if user type can't be determined
    }
  };

  return (
    <StyledAppBar>
      <StyledToolbar>
        <NavigationContainer>
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />}
            maxItems={3}
            itemsBeforeCollapse={1}
            itemsAfterCollapse={2}
          >
            <Link
              component="button"
              onClick={() => navigate('/')}
              sx={{ display: 'flex', alignItems: 'center', color: 'text.primary' }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
              Home
            </Link>
            {pathSegments.map((segment, index) => {
              const routeName = routeNames[segment] || segment;
              return (
                <Link
                  key={segment}
                  component="button"
                  onClick={() => handleNavigate(index)}
                  sx={{ color: 'text.primary' }}
                >
                  {routeName}
                </Link>
              );
            })}
          </Breadcrumbs>
        </NavigationContainer>

        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleLogout}
            endIcon={<LogoutIcon />}
            size="small"
          >
            Logout
          </Button>
        </Box>
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Navigation; 