import logo from './images/logo.png';
import './App.css';

function App() {
  return (
    <div className='App'>
    <header className='project-header'>
      <div className='header-inner'>
        <div className='logo'>
          <a href='#'>
            <img src={logo} alt='로고'/>
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
    <main>
    <section className='main-page'>
      
      <div className='main-page-contents'>
        <img src={logo} alt=''/>
        <h1>캘린더에서 친구들과 함께 디데이정리부터 <br></br>
        필기정리 / 정보공유 / 1:1 멘토멘티 서비스까지
        </h1>
        <p>DO:IT은  사용자를 탐색해 멘토멘티 기능을 구현하고<br></br>
          캘린더 기능으로 시험준비 및 공유까지 가능한 <br></br>
          공부 서비스입니다.</p>
      </div>
    </section>
    <section className='main-page-mypage'>
      <div className='main-page-mypage-header'>
        <h2>나만의 <span>자료함</span></h2>
        <button>자료함 바로가기</button>
      </div>
      <div></div>
    </section>
    </main>
    </div>
  );
}

export default App;
