import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Introduction</h2>
        <p className="mb-4">
          This Privacy Policy outlines how IHD Prediction Team collects, uses, discloses, and protects the personal information of individuals who use our Ischemic Disease Heart Risk Prediction System.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Information Collection</h2>
        <p className="mb-4">
          When you use the System, we may collect the following types of personal information:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li><strong>Health Information:</strong> This includes medical history and other health-related data that you voluntarily provide.</li>
          <li><strong>Demographic Information:</strong> This may include your age, gender, and location.</li>
          <li><strong>Contact Information:</strong> This may include your email address and phone number.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Information Use</h2>
        <p className="mb-4">
          We use your personal information for the following purposes:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>To provide and operate the System.</li>
          <li>To personalize your experience with the System.</li>
          <li>To improve the System's accuracy and functionality.</li>
          <li>To conduct research and analysis related to ischemic heart disease.</li>
          <li>To comply with legal and regulatory requirements.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Information Sharing</h2>
        <p className="mb-4">
          We may share your personal information with:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li><strong>Third-party service providers:</strong> We may engage third-party service providers to assist us in operating the System. These providers will only have access to your personal information as needed to perform their functions.</li>
          <li><strong>Researchers:</strong> We may share your de-identified data with researchers for the purpose of conducting research on ischemic heart disease.</li>
          <li><strong>Legal authorities:</strong> We may disclose your personal information to law enforcement or regulatory authorities if required by law or to protect our rights or the rights of others.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Data Security</h2>
        <p className="mb-4">
          We implement reasonable security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the Internet or electronic storage is completely secure. Please be aware that there is always a risk involved in transmitting personal information electronically.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Your Rights</h2>
        <p className="mb-4">
          You may have certain rights regarding your personal information, including the right to:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>Access and correct your personal information.</li>
          <li>Object to the processing of your personal information.</li>
          <li>Request the erasure of your personal information.</li>
          <li>Restrict the processing of your personal information.</li>
          <li>Data portability.</li>
        </ul>
        <p className="mb-4">
          To exercise your rights, please contact us at <a href="mailto:ihdpredictionteam@gmail.com" className="text-blue-600 hover:underline">ihdpredictionteam@gmail.com</a>.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Changes to this Privacy Policy</h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. Any changes will be posted on this page.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;