import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import LoginForm from './pages/LoginForm';
import CityDashboard from './pages/CityDashboard';
import NewTender from './pages/city/NewTender';
import ManageTenders from './pages/city/ManageTenders';
import BrowseTender from './pages/city/BrowseTender';
import SelectWinner from './pages/city/SelectWinner';
import CompanyDashboard from './pages/CompanyDashboard';
import SubmitBid from './pages/company/SubmitBid';
import MyBids from './pages/company/MyBids';
import BrowseTenders from './pages/company/BrowseTenders';
import CompanyProfile from './pages/company/CompanyProfile';
import TenderResults from './pages/company/TenderResults';
import CitizenView from './pages/CitizenView';
import { ThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CompanyRegister from './pages/auth/CompanyRegister';
import Layout from './components/Layout';
import TenderDetail from './pages/city/TenderDetail';
import PublicTenders from './pages/public/PublicTenders';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login/:userType" element={<Login />} />
              <Route path="/auth/:userType" element={<LoginForm />} />
              <Route path="/city" element={<CityDashboard />} />
              <Route path="/city/new-tender" element={<NewTender />} />
              <Route path="/city/modify-tender" element={<ManageTenders />} />
              <Route path="/city/browse-tender" element={<BrowseTender />} />
              <Route path="/city/select-winner" element={<SelectWinner />} />
              <Route path="/city/tenders/:tenderId" element={<TenderDetail />} />
              <Route path="/company" element={<CompanyDashboard />} />
              <Route path="/company/submit-bid/:tenderId" element={<SubmitBid />} />
              <Route path="/company/my-bids" element={<MyBids />} />
              <Route path="/company/browse-tenders" element={<BrowseTenders />} />
              <Route path="/company/profile" element={<CompanyProfile />} />
              <Route path="/company/tender-results" element={<TenderResults />} />
              <Route path="/citizen" element={<CitizenView />} />
              <Route path="/browse-tenders" element={<CitizenView />} />
              <Route path="/register/company" element={<CompanyRegister />} />
              <Route path="/public/tenders" element={<PublicTenders />} />
              <Route path="/tenders/:tenderId" element={<TenderDetail />} />
            </Routes>
          </Layout>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
