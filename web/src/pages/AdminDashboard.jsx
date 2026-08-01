import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getUser } from '../api.js';
import AdminShell from '../components/AdminShell.jsx';

export default function AdminDashboard() {
  const user = getUser();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') return;
    api('/api/admin/dashboard', { auth: true }).then(setData).catch((err) => setError(err.message));
  }, [user?.role]);

  if (user?.role !== 'admin') {
    return <div className="page"><div className="notice error">仅教练可访问后台，<Link to="/login">去登录</Link></div></div>;
  }

  return (
    <AdminShell title="数据总览" subtitle="活动核心数据一眼看全">
      {error ? <div className="notice error">{error}</div> : null}
      <section className="cards">
        <div className="data-card"><span>总选手</span><b className="mono">{data?.cards?.players ?? '-'}</b></div>
        <div className="data-card"><span>累计票数</span><b className="mono">{Number(data?.cards?.votes || 0).toLocaleString()}</b></div>
        <div className="data-card"><span>累计收益</span><b className="mono">¥{Number(data?.cards?.revenue || 0).toFixed(2)}</b></div>
        <div className="data-card"><span>活动状态</span><b>{data?.cards?.activity_status || '-'}</b></div>
      </section>

      <section className="two-col">
        <div className="table-card">
          <h2 className="title" style={{ fontSize: 18 }}>人气排行 Top 5</h2>
          <table>
            <thead><tr><th>排名</th><th>选手</th><th>位置</th><th>人气</th></tr></thead>
            <tbody>
              {(data?.top5 || []).map((player) => (
                <tr key={player.id}><td className="mono">{player.rank}</td><td>{player.name}</td><td>{player.position}</td><td className="mono popularity">{player.popularity}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-card">
          <h2 className="title" style={{ fontSize: 18 }}>最近送礼动态</h2>
          <table>
            <thead><tr><th>家长</th><th>选手</th><th>礼物</th><th>金额</th></tr></thead>
            <tbody>
              {(data?.recentGifts || []).map((log) => (
                <tr key={log.id}><td>{log.parent_name}</td><td>{log.player_name}</td><td>{log.gift_name} × {log.quantity}</td><td className="mono">¥{Number(log.money || 0).toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
