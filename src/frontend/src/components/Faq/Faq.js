import React, { useState } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa'; 

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
        question: "What is the IHD Prediction System?",
        answer: "Our system helps healthcare professionals assess the risk of ischemic heart disease in patients by analyzing various health metrics such as blood pressure, cholesterol levels, and lifestyle factors. It’s designed to provide valuable insights to support patient care.",
      },
    {
        question: 'Is this system a diagnostic tool?',
        answer:
          'No, the IHD Prediction System does not diagnose medical conditions. It provides risk assessments to assist healthcare providers in decision-making. All decisions regarding patient care should be made by qualified healthcare professionals.',
      },
    {
      question: "Is the prediction 100% accurate?",
      answer: "While our system uses advanced machine learning algorithms, it's important to remember that predictions are based on the data provided and should be used as a supporting tool, not as a definitive diagnosis.",
    },
    {
      question: "How do I generate a prediction?",
      answer: "To generate a prediction, simply go to the 'Prediction Form' page, enter the required patient details such as age, blood pressure, and cholesterol level, and click on 'Run Results'. The system will assess the risk based on the data provided.",
    },
    {
      question: "How do I save my predictions?",
      answer: "After generating a prediction, you can save it by clicking on the 'Save' button. This allows you to store the patient data and access it later from the 'Patients Record' section for future reference.",
    },
    {
      question: "Can I edit a saved prediction?",
      answer: "Currently, predictions cannot be edited once they are saved. However, you can create a new prediction for the same patient by filling out the 'Prediction Form' again with updated information.",
    },
    {
        question: "Can I delete patient records?",
        answer: "Yes, you can delete patient records by going to the 'Patients Record' section, selecting the record you want to remove, and confirming the deletion.",
      },
    {
      question: "Is the prediction data secure?",
      answer: "Yes, we take data security seriously. All patient information is encrypted and securely stored. Only authorized users with proper login credentials can access the data.",
    },
    {
        question: 'How can I contact the IHD Prediction System team?',
        answer:
          'You can reach the IHD Prediction System team by emailing ihdpredictionteam@gmail.com for inquiries or support.',
      },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Section */}
      <div className="flex justify-center flex-col gap-2 mt-1 pt-4 pb-4 px-4 md:px-10 lg:px-20">
        {/* Header */}
        <div className="flex justify-center">
          <h1 className="text-lg md:text-2xl lg:text-4xl font-bold text-center mb-1 mt-1 text-[#00717A] uppercase">
            Frequently Asked Questions
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-white py-2 px-4 sm:px-6 lg:px-8 mb-10">
        <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-8 border-2 border-[#00717A]">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-lg">
                <button
                  className="w-full flex justify-between items-center text-left px-4 py-4 focus:outline-none"
                  onClick={() => toggleFAQ(index)}
                >
                  <h2 className="text-lg font-medium text-[#00717A]">
                    {faq.question}
                  </h2>
                  <span className="text-[#00717A]">
                    {openIndex === index ? <FaMinus /> : <FaPlus />}
                  </span>
                </button>
                {openIndex === index && (
                  <div className="px-4 pb-4 text-gray-700">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FAQ;
