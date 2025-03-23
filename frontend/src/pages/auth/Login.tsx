import { Link as RouterLink } from 'react-router-dom';
import { Link } from '@mui/material';
import { Box } from '@mui/material';

<Box sx={{ mt: 2, textAlign: 'center' }}>
  <Link component={RouterLink} to="/register/company">
    Register as Company
  </Link>
</Box> 