import React, { useState, useEffect } from 'react';
import {
  Box,
  styled,
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
  Alert,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { Tender } from '../../types/Tender';

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

const TopSection = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '2rem',
});

const HeaderSection = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
});

const ImageContainer = styled('div')({
  width: '150px',
  height: '150px',
  borderRadius: '50%',
  overflow: 'hidden',
  marginBottom: '1rem',
});

const SearchContainer = styled(Box)({
  display: 'flex',
  gap: '1rem',
  marginBottom: '2rem',
  alignItems: 'center',
  flexWrap: 'wrap',
});

interface ModifyTenderProps {
  open: boolean;
  onClose: () => void;
  tender: Tender;
}

// 定义类别常量
const CATEGORIES = [
  'CONSTRUCTION',
  'INFRASTRUCTURE',
  'SERVICES',
  'TECHNOLOGY',
  'HEALTHCARE',
  'EDUCATION',
  'TRANSPORTATION',
  'ENVIRONMENT'
];

const CATEGORY_DISPLAY_NAMES: { [key: string]: string } = {
  'CONSTRUCTION': 'Construction',
  'INFRASTRUCTURE': 'Infrastructure',
  'SERVICES': 'Services',
  'TECHNOLOGY': 'Technology',
  'HEALTHCARE': 'Healthcare',
  'EDUCATION': 'Education',
  'TRANSPORTATION': 'Transportation',
  'ENVIRONMENT': 'Environment'
};

export default function ModifyTender({ open, onClose, tender }: ModifyTenderProps) {
  const [title, setTitle] = useState(tender.title);
  const [description, setDescription] = useState(tender.description);
  const [requirements, setRequirements] = useState(tender.requirements || '');
  const [budget, setBudget] = useState(tender.budget);
  const [category, setCategory] = useState(tender.category);
  const [submissionDeadline, setSubmissionDeadline] = useState(new Date(tender.submission_deadline));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    console.log('Received tender for modification:', tender);
    setTitle(tender.title || '');
    setDescription(tender.description || '');
    setRequirements(tender.requirements || '');
    setBudget(tender.budget || '0');
    setCategory(tender.category || 'CONSTRUCTION');
    setSubmissionDeadline(new Date(tender.submission_deadline));
  }, [tender]);

  const validateForm = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!budget || Number(budget) <= 0) {
      setError('Valid budget is required');
      return false;
    }
    if (!category) {
      setError('Category is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const formattedBudget = Number(budget).toFixed(2);
      
      const requestBody = {
        title,
        description,
        requirements,
        budget: formattedBudget,
        category,
        status: tender.status,
        notice_date: tender.notice_date,
        submission_deadline: submissionDeadline.toISOString().split('.')[0] + 'Z',
        created_by: tender.created_by,
      };

      console.log('Sending request body:', requestBody);

      const response = await fetch(`http://localhost:8000/api/tenders/${tender.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(`Failed to update tender: ${JSON.stringify(errorData)}`);
      }

      const updatedTender = await response.json();
      console.log('Update successful:', updatedTender);

      setSuccess('Tender updated successfully');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error updating tender:', err);
      setError('Failed to update tender. Please try again.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Modify Tender Details</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={4}
            fullWidth
            required
          />

          <TextField
            label="Requirements (Optional)"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            multiline
            rows={4}
            fullWidth
          />

          <TextField
            label="Budget (€)"
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            fullWidth
            required
          />

          <FormControl fullWidth required>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Category"
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {CATEGORY_DISPLAY_NAMES[cat]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Submission Deadline"
              value={submissionDeadline}
              onChange={(newValue) => {
                if (newValue) setSubmissionDeadline(newValue);
              }}
            />
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
} 