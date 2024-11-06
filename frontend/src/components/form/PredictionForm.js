// src/components/PredictionForm/PredictionForm.js

import React, { useRef, useState } from 'react';
import axios from 'axios';
import ModalSave from '../Modal/ModalSave';
import ModalNew from '../Modal/ModalNew';
import { db } from '../../firebase';
import {
  collection,
  addDoc,
  Timestamp,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { UserAuth } from '../../context/AuthContext'; 
import {
  FaArrowRight,
  FaArrowLeft,
  FaUserMd,
  FaHeart,
  FaCheckCircle,
  FaInfoCircle,
} from 'react-icons/fa';

// Utility function to check if all required fields have values
function hasAllValues(obj) {
  const requiredFields = [
    'lastname',
    'firstname',
    'age',
    'sex',
    'blood_pressure_systolic',
    'blood_pressure_diastolic',
    'cholesterol_level',
    'weight',
    'height',
    'BMI',
    'history_of_stroke',
  ];
  return requiredFields.every((field) => obj[field] && obj[field] !== '');
}

const PredictionForm = () => {
  // Default state for form details
  const defaultDetails = {
    lastname: '',
    firstname: '',
    age: '',
    sex: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    cholesterol_level: '',
    weight: '',
    height: '',
    BMI: '',
    history_of_stroke: '',
  };

  // Access the authenticated user from AuthContext
  const { user } = UserAuth(); 

  // Modal visibility states
  const [modalNew, setModalNew] = useState(false);
  const [modalSave, setModalSave] = useState(false);

  // Prediction results and form details
  const [results, setResults] = useState('');
  const [details, setDetails] = useState(defaultDetails);

  // Reference to the form for resetting
  const formRef = useRef(null);

  // Current step state (1: Personal Details, 2: Medical Details, 3: Prediction Results)
  const [currentStep, setCurrentStep] = useState(1);

  // Reference to prevent multiple submissions
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setDetails((prev) => {
      const updatedDetails = { ...prev, [name]: value };

      // Automatically calculate BMI when weight and height are provided
      if (name === 'weight' || name === 'height') {
        const weight = parseFloat(updatedDetails.weight);
        const height = parseFloat(updatedDetails.height) / 100; // Convert cm to meters
        if (weight > 0 && height > 0) {
          const bmi = weight / (height * height);
          updatedDetails.BMI = bmi.toFixed(2);
        } else {
          updatedDetails.BMI = '';
        }
      }

      return updatedDetails;
    });
  };

  const API_URL = process.env.REACT_APP_API_URL; 

  // Handle form submission to get prediction results
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions

    // Extract and parse input values
    const age = parseFloat(details.age);
    const bpSyst = parseFloat(details.blood_pressure_systolic);
    const bpDias = parseFloat(details.blood_pressure_diastolic);
    const chol = parseFloat(details.cholesterol_level);
    const bmiValue = parseFloat(details.BMI);

    // Validation Rules
    const validationErrors = [];

    if (isNaN(age) || age < 18 || age > 98) {
      validationErrors.push('Age must be between 18 and 98 years.');
    }
    if (isNaN(bpSyst) || bpSyst < 90 || bpSyst > 210) {
      validationErrors.push('Systolic Blood Pressure must be between 90 and 210 mm Hg.');
    }
    if (isNaN(bpDias) || bpDias < 60 || bpDias > 120) {
      validationErrors.push('Diastolic Blood Pressure must be between 60 and 120 mm Hg.');
    }
    if (isNaN(chol) || chol < 1.02 || chol > 10.8) {
      validationErrors.push('Cholesterol Level must be between 1.02 and 10.8 mmol/L.');
    }
    if (isNaN(bmiValue) || bmiValue < 18.02 || bmiValue > 36.96) {
      validationErrors.push('BMI must be between 18.02 and 36.96 kg/m².');
    }

    if (validationErrors.length > 0) {
      validationErrors.forEach((err) => toast.error(err, {
        style: {
          fontSize: '1rem',
          padding: '0.75rem',
        },
      }));
      return;
    }

    setIsSubmitting(true);
    const formattedDetails = {
      Age: age,
      BP_Syst: bpSyst,
      BP_Dias: bpDias,
      Chol: chol,
      BMI: bmiValue,
      Stroke: details.history_of_stroke === 'Yes' ? 1 : 0,
    };
    console.log('Sending data to backend:', formattedDetails);
    try {
      const response = await axios.post(
        `${API_URL}/predict`, 
        formattedDetails
      );
      console.log('Received response from backend:', response.data);

      const { prediction, percentage, risk_level } = response.data;

      setResults({
        prediction,
        percentage,
        risk_level,
      });
      setCurrentStep(3); // Move to Prediction Results step
      toast.success('Prediction completed.', {
        style: {
          fontSize: '1rem',
          padding: '0.75rem',
        },
      });
    } catch (error) {
      console.error('There was an error making the request:', error);
      const errorMsg = error.response && error.response.data && error.response.data.error
        ? error.response.data.error
        : 'Failed to fetch prediction results.';
      toast.error(errorMsg, {
        style: {
          fontSize: '1rem',
          padding: '0.75rem',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle saving data to Firestore
  const handleSaveData = async () => {
    try {
      if (!hasAllValues(details)) {
        console.log('Incomplete Details:', details);
        return toast.error('Incomplete Details', {
          style: {
            fontSize: '1rem',
            padding: '0.75rem',
          },
        });
      }

      if (!user) {
        console.log('User is not authenticated.');
        return toast.error('User is not authenticated.', {
          style: {
            fontSize: '1rem',
            padding: '0.75rem',
          },
        });
      }

      toast.loading('Saving data...', {
        id: 'loadingResults',
        style: {
          fontSize: '1rem',
          padding: '0.75rem',
        },
      });

      const patientsRef = collection(db, 'patients');

      // **Check if patient exists**
      const q = query(
        patientsRef,
        where('firstname', '==', details.firstname),
        where('lastname', '==', details.lastname),
        where('userid', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      let patientDocRef;

      if (!querySnapshot.empty) {
        // **Patient exists**
        patientDocRef = querySnapshot.docs[0].ref;
      } else {
        // **Patient does not exist, create new patient document**
        const newPatientDocRef = await addDoc(patientsRef, {
          firstname: details.firstname,
          lastname: details.lastname,
          age: parseInt(details.age, 10),
          sex: details.sex,
          userid: user.uid,
          createdAt: Timestamp.now(),
        });
        patientDocRef = newPatientDocRef;
      }

      // **Parse the necessary variables here**
      const bpSyst = parseFloat(details.blood_pressure_systolic);
      const bpDias = parseFloat(details.blood_pressure_diastolic);
      const chol = parseFloat(details.cholesterol_level);
      const bmiValue = parseFloat(details.BMI);

      const recordData = {
        blood_pressure_systolic: bpSyst, 
        blood_pressure_diastolic: bpDias, 
        cholesterol_level: chol, 
        weight: parseFloat(details.weight),
        height: parseFloat(details.height),
        BMI: bmiValue,
        history_of_stroke: details.history_of_stroke,
        timestamp: Timestamp.now(),
        risk_result: results.prediction,
        risk_percentage: results.percentage,
        risk_level: results.risk_level, 
        userid: user.uid,
      };
      console.log('Saving record data:', recordData);

      const recordsRef = collection(patientDocRef, 'records');
      await addDoc(recordsRef, recordData);

      toast.dismiss('loadingResults');
      toast.success('Saved Successfully', {
        style: {
          fontSize: '1rem',
          padding: '0.75rem',
        },
      });

      handleResetForm();
    } catch (err) {
      console.error('Error in handleSaveData:', err);
      toast.error(err.message || 'Failed to save patient data.', {
        style: {
          fontSize: '1rem',
          padding: '0.75rem',
        },
      });
      toast.dismiss('loadingResults');
    }
  };

  // Reset the form and state
  const handleResetForm = () => {
    if (formRef.current) {
      formRef.current.reset();
    }
    setDetails(defaultDetails);
    setResults('');
    setCurrentStep(1);
  };

  // If the user is not authenticated, prompt to log in
  if (!user) {
    return (
      <div className='flex justify-center items-center h-screen px-4 sm:px-6'>
        <div className='text-center max-w-md'>
          <h2 className='text-lg sm:text-xl md:text-2xl font-bold text-gray-700 mb-4'>
            Please log in to use the Prediction Form.
          </h2>
        </div>
      </div>
    );
  }

  // Render Step 1: Personal Details
  const renderStepOne = () => (
    <div className='bg-white rounded-lg shadow-lg border-2 border-gray-200 px-8 py-6 sm:px-8 sm:py-8'>
      <div className='flex items-center mb-4'>
        <FaUserMd className='text-[#00717A] mr-2 text-xl' />
        <span className='text-[#00717A] font-bold text-lg sm:text-xl'>Step 1: Patient's Personal Details</span>
      </div>
      <hr className='border-gray-300 my-4' />
      <p className='text-gray-600 mb-4 text-sm sm:text-base'>
        Please enter the patient's personal information to proceed to the medical details.
      </p>
      <form
        className='mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'
      >
        {/* Last Name and First Name */}
        <div className='flex flex-col sm:flex-row sm:col-span-2 gap-4 sm:gap-6'>
          {/* Last Name */}
          <div className='flex flex-col sm:w-1/2'>
            <label className='text-gray-700 font-semibold text-sm mb-1' style={{ textAlign: 'left' }}>
              Patient's Last Name:
            </label>
            <input
              type='text'
              className='bg-gray-100 h-12 sm:h-10 rounded-sm px-4 sm:px-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#00717A]'
              name='lastname'
              value={details.lastname}
              onChange={handleFormChange}
              required
              placeholder='Enter last name'
            />
          </div>

          {/* First Name */}
          <div className='flex flex-col sm:w-1/2'>
            <label className='text-gray-700 font-semibold text-sm mb-1' style={{ textAlign: 'left' }}>
              Patient's First Name:
            </label>
            <input
              type='text'
              className='bg-gray-100 h-12 sm:h-10 rounded-sm px-4 sm:px-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#00717A]'
              name='firstname'
              value={details.firstname}
              onChange={handleFormChange}
              required
              placeholder='Enter first name'
            />
          </div>
        </div>

        {/* Age and Sex */}
        <div className='flex flex-col sm:flex-row sm:col-span-2 gap-4 sm:gap-6'>
          {/* Age */}
          <div className='flex flex-col sm:w-1/2'>
            <label className='text-gray-700 font-semibold text-sm mb-1' style={{ textAlign: 'left' }}>
              Patient's Age:
            </label>
            <input
              type='number'
              min='18'
              max='98'
              className='bg-gray-100 h-12 sm:h-10 w-full rounded-sm px-4 sm:px-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#00717A]'
              name='age'
              value={details.age}
              onChange={handleFormChange}
              required
              placeholder='Enter age (18-98)'
            />
          </div>
          {/* Sex */}
          <div className='flex flex-col sm:w-1/2'>
            <label className='text-gray-700 font-semibold text-sm mb-1' style={{ textAlign: 'left' }}>Patient's Sex:</label>
            <select
              className='bg-gray-100 h-12 sm:h-10 w-full rounded-sm px-4 sm:px-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#00717A]'
              onChange={handleFormChange}
              required
              name='sex'
              value={details.sex}
            >
              <option value='' disabled>
                Select
              </option>
              <option value='Male'>Male</option>
              <option value='Female'>Female</option>
            </select>
          </div>
        </div>

        {/* Next Button */}
        <div className='flex justify-end col-span-1 sm:col-span-2'>
          <button
            type='button'
            onClick={() => {
              const { firstname, lastname, age, sex } = details;
              if (!firstname || !lastname || !age || !sex) {
                return toast.error('Please fill all patient personal details.', {
                  style: {
                    fontSize: '1rem',
                    padding: '0.75rem',
                  },
                });
              }
              setCurrentStep(2);
            }}
            className='bg-[#00717A] text-white font-semibold px-6 py-3 sm:px-6 sm:py-2 rounded-md hover:bg-[#005f61] flex items-center transition-colors duration-200 w-full sm:w-auto'
            aria-label="Proceed to Medical Details"
          >
            Next <FaArrowRight className='ml-2' />
          </button>
        </div>
      </form>
    </div>
  );

  // Render Step 2: Medical Details
  const renderStepTwo = () => (
    <div className='bg-white rounded-lg shadow-lg border-2 border-gray-200 px-6 sm:px-8 py-6 sm:py-8'>
      <div className='flex items-center mb-4'>
        <FaHeart className='text-[#00717A] mr-2 text-xl' />
        <span className='text-[#00717A] font-bold text-lg sm:text-xl'>Step 2: Patient's Medical Details</span>
      </div>
      <hr className='border-gray-300 my-4' />
      <p className='text-gray-600 mb-4 text-sm sm:text-base'>
        Please provide the patient's medical information to receive an accurate prediction.
      </p>
      <form
        className='mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'
        onSubmit={handleSubmit}
        ref={formRef}
      >
        {/* Blood Pressure */}
        <div className='flex flex-col sm:flex-row gap-4 sm:gap-6 items-center col-span-1 sm:col-span-2'>
          <div className='flex flex-col sm:w-1/2'>
            <label className='text-gray-700 font-semibold text-sm mb-1' style={{ textAlign: 'left' }}>
              Systolic (mm Hg):
            </label>
            <input
              type='number'
              min='90'
              max='210'
              className='bg-gray-100 h-10 sm:h-10 w-full rounded-sm px-4 sm:px-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#00717A]'
              name='blood_pressure_systolic'
              value={details.blood_pressure_systolic}
              onChange={handleFormChange}
              required
              placeholder='Systolic (90-210)'
            />
          </div>
          <div className='flex flex-col sm:w-1/2'>
            <label className='text-gray-700 font-semibold text-sm mb-1' style={{ textAlign: 'left' }}>
              Diastolic (mm Hg):
            </label>
            <input
              type='number'
              min='60'
              max='120'
              className='bg-gray-100 h-10 sm:h-10 w-full rounded-sm px-4 sm:px-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#00717A]'
              name='blood_pressure_diastolic'
              value={details.blood_pressure_diastolic}
              onChange={handleFormChange}
              required
              placeholder='Diastolic (60-120)'
            />
          </div>
        </div>

        {/* Cholesterol Level and History of Stroke */}
        <div className='flex flex-col sm:flex-row gap-4 sm:gap-6 col-span-1 sm:col-span-2'>
          {/* Cholesterol Level */}
          <div className='flex flex-col sm:w-1/2 w-full'>
            <label className='text-gray-700 font-semibold text-sm mb-1' style={{ textAlign: 'left' }}>
              Total Cholesterol (mmol/L):
            </label>
            <input
              type='number'
              min='1.02'
              max='10.8'
              step='0.01'
              className='bg-gray-100 h-10 sm:h-10 w-full rounded-sm px-4 sm:px-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#00717A]'
              name='cholesterol_level'
              value={details.cholesterol_level}
              onChange={handleFormChange}
              required
              placeholder='Cholesterol Level (1.02-10.8)'
            />
          </div>
          {/* History of Stroke */}
          <div className='flex flex-col sm:w-1/2 w-full'>
            <label className='text-gray-700 font-semibold text-sm mb-1' style={{ textAlign: 'left' }}>
              History of Stroke:
            </label>
            <select
              className='bg-gray-100 h-10 sm:h-10 w-full rounded-sm px-4 sm:px-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#00717A]'
              name='history_of_stroke'
              value={details.history_of_stroke}
              onChange={handleFormChange}
              required
            >
              <option value='' disabled>
                Select
              </option>
              <option value='Yes'>Yes</option>
              <option value='No'>No</option>
            </select>
          </div>
        </div>

        {/* Weight, Height, and BMI */}
        <div className='flex flex-col sm:flex-row gap-4 sm:gap-6 col-span-1 sm:col-span-2'>
          {/* Weight */}
          <div className='flex flex-col sm:w-1/3 w-full'>
            <label className='text-gray-700 font-semibold text-sm mb-1' style={{ textAlign: 'left' }}>
              Weight (kg):
            </label>
            <input
              type='number'
              min='0'
              step='0.1'
              className='bg-gray-100 h-10 sm:h-10 w-full rounded-sm px-4 sm:px-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#00717A]'
              name='weight'
              value={details.weight}
              onChange={handleFormChange}
              required
              placeholder='Enter weight'
            />
          </div>
          {/* Height */}
          <div className='flex flex-col sm:w-1/3 w-full'>
            <label className='text-gray-700 font-semibold text-sm mb-1' style={{ textAlign: 'left' }}>
              Height (cm):
            </label>
            <input
              type='number'
              min='0'
              step='0.1'
              className='bg-gray-100 h-10 sm:h-10 w-full rounded-sm px-4 sm:px-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#00717A]'
              name='height'
              value={details.height}
              onChange={handleFormChange}
              required
              placeholder='Enter height'
            />
          </div>
          {/* BMI */}
          <div className='flex flex-col sm:w-1/3 w-full'>
            <label className='text-gray-700 font-semibold text-sm mb-1' style={{ textAlign: 'left' }}>
              BMI (kg/m²):
            </label>
            <input
              type='text'
              className='bg-gray-200 h-10 sm:h-10 w-full rounded-sm px-4 sm:px-3 text-sm sm:text-base focus:outline-none'
              name='BMI'
              value={details.BMI}
              readOnly
              placeholder='BMI will be calculated'
            />
          </div>
        </div>

        {/* Buttons */}
        <div className='flex flex-col sm:flex-row sm:justify-between col-span-1 sm:col-span-2 mt-4 gap-4'>
          {/* Back Button */}
          <button
            type='button'
            onClick={() => setCurrentStep(1)}
            className='bg-[#00717A] text-white font-semibold px-6 py-2 rounded-md hover:bg-[#005f61] flex items-center transition-colors duration-200 w-full sm:w-auto'
            aria-label="Go Back to Personal Details"
          >
            <FaArrowLeft className='mr-2' /> Back
          </button>

          {/* Submit Button */}
          <button
            type='submit'
            className='bg-[#00717A] text-white font-semibold px-6 py-2 rounded-md hover:bg-[#005f61] flex items-center transition-colors duration-200 w-full sm:w-auto'
            aria-label="Run Prediction"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Run Prediction'} <FaArrowRight className='ml-2' />
          </button>
        </div>
      </form>
    </div>
  );

  // Render Step 3: Prediction Results
  const renderStepThree = () => {
    // Function to determine badge color based on risk level
    const getRiskColor = (level) => {
      switch (level) {
        case 'Low Risk':
          return 'bg-green-500';
        case 'Moderate Risk':
          return 'bg-yellow-500';
        case 'High Risk':
          return 'bg-orange-500';
        case 'Very High Risk':
          return 'bg-red-500';
        default:
          return 'bg-gray-500';
      }
    };

    return (
      <div className='bg-white rounded-lg shadow-lg border-2 border-gray-200 px-6 py-6 sm:px-8 sm:py-8'>
        <div className='flex items-center mb-4'>
          <FaCheckCircle className='text-[#28a745] mr-2 text-xl' />
          <span className='text-[#28a745] font-bold text-lg sm:text-xl'>Step 3: Prediction Results</span>
        </div>
        <hr className='border-gray-300 my-4' />
        <div className='flex items-center mb-6 flex-col sm:flex-row sm:items-center'>
          <FaHeart className='text-[#00717A] mr-2 text-xl mb-2 sm:mb-0' />
          <div className='text-gray-700 font-medium text-lg sm:text-xl text-center sm:text-left'>
            <p className='mb-2'>
              Based on the provided data, the patient is predicted to be <strong>{results.prediction}</strong> to Ischemic Heart Disease with a risk percentage of <strong>{results.percentage.toFixed(2)}%</strong>.
            </p>
            <p>
              This categorizes the patient as <span className={`text-white px-1 py-1 rounded ${getRiskColor(results.risk_level)}`}>
                {results.risk_level}
              </span>.
            </p>
          </div>
        </div>
        <div className='flex flex-col sm:flex-row justify-end gap-4'>
          <button
            onClick={() => setModalSave(true)}
            type='button'
            className='bg-[#00717A] rounded-md text-white font-semibold px-6 py-2 sm:px-6 sm:py-2 text-sm hover:bg-[#005f61] focus:outline-none focus:ring-2 focus:ring-[#005f61] transition-colors duration-200 w-full sm:w-auto'
            aria-label="Save Prediction"
          >
            Save
          </button>
          <button
            onClick={() => setModalNew(true)}
            type='button'
            className='bg-[#00717A] rounded-md text-white font-semibold px-6 py-2 sm:px-6 sm:py-2 text-sm hover:bg-[#005f61] focus:outline-none focus:ring-2 focus:ring-[#005f61] transition-colors duration-200 w-full sm:w-auto'
            aria-label="Enter New Data"
          >
            Enter New Data
          </button>
        </div>
      </div>
    );
  };

  // Render Reference Table for Risk Categories
  const renderReferenceTable = () => (
    <div className='bg-white rounded-lg shadow-lg border-2 border-gray-200 px-8 py-6 mt-6'>
      <div className='flex items-center mb-4'>
        <FaInfoCircle className='text-[#00717A] mr-2 text-xl' />
        <span className='text-[#00717A] font-bold text-lg'>Risk Categories Reference</span>
      </div>
      <hr className='border-gray-300 my-4' />
      {/* Informative Text with Hyperlink */}
      <p className='text-gray-600 mb-4 text-sm sm:text-base'>
        This reference table is based on the <a href="https://iris.who.int/bitstream/handle/10665/43786/9789241547253_eng.pdf?sequence=1" target="_blank" rel="noopener noreferrer" className='text-blue-500 underline'>
          World Health Organization (WHO)
        </a> guidelines for assessment and management of total cardiovascular risk.
      </p>
      {/* Reference Table */}
      <div className='overflow-x-auto'>
        <table className='min-w-full bg-white border-collapse'>
          <thead>
            <tr>
              <th className='px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border'>
                Risk Category
              </th>
              <th className='px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border'>
                Risk Percentage
              </th>
              <th className='px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border'>
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Low Risk */}
            <tr className='bg-white hover:bg-gray-50 transition-colors duration-200'>
              <td className='px-6 py-4 whitespace-nowrap border'>
                <span className='flex items-center'>
                  <span className='inline-block w-2 h-2 bg-blue-500 rounded-full mr-2'></span>
                  Low Risk
                </span>
              </td>
              <td className='px-6 py-4 whitespace-nowrap border'>Less than 10%</td>
              <td className='px-6 py-4 whitespace-nowrap border'>
                Individuals in this category are at low risk. Low risk does not mean “no” risk. Conservative management focusing on lifestyle interventions is suggested.
              </td>
            </tr>
            {/* Moderate Risk */}
            <tr className='bg-gray-50 hover:bg-gray-100 transition-colors duration-200'>
              <td className='px-6 py-4 whitespace-nowrap border'>
                <span className='flex items-center'>
                  <span className='inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2'></span>
                  Moderate Risk
                </span>
              </td>
              <td className='px-6 py-4 whitespace-nowrap border'>10% to less than 20%</td>
              <td className='px-6 py-4 whitespace-nowrap border'>
                Individuals in this category are at moderate risk of fatal or non-fatal vascular events. Monitor risk profile every 6–12 months.
              </td>
            </tr>
            {/* High Risk */}
            <tr className='bg-white hover:bg-gray-50 transition-colors duration-200'>
              <td className='px-6 py-4 whitespace-nowrap border'>
                <span className='flex items-center'>
                  <span className='inline-block w-2 h-2 bg-orange-500 rounded-full mr-2'></span>
                  High Risk
                </span>
              </td>
              <td className='px-6 py-4 whitespace-nowrap border'>20% to less than 30%</td>
              <td className='px-6 py-4 whitespace-nowrap border'>
                Individuals in this category are at high risk of fatal or non-fatal vascular events. Monitor risk profile every 3–6 months.
              </td>
            </tr>
            {/* Very High Risk */}
            <tr className='bg-gray-50 hover:bg-gray-100 transition-colors duration-200'>
              <td className='px-6 py-4 whitespace-nowrap border'>
                <span className='flex items-center'>
                  <span className='inline-block w-2 h-2 bg-red-500 rounded-full mr-2'></span>
                  Very High Risk
                </span>
              </td>
              <td className='px-6 py-4 whitespace-nowrap border'>More than 30%</td>
              <td className='px-6 py-4 whitespace-nowrap border'>
                Individuals in this category are at very high risk of fatal or non-fatal vascular events. Monitor risk profile every 3–6 months.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className='flex justify-center flex-col gap-6 mt-4 pt-6 pb-10 px-4 sm:px-6 md:px-10 lg:px-20'>
      {/* Header */}
      <div className='flex justify-center'>
        <h1 className='text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-2 mt-2 text-[#00717A] uppercase'>
          ISCHEMIC HEART DISEASE PREDICTION
        </h1>
      </div>

      {/* Instruction Text */}
      <div className='text-center px-2 sm:px-4'>
        <p className='text-gray-600 text-sm sm:text-base'>
          Please complete the form below to receive a prediction on the patient's risk for Ischemic Heart Disease. The form is divided into three steps: Personal Details, Medical Details, and Prediction Results. Ensure all required fields are filled out accurately.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className='flex justify-center mb-6 px-2 sm:px-4'>
        <div className='flex items-center space-x-2 sm:space-x-4'>
          {/* Step 1 */}
          <div className='flex items-center'>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 1 ? 'bg-[#00717A] text-white' : 'bg-gray-400 text-white'}`}>
              <FaUserMd />
            </div>
            <div className={`w-8 sm:w-16 h-1 ${currentStep > 1 ? 'bg-[#00717A]' : 'bg-gray-400'}`}></div>
          </div>
          {/* Step 2 */}
          <div className='flex items-center'>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 2 ? 'bg-[#00717A] text-white' : 'bg-gray-400 text-white'}`}>
              <FaHeart />
            </div>
            <div className={`w-8 sm:w-16 h-1 ${currentStep > 2 ? 'bg-[#00717A]' : 'bg-gray-400'}`}></div>
          </div>
          {/* Step 3 */}
          <div className='flex items-center'>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 3 ? 'bg-[#28a745] text-white' : 'bg-gray-400 text-white'}`}>
              <FaCheckCircle />
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Form Steps */}
      {currentStep === 1 && renderStepOne()}
      {currentStep === 2 && renderStepTwo()}
      {currentStep === 3 && (
        <>
          {renderStepThree()}
          {renderReferenceTable()}
        </>
      )} 

      {/* Modal Components */}
      {modalSave && (
        <ModalSave setModalSave={setModalSave} handleSaveData={handleSaveData} />
      )}
      {modalNew && (
        <ModalNew setModalNew={setModalNew} handleResetForm={handleResetForm} />
      )}
    </div>
  );
};

export default PredictionForm;