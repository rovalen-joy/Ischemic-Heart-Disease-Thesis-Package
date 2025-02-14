import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../../context/AuthContext';
import { FaUserPlus, FaSave } from 'react-icons/fa';
import Joyride, { EVENTS, STATUS } from 'react-joyride';
import { FaHeartPulse } from "react-icons/fa6";

const HomePage = () => {
  const { userData } = UserAuth(); // Get the user data from AuthContext
  const [runTour, setRunTour] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const firstLogin = localStorage.getItem('firstLogin');
    if (!firstLogin) {
      setRunTour(true); // Start the Joyride tour
      localStorage.setItem('firstLogin', 'true');
    }
  }, []);

  // Listen for the 'restartJoyride' event to restart the tour
  useEffect(() => {
    const handleRestart = () => {
      setRunTour(true);
    };

    window.addEventListener('restartJoyride', handleRestart);

    return () => {
      window.removeEventListener('restartJoyride', handleRestart);
    };
  }, []);

  // Define the steps for the guided tour
  const steps = [
    {
      target: '.joyride-welcome',
      content: `Welcome to the IHD Prediction System, Dr. ${userData?.firstName || 'User'}! This tour will guide you through the key features of the system.`,
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.joyride-steps',
      content: 'Here are the main steps to use the system effectively:',
      placement: 'top',
    },
    {
      target: '.joyride-step1',
      content: "Step 1: Fill in the Patient's Information. Enter comprehensive patient data to generate accurate predictions.",
      placement: 'right',
    },
    {
      target: '.joyride-step2',
      content: 'Step 2: Generate Prediction. Use the prediction form to assess the patient’s risk of ischemic heart disease.',
      placement: 'right',
    },
    {
      target: '.joyride-step3',
      content: 'Step 3: Save and Review. Save predictions for future reference and review past assessments anytime.',
      placement: 'right',
    },
    {
      target: '.joyride-hamburger-menu',
      content: 'This is the hamburger menu. Click here to navigate through different sections of the system.',
      placement: 'bottom',
    },
    {
      target: '.joyride-restart-tour-target',
      content: 'Need a refresher? Click the "Get Started" button to restart the guided tour at any time.',
      placement: 'center',
      spotlightPadding: 0,
      disableBeacon: true,
    },
    {
      target: '.joyride-disclaimer-target',
      content: (
        <div style={{ textAlign: 'justify' }}>
          <p style={{ color: 'red', fontWeight: 'bold' }}>Disclaimer:</p>
          <p>
            The IHD Prediction System is intended to support the assessment of ischemic heart disease risk. It does not provide diagnoses or treatment recommendations. All medical decisions should be made by qualified healthcare professionals.
          </p>
        </div>
      ),
      placement: 'center',
      spotlightPadding: 0,
      disableBeacon: true,
    },
  ];

  // Handle Joyride callback events
  const handleJoyrideCallback = (data) => {
    const { status, type } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
    }

    if (type === EVENTS.TOUR_END) {
      setRunTour(false);
    }
  };

  // Function to start the tour manually
  const startTour = () => {
    setRunTour(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center relative px-4 pb-4 joyride-container">
      {/* Joyride Component */}
      <Joyride
        steps={steps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        locale={{
          last: 'Got it',
        }}
        styles={{
          options: {
            zIndex: 10000,
          },
          buttonNext: {
            backgroundColor: '#05747F', // color for "Next" button
            color: 'white',
          },
          buttonBack: {
            color: '#757575', // color for "Back" button
          },
          buttonClose: {
            color: '#ff0000', // color for "Close" button
          },
          buttonSkip: {
            color: '#ff0000', // color for "Skip" button
          },
          buttonPrimary: {
            backgroundColor: '#05747F', // color for "Got it" button
            color: 'white',
          },
        }}
      />

      {/* Hidden target for restarting tour */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0 h-0 joyride-restart-tour-target"></div>

      {/* Hidden target for disclaimer */}
      <div className="absolute top-0 left-0 w-0 h-0 joyride-disclaimer-target"></div>

      {/* Header */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-6 text-[#353535] mt-10 leading-tight joyride-welcome text-center">
        Welcome, Dr. {userData?.firstName || 'User'} {userData?.lastName || ''}!
      </h1>

      {/* Introduction */}
      <div className="max-w-4xl text-center mb-10 px-4">
        <p className="text-base sm:text-lg text-gray-700 mb-4">
          The IHD Prediction System enables you to assess your patients' risk of ischemic heart disease using comprehensive data inputs. Our tools assist you in making informed decisions to improve patient care.
        </p>
        <p className="text-base sm:text-lg text-gray-700 mb-6">
          Get acquainted with the system by clicking the "Get Started" button below:
        </p>

        {/* Get Started Button */}
        <button
          onClick={startTour}
          className="bg-[#05747F] text-white py-2 px-6 rounded-lg font-medium hover:bg-[#035f62] transition-colors duration-200 joyride-get-started"
          title="Start the guided tour"
        >
          Get Started
        </button>
      </div>

      {/* Steps with Icons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl joyride-steps px-4">
        {/* Step 1 */}
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center joyride-step1">
          <FaUserPlus className="text-3xl sm:text-4xl text-[#05747F] mb-4" />
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-[#353535] text-center">
            1. Fill in the Patient's Information
          </h2>
          <p className="text-sm sm:text-base text-gray-600 text-center">
            Enter patient data such as age, cholesterol levels, and blood pressure to generate accurate predictions.
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center joyride-step2">
          <FaHeartPulse className="text-3xl sm:text-4xl text-[#05747F] mb-4" />
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-[#353535] text-center">
            2. Generate Prediction
          </h2>
          <p className="text-sm sm:text-base text-gray-600 text-center">
            Use our prediction form to assess the patient’s risk of ischemic heart disease and review the results.
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center joyride-step3">
          <FaSave className="text-3xl sm:text-4xl text-[#05747F] mb-4" />
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-[#353535] text-center">
            3. Save and Review
          </h2>
          <p className="text-sm sm:text-base text-gray-600 text-center">
            Save predictions for future reference and review past assessments at any time in Patient's Records.
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-10 mb-2 flex flex-col md:flex-row gap-4 px-4">
        {/* Prediction Form Button */}
        <button
          className="bg-[#05747F] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#035f62] transition-colors duration-200 joyride-prediction-form w-full md:w-auto"
          onClick={() => navigate('/prediction-form')}
          title="Fill in patient details to generate a prediction"
        >
          Go to Prediction Form
        </button>

        {/* System Analytics Button */}
        <button
          className="bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200 joyride-patient-history w-full md:w-auto"
          onClick={() => navigate('/analytics')}
          title="View saved system analytics and data insights"
        >
          View System Analytics
        </button>
      </div>
    </div>
  );
};

export default HomePage;