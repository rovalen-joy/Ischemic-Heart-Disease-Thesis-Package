import React from 'react';
import NavigationBar from '../Navbar'; 
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <>
      <NavigationBar />
      <Outlet />
    </>
  );
};

export default Layout;
