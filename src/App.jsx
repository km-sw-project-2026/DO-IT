
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Main from './pages/Main.jsx';
import Community from './pages/Community.jsx';
import CommunityInput from './pages/CommunityInput.jsx';
import CommunityView from './pages/CommunityView.jsx';
import Login from './pages/Login.jsx';
import MemberInput from './pages/MemberInput.jsx';
import { MainLayout } from './components/MainLayout.jsx';
import { UserLayout } from './components/UserLayout.jsx';


function App() {

  return (
    <Routes>
      <Route element={<MainLayout/>}>
        <Route path="/" element={<Main />}></Route>
        <Route path="/community" element={<Community />}></Route>
        <Route path="/view" element={<CommunityView />}></Route>
        <Route path="/input" element={<CommunityInput />}></Route>
      </Route>

      <Route element={<UserLayout/>}>
        <Route path='/login' element={<Login />}></Route>
        <Route path='/memberinput' element={<MemberInput />}></Route>
      </Route>
    </Routes>
  )
}

export default App
