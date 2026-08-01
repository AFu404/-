import { NavLink } from 'react-router-dom';
import { getUser, logout } from '../api.js';

export default function AdminShell({ title, subtitle, children }) {
  const user = getUser();
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="logo"><span className="logo-mark" /> 投票后台</div>
        <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>数据总览</NavLink>
        <NavLink to="/admin/players" className={({ isActive }) => (isActive ? 'active' : '')}>选手管理</NavLink>
        <NavLink to="/rewards" className={({ isActive }) => (isActive ? 'active' : '')}>奖励设置</NavLink>
        <NavLink to="/">家长端</NavLink>
        <button className="btn ghost" onClick={() => { logout(); location.href = '/login'; }}>退出</button>
        <div style={{ marginTop: 'auto', color: '#aab0bd', fontSize: 12 }}>{user?.name || '教练'}</div>
      </aside>
      <main className="admin-main">
        <div className="admin-top">
          <div>
            <h1 className="title">{title}</h1>
            {subtitle ? <p className="subtitle">{subtitle}</p> : null}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
