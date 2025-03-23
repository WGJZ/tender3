import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography,
  Paper,
  styled
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

const FilterContainer = styled(Paper)(({ theme }) => ({
  padding: '1.5rem',
  marginBottom: '2rem',
  borderRadius: '10px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
}));

interface TenderFilterProps {
  onFilter: (filters: FilterParams) => void;
}

export interface FilterParams {
  search: string;
  category: string;
  status: string;
  deadline_before: string | null;
  deadline_after: string | null;
}

const TenderFilter: React.FC<TenderFilterProps> = ({ onFilter }) => {
  // State for filter values
  const [search, setSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [deadlineBefore, setDeadlineBefore] = useState<Date | null>(null);
  const [deadlineAfter, setDeadlineAfter] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Category options
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'CONSTRUCTION', label: 'Construction' },
    { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
    { value: 'SERVICES', label: 'Services' },
    { value: 'TECHNOLOGY', label: 'Technology' },
    { value: 'HEALTHCARE', label: 'Healthcare' },
    { value: 'EDUCATION', label: 'Education' },
    { value: 'TRANSPORTATION', label: 'Transportation' },
    { value: 'ENVIRONMENT', label: 'Environment' },
  ];

  // Status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'OPEN', label: 'Open' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'AWARDED', label: 'Awarded' },
  ];

  const handleSearch = () => {
    const filters: FilterParams = {
      search,
      category,
      status,
      deadline_before: deadlineBefore ? formatDate(deadlineBefore) : null,
      deadline_after: deadlineAfter ? formatDate(deadlineAfter) : null,
    };
    onFilter(filters);
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    setDeadlineBefore(null);
    setDeadlineAfter(null);
    
    // Reset with empty filters
    onFilter({
      search: '',
      category: '',
      status: '',
      deadline_before: null,
      deadline_after: null,
    });
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  return (
    <FilterContainer>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Search Tenders
          </Typography>
          <Button 
            color="primary"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>

        {/* Basic search input */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Search by title or description"
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              endAdornment: <SearchIcon color="action" />,
            }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSearch}
            sx={{ minWidth: '120px' }}
          >
            Search
          </Button>
        </Box>

        {/* Advanced filters */}
        {showFilters && (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mt: 2 }}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="Category"
              >
                {categoryOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl variant="outlined" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                label="Status"
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Deadline After"
                value={deadlineAfter}
                onChange={(newValue) => setDeadlineAfter(newValue)}
              />
            </LocalizationProvider>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Deadline Before"
                value={deadlineBefore}
                onChange={(newValue) => setDeadlineBefore(newValue)}
              />
            </LocalizationProvider>

            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={handleReset}
              sx={{ minWidth: '120px' }}
            >
              Reset
            </Button>
          </Box>
        )}
      </Box>
    </FilterContainer>
  );
};

export default TenderFilter; 