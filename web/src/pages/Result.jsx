import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Avatar } from '../components/PlayerCard.jsx';

export default function Result() {
  const [data, setData] = useState({ activity: null, winners: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/activity/current')
      .then((current) => api(`/api/activity/${current.activity.id}/result`))
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <header className="backbar">
        <Link to="/">←</Link>
        <h1 className="title">评选结果</h1>
        <span className="spacer" />
      </header>
      <section className="banner">
        <strong>{data.activity?.status === '已结束' ? '活动已收官' : '活动进行中'}</strong>
        <span>{data.activity?.title || '篮球人气评选'}</span>
      </section>
      {error ? <div className="notice error">{error}</div> : null}
      <section className="card">
        {data.winners.map((winner) => (
          <div className="rank-row" key={winner.id}>
            <span className="rank-no mono">{winner.rank}</span>
            <Avatar name={winner.name} size={44} />
            <span className="rank-grow">
              <b>{winner.name}</b>
              <div className="player-meta">{winner.reward_title} · {winner.reward_description}</div>
            </span>
            <span className="mono popularity">{Number(winner.popularity || 0).toLocaleString()}</span>
          </div>
        ))}
      </section>
      <p className="help">活动结束后可在这里展示获奖名单</p>
    </div>
  );
}
