import { useEffect, useState } from "react";
import {
  Users,
  FileText,
  MessagesSquare,
  HelpCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { adminApi } from "~/api/index.js";
import Loading from "~/components/common/Loading.jsx";
import "./AdminDashboardPage.scss";

// Rút gọn "yyyy-MM-dd" -> "dd/MM" cho trục X đỡ rối.
function formatDay(dateStr) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi
      .getDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Đang tải số liệu..." />;
  if (error) return <p className="admin-dashboard-page__error">{error}</p>;
  if (!stats) return null;

  const userChartData = stats.userGrowth.map((p) => ({
    day: formatDay(p.date),
    "Người dùng mới": p.count,
  }));

  const documentChartData = stats.documentGrowth.map((p) => ({
    day: formatDay(p.date),
    "Tài liệu tải lên": p.count,
  }));

  return (
    <div className="admin-dashboard-page">
      <h1 className="admin-dashboard-page__title">Trang chủ quản trị</h1>
      <p className="admin-dashboard-page__subtitle">
        Tổng quan số liệu toàn hệ thống Smart Learning AI.
      </p>

      <div className="admin-dashboard-page__kpis">
        <div className="admin-dashboard-page__kpi">
          <div className="admin-dashboard-page__kpi-icon admin-dashboard-page__kpi-icon--blue">
            <Users size={20} />
          </div>
          <div>
            <p className="admin-dashboard-page__kpi-value">{stats.totalUsers}</p>
            <p className="admin-dashboard-page__kpi-label">Tổng người dùng</p>
          </div>
        </div>

        <div className="admin-dashboard-page__kpi">
          <div className="admin-dashboard-page__kpi-icon admin-dashboard-page__kpi-icon--green">
            <FileText size={20} />
          </div>
          <div>
            <p className="admin-dashboard-page__kpi-value">{stats.totalDocuments}</p>
            <p className="admin-dashboard-page__kpi-label">Tổng tài liệu</p>
          </div>
        </div>

        <div className="admin-dashboard-page__kpi">
          <div className="admin-dashboard-page__kpi-icon admin-dashboard-page__kpi-icon--amber">
            <MessagesSquare size={20} />
          </div>
          <div>
            <p className="admin-dashboard-page__kpi-value">{stats.totalConversations}</p>
            <p className="admin-dashboard-page__kpi-label">Hội thoại đã tạo</p>
          </div>
        </div>

        <div className="admin-dashboard-page__kpi">
          <div className="admin-dashboard-page__kpi-icon admin-dashboard-page__kpi-icon--purple">
            <HelpCircle size={20} />
          </div>
          <div>
            <p className="admin-dashboard-page__kpi-value">{stats.totalQuizzes}</p>
            <p className="admin-dashboard-page__kpi-label">Bộ quiz đã tạo</p>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-page__charts">
        <div className="admin-dashboard-page__chart-card">
          <h3>Người dùng đăng ký mới (14 ngày gần nhất)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={userChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" fontSize={12} stroke="#9ca3af" />
              <YAxis allowDecimals={false} fontSize={12} stroke="#9ca3af" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="Người dùng mới"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-dashboard-page__chart-card">
          <h3>Tài liệu tải lên (14 ngày gần nhất)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={documentChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" fontSize={12} stroke="#9ca3af" />
              <YAxis allowDecimals={false} fontSize={12} stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="Tài liệu tải lên" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
