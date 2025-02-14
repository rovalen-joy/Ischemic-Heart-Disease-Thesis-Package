import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.svg';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const { resetPassword } = UserAuth();
  const navigate = useNavigate();

  const handleOnChangeEmail = (email) => {
    setEmail(email);
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();

    try {
      toast.loading('Sending password reset email...', { id: 'verify_loading' });
      await resetPassword(email); // Firebase will send the link to its default reset page
      toast.dismiss('verify_loading');
      toast.success('Password reset email sent! Please check your inbox.');
      setVerificationSent(true);
    } catch (error) {
      toast.dismiss('verify_loading');
      console.error('Password reset error:', error.message);
      toast.error(`Failed to send password reset email: ${error.message}`);
    }
  };

  const handleLogin = () => {
    navigate('/');
  };

  return (
    <div className='bg-cover bg-center h-screen flex items-center justify-center bg-login'>
      <div className='bg-white px-[7rem] py-[1rem] rounded-2xl flex flex-col justify-center items-center' style={{ width: '540px' }}>
        <img src={logo} alt='logo' className='w-36 h-36 mb-1' />
        <h1 className='text-3xl font-[400] text-[#353535] mb-1'>Forgot Password</h1>

        {!verificationSent ? (
          <>
            <p className='text-center text-gray-600 mt-2'>
              Enter your email below to receive a password reset link.
            </p>
            <form className='flex flex-col gap-4 mt-6 w-full' onSubmit={handleVerificationSubmit}>
              <div className='flex flex-col relative'>
                <label htmlFor='email' className='text-primary font-semibold'>Email:</label>
                <input
                  id='email'
                  type='email'
                  className='active:border-[#353535] border-b-[3px] focus-visible:outline-0'
                  onChange={(e) => handleOnChangeEmail(e.target.value)}
                  required
                  placeholder='Enter your email'
                />
              </div>
              <button className='bg-[#05747F] text-base py-3 rounded-md font-medium my-[2rem] text-white' type='submit'>
                Send Password Reset Link
              </button>
            </form>
          </>
        ) : (
          <>
            <p className='text-center text-gray-600 mt-2'>
              A password reset link has been sent to your email. Please check your inbox and follow the instructions.
            </p>
          </>
        )}

        <div className='text-xs mt-4'>
          Remembered your password?{' '}
          <span
            className='text-[#23929D] font-semibold cursor-pointer'
            onClick={handleLogin}
          >
            Login
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;