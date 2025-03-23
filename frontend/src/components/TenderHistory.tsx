import React, { useState, useEffect } from 'react';
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
  Collapse,
  IconButton,
  styled,
  Chip
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import HistoryIcon from '@mui/icons-material/History';
import { formatDate } from '../utils/dateUtils';

const HistoryCard = styled(Paper)(({ theme }) => ({
  padding: '1.5rem',
  marginBottom: '2rem',
  borderRadius: '10px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
}));

interface TenderChange {
  old: any;
  new: any;
}

interface TenderHistoryItem {
  id: number;
  action: string;
  action_display: string;
  changes: Record<string, TenderChange>;
  performed_by: number;
  performed_by_username: string;
  timestamp: string;
}

interface TenderHistoryProps {
  tenderId: string;
}

const TenderHistory: React.FC<TenderHistoryProps> = ({ tenderId }) => {
  const [history, setHistory] = useState<TenderHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [openRows, setOpenRows] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(`http://localhost:8000/api/tenders/${tenderId}/history/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tender history');
        }

        const data = await response.json();
        setHistory(data);
      } catch (err) {
        console.error('Error fetching history:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [tenderId]);

  const toggleRow = (id: number) => {
    setOpenRows((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getActionColor = (action: string) => {
    switch(action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'None';
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <HistoryCard>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <HistoryIcon color="primary" />
        <Typography variant="h6" component="h2">
          Tender History
        </Typography>
      </Box>

      {loading ? (
        <Typography>Loading history...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : history.length === 0 ? (
        <Typography>No history records found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Action</TableCell>
                <TableCell>Performed By</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((item) => (
                <React.Fragment key={item.id}>
                  <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                    <TableCell padding="checkbox">
                      <IconButton
                        size="small"
                        onClick={() => toggleRow(item.id)}
                      >
                        {openRows[item.id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.action_display} 
                        color={getActionColor(item.action) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.performed_by_username}</TableCell>
                    <TableCell>{formatDate(item.timestamp)}</TableCell>
                    <TableCell>
                      {Object.keys(item.changes).length > 0 
                        ? `${Object.keys(item.changes).length} changes` 
                        : 'No changes'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} style={{ paddingBottom: 0, paddingTop: 0 }}>
                      <Collapse in={openRows[item.id]} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                          <Typography variant="h6" gutterBottom component="div">
                            Changes
                          </Typography>
                          {Object.keys(item.changes).length > 0 ? (
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Field</TableCell>
                                  <TableCell>From</TableCell>
                                  <TableCell>To</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {Object.entries(item.changes).map(([field, change]) => (
                                  <TableRow key={field}>
                                    <TableCell component="th" scope="row">
                                      {field}
                                    </TableCell>
                                    <TableCell>{formatValue(change.old)}</TableCell>
                                    <TableCell>{formatValue(change.new)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              No detailed changes available.
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </HistoryCard>
  );
};

export default TenderHistory; 