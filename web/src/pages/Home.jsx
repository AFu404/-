import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import PlayerCard from '../components/PlayerCard.jsx';
import TabBar from '../components/TabBar.jsx';

const positions = ['全部', '前锋', '后卫', '中锋'];

export default function Home() {
  const [activity, setActivity] = useState(null);
  const [players, setPlayers] = useState([]);
  const [position, setPosition] = useState('全部');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api('/api/activity/current'),
      api(`/api/players?position=${encodeURIComponent(position)}`),
    ])
      .then(([activityData, playerData]) => {
        setActivity(activityData.activity);
        setPlayers(playerData.players || []);
      })
      .catch((err) => setError(err.message));
  }, [position]);

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1 className="title">人气投票</h1>
          <p className="subtitle">每天签到，为喜欢的球员加油</p>
        </div>
        <Link className="btn ghost" to="/login">登录</Link>
      </header>

      <section className="banner">
        <strong>{activity?.title || '篮球人气评选'}</strong>
        <span>截止：{activity?.end_at ? new Date(activity.end_at).toLocaleString() : '待设置'}</span>
      </section>

      <div className="chips">
        {positions.map((item) => (
          <button key={item} className={`chip ${item === position ? 'active' : ''}`} onClick={() => setPosition(item)}>
            {item}
          </button>
        ))}
      </div>

      {error ? <div className="notice error">{error}</div> : null}
      <main className="grid">
        {players.map((player) => <PlayerCard key={player.id} player={player} />)}
      </main>
      <TabBar />
    </div>
  );
}
