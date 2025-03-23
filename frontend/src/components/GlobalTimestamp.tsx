import React, { useState, useEffect } from 'react';
import { Box, Typography, styled } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Simplified container without positioning
const TimestampContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const GlobalTimestamp: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <TimestampContainer>
      <AccessTimeIcon fontSize="small" />
      <Typography variant="body2" fontFamily="Outfit">
        {currentTime.toLocaleString()}
      </Typography>
    </TimestampContainer>
  );
};

export default GlobalTimestamp; 