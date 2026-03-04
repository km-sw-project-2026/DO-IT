function MypageRepositoryfile({ name }) {
  return (
    <li className="mypagerepository-main-body-inner">
      <button className="mypagerepository-bg">
        <img src="/images/icon/folder.png" alt="" />
        <p>{name}</p>
      </button>

      <button type="button">
        <div className="mypagerepository-span">
          <span>•</span>
          <span>•</span>
          <span>•</span>
        </div>
      </button>
    </li>
  );
}

export default MypageRepositoryfile;