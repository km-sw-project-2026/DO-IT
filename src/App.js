
import './App.css';
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
    <div className='App'>
    <Header/>
    {/* <LoginHeader/> */}
    {/* <Main/> */}
    {/* <Community/> */}
    <CommunityView/>
    {/* <CommunityInput/> */}
    {/* <Login/> */}
    {/* <MemberInput/> */}
    </div>
  ); 
}

export default App;
