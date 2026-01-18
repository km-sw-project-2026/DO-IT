
import './App.css';
import React, { Component } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Main from './Main.jsx';
import Community from './pages/Community.jsx';
import CommunityInput from './pages/CommunityInput.jsx';
import CommunityView from './pages/CommunityView.jsx';
import Login from './pages/Login.jsx';
import LoginHeader from './components/loginheader.jsx';
import MemberInput from './pages/MemberInput.jsx';


function App() {
  return (
    <BrowserRouter>
      <div className='App'>
        <Header/>
        {/* <LoginHeader /> */}
        <Routes>
          <Route path="/" element={<Main />}></Route>
          <Route path="/community" element={<Community />}></Route>
          <Route path="/view" element={<CommunityView />}></Route>
          <Route path="/input" element={<CommunityInput />}></Route>
          <Route path='/login' element={<Login />}></Route>
          <Route path='/memberinput' element={<MemberInput />}></Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
