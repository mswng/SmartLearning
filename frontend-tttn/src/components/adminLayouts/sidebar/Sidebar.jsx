import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  User,
  FileText,
} from "lucide-react";

import "./Sidebar.scss";

const navClass = ({ isActive }) =>
  `sidebar__item${isActive ? " active" : ""}`;

function Sidebar() {
  return (
    <aside className="sidebar">

      <nav className="sidebar__menu">
        <NavLink to="/admin" end className={navClass}>
          <LayoutDashboard size={20} />
          <span>Trang chủ</span>
        </NavLink>

        <NavLink to="/admin/users" className={navClass}>
          <User size={20} />
          <span>Quản lý người dùng</span>
        </NavLink>

        <NavLink to="/admin/documents" className={navClass}>
          <FileText size={20} />
          <span>Tài liệu</span>
        </NavLink>

      </nav>
    </aside>
  );
}

export default Sidebar;
