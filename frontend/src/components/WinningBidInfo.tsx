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
  bidId?: string;
  companyName: string;
  biddingPrice: number;
  submissionDate?: string;
  awardDate?: string;
  companyProfile?: CompanyProfile;
  email?: string;
  phone?: string;
  address?: string;
}

const WinningBidInfo: React.FC<WinningBidProps> = ({
  bidId,
  companyName,
  biddingPrice,
  submissionDate,
  awardDate,
  companyProfile,
  email,
  phone,
  address
}) => {
  return (
    <WinnerCard>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <WinnerChip 
          icon={<EmojiEventsIcon />} 
          label="WINNING BID" 
        />
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon sx={{ color: '#FFD700' }} /> 
            {companyName}
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Winning Bid
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                €{biddingPrice.toLocaleString()}
              </Typography>
            </Box>
            
            {awardDate && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Award Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(awardDate)}
                </Typography>
              </Box>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Contact Information
            </Typography>
            
            {companyProfile ? (
              <>
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
            ) : (
              <>
                {email && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Contact Email
                    </Typography>
                    <Typography variant="body2">
                      {email}
                    </Typography>
                  </Box>
                )}

                {phone && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Phone Number
                    </Typography>
                    <Typography variant="body2">
                      {phone}
                    </Typography>
                  </Box>
                )}

                {address && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body2">
                      {address}
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