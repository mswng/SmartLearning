import { useEffect, useState } from "react";
import { Lock, Unlock, UserPlus, ShieldCheck } from "lucide-react";

import { adminApi } from "~/api/index.js";
import { useAuth } from "~/context/AuthContext.jsx";
import Loading from "~/components/common/Loading.jsx";
import Modal from "~/components/common/Modal.jsx";
import Button from "~/components/common/Button.jsx";
import "./AdminUsersPage.scss";

function AdminUsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi
      .listUsers()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleToggleLock = async (u) => {
    setTogglingId(u.id);
    setError(null);
    try {
      const updated = await adminApi.setUserEnabled(u.id, !u.enabled);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch (e) {
      setError(e.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const created = await adminApi.createAdmin(form);
      setUsers((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setForm({ name: "", email: "", password: "" });
    } catch (e2) {
      setCreateError(e2.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-page__header">
        <div>
          <h1 className="admin-users-page__title">Quản lý người dùng</h1>
          <p className="admin-users-page__subtitle">
            Khóa/mở khóa tài khoản hoặc thêm quản trị viên mới. Dữ liệu tài
            liệu, hội thoại, quiz của mỗi người dùng luôn tách biệt độc lập.
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus size={16} /> Thêm quản trị viên
        </Button>
      </div>

      {error && <p className="admin-users-page__error">{error}</p>}

      {loading ? (
        <Loading />
      ) : (
        <div className="admin-users-page__table-wrap">
          <table className="admin-users-page__table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      {u.role === "ADMIN" ? (
                        <span className="admin-users-page__badge admin-users-page__badge--admin">
                          <ShieldCheck size={12} /> Admin
                        </span>
                      ) : (
                        <span className="admin-users-page__badge">User</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`admin-users-page__badge ${
                          u.enabled
                            ? "admin-users-page__badge--active"
                            : "admin-users-page__badge--locked"
                        }`}
                      >
                        {u.enabled ? "Hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : ""}</td>
                    <td>
                      <button
                        className={`admin-users-page__lock-btn${
                          u.enabled ? "" : " admin-users-page__lock-btn--locked"
                        }`}
                        disabled={isSelf || togglingId === u.id}
                        title={
                          isSelf
                            ? "Không thể tự khóa tài khoản của chính mình"
                            : u.enabled
                              ? "Khóa tài khoản"
                              : "Mở khóa tài khoản"
                        }
                        onClick={() => handleToggleLock(u)}
                      >
                        {u.enabled ? <Lock size={14} /> : <Unlock size={14} />}
                        {u.enabled ? "Khóa" : "Mở khóa"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <Modal title="Thêm quản trị viên mới" onClose={() => setShowCreateModal(false)}>
          <form className="admin-users-page__create-form" onSubmit={handleCreateAdmin}>
            <input
              type="text"
              placeholder="Họ tên"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            {createError && <p className="admin-users-page__error">{createError}</p>}

            <Button type="submit" full loading={creating}>
              Tạo tài khoản admin
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default AdminUsersPage;
