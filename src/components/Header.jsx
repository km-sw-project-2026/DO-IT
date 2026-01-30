import '../css/Header.css';
import { Link } from "react-router-dom";

function Header() {
  return (
    <header className='project-header'>
      <div className='header-inner'>
        <div className='logo'>
          <Link to={'/'}>
            <img src='/images/logo.png' alt='로고'/>
          </Link>
        </div>
        <nav>
          <ul>
            <li>멘토/멘티</li>
            <Link to={'/post'}><li>커뮤니티</li></Link>
            <li>캘린더</li>
            <li>마이페이지</li>
          </ul>
        </nav>
        <div className='user'>
          <Link to={"/Login"} className='login'>로그인</Link>
          <Link to={"/memberinput"} className='new-user'>회원가입</Link>
        </div>
        </div>
    </header>
    );
}

export default Header;