import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Avatar } from '../components/PlayerCard.jsx';
import TabBar from '../components/TabBar.jsx';

const medals = ['🥇', '🥈', '🥉'];

export default function Rank() {
  const [list, setList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/leaderboard?limit=50')
      .then((data) => setList(data.list || []))
      .catch((err) => setError(err.message));
  }, []);

  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div className="page">
      <header className="backbar">
        <Link to="/">←</Link>
        <h1 className="title">人气排行榜</h1>
        <span className="spacer" />
        <span className="chip active">实时</span>
      </header>

      {error ? <div className="notice error">{error}</div> : null}

      <section className="podium">
        {[top3[1], top3[0], top3[2]].filter(Boolean).map((player) => (
          <Link to={`/players/${player.id}`} key={player.id} className={`slot ${player.rank === 1 ? 'first' : ''}`}>
            <div className="medal">{medals[player.rank - 1]}</div>
            <Avatar name={player.name} size={player.rank === 1 ? 72 : 56} />
            <p className="player-name" style={{ marginTop: 8 }}>{player.name}</p>
            <div className="mono popularity">{Number(player.popularity || 0).toLocaleString()}</div>
          </Link>
        ))}
      </section>

      <section className="card">
        {rest.map((player) => (
          <Link to={`/players/${player.id}`} className="rank-row" key={player.id}>
            <span className="rank-no mono">{player.rank}</span>
            <Avatar name={player.name} size={42} />
            <span className="rank-grow">
            <b>{player.name}</b>
            <div className="player-meta">{player.position}</div>
            </span>
            <span className="mono popularity">{Number(player.popularity || 0).toLocaleString()}</span>
          </Link>
        ))}
      </section>
      <TabBar />
    </div>
  );
}
