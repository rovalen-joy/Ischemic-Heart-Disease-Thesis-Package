import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { IoEye, IoEyeOff, IoArrowBack, IoArrowForward } from 'react-icons/io5';
import logo from '../../assets/logo.svg';

const SignUp = () => {
  const [passwordShown, setPasswordShown] = useState(false);
  const [confirmPasswordShown, setConfirmPasswordShown] = useState(false);
  const [step, setStep] = useState(1); // To track which screen the user is on
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  }); // Store user input data
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false
  });

  const { createUser } = UserAuth();
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setPasswordShown(!passwordShown);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordShown(!confirmPasswordShown);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));

    if (name === 'password') {
      updatePasswordCriteria(value);
    }
  };

  const updatePasswordCriteria = (password) => {
    setPasswordCriteria({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password)
    });
  };

  const validatePassword = (password) => {
    const { minLength, hasUpperCase, hasLowerCase, hasNumber } = passwordCriteria;

    if (!minLength || !hasUpperCase || !hasLowerCase || !hasNumber) {
      return 'Password does not meet the required criteria.';
    }

    return null;
  };

  const handleNext = (e) => {
    e.preventDefault();
    // On the first step, don't validate the password
    if (step === 1) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const onSubmitForm = async (e) => {
    e.preventDefault();
    const errorMessage = validatePassword(credentials.password);
    if (errorMessage) {
      return toast.error(errorMessage);
    }

    if (credentials.password !== credentials.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    try {
      toast.loading('Loading...', { id: 'signup_loading' });

      // Create user with email, password, first name, and last name
      await createUser(credentials.email, credentials.password, credentials.firstName, credentials.lastName);

      toast.dismiss('signup_loading');
      navigate('/home', { state: { firstName: credentials.firstName, lastName: credentials.lastName } });
    } catch (e) {
      toast.dismiss('signup_loading');
      toast.error(e.message);
    }
  };

  const handleLogin = () => {
    navigate('/');
  };

  return (
    <div className='bg-cover bg-center h-screen flex items-center justify-center bg-login'>
      <div className='bg-white px-[7rem] py-[1rem] rounded-2xl flex flex-col justify-center items-center' style={{ width: '540px' }}>
        <img src={logo} alt='logo' className='w-36 h-36 mb-1' />
        <h1 className='text-3xl font-[400] text-[#353535] mb-1'>Sign Up</h1>
        <h1 className='text-lg mt-1 font-[300] text-[#353535]'>Create your account</h1>

        {/* Screen 1: Basic Info */}
        {step === 1 && (
          <form className='flex flex-col gap-1 mt-4 w-full' onSubmit={handleNext}>
            <div className='flex flex-col relative'>
              <label htmlFor='firstName' className='text-primary font-semibold'>First Name:</label>
              <input
                type='text'
                name='firstName'
                onChange={handleFormChange}
                value={credentials.firstName}
                className='active:border-[#353535] border-b-[3px] focus-visible:outline-0'
              />
            </div>
            <div className='flex flex-col relative'>
              <label htmlFor='lastName' className='text-primary font-semibold'>Last Name:</label>
              <input
                type='text'
                name='lastName'
                onChange={handleFormChange}
                value={credentials.lastName}
                className='active:border-[#353535] border-b-[3px] focus-visible:outline-0'
              />
            </div>
            <div className='flex flex-col relative'>
              <label htmlFor='email' className='text-primary font-semibold'>Email:</label>
              <input
                type='text'
                name='email'
                onChange={handleFormChange}
                value={credentials.email}
                className='active:border-[#353535] border-b-[3px] focus-visible:outline-0'
              />
            </div>
            <div className='flex justify-between items-center mt-6'>
              <div></div> {/* Placeholder for the back arrow to align Next properly */}
              <button type="submit" className="flex items-center text-primary">
                <span className="mr-2">Next</span>
                <IoArrowForward size={24} color='#353535' />
              </button>
            </div>
          </form>
        )}

        {/* Screen 2: Password Setup */}
        {step === 2 && (
          <form className='flex flex-col gap-1 mt-4 w-full' onSubmit={onSubmitForm}>
            <div className='flex justify-between items-center mb-4'>
              <button onClick={handleBack} type="button" className="flex items-center text-primary">
                <IoArrowBack size={24} color='#353535' className='mr-2' />
                <span>Back</span>
              </button>
              <div></div> {/* Placeholder for alignment */}
            </div>
            <div className='flex flex-col relative'>
              <label htmlFor='password' className='text-primary font-semibold'>Password:</label>
              <input
                type={!passwordShown ? 'password' : 'text'}
                name='password'
                onChange={handleFormChange}
                value={credentials.password}
                className='active:border-[#353535] border-b-[3px] focus-visible:outline-0'
              />
              {!passwordShown ? (
                <IoEyeOff size={18} color='#979797' onClick={togglePasswordVisibility} className='absolute bottom-[.3rem] right-[.2rem]' />
              ) : (
                <IoEye size={18} color='#979797' onClick={togglePasswordVisibility} className='absolute bottom-[.3rem] right-[.2rem]' />
              )}
            </div>
            <div className='text-sm mt-1'>
              <p className={passwordCriteria.minLength ? 'text-green-600' : 'text-red-600'}>At least 8 characters long</p>
              <p className={passwordCriteria.hasUpperCase ? 'text-green-600' : 'text-red-600'}>At least one uppercase letter</p>
              <p className={passwordCriteria.hasLowerCase ? 'text-green-600' : 'text-red-600'}>At least one lowercase letter</p>
              <p className={passwordCriteria.hasNumber ? 'text-green-600' : 'text-red-600'}>At least one number</p>
            </div>
            <div className='flex flex-col relative'>
              <label htmlFor='confirmPassword' className='text-primary font-semibold'>Confirm Password:</label>
              <input
                type={!confirmPasswordShown ? 'password' : 'text'}
                name='confirmPassword'
                onChange={handleFormChange}
                value={credentials.confirmPassword}
                className='active:border-[#353535] border-b-[3px] focus-visible:outline-0'
              />
              {!confirmPasswordShown ? (
                <IoEyeOff size={18} color='#979797' onClick={toggleConfirmPasswordVisibility} className='absolute bottom-[.3rem] right-[.2rem]' />
              ) : (
                <IoEye size={18} color='#979797' onClick={toggleConfirmPasswordVisibility} className='absolute bottom-[.3rem] right-[.2rem]' />
              )}
            </div>
            <button className='bg-[#05747F] text-base py-2 rounded-md font-medium my-[1rem] text-white' type='submit'>
              Sign Up
            </button>
          </form>
        )}

        <div className='text-sm flex gap-1 mt-2 mb-2'>
          Already have an account?
          <span onClick={handleLogin} className='text-[#23929D] font-semibold cursor-pointer'>Login</span>
        </div>
      </div>
    </div>
  );
};

export default SignUp;