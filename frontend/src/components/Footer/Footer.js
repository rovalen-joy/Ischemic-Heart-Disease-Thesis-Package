import React from 'react';
import cictLogo from '../../assets/cict.png';
import wvsuLogo from '../../assets/wvsu.png';

const Footer = () => {
  return (
    <footer className="bg-[#00717A] text-white py-6">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center md:items-start px-4 space-y-6 md:space-y-0">
        
        {/* Logos Section */}
        <div className="flex flex-col items-center md:items-start space-y-2">
          <div className="flex justify-center md:justify-start items-center space-x-4">
            <img src={wvsuLogo} alt="WVSU Logo" className="h-12 w-12" />
            <img src={cictLogo} alt="CICT Logo" className="h-12 w-12" />
          </div>
          {/* All Rights Reserved Text */}
          <div className="text-white text-sm mt-2 text-center md:text-left">
            &copy; {new Date().getFullYear()} IHD Prediction Team. All rights reserved.
          </div>
        </div>

        {/* Contact Us Section */}
        <div className="text-center md:text-left">
          <h2 className="text-lg font-semibold mb-2">Contact Us</h2>
          <p>IHD Prediction Team</p>
          <p>
            Email:{' '}
            <a
              href="mailto:ihdpredictionteam@gmail.com"
              className="text-white hover:underline"
              aria-label="Send email to ihdpredictionteam@gmail.com"
            >
              ihdpredictionteam@gmail.com
            </a>
          </p>
        </div>

        {/* Quick Links Section */}
        <div className="text-center md:text-right">
          <h2 className="text-lg font-semibold mb-2">Quick Links</h2>
          <ul>
            <li>
              <a
                href="/terms-of-use"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
                aria-label="Open Terms of Use in a new tab"
              >
                Terms of Use
              </a>
            </li>
            <li>
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
                aria-label="Open Privacy Policy in a new tab"
              >
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>

      </div>
    </footer>
  );
};

export default Footer;