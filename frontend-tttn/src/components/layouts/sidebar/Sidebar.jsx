import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  Search,
  History,
  Brain,
} from "lucide-react";

import "./Sidebar.scss";

function Sidebar() {
  return (
    <aside className="sidebar">

      <div className="sidebar__logo">
        <Brain size={28} />

        <span>
          SmartLearn
        </span>
      </div>

      <nav className="sidebar__menu">

        <NavLink
          to="/"
          className="sidebar__item"
        >
          <LayoutDashboard size={20} />

          <span>
            Dashboard
          </span>
        </NavLink>

        <NavLink
          to="/documents"
          className="sidebar__item"
        >
          <FileText size={20} />

          <span>
            Documents
          </span>
        </NavLink>

        <NavLink
          to="/search"
          className="sidebar__item"
        >
          <Search size={20} />

          <span>
            Semantic Search
          </span>
        </NavLink>

        <NavLink
          to="/history"
          className="sidebar__item"
        >
          <History size={20} />

          <span>
            History
          </span>
        </NavLink>

      </nav>

    </aside>
  );
}

export default Sidebar;