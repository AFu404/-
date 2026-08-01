import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', icon: '🏠', label: '首页' },
  { to: '/rank', icon: '🏆', label: '排行' },
  { to: '/login', icon: '👤', label: '我的' },
];

export default function TabBar() {
  return (
    <nav className="tabbar">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')} end={item.to === '/'}>
          <span className="icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
