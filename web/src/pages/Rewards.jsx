import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getUser } from '../api.js';

export default function Rewards() {
  const user = getUser();
  const isAdmin = user?.role === 'admin';
  const [rewards, setRewards] = useState([]);
  const [message, setMessage] = useState('');

  function load() {
    api('/api/rewards').then((data) => setRewards(data.rewards || [])).catch((err) => setMessage(err.message));
  }
  useEffect(load, []);

  function update(index, field, value) {
    setRewards((list) => list.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  async function save() {
    try {
      await api('/api/rewards', { method: 'PUT', auth: true, body: { rewards } });
      setMessage('已保存');
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div className="page">
      <header className="backbar">
        <Link to={isAdmin ? '/admin' : '/'}>←</Link>
        <h1 className="title">奖励设置</h1>
        <span className="spacer" />
        {isAdmin ? <span className="chip active">教练</span> : null}
      </header>
      {message ? <div className="notice">{message}</div> : null}
      <section className="card">
        {rewards.map((reward, index) => (
          <div className="rank-row" key={reward.id || index}>
            <span className="rank-no mono">{reward.rank_from}{reward.rank_to !== reward.rank_from ? `-${reward.rank_to}` : ''}</span>
            <span className="rank-grow">
              {isAdmin ? (
                <>
                  <input className="input" value={reward.title} onChange={(e) => update(index, 'title', e.target.value)} />
                  <input className="input" style={{ marginTop: 8 }} value={reward.description || ''} onChange={(e) => update(index, 'description', e.target.value)} />
                </>
              ) : (
                <>
                  <b>{reward.title}</b>
                  <div className="player-meta">{reward.description}</div>
                </>
              )}
            </span>
          </div>
        ))}
      </section>
      {isAdmin ? <button className="btn block" style={{ marginTop: 14 }} onClick={save}>保存奖励</button> : null}
    </div>
  );
}
