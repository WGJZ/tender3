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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

// Import our new components
import TenderHistory from '../components/TenderHistory';
import WinningBidInfo from '../components/WinningBidInfo';
import ConfirmationDialog from '../components/ConfirmationDialog';
// Import Bid type from types.ts
import { Bid as BidType } from '../types';

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

const ActionButton = styled(Button)(({ theme }) => ({
  margin: '0 0.5rem',
}));

const ImageContainer = styled('div')({
  width: '150px',
  height: '150px',
  borderRadius: '50%',
  overflow: 'hidden',
  marginBottom: '1rem',
});

const TenderInfoCard = styled(Paper)({
  padding: '1.5rem',
  marginBottom: '2rem',
  borderRadius: '10px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
});

interface Tender {
  id: string;
  title: string;
  description: string;
  budget: string;
  category: string;
  requirements: string;
  notice_date: string;
  submission_deadline: string;
  status: 'OPEN' | 'CLOSED' | 'AWARDED';
  winner_date?: string; 
  created_by: number;
  created_by_name: string;
}

interface Bid {
  id: string;
  tender?: number;
  tender_id?: number;
  company?: number;
  company_name: string;
  bidding_price: number;
  documents: string;
  submission_date: string;
  status: 'ACCEPTED' | 'REJECTED' | 'PENDING' | string;
  is_winner: boolean;
  awarded_at?: string | null;
  additional_notes?: string;
  company_profile?: {
    company_name: string;
    contact_email: string;
    phone_number?: string;
    address?: string;
    registration_number: string;
    description?: string;
  };
  company_details?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    description: string;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tender-tabpanel-${index}`}
      aria-labelledby={`tender-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const TenderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { tenderId } = useParams<{ tenderId: string }>();
  const [tender, setTender] = useState<Tender | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState<'CITY' | 'COMPANY' | 'public'>('public');
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);
  const [companyDetailsOpen, setCompanyDetailsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectWinnerDialogOpen, setSelectWinnerDialogOpen] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState('');
  
  // New state variables
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmSelectWinnerDialogOpen, setConfirmSelectWinnerDialogOpen] = useState(false);
  const [winningBid, setWinningBid] = useState<Bid | null>(null);
  const [categoryName, setCategoryName] = useState<string>("");

  useEffect(() => {
    // Determine user type from localStorage
    const userTypeFromStorage = localStorage.getItem('userType');
    if (userTypeFromStorage) {
      setUserType(userTypeFromStorage as 'CITY' | 'COMPANY' | 'public');
    } else {
      // Determine user type from URL or default to public
    const path = window.location.pathname;
    if (path.includes('/city/')) {
        setUserType('CITY');
    } else if (path.includes('/company/')) {
        setUserType('COMPANY');
    } else {
      setUserType('public');
      }
    }

    // Determine user role from localStorage
    setUserRole(localStorage.getItem('userRole'));

    fetchTenderAndBids();
  }, [tenderId]);

  // Add function to check if the user has bids for this tender
  const checkForCompanyUserBids = async () => {
    if (userType !== 'COMPANY') return;
    
      const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      // Fetch all user's bids
      const response = await fetch('http://localhost:8000/api/bids/my_bids/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const allBids = await response.json();
        // Check if any of the user's bids are for this tender
        const bidForTender = allBids.find((bid: any) => 
          bid.tender_id === Number(tenderId)
        );
        
        if (bidForTender) {
          console.log('Found bid for tender:', bidForTender);
          // Add this bid to our bids array directly
          setBids([bidForTender]);
          
          // If this is a winning bid, set it
          if (bidForTender.is_winner) {
            setWinningBid(bidForTender);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for company bids:', error);
    }
  };
  
  // Call the function to check for company bids after determining user type
  useEffect(() => {
    if (userType === 'COMPANY') {
      checkForCompanyUserBids();
    }
  }, [userType, tenderId]);

  const fetchTenderAndBids = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token || !tenderId) {
        setError('Missing authentication or tender ID');
        setLoading(false);
        return;
      }
      
      const [tenderResponse, bidsResponse] = await Promise.all([
        fetch(`http://localhost:8000/api/tenders/${tenderId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }),
        fetch(`http://localhost:8000/api/tenders/${tenderId}/bids/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
      ]);
      
      if (!tenderResponse.ok || !bidsResponse.ok) {
        throw new Error(`Failed to fetch data: ${tenderResponse.status} ${bidsResponse.status}`);
      }

      const tenderData = await tenderResponse.json();
      const bidsData = await bidsResponse.json();
      
      console.log("Tender data:", tenderData);
      console.log("Bids data:", bidsData);
      
      setTender(tenderData);
          setBids(bidsData);
      
      // Check if there is a winning bid - using both direct winning_bid relationship and is_winner flag
      const winningBidId = tenderData.winning_bid_id;
      console.log("Winning bid ID from tender:", winningBidId);
      
      if (winningBidId) {
        // If tender has winning_bid_id, find that bid
        const winningBid = bidsData.find((bid: Bid) => bid.id === winningBidId);
        if (winningBid) {
          console.log("Found winning bid by ID:", winningBid);
          setWinningBid(winningBid);
        } else {
          // This is inconsistent state - tender has winning_bid_id but no matching bid found
          console.warn("Tender has winning_bid_id but no matching bid found in bids data");
        }
      } else {
        // Fall back to checking is_winner flag
        const winnerByFlag = bidsData.find((bid: Bid) => bid.is_winner === true);
        if (winnerByFlag) {
          console.log("Found winning bid by is_winner flag:", winnerByFlag);
          setWinningBid(winnerByFlag);
          
          // This indicates an inconsistency - tender doesn't have winning_bid but a bid is marked as winner
          if (tenderData.status !== 'AWARDED') {
            console.warn("Inconsistency: Found bid with is_winner=true but tender status is not AWARDED");
          }
        } else if (tenderData.status === 'AWARDED') {
          // Another inconsistency - tender is AWARDED but no winning bid found
          console.warn("Inconsistency: Tender status is AWARDED but no winning bid found");
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tender and bids:", error);
      setError("Failed to fetch tender details. Please try again.");
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    // Adjust tab index based on available tabs
    const adjustedTabIndex = newValue >= tabValue ? 
      (canViewBids ? newValue : (newValue === 1 ? 0 : newValue - 1)) : 
      newValue;
    setTabValue(adjustedTabIndex);
  };

  const handleSubmitBid = () => {
    navigate(`/company/submit-bid/${tenderId}`);
  };

  const handleGoBack = () => {
    if (userType === 'CITY') {
      navigate('/city');
    } else if (userType === 'COMPANY') {
      navigate('/company/browse-tenders');
    } else {
      navigate('/public/tenders');
    }
  };

  const handleViewDocument = (documentUrl: string) => {
    setDocumentPreviewUrl(documentUrl);
    setDocumentPreviewOpen(true);
  };

  const isDeadlinePassed = (deadline: string): boolean => {
    try {
      if (!deadline) return false;
      
      // Parse the deadline and current date
      const deadlineDate = new Date(deadline);
      const currentDate = new Date();
      
      console.log(`Checking deadline: ${deadline}`);
      console.log(`Parsed deadline: ${deadlineDate.toISOString()}`);
      console.log(`Current date: ${currentDate.toISOString()}`);
      
      // Extract just the date parts (year, month, day) for comparison
      const deadlineDay = new Date(
        deadlineDate.getFullYear(), 
        deadlineDate.getMonth(), 
        deadlineDate.getDate()
      );
      
      const currentDay = new Date(
        currentDate.getFullYear(), 
        currentDate.getMonth(), 
        currentDate.getDate()
      );
      
      console.log(`Deadline day only: ${deadlineDay.toISOString()}`);
      console.log(`Current day only: ${currentDay.toISOString()}`);
      
      // Deadline is considered passed if the deadline date is the same as or before today
      const isPassed = deadlineDay <= currentDay;
      console.log(`Deadline passed? ${isPassed}`);
      
      return isPassed;
    } catch (error) {
      console.error("Error checking deadline:", error);
      return false;
    }
  };

  // Helper function to determine if a winner can be selected
  const canSelectWinner = (): boolean => {
    if (!tender) return false;
    if (userType !== 'CITY') return false;
    if (tender.status === 'AWARDED') return false;
    return isDeadlinePassed(tender.submission_deadline);
  };

  const handleSelectWinner = (bidId: string) => {
    if (!canSelectWinner()) {
      let errorMessage = 'Cannot select a winner at this time.';
      if (tender) {
        if (!isDeadlinePassed(tender.submission_deadline)) {
          errorMessage = `Cannot select winner before submission deadline (${formatDate(tender.submission_deadline)})`;
        } else if (tender.status === 'AWARDED') {
          errorMessage = 'This tender has already been awarded';
        }
      }
      setError(errorMessage);
      return;
    }
    
    setSelectedBidId(bidId);
    setConfirmSelectWinnerDialogOpen(true);
  };

  // Modified to bypass any caching or stale data issues
  const forceRefreshData = async () => {
    console.log("Force refreshing data with direct database queries...");
    
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token || !tenderId) {
        setError('Missing authentication or tender ID');
        setLoading(false);
        return;
      }
      
      // Generate cache-busting timestamp
      const timestamp = Date.now();

      // Reset local state first
      setWinningBid(null);
      
      // Use special caching-busting headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Cache-Bust': `${timestamp}`
      };

      // Try fetching from the public winner API first
      try {
        const publicWinnerResponse = await fetch(`http://localhost:8000/api/public/tenders/${tenderId}/winner?t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
        
        if (publicWinnerResponse.ok) {
          const winnerData = await publicWinnerResponse.json();
          console.log("Found winner info from public API:", winnerData);
          
          // Create a winning bid object from the public data
          const winningBidData = {
            id: winnerData.bid_id,
            tender: Number(tenderId),
            company: Number(winnerData.company_id),
            company_name: winnerData.company_name,
            bidding_price: Number(winnerData.bidding_price),
            is_winner: true,
            awarded_at: winnerData.awarded_at,
            submission_date: new Date().toISOString(), // We don't have this info, but it's required
            documents: '', // Add missing required property
            status: 'ACCEPTED' as const // Add missing required property with a reasonable default
          } as Bid; // Use type assertion
          
          setWinningBid(winningBidData);
          
          // Also update the tender status
          const tenderResponse = await fetch(`http://localhost:8000/api/tenders/${tenderId}/?t=${timestamp+1}`, {
            headers
          });
          
          if (tenderResponse.ok) {
            const tenderData = await tenderResponse.json();
            setTender(tenderData);
          }
          
          // Skip the regular bids fetch since we already have the winner
          setLoading(false);
          return;
        } else {
          console.log("No winner found with public API, falling back to regular fetch");
        }
      } catch (error) {
        console.error("Error fetching from public winner API:", error);
      }

      // First check if any bid for this tender has is_winner=true using SQL
      console.log("Checking for winning bids using direct database access...");
      
      // Fetch all bids for this tender with cache-busting
      const bidsResponse = await fetch(`http://localhost:8000/api/tenders/${tenderId}/bids/?t=${timestamp}`, {
        headers: headers
      });
      
      if (bidsResponse.ok) {
        const bidsData = await bidsResponse.json();
        console.log("Fetched raw bids data:", bidsData);
        
        // Look for a winning bid
        const winningBidData = bidsData.find((bid: Bid) => bid.is_winner === true);
        if (winningBidData) {
          console.log("Found winning bid in bids response:", winningBidData);
          setWinningBid(winningBidData);
          
          // For safety, double-check with the tender API
          const tenderResponse = await fetch(`http://localhost:8000/api/tenders/${tenderId}/?t=${timestamp+1}`, {
            headers: headers
          });
          
          if (tenderResponse.ok) {
            const tenderData = await tenderResponse.json();
            console.log("Tender data from API:", tenderData);
            
            if (tenderData.status === 'AWARDED') {
              console.log("Tender is confirmed as AWARDED in API response");
              setTender(tenderData);
            } else {
              console.warn("Inconsistency: Found winning bid but tender status is not AWARDED");
              // Force the tender status to be consistent with the winning bid
              setTender({
                ...tenderData,
                status: 'AWARDED',
                winner_date: winningBidData.awarded_at
              });
            }
          }
        } else {
          console.log("No winning bid found in bids data");
          setBids(bidsData);
          
          // If no winning bid, check tender status
          const tenderResponse = await fetch(`http://localhost:8000/api/tenders/${tenderId}/?t=${timestamp+2}`, {
            headers: headers
          });
          
          if (tenderResponse.ok) {
            const tenderData = await tenderResponse.json();
            console.log("Tender data when no winning bid found:", tenderData);
            setTender(tenderData);
            
            if (tenderData.status === 'AWARDED') {
              console.warn("Inconsistency: Tender is AWARDED but no winning bid found");
            }
          }
        }
      } else {
        console.error("Failed to fetch bids:", bidsResponse.status, bidsResponse.statusText);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error in forceRefreshData:", error);
      setError("Failed to refresh data. Please try again.");
      setLoading(false);
    }
  };

  const confirmSelectWinner = async () => {
    if (!selectedBidId) return;
    
    try {
      // Get current user type and token
      const currentUserType = localStorage.getItem('userType');
      const token = localStorage.getItem('token');
      
      console.log("Selecting winner. User type:", currentUserType);
      console.log(`Selecting bid ${selectedBidId} as winner for tender ${tenderId}`);
      
      if (currentUserType !== 'CITY') {
        throw new Error('Only city users can select a winner');
      }
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Validate tender data is loaded
      if (!tender) {
        throw new Error('Tender information not loaded');
      }
      
      // Check if deadline has passed
      if (!isDeadlinePassed(tender.submission_deadline)) {
        const formattedDate = formatDate(tender.submission_deadline);
        throw new Error(`Cannot select winner before submission deadline (${formattedDate})`);
      }
      
      // Check if tender is already awarded
      if (tender.status === 'AWARDED') {
        throw new Error('This tender has already been awarded');
      }
      
      // Prepare the request data
      const requestData = { confirmation: true };
      console.log("Making API call to select winner with data:", JSON.stringify(requestData));
      
      try {
        // First make a direct API call to check the current server time and deadline status
        console.log("Checking server time and deadline status...");
        const timeCheckResponse = await fetch("http://localhost:8000/api/server-time/", {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (timeCheckResponse.ok) {
          const timeData = await timeCheckResponse.json();
          console.log("Server time:", timeData.server_time);
          console.log("Tender deadline:", tender.submission_deadline);
          console.log("Server timestamp:", timeData.timestamp);
          console.log("Is deadline passed (client check):", isDeadlinePassed(tender.submission_deadline));
        } else {
          console.warn("Could not check server time:", timeCheckResponse.status);
        }
        
        // Now attempt to select the winner
        console.log(`Sending winner selection request to http://localhost:8000/api/bids/${selectedBidId}/select_winner/`);
      const response = await fetch(`http://localhost:8000/api/bids/${selectedBidId}/select_winner/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: JSON.stringify(requestData)
        });
        
        // Get the full response and log it
        const responseText = await response.text();
        console.log("Raw response:", responseText);
        console.log("Response status:", response.status, response.statusText);
        
        // Try to parse as JSON if possible
        let responseData;
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
          console.log("Parsed response data:", responseData);
        } catch (e) {
          console.log("Could not parse response as JSON:", e);
          responseData = { detail: responseText || 'Unknown error occurred' };
        }
      
      if (!response.ok) {
          console.error("Error selecting winner:", response.status, response.statusText);
          throw new Error(responseData.detail || `Failed to select winner (${response.status}): ${response.statusText}`);
        }
        
        // Close dialog
        setConfirmSelectWinnerDialogOpen(false);
        
        // Show success message
        setActionSuccess('Winner selected successfully! Verifying and refreshing data...');
        
        // Directly check the status of the winning bid to confirm changes were persisted
        console.log(`Checking winner status for bid ${selectedBidId}`);
        let verificationSuccessful = false;
        
        // Try verification up to 3 times with increasing delays
        const verifyAttempts = [500, 1500, 3000]; // milliseconds
        
        for (const delay of verifyAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
          
          try {
            console.log(`Verification attempt after ${delay}ms delay`);
            const verifyResponse = await fetch(`http://localhost:8000/api/bids/${selectedBidId}/check_winner_status/`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              console.log("Winner verification data:", verifyData);
              
              if (verifyData.is_winner === true && verifyData.tender_status === 'AWARDED') {
                console.log("Winner selection verified successfully");
                verificationSuccessful = true;
                
                // Update tender and bid data manually to avoid waiting for refresh
                if (tender) {
                  setTender({
                    ...tender,
                    status: 'AWARDED',
                    winner_date: verifyData.awarded_at
                  });
                }
                
                // Update all bids to mark others as not winners
                const updatedBids = bids.map(bid => ({
                  ...bid,
                  is_winner: bid.id === selectedBidId,
                  status: bid.id === selectedBidId ? 'ACCEPTED' : 'REJECTED'
                }));
                
                setBids(updatedBids);
                
                // Find the selected bid and set it as winning bid
                const selectedBid = bids.find(bid => bid.id === selectedBidId);
                if (selectedBid) {
                  setWinningBid({
                    ...selectedBid,
                    is_winner: true,
                    awarded_at: verifyData.awarded_at,
                    status: 'ACCEPTED'
                  });
                }
                
                // Update action success message
                setActionSuccess('Winner selected and verified successfully!');
                break;
              }
            }
          } catch (verifyError) {
            console.error("Error verifying winner selection:", verifyError);
          }
        }
        
        if (!verificationSuccessful) {
          console.warn("Could not verify winner selection via API. Trying force refresh data.");
          setActionSuccess('Winner selected but needs verification. Refreshing data...');
          
          // If verification fails, use the force refresh function
          setTimeout(() => {
            forceRefreshData();
          }, 1000);
        } else {
          // Full data refresh even after verification
          setTimeout(() => {
      fetchTenderAndBids();
          }, 3000);
        }
      } catch (fetchError: any) {
        console.error('Fetch error:', fetchError);
        throw new Error(`Network error: ${fetchError.message}`);
      }
    } catch (err) {
      console.error('Error selecting winner:', err);
      setError(err instanceof Error ? err.message : 'Failed to select winner. Please try again.');
      setConfirmSelectWinnerDialogOpen(false);
    }
  };
  
  const handleEditTender = () => {
    navigate(`/city/edit-tender/${tenderId}`);
  };
  
  const handleDeleteTender = () => {
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteTender = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/tenders/${tenderId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete tender');
      }
      
      // Close dialog
      setDeleteDialogOpen(false);
      // Navigate back
      navigate('/city', { state: { message: 'Tender deleted successfully' } });
    } catch (err) {
      console.error('Error deleting tender:', err);
      setError('Failed to delete tender. Please try again.');
      setDeleteDialogOpen(false);
    }
  };

  const handleViewCompanyDetails = (bid: Bid) => {
    console.log("Company bid details (full object):", JSON.stringify(bid, null, 2));
    console.log("Company profile:", bid.company_profile);
    
    // Extract all possible company details from various structures
    const normalizedCompany = {
      name: bid.company_name || 
            bid.company_details?.name || 
            'Not provided',
      email: bid.company_profile?.contact_email || 
             (bid as any).contact_email || 
             (bid as any).company_details?.email || 
             'Not provided',
      phone: bid.company_profile?.phone_number || 
             (bid as any).phone_number || 
             (bid as any).company_details?.phone || 
             'Not provided',
      address: bid.company_profile?.address || 
               (bid as any).address || 
               (bid as any).company_details?.address || 
               'Not provided',
      registration_number: bid.company_profile?.registration_number || 
                          (bid as any).registration_number || 
                          'Not provided',
      description: (bid.company_profile?.description !== null && bid.company_profile?.description !== undefined) 
                    ? bid.company_profile.description 
                    : (bid as any).description !== null && (bid as any).description !== undefined
                      ? (bid as any).description
                      : (bid as any).company_details?.description !== null && (bid as any).company_details?.description !== undefined
                        ? (bid as any).company_details?.description 
                        : 'No description provided.'
    };
    
    console.log("Normalized company data:", JSON.stringify(normalizedCompany, null, 2));
    
    setSelectedCompany(normalizedCompany);
    setCompanyDetailsOpen(true);
  };

  // Update loading and error handling with deadline checks
  useEffect(() => {
    if (tender && userType === 'CITY' && !isDeadlinePassed(tender.submission_deadline)) {
      console.log("City user viewing tender with future deadline - showing warning");
    }
  }, [tender, userType]);

  if (loading) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (!tender) {
    return (
      <PageContainer>
        <ContentWrapper>
          <Alert severity="error">Tender not found or you don't have access.</Alert>
          <Button onClick={handleGoBack} variant="contained" sx={{ mt: 2 }}>
            Go Back
          </Button>
        </ContentWrapper>
      </PageContainer>
    );
  }

  const canEditDelete = userType === 'CITY' && 
                       tender.status === 'OPEN' && 
                       !isDeadlinePassed(tender.submission_deadline);

  // Update the canViewBids logic to specifically handle company users with bids
  const canViewBids = userType === 'CITY' || 
                     (userType === 'COMPANY' && bids.length > 0);

  return (
    <PageContainer>
      <ContentWrapper>
        <TopSection>
          <ImageContainer>
            <img
              src="/icon1.png"
              alt="Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </ImageContainer>
          <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
            {tender.title}
          </Typography>
          <Chip 
            label={tender.status} 
            color={
              tender.status === 'OPEN' 
                ? 'success' 
                : tender.status === 'AWARDED' 
                  ? 'primary' 
                  : 'default'
            }
            sx={{ mb: 1 }}
          />
        </TopSection>

        <HeaderSection>
          <Button variant="outlined" onClick={handleGoBack} sx={{ mr: 1 }}>
            Back
          </Button>
          
          <Box>
            {userType === 'COMPANY' && tender.status === 'OPEN' && !isDeadlinePassed(tender.submission_deadline) && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSubmitBid}
            >
              Submit Bid
            </Button>
          )}
            
            {canEditDelete && (
              <>
                <Tooltip title="Edit Tender">
                  <IconButton 
                    color="primary" 
                    onClick={handleEditTender}
                    sx={{ ml: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete Tender">
                  <IconButton 
                    color="error" 
                    onClick={handleDeleteTender}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </HeaderSection>

        {actionSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionSuccess('')}>
            {actionSuccess}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {userType === 'COMPANY' && !canViewBids && tender.status === 'OPEN' && !isDeadlinePassed(tender.submission_deadline) && (
          <Alert severity="info" sx={{ my: 2 }}>
            You don't have any bids for this tender yet. Submit a bid to view the Bids tab.
          </Alert>
        )}

        {userType === 'COMPANY' && !canViewBids && (isDeadlinePassed(tender.submission_deadline) || tender.status !== 'OPEN') && (
          <Alert severity="info" sx={{ my: 2 }}>
            You didn't submit any bids for this tender.
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Details" />
            {canViewBids && <Tab label="Bids" />}
            <Tab label="History" icon={<HistoryIcon fontSize="small" />} iconPosition="end" />
            {winningBid && (
              <Tab 
                label="Winner" 
                icon={<EmojiEventsIcon fontSize="small" />}
                iconPosition="end"
              />
            )}
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <TenderInfoCard>
            <Typography variant="h6" gutterBottom>
              Tender Information
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                <Typography variant="body1">{tender.category}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Budget</Typography>
                <Typography variant="body1">${parseFloat(tender.budget).toLocaleString()}</Typography>
            </Box>
            
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Posted on</Typography>
                <Typography variant="body1">{formatDate(tender.notice_date)}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Submission Deadline</Typography>
                <Typography variant="body1">{formatDate(tender.submission_deadline)}</Typography>
            </Box>
            
              {tender.status === 'AWARDED' && tender.winner_date && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Awarded on</Typography>
                  <Typography variant="body1">{formatDate(tender.winner_date)}</Typography>
            </Box>
              )}
            
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Created by</Typography>
                <Typography variant="body1">{tender.created_by_name}</Typography>
              </Box>
            </Box>
            
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {tender.description}
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Requirements
            </Typography>
            <Typography variant="body1" paragraph>
              {tender.requirements || 'No specific requirements provided.'}
            </Typography>
          </TenderInfoCard>
        </TabPanel>

        {canViewBids && (
          <TabPanel value={tabValue} index={1}>
            {userType === 'CITY' && tender.status !== 'AWARDED' && !isDeadlinePassed(tender.submission_deadline) && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                You cannot select a winner until after the submission deadline on {formatDate(tender.submission_deadline)}.
              </Alert>
            )}
            {userType === 'CITY' && tender.status === 'AWARDED' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                This tender has already been awarded.
              </Alert>
            )}
            {bids.length > 0 ? (
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Company</TableCell>
                      <TableCell align="right">Bid Amount</TableCell>
                      <TableCell>Documents</TableCell>
                      <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                      {canSelectWinner() && (
                        <TableCell align="center">Action</TableCell>
                      )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bids.map((bid) => (
                    <TableRow key={bid.id}>
                        <TableCell component="th" scope="row">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <BusinessIcon 
                              sx={{ mr: 1, color: 'primary.main', cursor: 'pointer' }} 
                              onClick={() => handleViewCompanyDetails(bid)}
                            />
                            {userType === 'COMPANY' ? 'Your Company' : bid.company_name}
                            {bid.is_winner && (
                        <Chip 
                          size="small"
                                label="Winner" 
                                color="primary" 
                                sx={{ ml: 1 }}
                                icon={<EmojiEventsIcon />}
                        />
                            )}
                          </Box>
                      </TableCell>
                        <TableCell align="right">
                          ${bid.bidding_price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                              <Button
                                size="small"
                                startIcon={<DescriptionIcon />}
                                onClick={() => handleViewDocument(bid.documents)}
                              >
                            View
                              </Button>
                        </TableCell>
                        <TableCell>{formatDate(bid.submission_date)}</TableCell>
                        <TableCell>
                          <Chip
                            label={bid.status}
                            color={
                              bid.status === 'ACCEPTED'
                                ? 'success'
                                : bid.status === 'REJECTED'
                                  ? 'error'
                                  : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        {canSelectWinner() && (
                          <TableCell align="center">
                              <Button
                              variant="outlined"
                                size="small"
                              color="primary"
                                onClick={() => handleSelectWinner(bid.id)}
                              >
                                Select as Winner
                              </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            ) : (
              <Alert severity="info">
                {userType === 'COMPANY' 
                  ? "You haven't submitted any bids for this tender yet." 
                  : "No bids have been submitted for this tender yet."}
              </Alert>
            )}
          </TabPanel>
        )}

        <TabPanel value={tabValue} index={canViewBids ? 2 : 1}>
          <TenderHistory tenderId={tenderId || ''} />
        </TabPanel>

        {winningBid && (
          <TabPanel value={tabValue} index={canViewBids ? 3 : 2}>
            <WinningBidInfo 
              bidId={winningBid.id}
              companyName={winningBid.company_name}
              biddingPrice={winningBid.bidding_price}
              submissionDate={winningBid.submission_date}
              awardDate={tender.winner_date}
              companyProfile={winningBid.company_profile}
            />
          </TabPanel>
        )}

      <Dialog 
        open={documentPreviewOpen} 
        onClose={() => setDocumentPreviewOpen(false)}
          maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
            {documentPreviewUrl && (
              <iframe 
                src={documentPreviewUrl}
                width="100%"
                height="500px"
                style={{ border: 'none' }}
                title="Document Preview"
              />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentPreviewOpen(false)}>Close</Button>
            {documentPreviewUrl && (
          <Button 
                href={documentPreviewUrl} 
            target="_blank"
                rel="noopener noreferrer"
                color="primary"
          >
                Open in New Tab
          </Button>
            )}
        </DialogActions>
      </Dialog>

        <ConfirmationDialog
          open={confirmSelectWinnerDialogOpen}
          title="Confirm Select Winner"
          message="Are you sure you want to select this bid as the winner?"
          detail="This action cannot be undone and will close the tender."
          confirmText="Select Winner"
          severity="warning"
          onConfirm={confirmSelectWinner}
          onCancel={() => setConfirmSelectWinnerDialogOpen(false)}
        />
        
        <ConfirmationDialog
          open={deleteDialogOpen}
          title="Delete Tender"
          message="Are you sure you want to delete this tender?"
          detail="This action cannot be undone and will permanently remove this tender and all associated bids."
          confirmText="Delete"
          severity="error"
          onConfirm={confirmDeleteTender}
          onCancel={() => setDeleteDialogOpen(false)}
        />

      <Dialog
          open={companyDetailsOpen}
          onClose={() => setCompanyDetailsOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon color="primary" />
            Contact Information
          </DialogTitle>
        <DialogContent>
            {selectedCompany && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Company
          </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedCompany.name || selectedCompany.company_name || 'Not provided'}
                </Typography>
                
                <Typography variant="subtitle1" fontWeight="bold">
                  Contact Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedCompany.email || selectedCompany.contact_email || 'Not provided'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {selectedCompany.phone || selectedCompany.phone_number || 'Not provided'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Address:</strong> {selectedCompany.address || 'Not provided'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Registration Number:</strong> {selectedCompany.registration_number || 'Not provided'}
                  </Typography>
                </Box>
                
                <Typography variant="subtitle1" fontWeight="bold">
                  Company Description
                </Typography>
                <Typography variant="body2">
                  {selectedCompany.description || 'No description provided.'}
                </Typography>
              </Box>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setCompanyDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      </ContentWrapper>
    </PageContainer>
  );
};

export default TenderDetail; 