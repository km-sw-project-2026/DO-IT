import "../css/loginheader.css";
import { Link } from "react-router-dom";

function LoginHeader() {
  return (
    <>
    <header className='project-login-header'>
      <div className='login-header-inner'>
        <div className='logo'>
          <Link to={'/'}>
            <img src='/images/logo.png' alt='로고'/>
          </Link>
        </div>
        <nav>
          <ul>
            <Link to="/mentypage"><li>멘토/멘티</li></Link>
            <Link to="/post"><li>커뮤니티</li></Link>
            <Link to="/calendar"><li>캘린더</li></Link>
            <Link to="/mypagementy"><li>마이페이지</li></Link>
          </ul>
        </nav>
        </div>
    </header>
    </>
    );
}

export default LoginHeader;
