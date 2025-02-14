import React, { useState, useEffect } from 'react';
import { UserAuth } from '../../context/AuthContext';
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { db } from '../../firebase';

const Profile = () => {
  const { user, userData, logout } = UserAuth(); 
  const [activeSection, setActiveSection] = useState('name');
  const [firstName, setFirstName] = useState(userData?.firstName || '');
  const [lastName, setLastName] = useState(userData?.lastName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Password criteria state
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
  });

  // Update password criteria as the user types
  useEffect(() => {
    const criteria = {
      minLength: newPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumber: /\d/.test(newPassword),
    };
    setPasswordCriteria(criteria);
  }, [newPassword]);

  // Re-authenticate the user before updating password
  const reauthenticateUser = async () => {
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword // Current password entered by the user for re-authentication
      );
      await reauthenticateWithCredential(user, credential);
      console.log('Re-authentication successful');
      toast.success('Re-authenticated successfully');
    } catch (error) {
      console.error('Error re-authenticating:', error);
      toast.error('Failed to re-authenticate. Please check your current password and try again.');
      throw error; // Stop further actions if re-authentication fails
    }
  };

  // Sign out user after successful update
  const signOutUser = async () => {
    try {
      await logout(); // Call the logout function
      toast.success('You have been signed out. Please log in again to reflect changes.');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // Update the user's name in Firebase Auth and Firestore
  const handleNameUpdate = async (e) => {
    e.preventDefault();
    try {
      if (!user) {
        throw new Error('User is not authenticated');
      }

      // Update Firebase Authentication profile
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      // Update Firestore document with firstName and lastName
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        {
          firstName,
          lastName,
        },
        { merge: true } // Use merge to avoid overwriting other fields
      );

      console.log('Name update successful');
      toast.success('Name updated successfully');
      await signOutUser(); // Sign out after success
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Failed to update name. Please try again.');
    }
  };

  // Update password in Firebase Auth
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      return toast.error("Passwords don't match");
    }

    const allCriteriaMet = Object.values(passwordCriteria).every(Boolean);
    if (!allCriteriaMet) {
      return toast.error('Please ensure your new password meets all criteria.');
    }

    try {
      if (!user) {
        throw new Error('User is not authenticated');
      }

      // Re-authenticate the user before updating the password
      await reauthenticateUser();

      // Update password after re-authentication
      await updatePassword(user, newPassword);
      console.log('Password update successful');
      toast.success('Password updated successfully');
      await signOutUser(); // Sign out after success
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/weak-password') {
        toast.error('The new password is too weak.');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log in again to continue.');
        await signOutUser();
      } else {
        toast.error('Failed to update password. Please try again.');
      }
    }
  };

  // Helper function to render password criteria
  const renderCriteria = (isMet, text) => (
    <li className="flex items-center">
      {isMet ? (
        <FaCheckCircle className="text-green-500 mr-2" aria-hidden="true" />
      ) : (
        <FaTimesCircle className="text-red-500 mr-2" aria-hidden="true" />
      )}
      <span className="text-gray-700">{text}</span>
    </li>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Include the Toaster component */}
      <Toaster />
      {/* Header */}
      <div className="w-full bg-gray-50 py-4 px-4">
        <div className="text-center">
          <h1 className="text-lg md:text-2xl lg:text-4xl font-bold text-center mb-1 mt-1 text-[#00717A] uppercase">
            Profile Settings
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Update your name or password to keep your profile up-to-date
          </p>
          {/* Information Text About Email Change */}
          <div className="mt-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
            <p className="font-bold">Important:</p>
            <p>
              For security reasons, changing your email address is not permitted. This helps us
              protect your account and ensure the integrity of your data.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-start flex-1 px-4 py-4">
        <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-8">
          {/* Navigation Tabs */}
          <nav className="flex justify-center space-x-8 border-b border-gray-200 mb-8">
            {['name', 'password'].map((section) => (
              <button
                key={section}
                onClick={() => {
                  setActiveSection(section);
                  // Reset fields when switching sections
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                }}
                className={`py-2 px-4 text-lg font-medium focus:outline-none ${
                  activeSection === section
                    ? 'text-[#00717A] border-b-2 border-[#00717A]'
                    : 'text-gray-500 hover:text-[#00717A]'
                }`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </nav>

          {/* Form Sections */}
          <div>
            {/* Name Update Section */}
            {activeSection === 'name' && (
              <section aria-labelledby="update-name" className="mb-8">
                <h2 id="update-name" className="text-xl font-semibold text-[#00717A] mb-4">
                  Update Name
                </h2>
                <p className="text-gray-600 mb-4">Change your first and last name as needed.</p>
                <form onSubmit={handleNameUpdate}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      className="w-full border-gray-300 rounded-lg px-4 py-3 shadow-sm focus:ring-[#00717A] focus:border-[#00717A] transition duration-200"
                      required
                    />
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className="w-full border-gray-300 rounded-lg px-4 py-3 shadow-sm focus:ring-[#00717A] focus:border-[#00717A] transition duration-200"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-6 bg-[#05747F] text-white py-3 px-6 rounded-lg font-medium shadow-md hover:bg-[#035f62] transition-colors duration-200 w-full"
                  >
                    Update Name
                  </button>
                </form>
              </section>
            )}

            {/* Password Update Section */}
            {activeSection === 'password' && (
              <section aria-labelledby="update-password" className="mb-8">
                <h2 id="update-password" className="text-xl font-semibold text-[#00717A] mb-4">
                  Update Password
                </h2>
                <p className="text-gray-600 mb-4">
                  Ensure your account remains secure by updating your password regularly.
                </p>
                <form onSubmit={handlePasswordUpdate}>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current Password"
                    className="w-full border-gray-300 rounded-lg px-4 py-3 shadow-sm focus:ring-[#00717A] focus:border-[#00717A] mb-4"
                    required
                  />
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full border-gray-300 rounded-lg px-4 py-3 shadow-sm focus:ring-[#00717A] focus:border-[#00717A] mb-4"
                    required
                  />
                  <input
                    id="confirmNewPassword"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="w-full border-gray-300 rounded-lg px-4 py-3 shadow-sm focus:ring-[#00717A] focus:border-[#00717A]"
                    required
                  />

                  {/* Password Criteria */}
                  <div id="password-criteria" className="mb-6">
                    <p className="text-gray-600 mb-2">Password must contain:</p>
                    <ul className="space-y-1">
                      {renderCriteria(passwordCriteria.minLength, 'At least 8 characters')}
                      {renderCriteria(passwordCriteria.hasUpperCase, 'One uppercase letter')}
                      {renderCriteria(passwordCriteria.hasLowerCase, 'One lowercase letter')}
                      {renderCriteria(passwordCriteria.hasNumber, 'One number')}
                    </ul>
                  </div>

                  <button
                    type="submit"
                    className="bg-[#05747F] text-white py-3 px-6 rounded-lg font-medium shadow-md hover:bg-[#035f62] transition-colors duration-200 w-full"
                  >
                    Update Password
                  </button>
                </form>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
