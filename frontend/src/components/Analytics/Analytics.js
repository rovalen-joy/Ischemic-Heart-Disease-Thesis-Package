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
import { FaChartLine } from 'react-icons/fa';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css'; 
import './Analytics.css'; 

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#33AA99', '#AA9933', '#9933AA'];

const Analytics = () => {
  const { user } = UserAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Timeframe Selection
  const [selectedTimeframe, setSelectedTimeframe] = useState('Month'); // Default timeframe


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
    let highBMI = 0;
    let normalBMI = 0;
    let lowBMI = 0;

    // Risk Assessment
    let lowRisk = 0;
    let moderateRisk = 0;
    let highRisk = 0;

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
          if (bmi > 30) highBMI += 1;
          else if (bmi >= 18.5 && bmi <= 24.9) normalBMI += 1;
          else if (bmi < 18.5) lowBMI += 1;
        }

        // Risk Assessment
        if (record.risk_result === 'Low') lowRisk += 1;
        else if (record.risk_result === 'Moderate') moderateRisk += 1;
        else if (record.risk_result === 'High') highRisk += 1;

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
      { name: 'High BMI (>30)', value: highBMI },
      { name: 'Normal BMI (18.5-24.9)', value: normalBMI },
      { name: 'Low BMI (<18.5)', value: lowBMI },
    ];

    const riskData = [
      { name: 'Low Risk', value: lowRisk },
      { name: 'Moderate Risk', value: moderateRisk },
      { name: 'High Risk', value: highRisk },
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
    const avgAge = patients.reduce((acc, patient) => acc + parseInt(patient.age, 10), 0) / totalPatients || 0;
    const avgBMIVal = averageBMI;
    const totalStroke = strokeYes + strokeNo;
    const percentStroke = totalStroke === 0 ? 0 : ((strokeYes / totalStroke) * 100).toFixed(2);
    const avgSystolicBP = bpCount === 0 ? 0 : (totalBP_Systolic / bpCount).toFixed(2);
    const avgDiastolicBP = bpCount === 0 ? 0 : (totalBP_Diastolic / bpCount).toFixed(2);
    const avgCholesterol = cholesterolCount === 0 ? 0 : (totalCholesterol / cholesterolCount).toFixed(2);

    const summaryData = {
      Total_Patients: totalPatients,
      Average_Age: avgAge.toFixed(2),
      Average_BMI: avgBMIVal,
      'History of Stroke (%)': percentStroke,
      'Average Systolic BP': avgSystolicBP,
      'Average Diastolic BP': avgDiastolicBP,
      'Average Total Cholesterol': avgCholesterol,
    };

    return {
      ageData,
      genderData, // Included genderData
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
          { name: 'Average Systolic BP', value: parseFloat(avgSystolicBP) },
        ],
        Blood_Pressure_Diastolic: bpCount === 0 ? [] : [
          { name: 'Average Diastolic BP', value: parseFloat(avgDiastolicBP) },
        ],
        Cholesterol_Level: cholesterolCount === 0 ? [] : [
          { name: 'Average Cholesterol', value: parseFloat(avgCholesterol) },
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
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="container p-6">
        <h1 className="text-lg md:text-2xl lg:text-4xl font-bold text-center mb-1 mt-1 text-[#00717A] uppercase">Patient Analytics Dashboard</h1>
      </div>

      {/* Summary Report */}
      <div className="summary-container container mb-16 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-center">Summary Report</h2>

        {/* Summary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Patients - Full Width */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-inner flex flex-col items-center md:col-span-3">
            <span className="text-gray-500 font-medium mb-2">Total Patients</span>
            <span className="text-3xl font-bold text-[#00717A]">{aggregatedData.summaryData.Total_Patients}</span>
          </div>

          {/* Average Age */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-inner flex flex-col items-center">
            <span className="text-gray-500 font-medium mb-2">Average Age</span>
            <span className="text-2xl font-bold text-[#00717A]">{aggregatedData.summaryData.Average_Age} yrs</span>
          </div>

          {/* Average BMI */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-inner flex flex-col items-center">
            <span className="text-gray-500 font-medium mb-2">Average BMI</span>
            <span className="text-2xl font-bold text-[#00717A]">{aggregatedData.summaryData.Average_BMI}</span>
          </div>

          {/* History of Stroke */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-inner flex flex-col items-center">
            <span className="text-gray-500 font-medium mb-2">History of Stroke (%)</span>
            <span className="text-2xl font-bold text-[#00717A]">{aggregatedData.summaryData['History of Stroke (%)']}%</span>
          </div>

          {/* Average Systolic BP */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-inner flex flex-col items-center">
            <span className="text-gray-500 font-medium mb-2">Average Systolic BP</span>
            <span className="text-2xl font-bold text-[#00717A]">{aggregatedData.summaryData['Average Systolic BP']} mmHg</span>
          </div>

          {/* Average Diastolic BP */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-inner flex flex-col items-center">
            <span className="text-gray-500 font-medium mb-2">Average Diastolic BP</span>
            <span className="text-2xl font-bold text-[#00717A]">{aggregatedData.summaryData['Average Diastolic BP']} mmHg</span>
          </div>

          {/* Average Cholesterol Level */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-inner flex flex-col items-center">
            <span className="text-gray-500 font-medium mb-2">Average Cholesterol Level</span>
            <span className="text-2xl font-bold text-[#00717A]">{aggregatedData.summaryData['Average Total Cholesterol']} mmol/L</span>
          </div>
        </div>
      </div>

      <div className="section-spacing bg-gray-100 mb-16"></div>
      {/* Tabs Section */}
      <div className="tabs-container container bg-white p-6 rounded-lg shadow-md m-16">
        <Tabs>
          <TabList className="tab-list custom-shadow">
            <Tab className="tab">Patient Overview</Tab>
            <Tab className="tab">Demographics</Tab>
            <Tab className="tab">Health Metrics</Tab>
          </TabList>

          {/* Patient Overview Tab */}
          <TabPanel>
            {/* Timeframe Selection */}
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-end">
              <label htmlFor="timeframe" className="mr-2 text-gray-700 font-medium mt-2">
                Select Timeframe:
              </label>
              <select
                id="timeframe"
                name="timeframe"
                value={selectedTimeframe}
                onChange={handleTimeframeChange}
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#00717A] mt-4"
                aria-label="Select Timeframe for Patient Overview"
              >
                <option value="Day">Day</option>
                <option value="Week">Week</option>
                <option value="Month">Month</option>
                <option value="Year">Year</option>
              </select>
            </div>

            {/* Patient Overview Chart */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
              <h2 className="text-xl font-semibold mb-4 text-center">Patient Overview</h2>
              <ResponsiveContainer width="100%" height={400}>
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
          </TabPanel>

          {/* Demographics Tab */}
          <TabPanel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              {/* Age Distribution (Bar Chart) */}
              <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                <h2 className="text-xl font-semibold mb-4 text-center">Age Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={aggregatedData.ageData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
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

              {/* Gender Ratio (Pie Chart) */}
              <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                <h2 className="text-xl font-semibold mb-4 text-center">Gender Ratio</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart aria-label="Pie chart showing gender ratio of patients">
                    <Pie
                      data={aggregatedData.genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
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
          </TabPanel>

          {/* Health Metrics Tab */}
          <TabPanel>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
              {/* Age vs Cholesterol Level (Scatter Chart) */}
              <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                <h2 className="text-xl font-semibold mb-4 text-center">Age vs. Total Cholesterol</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart
                    margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
                    aria-label="Scatter chart showing Age vs Total Cholesterol"
                  >
                    <CartesianGrid />
                    <XAxis type="number" dataKey="age" name="Age" unit="yrs" />
                    <YAxis type="number" dataKey="cholesterol" name="Cholesterol" unit="mmol/L" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    <Scatter name="Patients" data={patients.flatMap(patient => 
                      patient.records.map(record => ({
                        age: parseInt(patient.age, 10),
                        cholesterol: parseFloat(record.cholesterol_level),
                      }))
                    )} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* BMI vs Systolic BP (Scatter Chart) */}
              <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                <h2 className="text-xl font-semibold mb-4 text-center">BMI vs. Systolic BP</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart
                    margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
                    aria-label="Scatter chart showing BMI vs Systolic Blood Pressure"
                  >
                    <CartesianGrid />
                    <XAxis type="number" dataKey="bmi" name="BMI" />
                    <YAxis type="number" dataKey="systolic" name="Systolic BP" unit="mmHg" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    <Scatter name="Patients" data={patients.flatMap(patient => 
                      patient.records.map(record => ({
                        bmi: parseFloat(record.BMI),
                        systolic: parseFloat(record.blood_pressure_systolic),
                      }))
                    )} fill="#82ca9d" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* BMI vs Diastolic BP (Scatter Chart) */}
              <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                <h2 className="text-xl font-semibold mb-4 text-center">BMI vs. Diastolic BP</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart
                    margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
                    aria-label="Scatter chart showing BMI vs Diastolic Blood Pressure"
                  >
                    <CartesianGrid />
                    <XAxis type="number" dataKey="bmi" name="BMI" />
                    <YAxis type="number" dataKey="diastolic" name="Diastolic BP" unit="mmHg" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    <Scatter name="Patients" data={patients.flatMap(patient => 
                      patient.records.map(record => ({
                        bmi: parseFloat(record.BMI),
                        diastolic: parseFloat(record.blood_pressure_diastolic),
                      }))
                    )} fill="#FF8042" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </div>
      <div className="h-14"></div>
    </div>
    
  );
};

export default Analytics;