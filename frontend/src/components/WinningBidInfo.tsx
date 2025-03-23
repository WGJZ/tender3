import React from 'react';
import {
  Box,
  Typography,
  Paper,
  styled,
  Divider,
  Chip,
  Avatar
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BusinessIcon from '@mui/icons-material/Business';
import { formatDate } from '../utils/dateUtils';

const WinnerCard = styled(Paper)(({ theme }) => ({
  padding: '1.5rem',
  borderRadius: '10px',
  border: '2px solid #FFD700',  // Gold border for winner
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  background: 'linear-gradient(to bottom, rgba(255, 250, 205, 0.2), rgba(255, 255, 255, 0.9))'
}));

const WinnerChip = styled(Chip)(({ theme }) => ({
  backgroundColor: '#FFD700',
  color: '#000',
  fontWeight: 'bold',
  '& .MuiChip-icon': {
    color: '#000'
  }
}));

interface CompanyProfile {
  company_name: string;
  contact_email: string;
  phone_number?: string;
  address?: string;
  registration_number: string;
}

interface WinningBidProps {
  bidId: string;
  companyName: string;
  biddingPrice: number;
  submissionDate: string;
  awardDate?: string;
  companyProfile?: CompanyProfile;
}

const WinningBidInfo: React.FC<WinningBidProps> = ({
  bidId,
  companyName,
  biddingPrice,
  submissionDate,
  awardDate,
  companyProfile
}) => {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <WinnerCard>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
          Winning Bid
        </Typography>
        <WinnerChip
          icon={<EmojiEventsIcon />}
          label="WINNER"
          size="small"
        />
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
          <BusinessIcon fontSize="large" />
        </Avatar>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            {companyName}
          </Typography>
          
          <Typography variant="body1" color="primary" fontWeight="bold" sx={{ mb: 2 }}>
            Bid Amount: {formatPrice(biddingPrice)}
          </Typography>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 2
          }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Submission Date
              </Typography>
              <Typography variant="body2">
                {formatDate(submissionDate)}
              </Typography>
            </Box>
            
            {awardDate && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Award Date
                </Typography>
                <Typography variant="body2">
                  {formatDate(awardDate)}
                </Typography>
              </Box>
            )}
            
            {companyProfile && (
              <>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Registration Number
                  </Typography>
                  <Typography variant="body2">
                    {companyProfile.registration_number}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Contact Email
                  </Typography>
                  <Typography variant="body2">
                    {companyProfile.contact_email}
                  </Typography>
                </Box>
                
                {companyProfile.phone_number && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Phone Number
                    </Typography>
                    <Typography variant="body2">
                      {companyProfile.phone_number}
                    </Typography>
                  </Box>
                )}
                
                {companyProfile.address && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body2">
                      {companyProfile.address}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>
    </WinnerCard>
  );
};

export default WinningBidInfo; 