import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../firebase';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { UserAuth } from '../../context/AuthContext';
import { FaChartLine, FaInfoCircle } from 'react-icons/fa';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css'; 
import './Analytics.css'; 

import { MdExpandMore, MdExpandLess } from 'react-icons/md';

const scatterFeatures = [
  { value: 'Age', label: 'Age (yrs)' },
  { value: 'BMI', label: 'BMI' },
  { value: 'Blood_Pressure_Systolic', label: 'Systolic BP (mmHg)' },
  { value: 'Blood_Pressure_Diastolic', label: 'Diastolic BP (mmHg)' },
  { value: 'Cholesterol_Level', label: 'Cholesterol Level (mmol/L)' },
  { value: 'History_of_Stroke', label: 'History of Stroke' }, 
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#33AA99', '#AA9933', '#9933AA'];

// Colors for Pie Chart representing Risk Categories
const RISK_COLORS = ['#82ca9d', '#8884d8', '#ffc658', '#ff8042'];

const Analytics = () => {
  const { user } = UserAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Timeframe Selection
  const [selectedTimeframe, setSelectedTimeframe] = useState('Month'); // Default timeframe

  // Collapsible states for each chart
  const [isAgeChartOpen, setIsAgeChartOpen] = useState(false);
  const [isGenderChartOpen, setIsGenderChartOpen] = useState(false);
  const [isBMICategoriesChartOpen, setIsBMICategoriesChartOpen] = useState(false);

  // State for Scatter Plot feature selection
  const [scatterX, setScatterX] = useState('Age');
  const [scatterY, setScatterY] = useState('Cholesterol_Level');

  // Fetch patients and their records from Firestore
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        if (!user) {
          throw new Error('User not authenticated.');
        }

        const patientsRef = collection(db, 'patients');
        const q = query(patientsRef, where('userid', '==', user.uid));

        const querySnapshot = await getDocs(q);
        const fetchedPatients = [];

        // Fetch all patients and their records
        for (const docSnap of querySnapshot.docs) {
          const patientData = docSnap.data();
          const recordsRef = collection(db, 'patients', docSnap.id, 'records');
          const recordsSnapshot = await getDocs(recordsRef);
          const records = recordsSnapshot.docs.map(rec => rec.data());
          fetchedPatients.push({ ...patientData, records });
        }

        setPatients(fetchedPatients);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching patients:', error);
        toast.error(`Failed to fetch patients: ${error.message}`);
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user]);

  // Helper function to get ISO week number
  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getFullYear(),0,1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    return weekNo;
  }

  // Memoize aggregated data to optimize performance
  const aggregatedData = useMemo(() => {
    if (patients.length === 0) return {};

    // Age Distribution
    const ageBuckets = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81+': 0,
    };

    // Gender Ratio
    let male = 0;
    let female = 0;

    // BMI Statistics
    let totalBMI = 0;
    let bmiCount = 0;
    let highBMI = 0; // Obese (>30)
    let overweightBMI = 0; // Overweight (25-29.9)
    let normalBMI = 0; // Normal (18.5-24.9)
    let lowBMI = 0; // Underweight (<18.5)

    // Risk Assessment
    let lowRisk = 0;
    let moderateRisk = 0;
    let highRisk = 0;
    let veryHighRisk = 0; // Added Very High Risk

    // Health Metrics
    let totalBP_Systolic = 0;
    let totalBP_Diastolic = 0;
    let bpCount = 0;
    let totalCholesterol = 0;
    let cholesterolCount = 0;
    let strokeYes = 0;
    let strokeNo = 0;

    // Trend Data
    const trendMap = {};

    // Patient Counts Over Time
    const dailyCounts = {};
    const weeklyCounts = {};
    const monthlyCounts = {};
    const yearlyCounts = {};

    patients.forEach(patient => {
      const age = parseInt(patient.age, 10);
      if (age <= 20) ageBuckets['0-20'] += 1;
      else if (age <= 40) ageBuckets['21-40'] += 1;
      else if (age <= 60) ageBuckets['41-60'] += 1;
      else if (age <= 80) ageBuckets['61-80'] += 1;
      else ageBuckets['81+'] += 1;

      // Gender
      if (patient.sex === 'Male') male += 1;
      else if (patient.sex === 'Female') female += 1;

      // Records
      patient.records.forEach(record => {
        const bmi = parseFloat(record.BMI);
        if (bmi) {
          totalBMI += bmi;
          bmiCount += 1;
          if (bmi > 30) highBMI += 1; // Obese
          else if (bmi >= 25 && bmi <= 29.9) overweightBMI += 1; // Overweight
          else if (bmi >= 18.5 && bmi <= 24.9) normalBMI += 1; // Normal
          else if (bmi < 18.5) lowBMI += 1; // Underweight
        }

        // Risk Assessment
        if (record.risk_result === 'Low') lowRisk += 1;
        else if (record.risk_result === 'Moderate') moderateRisk += 1;
        else if (record.risk_result === 'High') highRisk += 1;
        else if (record.risk_result === 'Very High') veryHighRisk += 1; // Handle Very High Risk

        // Health Metrics
        const bp_systolic = parseFloat(record.blood_pressure_systolic);
        const bp_diastolic = parseFloat(record.blood_pressure_diastolic);
        if (bp_systolic && bp_diastolic) {
          totalBP_Systolic += bp_systolic;
          totalBP_Diastolic += bp_diastolic;
          bpCount += 1;
        }

        const cholesterol = parseFloat(record.cholesterol_level);
        if (cholesterol) {
          totalCholesterol += cholesterol;
          cholesterolCount += 1;
        }

        if (record.history_of_stroke === 'Yes') strokeYes += 1;
        else if (record.history_of_stroke === 'No') strokeNo += 1;

        // Trend Data
        const date = record.timestamp ? new Date(record.timestamp.seconds * 1000) : null;
        if (date) {
          const month = `${date.getMonth() + 1}/${date.getFullYear()}`;
          trendMap[month] = (trendMap[month] || 0) + 1;

          // Daily Counts
          const day = date.toISOString().split('T')[0];
          dailyCounts[day] = (dailyCounts[day] || 0) + 1;

          // Weekly Counts
          const weekNumber = getWeekNumber(date);
          const weekKey = `${date.getFullYear()}-W${weekNumber}`;
          weeklyCounts[weekKey] = (weeklyCounts[weekKey] || 0) + 1;

          // Monthly Counts
          monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;

          // Yearly Counts
          const year = date.getFullYear();
          yearlyCounts[year] = (yearlyCounts[year] || 0) + 1;
        }
      });
    });

    const ageData = Object.keys(ageBuckets).map(key => ({
      ageRange: key,
      count: ageBuckets[key],
    }));

    const genderData = [
      { name: 'Male', value: male },
      { name: 'Female', value: female },
    ];

    const averageBMI = bmiCount === 0 ? 0 : (totalBMI / bmiCount).toFixed(2);
    const bmiData = [
      { name: 'Average BMI', value: parseFloat(averageBMI) },
      { name: 'Obese (>30)', value: highBMI }, 
      { name: 'Overweight (25-29.9)', value: overweightBMI },
      { name: 'Normal (18.5-24.9)', value: normalBMI },
      { name: 'Underweight (<18.5)', value: lowBMI }, 
    ];

    const riskData = [
      { name: 'Low Risk', value: lowRisk },
      { name: 'Moderate Risk', value: moderateRisk },
      { name: 'High Risk', value: highRisk },
      { name: 'Very High Risk', value: veryHighRisk }, 
    ];

    const trendArray = Object.keys(trendMap).map(month => ({
      month,
      predictions: trendMap[month],
    }));

    // Sort trend data chronologically
    trendArray.sort((a, b) => {
      const [monthA, yearA] = a.month.split('/').map(Number);
      const [monthB, yearB] = b.month.split('/').map(Number);
      if (yearA !== yearB) return yearA - yearB;
      return monthA - monthB;
    });

    // Patient Counts Over Time Data
    const dailyData = Object.keys(dailyCounts).map(day => ({
      date: day,
      count: dailyCounts[day],
    }));

    const weeklyData = Object.keys(weeklyCounts).map(week => ({
      week,
      count: weeklyCounts[week],
    }));

    const monthlyData = Object.keys(monthlyCounts).map(month => ({
      month,
      count: monthlyCounts[month],
    }));

    const yearlyData = Object.keys(yearlyCounts).map(year => ({
      year: year.toString(),
      count: yearlyCounts[year],
    }));

    // Summary Report Data
    const totalPatients = patients.length;
    const summaryData = {
      Total_Patients: totalPatients,
      'Low Risk Patients': lowRisk, 
      'Moderate Risk Patients': moderateRisk, 
      'High Risk Patients': highRisk, 
      'Very High Risk Patients': veryHighRisk, 
    };

    return {
      ageData,
      genderData,
      bmiData,
      riskData,
      trendData: trendArray,
      dailyData,
      weeklyData,
      monthlyData,
      yearlyData,
      summaryData,
      healthMetrics: {
        BMI: bmiData, 
        Blood_Pressure_Systolic: bpCount === 0 ? [] : [
          { name: 'Average Systolic BP', value: parseFloat((totalBP_Systolic / bpCount).toFixed(2)) },
        ],
        Blood_Pressure_Diastolic: bpCount === 0 ? [] : [
          { name: 'Average Diastolic BP', value: parseFloat((totalBP_Diastolic / bpCount).toFixed(2)) },
        ],
        Cholesterol_Level: cholesterolCount === 0 ? [] : [
          { name: 'Average Cholesterol', value: parseFloat((totalCholesterol / cholesterolCount).toFixed(2)) },
        ],
        History_of_Stroke: [
          { name: 'Yes', value: strokeYes },
          { name: 'No', value: strokeNo },
        ],
      },
    };
  }, [patients]);

  // Handle timeframe selection
  const handleTimeframeChange = (e) => {
    setSelectedTimeframe(e.target.value);
  };

  // Handle Scatter Plot feature selection
  const handleScatterXChange = (e) => {
    const selectedX = e.target.value;
    // If the selected X is currently selected in Y, reset Y
    if (selectedX === scatterY) {
      setScatterY('');
    }
    setScatterX(selectedX);
  };

  const handleScatterYChange = (e) => {
    const selectedY = e.target.value;
    // If the selected Y is currently selected in X, reset X
    if (selectedY === scatterX) {
      setScatterX('');
    }
    setScatterY(selectedY);
  };

  // Prepare data for dynamic scatter plot
  const scatterData = useMemo(() => {
    if (!patients || patients.length === 0) return [];

    return patients.flatMap(patient => 
      patient.records.map(record => {
        const dataPoint = {};
        dataPoint['Age'] = parseInt(patient.age, 10);
        dataPoint['BMI'] = parseFloat(record.BMI);
        dataPoint['Blood_Pressure_Systolic'] = parseFloat(record.blood_pressure_systolic);
        dataPoint['Blood_Pressure_Diastolic'] = parseFloat(record.blood_pressure_diastolic);
        dataPoint['Cholesterol_Level'] = parseFloat(record.cholesterol_level);
        dataPoint['History_of_Stroke'] = record.history_of_stroke === 'Yes' ? 1 : 0;
        dataPoint['Risk_Level'] = record.risk_level; 
        return dataPoint;
      })
    ).filter(point => {
      // Ensure selected features have valid numbers
      return (
        point[scatterX] !== undefined &&
        point[scatterX] !== null &&
        !isNaN(point[scatterX]) &&
        point[scatterY] !== undefined &&
        point[scatterY] !== null &&
        !isNaN(point[scatterY])
      );
    });
  }, [patients, scatterX, scatterY]);

  // Generate filtered feature lists for X and Y axes 
  const filteredScatterFeaturesX = useMemo(() => {
    return scatterFeatures.filter(feature => feature.value !== scatterY);
  }, [scatterY]);

  const filteredScatterFeaturesY = useMemo(() => {
    return scatterFeatures.filter(feature => feature.value !== scatterX);
  }, [scatterX]);

  // Render Reference Table Function
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
          <span className="text-lg text-[#00717A]">Loading Analytics...</span>
        </div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <FaChartLine size={50} className="text-gray-400 mb-4" aria-hidden="true" />
        <p className="text-lg text-gray-600">No patient data available for analytics.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen pb-8">
      {/* Header */}
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-4 text-[#00717A] uppercase">
          Patient Analytics Dashboard
        </h1>
      </div>

      {/* Summary Report */}
      <div className="container mx-auto mb-8 px-4">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-center text-[#00717A]">Summary Report</h2>

          {/* Summary Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-6">
            {/* Row 1: Total Patients */}
            <div className="col-span-1 sm:col-span-2 bg-gray-50 p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-300 flex flex-col items-center text-center h-full">
              <p className="text-gray-600 mb-2">Total Patients</p>
              <p className="text-3xl font-bold text-black">{aggregatedData.summaryData.Total_Patients}</p>
            </div>

            {/* Row 2: Low Risk and Moderate Risk */}
            <div className="col-span-1 bg-blue-50 p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-300 flex flex-col items-center text-center h-full">
              <p className="text-gray-600 mb-2">Low Risk Patients</p>
              <p className="text-2xl font-bold text-blue-600">{aggregatedData.summaryData['Low Risk Patients']}</p>
            </div>
            <div className="col-span-1 bg-yellow-50 p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-300 flex flex-col items-center text-center h-full">
              <p className="text-gray-600 mb-2">Moderate Risk Patients</p>
              <p className="text-2xl font-bold text-yellow-600">{aggregatedData.summaryData['Moderate Risk Patients']}</p>
            </div>

            {/* Row 3: High Risk and Very High Risk */}
            <div className="col-span-1 bg-orange-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-300 flex flex-col items-center text-center h-full">
              <p className="text-gray-600 mb-2">High Risk Patients</p>
              <p className="text-2xl font-bold text-orange-600">{aggregatedData.summaryData['High Risk Patients']}</p>
            </div>
            <div className="col-span-1 bg-red-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-300 flex flex-col items-center text-center h-full">
              <p className="text-gray-600 mb-2">Very High Risk Patients</p>
              <p className="text-2xl font-bold text-red-600">{aggregatedData.summaryData['Very High Risk Patients']}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Added Space Between Summary and Tabs */}
      <div className="mt-8"></div>

      {/* Tabs Section */}
      <div className="container mx-auto px-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <Tabs>
            <TabList className="flex flex-wrap justify-center space-x-2 overflow-x-auto">
              <Tab className="tab px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00717A]">
                Patient Overview
              </Tab>
              <Tab className="tab px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00717A]">
                Risk Categories
              </Tab>
              <Tab className="tab px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00717A]">
                Demographics
              </Tab>
              <Tab className="tab px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00717A]">
                Health Metrics
              </Tab>
            </TabList>

            {/* Patient Overview Tab */}
            <TabPanel>
              {/* Timeframe Selection */}
              <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-end">
                <label htmlFor="timeframe" className="mr-2 text-gray-700 font-medium mt-2 sm:mt-0">
                  Select Timeframe:
                </label>
                <select
                  id="timeframe"
                  name="timeframe"
                  value={selectedTimeframe}
                  onChange={handleTimeframeChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#00717A] mt-2 sm:mt-0"
                  aria-label="Select Timeframe for Patient Overview"
                >
                  <option value="Day">Day</option>
                  <option value="Week">Week</option>
                  <option value="Month">Month</option>
                  <option value="Year">Year</option>
                </select>
              </div>

              {/* Patient Overview Chart */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-inner">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">Patient Overview</h2>
                <div className="w-full h-64 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    {selectedTimeframe === 'Day' && (
                      <LineChart data={aggregatedData.dailyData} aria-label="Line chart showing patient counts per day">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={date => date.slice(5)} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '14px' }} />
                        <Line type="monotone" dataKey="count" stroke="#00717A" name="Patients" />
                      </LineChart>
                    )}
                    {selectedTimeframe === 'Week' && (
                      <LineChart data={aggregatedData.weeklyData} aria-label="Line chart showing patient counts per week">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" tickFormatter={week => week.replace('W', 'Week ')} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '14px' }} />
                        <Line type="monotone" dataKey="count" stroke="#00C49F" name="Patients" />
                      </LineChart>
                    )}
                    {selectedTimeframe === 'Month' && (
                      <LineChart data={aggregatedData.monthlyData} aria-label="Line chart showing patient counts per month">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '14px' }} />
                        <Line type="monotone" dataKey="count" stroke="#FF8042" name="Patients" />
                      </LineChart>
                    )}
                    {selectedTimeframe === 'Year' && (
                      <LineChart data={aggregatedData.yearlyData} aria-label="Line chart showing patient counts per year">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '14px' }} />
                        <Line type="monotone" dataKey="count" stroke="#FFBB28" name="Patients" />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </TabPanel>

            {/* Risk Categories Tab */}
            <TabPanel>
              <div className="flex flex-col space-y-8 mt-4">
                {/* Risk Categories Distribution (Pie Chart) */}
                <div>
                  <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-inner">
                    <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">Risk Categories Distribution</h2>
                    <div className="w-full h-64 sm:h-96 flex flex-col items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart aria-label="Pie chart showing distribution of patients across risk categories">
                          <Pie
                            data={aggregatedData.riskData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {aggregatedData.riskData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} aria-label={`${entry.name}: ${entry.value}`} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '14px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Reference Table */}
                {renderReferenceTable()}
              </div>
            </TabPanel>

            {/* Demographics Tab */}
            <TabPanel>
              <div className="flex flex-col space-y-8 mt-4">
                {/* Age Distribution (Bar Chart) */}
                <div>
                  {/* Collapsible Section for Mobile Screens */}
                  <div className="md:hidden mb-4">
                    <button
                      onClick={() => setIsAgeChartOpen(!isAgeChartOpen)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-[#00717A] text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00717A]"
                      aria-label="Toggle Age Distribution Chart"
                    >
                      <span>Age Distribution</span>
                      {isAgeChartOpen ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
                    </button>
                  </div>

                  {/* Content Wrapper */}
                  <div className={`${isAgeChartOpen ? '' : 'hidden'} md:block`}>
                    <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-inner">
                      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">Age Distribution</h2>
                      <div className="w-full h-64 sm:h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={aggregatedData.ageData}
                            aria-label="Bar chart showing age distribution of patients"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="ageRange" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '14px' }} />
                            <Bar dataKey="count" fill="#00717A" name="Number of Patients" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gender Ratio (Pie Chart) */}
                <div>
                  {/* Collapsible Section for Mobile Screens */}
                  <div className="md:hidden mb-4">
                    <button
                      onClick={() => setIsGenderChartOpen(!isGenderChartOpen)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-[#00717A] text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00717A]"
                      aria-label="Toggle Gender Ratio Chart"
                    >
                      <span>Gender Ratio</span>
                      {isGenderChartOpen ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
                    </button>
                  </div>

                  {/* Content Wrapper */}
                  <div className={`${isGenderChartOpen ? '' : 'hidden'} md:block`}>
                    <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-inner">
                      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">Gender Ratio</h2>
                      <div className="w-full h-64 sm:h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart aria-label="Pie chart showing gender ratio of patients">
                            <Pie
                              data={aggregatedData.genderData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#82ca9d"
                              dataKey="value"
                              nameKey="name"
                            >
                              {aggregatedData.genderData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                  aria-label={`${entry.name}: ${entry.value}`}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '14px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>

            {/* Health Metrics Tab */}
            <TabPanel>
              <div className="flex flex-col space-y-8 mt-4">
                {/* BMI Categories (Bar Chart) */}
                <div>
                  {/* Collapsible Section for Mobile Screens */}
                  <div className="md:hidden mb-4">
                    <button
                      onClick={() => setIsBMICategoriesChartOpen(!isBMICategoriesChartOpen)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-[#00717A] text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00717A]"
                      aria-label="Toggle BMI Categories Chart"
                    >
                      <span>BMI Categories</span>
                      {isBMICategoriesChartOpen ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
                    </button>
                  </div>

                  {/* Content Wrapper */}
                  <div className={`${isBMICategoriesChartOpen ? '' : 'hidden'} md:block`}>
                    <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-inner">
                      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">BMI Categories</h2>
                      <div className="w-full h-64 sm:h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={aggregatedData.bmiData.filter(item => item.name !== 'Average BMI')}
                            aria-label="Bar chart showing BMI categories of patients"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '14px' }} />
                            <Bar dataKey="value" fill="#00717A" name="Number of Patients" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Scatter Plot Selection */}
                <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-inner">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">Custom Scatter Plot</h2>
                  <div className="flex flex-col sm:flex-row items-center justify-center mb-4">
                    {/* X-Axis Selection */}
                    <div className="flex flex-col mr-4 mb-4 sm:mb-0">
                      <label htmlFor="scatterX" className="mb-2 text-gray-700 font-medium">Select X-Axis:</label>
                      <select
                        id="scatterX"
                        name="scatterX"
                        value={scatterX}
                        onChange={handleScatterXChange}
                        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#00717A]"
                        aria-label="Select X-Axis for Scatter Plot"
                      >
                        <option value="" disabled>Select X-Axis</option>
                        {filteredScatterFeaturesX.map(feature => (
                          <option key={feature.value} value={feature.value}>{feature.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Y-Axis Selection */}
                    <div className="flex flex-col">
                      <label htmlFor="scatterY" className="mb-2 text-gray-700 font-medium">Select Y-Axis:</label>
                      <select
                        id="scatterY"
                        name="scatterY"
                        value={scatterY}
                        onChange={handleScatterYChange}
                        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#00717A]"
                        aria-label="Select Y-Axis for Scatter Plot"
                      >
                        <option value="" disabled>Select Y-Axis</option>
                        {filteredScatterFeaturesY.map(feature => (
                          <option key={feature.value} value={feature.value}>{feature.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Scatter Plot */}
                  <div className="w-full h-64 sm:h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 30, bottom: 40, left: 20 }}
                        aria-label={`Scatter chart showing ${scatterX} vs ${scatterY}`}
                      >
                        <CartesianGrid />
                        <XAxis
                          type="number"
                          dataKey={scatterX}
                          name={scatterX}
                          label={{ value: scatterFeatures.find(f => f.value === scatterX)?.label, position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis
                          type="number"
                          dataKey={scatterY}
                          name={scatterY}
                          label={{ value: scatterFeatures.find(f => f.value === scatterY)?.label, angle: -90, position: 'insideLeft', offset: -10 }}
                        />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '14px', top: 0, right: 0 }} />
                        <Scatter name="Patients" data={scatterData} fill="#8884d8" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </TabPanel>

            {/* Demographics Tab */}
            <TabPanel>
              <div className="flex flex-col space-y-8 mt-4">
                {/* Age Distribution (Bar Chart) */}
                <div>
                  {/* Collapsible Section for Mobile Screens */}
                  <div className="md:hidden mb-4">
                    <button
                      onClick={() => setIsAgeChartOpen(!isAgeChartOpen)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-[#00717A] text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00717A]"
                      aria-label="Toggle Age Distribution Chart"
                    >
                      <span>Age Distribution</span>
                      {isAgeChartOpen ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
                    </button>
                  </div>

                  {/* Content Wrapper */}
                  <div className={`${isAgeChartOpen ? '' : 'hidden'} md:block`}>
                    <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-inner">
                      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">Age Distribution</h2>
                      <div className="w-full h-64 sm:h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={aggregatedData.ageData}
                            aria-label="Bar chart showing age distribution of patients"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="ageRange" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '14px' }} />
                            <Bar dataKey="count" fill="#00717A" name="Number of Patients" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gender Ratio (Pie Chart) */}
                <div>
                  {/* Collapsible Section for Mobile Screens */}
                  <div className="md:hidden mb-4">
                    <button
                      onClick={() => setIsGenderChartOpen(!isGenderChartOpen)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-[#00717A] text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00717A]"
                      aria-label="Toggle Gender Ratio Chart"
                    >
                      <span>Gender Ratio</span>
                      {isGenderChartOpen ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
                    </button>
                  </div>

                  {/* Content Wrapper */}
                  <div className={`${isGenderChartOpen ? '' : 'hidden'} md:block`}>
                    <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-inner">
                      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">Gender Ratio</h2>
                      <div className="w-full h-64 sm:h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart aria-label="Pie chart showing gender ratio of patients">
                            <Pie
                              data={aggregatedData.genderData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#82ca9d"
                              dataKey="value"
                              nameKey="name"
                            >
                              {aggregatedData.genderData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                  aria-label={`${entry.name}: ${entry.value}`}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '14px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>

            {/* Health Metrics Tab */}
            <TabPanel>
              <div className="flex flex-col space-y-8 mt-4">
                {/* BMI Categories (Bar Chart) */}
                <div>
                  {/* Collapsible Section for Mobile Screens */}
                  <div className="md:hidden mb-4">
                    <button
                      onClick={() => setIsBMICategoriesChartOpen(!isBMICategoriesChartOpen)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-[#00717A] text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00717A]"
                      aria-label="Toggle BMI Categories Chart"
                    >
                      <span>BMI Categories</span>
                      {isBMICategoriesChartOpen ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
                    </button>
                  </div>

                  {/* Content Wrapper */}
                  <div className={`${isBMICategoriesChartOpen ? '' : 'hidden'} md:block`}>
                    <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-inner">
                      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">BMI Categories</h2>
                      <div className="w-full h-64 sm:h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={aggregatedData.bmiData.filter(item => item.name !== 'Average BMI')}
                            aria-label="Bar chart showing BMI categories of patients"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '14px' }} />
                            <Bar dataKey="value" fill="#00717A" name="Number of Patients" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Scatter Plot Selection */}
                <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-inner">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">Custom Scatter Plot</h2>
                  <div className="flex flex-col sm:flex-row items-center justify-center mb-4">
                    {/* X-Axis Selection */}
                    <div className="flex flex-col mr-4 mb-4 sm:mb-0">
                      <label htmlFor="scatterX" className="mb-2 text-gray-700 font-medium">Select X-Axis:</label>
                      <select
                        id="scatterX"
                        name="scatterX"
                        value={scatterX}
                        onChange={handleScatterXChange}
                        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#00717A]"
                        aria-label="Select X-Axis for Scatter Plot"
                      >
                        <option value="" disabled>Select X-Axis</option>
                        {filteredScatterFeaturesX.map(feature => (
                          <option key={feature.value} value={feature.value}>{feature.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Y-Axis Selection */}
                    <div className="flex flex-col">
                      <label htmlFor="scatterY" className="mb-2 text-gray-700 font-medium">Select Y-Axis:</label>
                      <select
                        id="scatterY"
                        name="scatterY"
                        value={scatterY}
                        onChange={handleScatterYChange}
                        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#00717A]"
                        aria-label="Select Y-Axis for Scatter Plot"
                      >
                        <option value="" disabled>Select Y-Axis</option>
                        {filteredScatterFeaturesY.map(feature => (
                          <option key={feature.value} value={feature.value}>{feature.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Scatter Plot */}
                  <div className="w-full h-64 sm:h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 30, bottom: 40, left: 20 }}
                        aria-label={`Scatter chart showing ${scatterX} vs ${scatterY}`}
                      >
                        <CartesianGrid />
                        <XAxis
                          type="number"
                          dataKey={scatterX}
                          name={scatterX}
                          label={{ value: scatterFeatures.find(f => f.value === scatterX)?.label, position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis
                          type="number"
                          dataKey={scatterY}
                          name={scatterY}
                          label={{ value: scatterFeatures.find(f => f.value === scatterY)?.label, angle: -90, position: 'insideLeft', offset: -10 }}
                        />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '14px', top: 0, right: 0 }} />
                        <Scatter name="Patients" data={scatterData} fill="#8884d8" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Analytics;