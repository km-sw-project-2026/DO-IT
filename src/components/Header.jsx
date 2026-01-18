import '../css/Header.css';

function Header() {
  return (
    <header className='project-header'>
      <div className='header-inner'>
        <div className='logo'>
          <a href='#'>
            <img src='./images/logo.png' alt='로고'/>
          </a>
        </div>
        <nav>
          <ul>
            <li><a href='#'>멘토/멘티</a></li>
            <li><a href='#'>커뮤니티</a></li>
            <li><a href='#'>캘린더</a></li>
            <li><a href='#'>마이페이지</a></li>
          </ul>
        </nav>
        <div className='user'>
          <a href='#' className='login'>로그인</a>/
          <a href='#' className='new-user'>회원가입</a>
        </div>
        </div>
    </header>
    );
}

export default Header;