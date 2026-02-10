
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Main from './pages/Main.jsx';
import Login from './pages/Login.jsx';
import MemberInput from './pages/MemberInput.jsx';
import { MainLayout } from './components/MainLayout.jsx';
import { UserLayout } from './components/UserLayout.jsx';
import Posts from './components/Posts';
import Post from './components/Post';
import PostCreate from "./components/PostCreate";
import AdminPage from "./pages/AdminPage";
import Mypage from './components/Mypage.jsx';
import MypageMenty from './components/MypageMenty.jsx';
import ProfileSetting from './components/ProfileSetting.jsx';
import Calendar from './components/calendar.jsx';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Main />} />
        <Route path="/post" element={<Posts />} />
        <Route path="/post/new" element={<PostCreate />} />
        <Route path="/post/:id" element={<Post />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path='/mypagementy' element={<MypageMenty/>} />
        <Route path='/mypage' element={<Mypage/>} />
        <Route path='/profilesetting' element={<ProfileSetting/>} />
        <Route path='/calendar' element={<Calendar/>}/>
      </Route>
      <Route element={<UserLayout />}>
        <Route path='/login' element={<Login />} />
        <Route path='/memberinput' element={<MemberInput />} />
      </Route>
    </Routes>
  )
}

export default App;
