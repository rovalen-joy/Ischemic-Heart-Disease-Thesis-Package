import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../firebase';
import {
  doc,
  collection,
  getDoc,
  getDocs,
  orderBy,
  query,
  deleteDoc,
} from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { UserAuth } from '../../context/AuthContext';

const PatientDetails = () => {
  const { id } = useParams(); // Retrieve patient ID from URL
  const { user } = UserAuth(); // Access authenticated user from context
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null); // Track selected record for deletion
  const [isDeletePatientModalOpen, setIsDeletePatientModalOpen] = useState(false); // Track patient deletion modal
  const navigate = useNavigate();
  const recordModalRef = useRef(null);
  const patientModalRef = useRef(null);

  useEffect(() => {
    const fetchPatientAndRecords = async () => {
      try {
        console.log('Authenticated User:', user);
        console.log('Patient ID:', id);

        if (!user) {
          throw new Error('User not authenticated.');
        }

        // Fetch patient data
        const patientRef = doc(db, 'patients', id);
        const patientSnap = await getDoc(patientRef);

        if (patientSnap.exists()) {
          const patientData = patientSnap.data();
          console.log("Fetched patient data: ", patientData);
          
          // Check if 'userid' field exists
          if (!patientData.userid) {
            throw new Error("Patient document is missing 'userid' field.");
          }

          console.log('Authenticated UID:', user.uid);
          console.log('Patient UID:', patientData.userid);

          // Check if the authenticated user's UID matches the patient's userid
          if (patientData.userid !== user.uid) {
            throw new Error("Unauthorized: Patient userid does not match authenticated user.");
          }

          setPatient({ id: patientSnap.id, data: patientData });

          // Fetch records subcollection
          const recordsRef = collection(db, 'patients', id, 'records');
          const q = query(recordsRef, orderBy('timestamp', 'desc'));
          const recordsSnap = await getDocs(q);

          const recordsData = recordsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          console.log("Fetched records: ", recordsData);
          setRecords(recordsData);

        } else {
          console.log('No such patient document!');
          toast.error('Patient not found.');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error fetching patient and records:', error);
        if (error.code) {
          console.error('Error Code:', error.code);
        }
        if (error.message) {
          console.error('Error Message:', error.message);
        }
        toast.error(`Failed to fetch patient details: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientAndRecords();
  }, [id, user]);

  // **Handle Record Deletion Modal**
  useEffect(() => {
    const handleClickOutsideRecord = (event) => {
      if (recordModalRef.current && !recordModalRef.current.contains(event.target)) {
        setSelectedRecord(null);
      }
    };

    if (selectedRecord) {
      document.addEventListener('mousedown', handleClickOutsideRecord);
    } else {
      document.removeEventListener('mousedown', handleClickOutsideRecord);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideRecord);
    };
  }, [selectedRecord]);

  // **Handle Patient Modal Outside Click**
  useEffect(() => {
    const handleClickOutsidePatient = (event) => {
      if (patientModalRef.current && !patientModalRef.current.contains(event.target)) {
        setIsDeletePatientModalOpen(false);
      }
    };

    if (isDeletePatientModalOpen) {
      document.addEventListener('mousedown', handleClickOutsidePatient);
    } else {
      document.removeEventListener('mousedown', handleClickOutsidePatient);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsidePatient);
    };
  }, [isDeletePatientModalOpen]);

  // **Handle Deletion of a Prediction Record**
  const handleDeleteRecord = async () => {
    if (!selectedRecord) return;

    try {
      const recordDocRef = doc(db, 'patients', patient.id, 'records', selectedRecord.id);
      await deleteDoc(recordDocRef);

      // Remove the deleted record from the state
      setRecords((prevRecords) => prevRecords.filter((rec) => rec.id !== selectedRecord.id));
      setSelectedRecord(null); // Close the modal

      toast.success('Prediction record deleted successfully.');
    } catch (error) {
      console.error('Error deleting prediction record:', error);
      if (error.code) {
        console.error('Error Code:', error.code);
      }
      if (error.message) {
        console.error('Error Message:', error.message);
      }
      toast.error(`Failed to delete prediction record: ${error.message}`);
    }
  };

  // **Handle Deletion of the Patient**
  const handleDeletePatient = async () => {
    try {
      if (!patient) {
        throw new Error('Patient data is missing.');
      }

      // Delete all records in the 'records' subcollection
      const recordsRef = collection(db, 'patients', patient.id, 'records');
      const recordsSnap = await getDocs(recordsRef);
      const deletePromises = recordsSnap.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete the patient document
      const patientDocRef = doc(db, 'patients', patient.id);
      await deleteDoc(patientDocRef);

      toast.success('Patient and all records deleted successfully.');
      navigate('/prediction-table'); // Redirect back to the table
    } catch (error) {
      console.error('Error deleting patient record:', error);
      if (error.code) {
        console.error('Error Code:', error.code);
      }
      if (error.message) {
        console.error('Error Message:', error.message);
      }
      toast.error(`Failed to delete patient record: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div role="status" aria-live="polite" className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-[#00717A] mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <span className="text-lg text-[#00717A]">Loading Patient Details...</span>
        </div>
      </div>
    );
  }
  
  if (!patient) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-lg">No patient data available.</p>
        <button
          onClick={() => navigate('/prediction-table')}
          className="mt-3 px-8 py-3 bg-[#00717A] text-white rounded-sm hover:bg-[#005f61] focus:outline-none focus:ring-2 focus:ring-[#005f61] text-sm"
          aria-label="Go Back to Table"
        >
          Back
        </button>
      </div>
    );
  }

  const { data } = patient;

  return (
    <div className="flex flex-col items-center p-4 mt-6 relative w-full max-w-6xl mx-auto">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-6 text-[#00717A]">Patient's Detail</h1>

      {/* Unified Container for Patient Info and Prediction History */}
      <div className="w-full bg-white shadow-md rounded-md p-6 border-2 border-[#299FA8]">

        {/* Combined Patient Name, Age, and Sex in One Row */}
        <div className="flex flex-row justify-between w-full mb-6">
          {/* Patient Name */}
          <div className="flex flex-col">
            <strong>Patient Name:</strong>
            <span>{`${data.lastname}, ${data.firstname}`}</span>
          </div>
          {/* Age */}
          <div className="flex flex-col">
            <strong>Age:</strong>
            <span>{data.age}</span>
          </div>
          {/* Sex */}
          <div className="flex flex-col">
            <strong>Sex:</strong>
            <span>{data.sex}</span>
          </div>
        </div>

        {/* Prediction History */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-[#00717A]">Prediction History</h3>
          {records.length === 0 ? (
            <p className="text-gray-700">No prediction records found for this patient.</p>
          ) : (
            <div className="overflow-x-auto relative">
              <table className="min-w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-[#299FA8] text-white">
                    <th className="px-4 py-2 border">Date &amp; Time</th>
                    <th className="px-4 py-2 border">Blood Pressure</th>
                    <th className="px-4 py-2 border">Cholesterol Level</th>
                    <th className="px-4 py-2 border">BMI</th>
                    <th className="px-4 py-2 border">Weight</th>
                    <th className="px-4 py-2 border">Height</th>
                    <th className="px-4 py-2 border">History of Stroke</th>
                    <th className="px-4 py-2 border">Risk Result</th>
                    <th className="px-4 py-2 border">Risk Percentage</th>
                    <th className="px-4 py-2 border">Risk Level</th> 
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      className="bg-white text-center font-medium hover:bg-gray-100 transition-colors duration-200 cursor-pointer relative"
                      onClick={() => setSelectedRecord(record)}
                      tabIndex="0"
                      role="row"
                      aria-label={`View details for record on ${record.timestamp ? format(record.timestamp.toDate(), 'MM/dd/yyyy') : 'N/A'}`}
                      title="View Details" // Tooltip
                    >
                      <td className="px-4 py-2 border">
                        {record.timestamp
                          ? format(record.timestamp.toDate(), 'MM/dd/yyyy HH:mm')
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-2 border">
                        {record.blood_pressure_systolic && record.blood_pressure_diastolic
                          ? `${record.blood_pressure_systolic}/${record.blood_pressure_diastolic}`
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-2 border">{record.cholesterol_level}</td>
                      <td className="px-4 py-2 border">
                        {record.BMI !== undefined && record.BMI !== null
                          ? record.BMI
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-2 border">{record.weight}</td>
                      <td className="px-4 py-2 border">{record.height}</td>
                      <td className="px-4 py-2 border">
                        {record.history_of_stroke}
                      </td>
                      <td className="px-4 py-2 border">
                        {typeof record.risk_result === 'number'
                          ? `${record.risk_result.toFixed(2)}%`
                          : record.risk_result}
                      </td>
                      <td className="px-4 py-2 border">
                        {typeof record.risk_percentage === 'number'
                          ? `${record.risk_percentage.toFixed(2)}%`
                          : record.risk_percentage || 'N/A'}
                      </td>
                      <td className="px-4 py-2 border">
                        {record.risk_level ? record.risk_level : 'N/A'}
                      </td> 
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-6xl flex justify-between mt-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/prediction-table')}
          className="flex items-center justify-center px-8 py-3 bg-[#00717A] text-white rounded-sm hover:bg-[#005f61] focus:outline-none focus:ring-2 focus:ring-[#005f61] text-lg"
          aria-label="Back"
        >
          Back
        </button>

        {/* Delete Patient Button */}
        <button
          onClick={() => setIsDeletePatientModalOpen(true)}
          className="flex items-center justify-center px-8 py-3 bg-[#DA4B4B] text-white rounded-sm hover:bg-[#b33a3a] focus:outline-none focus:ring-2 focus:ring-[#b33a3a] text-lg"
          aria-label="Delete Patient"
        >
          Delete Patient
        </button>
      </div>

      {/* **Delete Record Confirmation Modal** */}
      {selectedRecord && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div
            className="bg-white shadow-lg rounded-md p-6 border-2 border-red-500 w-11/12 max-w-md pointer-events-auto"
            ref={recordModalRef}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-xl font-semibold text-red-600 mb-3">
              Confirm Deletion
            </h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this prediction record? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-sm hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Cancel Deletion"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRecord}
                className="px-3 py-1 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label="Confirm Deletion"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* **Delete Patient Confirmation Modal** */}
      {isDeletePatientModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div
            className="bg-white shadow-lg rounded-md p-6 border-2 border-red-500 w-11/12 max-w-md pointer-events-auto"
            ref={patientModalRef}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-xl font-semibold text-red-600 mb-3">
              Confirm Deletion
            </h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this patient and all associated records? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeletePatientModalOpen(false)}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-sm hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Cancel Deletion"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePatient}
                className="px-3 py-1 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label="Confirm Deletion"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetails;