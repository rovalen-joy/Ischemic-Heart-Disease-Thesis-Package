import React from 'react'; 
import Login from './components/Registration/Login';
import SignUp from './components/Registration/Sign_Up';
import ForgotPassword from './components/Registration/ForgotPassword'; 
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthContextProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PredictionForm from './components/form/PredictionForm';
import PredictionTable from './components/table/PredictionTable';
import PatientDetails from './components/table/PatientDetails'; 
import Layout from './components/Layout/Layout';
import AboutUs from './components/AboutUs/AboutUs'; 
import HomePage from './components/HomePage/HomePage';
import FAQ from './components/Faq/Faq';
import Profile from './components/Profile/Profile';
import PrivacyPolicy from './components/PrivacyPolicy/PrivacyPolicy';
import TermsOfUse from './components/TermsOfUse/TermsUse';
import Analytics from './components/Analytics/Analytics';

function App() {
  return (
    <Router>
      <AuthContextProvider>
        <Routes>
          {/* Public Routes */}
          <Route path='/' element={<Login />} />
          <Route path='/signup' element={<SignUp />} />
          <Route path='/forgot-password' element={<ForgotPassword />} /> 
          
          {/* Public Routes for Terms and Privacy */}
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Protected Routes */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path='/home' element={<HomePage />} />
            <Route path='/prediction-form' element={<PredictionForm />} />
            <Route path='/prediction-table' element={<PredictionTable />} />
            <Route path='/about-us' element={<AboutUs />} />
            <Route path='/faq' element={<FAQ />} /> 
            <Route path='/profile' element={<Profile />} />
            <Route path='/analytics' element={<Analytics />} />
          </Route>

          {/* PatientDetails */}
          <Route path='/patient-details/:id' element={<PatientDetails />} /> 
        </Routes>
      </AuthContextProvider>
    </Router>
  );
}

export default App;