import { Link } from "react-router-dom";

function Main() {
  return (
    <main>
      <section className='main-page'>

        <div className='main-page-contents'>
          <img src='/images/logo.png' alt='' />
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
          <div className="mypage-title">
            <h2>나만의 <span>자료함</span></h2>
            <img
              src="/images/mypage_icon.png"
              alt="자료함 아이콘"
              className="mypage-emoji"
            />
          </div>
          <Link to="/mypage"><button>자료함 바로가기</button></Link>
        </div>
        <div className="folder-area">
          <div className="folder-grid">
            <button className="folder-card">
              <img src="/images/folder.png" alt="수학" />
              <p>수학</p>
            </button>

            <button className="folder-card">
              <img src="/images/folder.png" alt="영어" />
              <p>영어</p>
            </button>

            <button className="folder-card">
              <img src="/images/folder.png" alt="국어" />
              <p>국어</p>
            </button>
          </div>
        </div>
      </section>
      <section className="main-page-mypage">
        <div className="recent-wrap">
          <h3>최근 커뮤니티 글</h3>

          <Link to="/post">
            <div className="recent-card">
              <div className="recent-header">
                <span className="recent-title">커뮤니티</span>

                <div className="recent-action">
                  <span className="recent-more">더보기</span>
                  <button className="recent-plus">+</button>
                </div>
              </div>


              <ul className="recent-list">
                <li>
                  <span>커뮤니티 최신 글 1</span>
                  <span className="recent-date">2025.04.23</span>
                </li>
                <li>
                  <span>커뮤니티 최신 글 2</span>
                  <span className="recent-date">2025.04.22</span>
                </li>
                <li>
                  <span>커뮤니티 최신 글 3</span>
                  <span className="recent-date">2025.04.21</span>
                </li>
                <li>
                  <span>커뮤니티 최신 글 4</span>
                  <span className="recent-date">2025.04.20</span>
                </li>
              </ul>
            </div>
          </Link>
        </div>
</section>

      {/* =======================
    1:1 멘토멘티 섹션
======================= */}

      <section className="mm-hero">
        <div className="mm-inner">
          {/* 왼쪽 텍스트 */}
          <div className="mm-left">
            <p className="mm-kicker">DO:IT만의 특별한 서비스</p>
            <h2 className="mm-title">1:1 멘토멘티</h2>
            <p className="mm-desc">
              1:1 멘토멘티 서비스는 맞춤형 학습으로<br />
              사용자의 수준에 맞도록 멘토와 멘티를 찾아<br />
              자동으로 연결시켜 배울 수 있도록 돕습니다.
            </p>

            <div className="mm-actions">
              <button className="mm-btn mm-btn--primary">멘토 서비스</button>
              <button className="mm-btn mm-btn--ghost">멘티 서비스</button>
            </div>
          </div>


          <div className="mm-right">
            <img
              className="mm-illust"
              src="/images/mentor_illust.png"
              alt="멘토멘티 일러스트"
            />
          </div>
        </div>
      </section>


      <section className="mm-stars">
        <div className="mm-stars-inner">
          <p className="mm-slogan">
            <span className="brand">DO:IT</span> 와 함께<br />
            <span className="highlight">편리</span>하고{" "}
            <span className="highlight2">효율적인</span> 공부
          </p>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="main-footer">
        <div className="footer-inner">
          <p>© 2026 DO:IT. All rights reserved.</p>
        </div>
      </footer>



    </main>
  );
}
export default Main;