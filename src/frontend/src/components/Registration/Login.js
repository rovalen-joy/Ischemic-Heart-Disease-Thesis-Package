import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { UserAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.svg';
import { FaUser } from 'react-icons/fa6';
import { IoEyeOff, IoEye } from 'react-icons/io5';

const Login = () => {
  const [passwordShown, setPasswordShown] = useState(false);
  const [email, setEmail] = useState(''); // Store email input
  const [password, setPassword] = useState(''); // Store password input
  const { signIn, logout } = UserAuth(); // Destructure logout for potential use
  const navigate = useNavigate();

  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordShown(!passwordShown);
  };

  const navigateSignUp = () => {
    navigate('/signup');
  };

  const navigateForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleOnChangeEmail = (email) => {
    setEmail(email);
  };

  const handleOnChangePassword = (password) => {
    setPassword(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Show loading
      toast.loading('Loading...', { id: 'login_loading' });
      await signIn(email, password);

      // Hide loading after login
      toast.dismiss('login_loading');

      // Show the disclaimer modal
      setShowDisclaimer(true);
    } catch (e) {
      // Handle specific authentication errors and show only one toast
      toast.dismiss('login_loading');

      switch (e.code) {
        case 'auth/invalid-email':
          toast.error('The email address is not valid.', { id: 'login_invalid_email' });
          break;
        case 'auth/user-disabled':
          toast.error('This user account has been disabled.', { id: 'login_user_disabled' });
          break;
        case 'auth/user-not-found':
          toast.error('No account found with this email.', { id: 'login_user_not_found' });
          break;
        case 'auth/wrong-password':
          toast.error('Invalid email or password', { id: 'login_wrong_password' });
          break;
        default:
          toast.error('Failed to sign in. Please check your credentials and try again.', { id: 'login_failed' });
          break;
      }

      console.error(e.message);
    }
  };

  const handleAcceptDisclaimer = () => {
    // Pass firstName and lastName (hardcoded or fetched) via state when navigating to HomePage
    setShowDisclaimer(false);
    navigate('/home', { state: { firstName: ' ', lastName: ' ' } }); 
  };

  const handleDeclineDisclaimer = async () => {
    setShowDisclaimer(false);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className='bg-cover bg-center h-screen flex items-center justify-center bg-login'>
      <div className='bg-white px-[9.5rem] py-[2rem] rounded-2xl flex flex-col justify-center items-center'>
        <img src={logo} alt='logo' className='w-32 h-32 mb-2' />
        <h1 className='text-4xl font-[400] text-[#353535]'>Welcome Back!</h1>

        <form className='flex flex-col gap-4 mt-10 w-[18rem]' onSubmit={handleSubmit}>
          <div className='flex flex-col relative'>
            <label htmlFor='email' className='text-primary font-semibold'>
              Email:
            </label>
            <input
              id='email'
              type='email'
              className='active:border-[#353535] border-b-[3px] focus-visible:outline-0'
              onChange={(e) => handleOnChangeEmail(e.target.value)}
              required
              placeholder='Enter your email'
            />
            <FaUser size={20} color='#979797' className='absolute bottom-[.3rem] right-[.2rem]' />
          </div>
          <div className='flex flex-col relative'>
            <label htmlFor='password' className='text-primary font-semibold'>
              Password:
            </label>
            <input
              id='password'
              type={passwordShown ? 'text' : 'password'}
              className='active:border-[#353535] border-b-[3px] focus-visible:outline-0'
              onChange={(e) => handleOnChangePassword(e.target.value)}
              required
              placeholder='Enter your password'
            />
            {passwordShown ? (
              <IoEye size={20} color='#979797' onClick={togglePasswordVisibility} className='absolute bottom-[.3rem] right-[.2rem] cursor-pointer' />
            ) : (
              <IoEyeOff size={20} color='#979797' onClick={togglePasswordVisibility} className='absolute bottom-[.3rem] right-[.2rem] cursor-pointer' />
            )}
          </div>
          <button className='bg-[#05747F] text-base py-3 rounded-md font-medium my-[2rem] text-white' type='submit'>
            Login
          </button>
        </form>
        <div className='text-sm flex flex-col items-center'>
          <span>
            Don’t have an account?{' '}
            <span className='text-[#23929D] font-semibold cursor-pointer' onClick={navigateSignUp}>
              Sign up
            </span>
          </span>
          <span className='text-[#23929D] font-semibold cursor-pointer mt-2' onClick={navigateForgotPassword}>
            Forgot password?
          </span>
        </div>

        {showDisclaimer && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg shadow-lg p-6 w-11/12 md:w-1/2 lg:w-1/3'>
              <h2 className='text-2xl font-bold mb-4 text-center'>Data Privacy Agreement</h2>
              <p className='text-gray-700 mb-6'>
                By using this application, you agree to our data privacy policy. We are committed to protecting your personal information and ensuring your data is handled securely. Your data will be used solely for the purpose of providing Ischemic Heart Disease predictions and will not be shared with third parties without your consent.
              </p>
              <div className='flex justify-end gap-4'>
                <button onClick={handleDeclineDisclaimer} className='bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400'>
                  Decline
                </button>
                <button onClick={handleAcceptDisclaimer} className='bg-[#05747F] text-white px-4 py-2 rounded-md hover:bg-[#035f62]'>
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;