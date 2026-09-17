import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  Search,
  History,
  Brain,
} from "lucide-react";

import "./Sidebar.scss";

const navClass = ({ isActive }) =>
  `sidebar__item${isActive ? " active" : ""}`;

function Sidebar() {
  return (
    <aside className="sidebar">

      <nav className="sidebar__menu">
        <NavLink to="/" end className={navClass}>
          <LayoutDashboard size={20} />
          <span>Trang chủ</span>
        </NavLink>

        <NavLink to="/documents" className={navClass}>
          <FileText size={20} />
          <span>Tài liệu</span>
        </NavLink>

        <NavLink to="/search" className={navClass}>
          <Search size={20} />
          <span>Tìm kiếm ngữ nghĩa</span>
        </NavLink>

        <NavLink to="/history" className={navClass}>
          <History size={20} />
          <span>Lịch sử</span>
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
