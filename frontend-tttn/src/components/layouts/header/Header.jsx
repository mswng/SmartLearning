import "./Header.scss";

function Header() {
  return (
    <header className="header">
      <div className="header__left">
        <h2 className="header__title">
          Smart Learning AI
        </h2>
      </div>

      <div className="header__right">
        <span className="header__username">
          Thanh Sương
        </span>

        <div className="header__avatar">
          S
        </div>
      </div>
    </header>
  );
}

export default Header;