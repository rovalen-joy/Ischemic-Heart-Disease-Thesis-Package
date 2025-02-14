import React from 'react';

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4">Terms of Use</h1>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Introduction</h2>
        <p className="mb-4">
          These Terms of Use govern your use of the Ischemic Heart Risk Prediction System. By using the System, you agree to these terms.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Use of the System</h2>
        <p className="mb-4">You may use the System for personal, non-commercial purposes. You agree not to:</p>
        <ul className="list-disc list-inside mb-4">
          <li>Use the System in a way that violates any applicable laws or regulations.</li>
          <li>Use the System to collect or store personal information about others without their consent.</li>
          <li>Attempt to gain unauthorized access to the System or its underlying infrastructure.</li>
          <li>Modify, adapt, or create derivative works based on the System.</li>
        </ul>
        <p className="mb-4">
          The System is provided "as is" without any warranties, express or implied. We do not warrant that the System will be error-free, uninterrupted, or secure.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Limitation of Liability</h2>
        <p className="mb-4">
          In no event shall we be liable for any indirect, incidental, special, consequential, or exemplary damages arising out of or in connection with your use of the System.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Governing Law</h2>
        <p className="mb-4">
          These Terms of Use shall be governed by and construed in accordance with the laws of the Republic of the Philippines. All rights reserved 2024.
        </p>
      </div>
    </div>
  );
};

export default TermsOfUse;
