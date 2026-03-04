
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
import MypageMenty from './components/MypageMenty.jsx';
import Mypagedata from './components/Mypagedata.jsx';
import MypageMentor from './components/MypageMentor.jsx';
import Mentypage from './components/Menty/Mentypage.jsx';
import ProfileSetting from './components/ProfileSetting.jsx';
import Calendar from './components/calendar.jsx';
import Mypageposts from './components/mypageposts.jsx';
import MypageRepository from './components/MypageRepository.jsx';
import MypageRepositoryDelete from './components/MypageRepositoryDelete.jsx';
import MRFI from './components/MRFI.jsx';
import MRSDB from './components/MRSDB.jsx';
import Bookmark from './components/Bookmark.jsx';

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
        <Route path='/mypage' element={<Mypagedata/>} />
        <Route path='/mypageMentor' element={<MypageMentor/>} />
        <Route path='/mentypage' element={<Mentypage/>} />
        <Route path='/profilesetting' element={<ProfileSetting/>} />
        <Route path='/mypagerepository' element={<MypageRepository/>} />
        <Route path='/mypagerepositorydelete' element={<MypageRepositoryDelete/>} />
        <Route path='/mrfi' element={<MRFI/>} />
        <Route path='/mrsdb' element={<MRSDB/>} />
        <Route path='/calendar' element={<Calendar />} />
        <Route path='/mypageposts' element={<Mypageposts/>} />
        <Route path='/Bookmark' element={<Bookmark/>} />
      </Route>
      <Route element={<UserLayout />}>
        <Route path='/login' element={<Login />} />
        <Route path='/memberinput' element={<MemberInput />} />
      </Route>
    </Routes>
  )
}

export default App;
