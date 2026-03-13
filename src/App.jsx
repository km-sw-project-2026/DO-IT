
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
import Mentoring from './components/Menty/Mentoring.jsx';
import Mentoreview from './components/Menty/Mentoreview.jsx';
import Mentologin from './components/Menty/Mentologin.jsx';
import ProfileSetting from './components/ProfileSetting.jsx';
import Calendar from './components/calendar.jsx';
import Mypageposts from './components/mypageposts.jsx';
import MypageRepository from './components/MypageRepository.jsx';
import MypageRepositoryDelete from './components/MypageRepositoryDelete.jsx';
import RepositoryTrashFolder from './components/RepositoryTrashFolder.jsx';
import MRFI from './components/MRFI.jsx';
import MRSDB from './components/MRSDB.jsx';
import Bookmark from './components/Bookmark.jsx';
import DocEditor from "./components/DocEditor";
import DocViewer from "./components/DocViewer";


function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Main />} />
        <Route path="/post" element={<Posts />} />
        <Route path="/post/new" element={<PostCreate />} />
        <Route path="/post/:id" element={<Post />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path='/mypagementy' element={<MypageMenty />} />
        <Route path='/mypagementor' element={<MypageMentor />} />
        <Route path='/mentypage' element={<Mentypage />} />
        <Route path='/mentoring/:id' element={<Mentoring />} />
        <Route path='/mentoreview' element={<Mentoreview />} />
        <Route path='/mentologin' element={<Mentologin />} />
        <Route path='/mypagerepository' element={<MypageRepository />} />
        <Route path='/mypagerepositorydelete' element={<MypageRepositoryDelete />} />
        <Route path='/mrfi' element={<MRFI />} />
        <Route path='/mrsdb' element={<MRSDB />} />
        <Route path='/Bookmark' element={<Bookmark />} />
        <Route path="/editor" element={<DocEditor />} />
        <Route path="/doc-editor" element={<DocEditor />} />
        <Route path="/doc-editor/:id" element={<DocEditor />} />
        <Route path="/mypagerepository" element={<MypageRepository />} />
        <Route path="/doc-view/:id" element={<DocViewer />} />
        <Route path="/doc-edit" element={<DocEditor />} />
        <Route path="/doc-edit/:id" element={<DocEditor />} />
        <Route path="/mypage/repository" element={<MypageRepository />} />
        <Route path="/repository/folder/:folderId" element={<MRFI />} />
        <Route path="/repository" element={<MypageRepository />} />
        <Route path="/repository/trash" element={<MypageRepositoryDelete />} />
        <Route path="/repository/trash/folder/:folderId" element={<RepositoryTrashFolder />} />
      </Route>
      <Route element={<UserLayout />}>
        <Route path='/login' element={<Login />} />
        <Route path='/memberinput' element={<MemberInput />} />
      </Route>
    </Routes>
  )
}

export default App;
