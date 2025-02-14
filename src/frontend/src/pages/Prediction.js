import React, {} from 'react'
import NavigationBar from '../components/Navbar'
import { Outlet } from 'react-router-dom'

function Prediction() {
  return (
    <div className='app flex flex-col'>
      <NavigationBar />
      <Outlet />
    </div>
  )
}

export default Prediction