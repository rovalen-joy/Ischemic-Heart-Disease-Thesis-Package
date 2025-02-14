import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import toast, { Toaster } from 'react-hot-toast';

const UserContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); // Store additional user data like firstName, lastName

  // Signup function
  const createUser = async (email, password, firstName, lastName) => {
    try {
      toast.dismiss(); // Dismiss any existing toasts
      toast.loading('Loading...', { id: 'signup_loading' });

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Store the user's first name, last name, email, and uid in Firestore under the "users" collection
      await setDoc(doc(db, 'users', userId), {
        firstName,
        lastName,
        email,
        uid: userId, // Added uid field
      });

      toast.dismiss('signup_loading');
      toast.success('Account created successfully', { id: 'signup_success' });
    } catch (error) {
      toast.dismiss('signup_loading');
      console.error('Error creating user:', error.message);
      toast.error(`Failed to create account: ${error.message}`, { id: 'signup_error' });
      throw error;
    }
  };

  // Signin function with improved error handling
  const signIn = async (email, password) => {
    try {
      toast.dismiss();
      toast.loading('Loading...', { id: 'login_loading' });

      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      toast.dismiss('login_loading');
      return userCredential;
    } catch (error) {
      toast.dismiss('login_loading');
      console.error('Error signing in:', error.message);

      switch (error.code) {
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
          toast.error('Incorrect password. Please try again.', { id: 'login_wrong_password' });
          break;
        default:
          toast.error('Failed to sign in. Please check your credentials and try again.', { id: 'login_failed' });
          break;
      }
      throw error;
    }
  };

  // Fetch additional user data from Firestore (firstName, lastName)
  const fetchUserData = async (userId) => {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setUserData(docSnap.data());
    } else {
      console.error('No such user data found in Firestore!');
      setUserData(null);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      toast.dismiss(); // Dismiss any active toasts

      // Use a unique toast ID to avoid duplicate toasts
      const toastId = 'logout_loading'

      // Show the loading toast
      toast.loading('Logging out...', { id: toastId });

      // Perform the logout
      await signOut(auth);

      // After logout, dismiss loading and show success
      toast.dismiss(toastId);
      toast.success('Logged out successfully', { id: 'logout_success' });
    } catch (error) {
      // In case of error, dismiss loading and show the error message
      toast.dismiss('logout_loading');
      console.error('Error logging out:', error.message);
      toast.error(`Failed to logout: ${error.message}`, { id: 'logout_error' });
    }
  };

  // Reset Password function
  const resetPassword = async (email) => {
    try {
      toast.dismiss();
      toast.loading('Sending password reset email...', { id: 'reset_loading' });

      await sendPasswordResetEmail(auth, email);

      toast.dismiss('reset_loading');
      toast.success('Password reset email sent successfully.', { id: 'reset_success' });
    } catch (error) {
      toast.dismiss('reset_loading');
      console.error('Error sending password reset email:', error.message);
      toast.error(`Failed to send password reset email: ${error.message}`, { id: 'reset_error' });
      throw error;
    }
  };

  // Listen for authentication state changes and fetch user data
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserData(currentUser.uid);
      } else {
        setUser(null);
        setUserData(null);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  return (
    <UserContext.Provider value={{ createUser, user, userData, logout, signIn, resetPassword }}>
      {children}
      <Toaster />
    </UserContext.Provider>
  );
};

// Create a hook to use the AuthContext
export const UserAuth = () => {
  return useContext(UserContext);
};