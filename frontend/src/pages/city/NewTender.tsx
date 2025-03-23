import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  styled,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  MenuItem,
} from '@mui/material';

/**
 * NewTender Component
 * 
 * A comprehensive interface for creating new tender projects in the system.
 * This component handles the entire process of tender creation, including:
 * - Input validation
 * - Date management
 * - Budget handling
 * - Construction period settings
 * - API communication
 */

/**
 * PageContainer
 * Main container for the new tender page
 * Uses a gradient background and ensures full viewport height
 * Implements responsive design principles
 */
const PageContainer = styled('div')({
  width: '100%',
  minHeight: '100vh',
  background: 'linear-gradient(180deg, rgb(55.89, 202.64, 251.55) 0%, rgb(33.22, 120.47, 149.55) 100%)',
  display: 'flex',
  justifyContent: 'center',
  padding: '2vh 0',
});

/**
 * ContentWrapper
 * Contains the form elements with a semi-transparent background
 * Provides proper spacing and shadow effects
 * Ensures content is readable and well-organized
 */
const ContentWrapper = styled('div')({
  width: '90%',
  maxWidth: '1200px',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '20px',
  padding: '2rem',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
});

/**
 * FormSection
 * Organizes form fields in a vertical layout
 * Maintains consistent spacing between elements
 * Implements flex layout for better responsiveness
 */
const FormSection = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '2vh',
});

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});

/**
 * TenderForm Interface
 * Defines the structure of the tender form data
 * Each field corresponds to a specific aspect of the tender
 */
interface TenderForm {
  title: string;          // The official name of the tender project
  description: string;    // Detailed explanation of the tender requirements
  budget: string;         // Project budget in EUR
  notice_date: string;    // Official publication date of the tender
  close_date: string;     // Final date for accepting submissions
  winner_date: string;    // Planned date for winner announcement
  construction_start: string;  // Expected construction start date
  construction_end: string;    // Expected construction completion date
  requirements: string;   // Specific technical or legal requirements
  category: string;       // Classification category of the tender
}

const DEBUG = true; // Enable debug logging

// Add this utility function for debug logging
const debugLog = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
};

const TENDER_CATEGORIES = [
  'CONSTRUCTION',
  'INFRASTRUCTURE',
  'SERVICES',
  'TECHNOLOGY',
  'HEALTHCARE',
  'EDUCATION',
  'TRANSPORTATION',
  'ENVIRONMENT'
];

// Add display names for categories
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

/**
 * NewTender Component Implementation
 * Manages the state and behavior of the tender creation form
 */
const NewTender: React.FC = () => {
  // Navigation hook for routing after form submission
  const navigate = useNavigate();

  /**
   * Form state management
   * Includes all fields necessary for tender creation
   * Initialized with empty values
   */
  const [formData, setFormData] = useState<TenderForm>({
    title: '',
    description: '',
    budget: '',
    notice_date: '',
    close_date: '',
    winner_date: '',
    construction_start: '',
    construction_end: '',
    requirements: '',
    category: '',
  });

  /**
   * Dialog state management
   * Controls the visibility of the confirmation dialog
   */
  const [openConfirm, setOpenConfirm] = useState(false);

  /**
   * Error state management
   * Handles display of error messages to the user
   */
  const [error, setError] = useState<string>('');

  /**
   * Handles form submission to create a new tender
   * Validates input, prepares data, and sends to backend
   * Provides error handling and user feedback
   */
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("You must be logged in to create a tender");
        return;
      }

      const userId = getUserIdFromToken(token);
      if (!userId) {
        setError("Unable to identify user, please login again");
        return;
      }

      // Validate the form before submission
      if (!validateForm()) {
        return;
      }

      // Debug logging for date fields
      console.log('Submitting tender with dates:', {
        notice_date: formData.notice_date,
        submission_deadline: formData.close_date,
        winner_date: formData.winner_date,
        formatted_winner_date: formData.winner_date ? new Date(formData.winner_date).toISOString() : null
      });

      const requestData = {
        title: formData.title,
        description: formData.description,
        budget: parseFloat(formData.budget),
        category: formData.category,
        requirements: formData.requirements,
        status: 'OPEN',
        notice_date: formData.notice_date ? new Date(formData.notice_date).toISOString() : null,
        submission_deadline: formData.close_date ? new Date(formData.close_date).toISOString() : null,
        winner_date: formData.winner_date ? new Date(formData.winner_date).toISOString() : null,
        construction_start: formData.construction_start ? new Date(formData.construction_start).toISOString().split('T')[0] : null,
        construction_end: formData.construction_end ? new Date(formData.construction_end).toISOString().split('T')[0] : null,
        created_by: userId
      };

      debugLog('Request data:', requestData);
      debugLog('Making request to:', 'http://localhost:8000/api/tenders/');

      // First check if the server is responding
      try {
        const checkResponse = await fetch('http://localhost:8000/api/tenders/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!checkResponse.ok && checkResponse.status !== 401) {  // Allow 401 as we'll handle auth in main request
          throw new Error(`Server check failed: ${checkResponse.status}`);
        }
      } catch (error) {
        setError('Cannot connect to server. Please ensure the backend server is running.');
        return;
      }

      const response = await fetch('http://localhost:8000/api/tenders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,  // Add token here
        },
        body: JSON.stringify(requestData),
      });

      debugLog('Response status:', response.status);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (response.status === 401) {
          setError('Authentication failed. Please login again.');
          // Optionally redirect to login page
          navigate('/login');
          return;
        }
        throw new Error(`Expected JSON response but got ${contentType}`);
      }

      const responseData = await response.json();
      debugLog('Response data:', responseData);

      if (response.ok) {
        debugLog('Tender creation successful');
        navigate('/city/browse-tender');
      } else {
        let errorMessage = 'Unknown error';
        if (responseData.detail) {
          errorMessage = responseData.detail;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (typeof responseData === 'object') {
          const errors = Object.entries(responseData)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          errorMessage = `Validation failed: ${errors}`;
        }
        debugLog('Tender creation failed:', errorMessage);
        setError(`Failed to create tender: ${errorMessage}`);
      }
    } catch (err) {
      debugLog('Error in handleSubmit:', err);
      if (err instanceof Error) {
        if (err.message.includes('Expected JSON response')) {
          setError('Server error: Backend may not be running or token may have expired. Please try logging in again.');
        } else {
          setError(`Network error: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  /**
   * Validates all form fields before submission
   * Checks for:
   * - Required fields
   * - Valid budget amount
   * - Logical date sequences
   * - Future dates where applicable
   * 
   * @returns {boolean} Whether the form is valid
   */
  const validateForm = () => {
    if (!formData.title || !formData.description || !formData.budget || !formData.notice_date) {
      setError('Please fill in all required fields');
      return false;
    }
    if (isNaN(Number(formData.budget)) || Number(formData.budget) <= 0) {
      setError('Please enter a valid budget amount');
      return false;
    }
    
    const now = new Date();
    
    if (formData.notice_date && new Date(formData.notice_date) < now) {
      setError('Notice date must be in the future');
      return false;
    }
    
    if (formData.close_date && new Date(formData.close_date) < new Date(formData.notice_date)) {
      setError('Close date must be after notice date');
      return false;
    }
    
    if (formData.winner_date && new Date(formData.winner_date) < new Date(formData.close_date)) {
      setError('Winner announcement date must be after close date');
      return false;
    }
    
    if (formData.construction_start && formData.construction_end && 
        new Date(formData.construction_end) < new Date(formData.construction_start)) {
      setError('Construction end date must be after start date');
      return false;
    }
    
    return true;
  };

  const handleConfirm = () => {
    if (validateForm()) {
      setOpenConfirm(true);
    }
  };

  /**
   * Formats date-time strings for display in the UI
   * 
   * @param {string} dateTimeStr - ISO date-time string
   * @returns {string} Localized date-time string
   */
  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  };

  // Helper function to extract user ID from JWT token
  const getUserIdFromToken = (token: string): number | null => {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return null;
      }
      const tokenPayload = JSON.parse(atob(tokenParts[1]));
      return tokenPayload.user_id || null;
    } catch (e) {
      console.error('Error extracting user ID from token:', e);
      return null;
    }
  };

  return (
    <PageContainer>
      <ContentWrapper>
        <Typography variant="h4" sx={{ mb: 4, color: '#000', fontFamily: 'Outfit', fontWeight: 300 }}>
          Create New Tender
        </Typography>

        <FormSection>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <StyledTextField
            label="Tender Title"
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <StyledTextField
            label="Category"
            fullWidth
            select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          >
            {TENDER_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {CATEGORY_DISPLAY_NAMES[category]}
              </MenuItem>
            ))}
          </StyledTextField>

          <StyledTextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />

          <StyledTextField
            label="Budget (EUR)"
            fullWidth
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            required
          />

          <StyledTextField
            label="Date of Tender Notice"
            type="datetime-local"
            fullWidth
            value={formData.notice_date}
            onChange={(e) => setFormData({ ...formData, notice_date: e.target.value })}
            InputLabelProps={{
              shrink: true,
            }}
            required
          />

          <StyledTextField
            label="Date of Tender Close"
            type="datetime-local"
            fullWidth
            value={formData.close_date}
            onChange={(e) => setFormData({ ...formData, close_date: e.target.value })}
            InputLabelProps={{
              shrink: true,
            }}
            required
          />

          <StyledTextField
            label="Date of Disclosing Winner"
            type="datetime-local"
            fullWidth
            value={formData.winner_date}
            onChange={(e) => setFormData({ ...formData, winner_date: e.target.value })}
            InputLabelProps={{
              shrink: true,
            }}
            required
          />

          <Typography variant="subtitle1" sx={{ mt: 2 }}>Terms of Construction</Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <StyledTextField
              label="Start Date"
              type="date"
              fullWidth
              value={formData.construction_start}
              onChange={(e) => {
                const date = e.target.value;
                debugLog('Construction start date:', date);
                setFormData({ ...formData, construction_start: date });
              }}
              InputLabelProps={{
                shrink: true,
              }}
              // Add placeholder to show expected format
              placeholder="YYYY-MM-DD"
              required
            />
            
            <StyledTextField
              label="End Date"
              type="date"
              fullWidth
              value={formData.construction_end}
              onChange={(e) => {
                const date = e.target.value;
                debugLog('Construction end date:', date);
                setFormData({ ...formData, construction_end: date });
              }}
              InputLabelProps={{
                shrink: true,
              }}
              // Add placeholder to show expected format
              placeholder="YYYY-MM-DD"
              required
            />
          </Box>

          <StyledTextField
            label="Requirements"
            fullWidth
            multiline
            rows={4}
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/city')}
              sx={{ fontFamily: 'Outfit' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              sx={{ fontFamily: 'Outfit' }}
            >
              Create Tender
            </Button>
          </Box>
        </FormSection>

        {/* Confirmation dialog */}
        <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
          <DialogTitle>Confirm Tender Creation</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to create this tender?</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Title: {formData.title}</Typography>
              <Typography variant="subtitle1">Budget: €{formData.budget}</Typography>
              <Typography variant="subtitle1">
                Notice Date: {formatDateTime(formData.notice_date)}
              </Typography>
              <Typography variant="subtitle1">
                Close Date: {formatDateTime(formData.close_date)}
              </Typography>
              <Typography variant="subtitle1">
                Construction: {formatDateTime(formData.construction_start)} to {formatDateTime(formData.construction_end)}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenConfirm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </ContentWrapper>
    </PageContainer>
  );
};

export default NewTender; 