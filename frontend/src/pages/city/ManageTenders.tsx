import { useState, useEffect } from 'react';
import { Tender } from '../../types/Tender';
import ModifyTender from './ModifyTender';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  CircularProgress,
  styled,
  Alert
} from '@mui/material';
import { formatDate } from '../../utils/dateUtils';

const PageContainer = styled('div')({
  width: '100%',
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #37CAFB 0%, #217895 100%)',
  display: 'flex',
  justifyContent: 'center',
  padding: '2vh 0',
});

const ContentWrapper = styled('div')({
  width: '90%',
  maxWidth: '1200px',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '20px',
  padding: '2rem',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
});

const ManageTenders: React.FC = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTenders = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/tenders/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tenders');
      }
      
      const data = await response.json();
      console.log('Fetched tenders:', data); // 检查原始数据
      
      // 确保每个tender都有自己的独立数据
      const processedTenders = data.map((tender: any) => ({
        id: tender.id,
        title: tender.title,
        description: tender.description,
        budget: tender.budget,
        category: tender.category,
        requirements: tender.requirements || '',
        status: tender.status,
        notice_date: tender.notice_date,
        submission_deadline: tender.submission_deadline,
        created_by: tender.created_by,
        created_at: tender.created_at,
        winner_date: tender.winner_date,
        construction_start: tender.construction_start,
        construction_end: tender.construction_end
      }));
      
      console.log('Processed tenders:', processedTenders); // 检查处理后的数据
      setTenders(processedTenders);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tenders:', err);
      setError('Failed to load tenders');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  const handleModifyClick = (tender: Tender) => {
    // 创建一个深拷贝以避免引用问题
    const selectedTenderCopy = JSON.parse(JSON.stringify(tender));
    console.log('Selected tender for modification:', selectedTenderCopy);
    setSelectedTender(selectedTenderCopy);
    setModifyDialogOpen(true);
  };

  const handleDialogClose = () => {
    setModifyDialogOpen(false);
    setSelectedTender(null);
    fetchTenders(); // 刷新列表
  };

  // Add this function to check if tender can be modified
  const canModifyTender = (tender: Tender) => {
    // Check if status is OPEN
    if (tender.status !== 'OPEN') {
      return false;
    }
    
    // Check if deadline has not passed
    const deadline = new Date(tender.submission_deadline);
    const today = new Date();
    
    // Compare dates (ignoring time)
    const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return deadlineDate >= todayDate;
  };

  if (loading) {
    return (
      <PageContainer>
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentWrapper>
        <Typography variant="h4" gutterBottom>
          Manage Tenders
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Budget</TableCell>
                <TableCell>Submission Deadline</TableCell>
                <TableCell>Winner Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenders.map((tender) => (
                <TableRow key={tender.id}>
                  <TableCell>{tender.id}</TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {tender.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {tender.category}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      €{parseFloat(tender.budget).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {formatDate(tender.submission_deadline)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {tender.winner_date ? formatDate(tender.winner_date) : "Not specified"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={tender.status}
                      color={
                        tender.status === 'OPEN' ? 'primary' :
                        tender.status === 'AWARDED' ? 'success' :
                        'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {canModifyTender(tender) ? (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleModifyClick(tender)}
                      >
                        Modify
                      </Button>
                    ) : (
                      <Chip 
                        label="Cannot modify" 
                        color="default" 
                        variant="outlined"
                        title="Tenders past their deadline or not in OPEN status cannot be modified"
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {selectedTender && (
          <ModifyTender
            open={modifyDialogOpen}
            onClose={handleDialogClose}
            tender={selectedTender}
          />
        )}
      </ContentWrapper>
    </PageContainer>
  );
};

export default ManageTenders; 