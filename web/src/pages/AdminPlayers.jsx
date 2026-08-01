import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getUser } from '../api.js';
import AdminShell from '../components/AdminShell.jsx';

const empty = { name: '', position: '前锋', number: '' };

export default function AdminPlayers() {
  const user = getUser();
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState('');

  function load() {
    api('/api/admin/players?page=1&size=50', { auth: true }).then((data) => setList(data.list || [])).catch((err) => setMessage(err.message));
  }

  useEffect(() => {
    if (user?.role === 'admin') load();
  }, [user?.role]);

  async function add() {
    try {
      await api('/api/players', { method: 'POST', auth: true, body: { ...form, number: form.number ? Number(form.number) : null } });
      setForm(empty);
      setMessage('已新增');
      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('确定删除这位选手吗？')) return;
    try {
      await api(`/api/players/${id}`, { method: 'DELETE', auth: true });
      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (user?.role !== 'admin') {
    return <div className="page"><div className="notice error">仅教练可访问后台，<Link to="/login">去登录</Link></div></div>;
  }

  return (
    <AdminShell title="选手管理" subtitle={`共 ${list.length} 位选手`}>
      {message ? <div className="notice">{message}</div> : null}
      <section className="table-card" style={{ marginBottom: 14 }}>
        <div className="code-row" style={{ gridTemplateColumns: '1fr 140px 110px auto' }}>
          <input className="input" placeholder="姓名" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
            <option>前锋</option><option>后卫</option><option>中锋</option>
          </select>
          <input className="input" placeholder="队号" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          <button className="btn" onClick={add}>新增选手</button>
        </div>
      </section>
      <section className="table-card">
        <table>
          <thead><tr><th>ID</th><th>姓名</th><th>位置</th><th>人气</th><th>票数</th><th>操作</th></tr></thead>
          <tbody>
            {list.map((player) => (
              <tr key={player.id}>
                <td className="mono">{player.id}</td>
                <td>{player.name}</td>
                <td>{player.position}{player.number ? ` · ${player.number}` : ''}</td>
                <td className="mono popularity">{player.popularity}</td>
                <td className="mono">{player.votes}</td>
                <td><button className="btn ghost" onClick={() => remove(player.id)}>删除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
