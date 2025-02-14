import React, { useState, useEffect, useMemo } from 'react';
import { IoSearch } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { UserAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import debounce from 'lodash.debounce';

const PredictionTable = () => {
  // State variables
  const [patients, setPatients] = useState([]); // Original patient data
  const [filteredPatients, setFilteredPatients] = useState([]); // Filtered and sorted data
  const [loading, setLoading] = useState(true); // Loading state
  const [searchTerm, setSearchTerm] = useState(''); // Search term
  const [sortBy, setSortBy] = useState('Date'); // Sort criterion: 'Name' or 'Date'
  const { user } = UserAuth(); // Authenticated user

  // Pagination state variables
  const [currentPage, setCurrentPage] = useState(1); // Tracks the current page
  const patientsPerPage = 10; // Number of patients per page

  const navigate = useNavigate();

  // Debounced search term setter to optimize performance
  const debouncedSetSearchTerm = useMemo(
    () => debounce((term) => setSearchTerm(term), 300),
    []
  );

  // Cleanup debounce on component unmount
  useEffect(() => {
    return () => {
      debouncedSetSearchTerm.cancel();
    };
  }, [debouncedSetSearchTerm]);

  // Fetch patients from Firestore in real-time
  useEffect(() => {
    if (!user) {
      console.log('No authenticated user found.');
      setLoading(false);
      return;
    }

    console.log(`Fetching patients for UID: ${user.uid}`);
    setLoading(true);

    // Define the query on the 'patients' collection
    const q = query(
      collection(db, 'patients'),
      where('userid', '==', user.uid),
      orderBy('createdAt', 'desc') // Ordering by creation date descending
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedPatients = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data(),
        }));
        console.log('Fetched Patients:', fetchedPatients);
        setPatients(fetchedPatients);
        setFilteredPatients(fetchedPatients);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching patients:', error);
        toast.error(`Failed to fetch patients: ${error.message}`, {
          style: {
            fontSize: '0.875rem', // 14px
            padding: '0.5rem', // 8px
          },
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Filter and sort patients based on search term and sort criteria
  useEffect(() => {
    const processPatients = () => {
      let results = [...patients];

      // **Search Filtering**
      if (searchTerm) {
        const lowercasedTerm = searchTerm.toLowerCase();

        results = results.filter((item) => {
          return (
            (item.data.firstname &&
              item.data.firstname.toLowerCase().includes(lowercasedTerm)) ||
            (item.data.lastname &&
              item.data.lastname.toLowerCase().includes(lowercasedTerm))
          );
        });
      }

      // **Sorting**
      if (sortBy === 'Name') {
        results.sort((a, b) => {
          const lastNameA = a.data.lastname.toLowerCase();
          const lastNameB = b.data.lastname.toLowerCase();

          if (lastNameA < lastNameB) return -1;
          if (lastNameA > lastNameB) return 1;

          const firstNameA = a.data.firstname.toLowerCase();
          const firstNameB = b.data.firstname.toLowerCase();

          if (firstNameA < firstNameB) return -1;
          if (firstNameA > firstNameB) return 1;

          return 0; // Names are identical
        });
      } else if (sortBy === 'Date') {
        results.sort(
          (a, b) => b.data.createdAt.seconds - a.data.createdAt.seconds
        );
      }

      setFilteredPatients(results);
    };

    processPatients();
  }, [patients, searchTerm, sortBy]);

  // **Reset to First Page when searchTerm or sortBy changes**
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  // **Handle Row Click to Navigate to Details**
  const handleRowClick = (patient) => {
    // Navigate to patient details using patient ID
    console.log('Navigating to Patient Details with ID:', patient.id);
    navigate(`/patient-details/${patient.id}`);
  };

  // **Calculate Paginated Data**
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(
    indexOfFirstPatient,
    indexOfLastPatient
  );
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  // Loading Spinner Logic
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
          <span className="text-lg text-[#00717A]">Loading Patients' Records</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center flex-col gap-4 mt-1 pt-4 pb-8 px-4 md:px-6 lg:px-10">
      {/* Header */}
      <div className="flex justify-center">
        <h1 className="text-lg md:text-2xl lg:text-4xl font-bold text-center mb-1 text-[#00717A] uppercase">
          Patients' Records
        </h1>
      </div>

      {/* Search and Sort Controls */}
      <div className="bg-[#00717A] rounded-md px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center py-2">
          {/* Search Input */}
          <div className="relative w-full md:w-2/5 lg:w-2/5 mb-3 md:mb-0">
            <input
              type="text"
              placeholder="Search patient by name"
              className="h-8 px-3 rounded-2xl w-full focus-visible:outline-0 text-sm"
              onChange={(e) => debouncedSetSearchTerm(e.target.value)}
              aria-label="Search patients by name"
            />
            <IoSearch
              className="absolute right-2 top-2 text-[#d0d0d0]"
              size={14}
              aria-hidden="true"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="bg-white rounded-2xl flex items-center gap-1 px-2 py-1 max-w-xs">
            <span className="text-sm text-gray-800">View By:</span>
            <select
              className="outline-none focus:outline-none text-sm bg-transparent w-auto border border-gray-300 rounded hover:border-gray-400 focus:border-[#00717A] focus:ring-2 focus:ring-[#00717A]"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort patients by"
            >
              <option value="Name">Name</option>
              <option value="Date">Date</option>
            </select>
          </div>
        </div>

        {/* Instruction Note */}
        <p className="text-sm text-white mt-2">
          Click on a patient to view full details.
        </p>

        {/* Patient Data Table */}
        <div className="overflow-x-auto relative mt-6 mb-4">
          <div
            className="rounded-lg overflow-hidden shadow mx-auto"
            style={{ maxWidth: '1200px' }}
          >
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="bg-[#299FA8] text-white">
                  <th className="font-medium py-3 px-1">Last Name</th>
                  <th className="font-medium py-3 px-1">First Name</th>
                  <th className="font-medium py-3 px-1">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3" className="text-center text-sm py-2">
                      Loading...
                    </td>
                  </tr>
                ) : currentPatients.length > 0 ? (
                  currentPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className={`bg-white text-center font-medium hover:bg-[#c6fbff] cursor-pointer transition-transform transform-gpu duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#00717A]`}
                      onClick={() => handleRowClick(patient)}
                      tabIndex="0"
                      role="row"
                      aria-label={`View details for patient ${patient.data.firstname} ${patient.data.lastname}`}
                      title="View Details" // Tooltip
                    >
                      {/* Last Name */}
                      <td className="font-medium py-2 px-1">
                        {patient.data.lastname}
                      </td>
                      {/* First Name */}
                      <td className="font-medium py-2 px-1">
                        {patient.data.firstname}
                      </td>
                      {/* Date */}
                      <td className="font-medium py-2 px-1">
                        {patient.data.createdAt
                          ? new Date(
                              patient.data.createdAt.seconds * 1000
                            ).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center text-white text-sm py-2">
                      No patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {!loading && filteredPatients.length > patientsPerPage && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-2 py-0.5 mx-1 rounded text-xs ${
                currentPage === 1
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[#00717A] text-white hover:bg-[#005f61]'
              }`}
              aria-label="Previous Page"
            >
              Previous
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (number) => (
                <button
                  key={number}
                  onClick={() => setCurrentPage(number)}
                  className={`px-2 py-0.5 mx-1 rounded text-xs ${
                    currentPage === number
                      ? 'bg-[#005f61] text-white'
                      : 'bg-[#00717A] text-white hover:bg-[#005f61]'
                  }`}
                  aria-label={`Go to Page ${number}`}
                >
                  {number}
                </button>
              )
            )}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`px-2 py-0.5 mx-1 rounded text-xs ${
                currentPage === totalPages
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[#00717A] text-white hover:bg-[#005f61]'
              }`}
              aria-label="Next Page"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionTable;