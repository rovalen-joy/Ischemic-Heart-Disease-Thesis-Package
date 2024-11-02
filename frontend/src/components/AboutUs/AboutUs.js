import React from 'react';
import Footer from '../Footer/Footer'; 

const AboutUs = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Section */}
      <div className="flex justify-center flex-col gap-2 mt-1 pt-4 pb-4 px-4 sm:px-6 md:px-10 lg:px-20">
        {/* Header */}
        <div className="flex justify-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-2 mt-1 text-[#00717A]">
            ABOUT US
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-white py-4 px-4 sm:px-6 md:px-10 lg:px-20 mb-10"> 
        <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-6 sm:p-8 border-2 border-[#00717A]">
          
          {/* Our Mission */}
          <section className="mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#00717A] mb-4">
              Our Mission
            </h2>
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
              At IHD Prediction System, our goal is to make heart disease risk prediction simple and effective. By using advanced machine learning and patient data, we provide clear, actionable insights to healthcare professionals. This helps identify people who may be at high risk of ischemic heart disease, allowing for earlier interventions and better patient outcomes. We aim to support healthcare providers in making informed decisions that can save lives.
            </p>
          </section>

          {/* Our Technology */}
          <section className="mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#00717A] mb-4">
              Our Technology
            </h2>
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
              Our system integrates machine learning models with real-time data processing to deliver precise risk assessments. Utilizing a robust dataset and continuous model training, we ensure that our predictions are both accurate and up-to-date, adapting to the latest medical research and patient information.
            </p>
          </section>

          {/* Important Disclaimer */}
          <section className="mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#00717A] mb-4">
              Important Disclaimer
            </h2>
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
              It’s important to understand that the IHD Prediction System is a tool designed to assist with predicting the risk of ischemic heart disease. However, it does <strong>not</strong> provide medical diagnoses or prescribe treatments. Any decisions about patient care, including diagnosis and treatment, should always be made by qualified medical professionals. Our system is here to support healthcare providers, but it cannot replace their expertise and judgment.
            </p>
          </section>

          {/* Contact Us */}
          <section className="mb-2">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#00717A] mb-4">
              Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base md:text-lg">
              For more information about our services, collaborations, or inquiries, please feel free to reach out to us.
            </p>
            <a href="mailto:ihdpredictionteam@gmail.com" className="text-[#00717A] underline hover:text-[#005f61] text-sm sm:text-base md:text-lg">
              ihdpredictionteam@gmail.com
            </a>
          </section>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AboutUs;