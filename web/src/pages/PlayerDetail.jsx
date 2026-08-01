import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, getToken, getUser } from '../api.js';
import { Avatar } from '../components/PlayerCard.jsx';

export default function PlayerDetail() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const user = getUser();

  function load() {
    Promise.all([api(`/api/players/${id}`), api('/api/gifts')])
      .then(([playerData, giftData]) => {
        setPlayer(playerData.player);
        setGifts(giftData.gifts || []);
      })
      .catch((err) => setMessage(err.message));
  }

  useEffect(load, [id]);

  async function checkin() {
    if (!getToken()) return setMessage('请先登录后再签到');
    setBusy(true);
    setMessage('');
    try {
      const data = await api(`/api/players/${id}/checkin`, { method: 'POST', auth: true });
      setMessage(`签到成功，已连续 ${data.streak_days} 天`);
      load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendGift() {
    if (!getToken()) return setMessage('请先登录后再送礼');
    if (!selected) return setMessage('先选一个礼物');
    setBusy(true);
    setMessage('');
    try {
      await api(`/api/players/${id}/gift`, { method: 'POST', auth: true, body: { gift_id: selected.id, quantity: 1 } });
      setMessage(`已送出${selected.name}`);
      setOpen(false);
      setSelected(null);
      load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!player) return <div className="page"><div className="notice">{message || '加载中...'}</div></div>;

  return (
    <div className="page">
      <header className="backbar">
        <Link to="/">←</Link>
        <h1 className="title">选手详情</h1>
        <span className="spacer" />
        <span className="chip active">{user?.role === 'admin' ? '教练' : '家长'}</span>
      </header>

      <section className="hero">
        <Avatar name={player.name} size={120} />
        <h2 className="player-name" style={{ fontSize: 24 }}>{player.name}</h2>
        <div className="player-meta">{player.position}{player.number ? ` · ${player.number}号` : ''}</div>
        <div className="mono big">{Number(player.popularity || 0).toLocaleString()}</div>
        <div className="player-meta">当前人气</div>
      </section>

      <div className="cta">
        <button className="btn" disabled={busy} onClick={checkin}>每日签到 +10</button>
        <button className="btn secondary" disabled={busy} onClick={() => setOpen(true)}>送礼物助威</button>
      </div>

      {message ? <div className={`notice ${message.includes('成功') || message.includes('已送出') ? 'ok' : ''}`}>{message} {!getToken() ? <Link to="/login">去登录</Link> : null}</div> : null}

      <section className="stats">
        <div className="stat"><b className="mono">{player.stats?.checkin_days || 0}</b><span>连续签到</span></div>
        <div className="stat"><b className="mono">{player.stats?.gift_count || 0}</b><span>收到礼物</span></div>
        <div className="stat"><b className="mono">{Number(player.stats?.votes || 0).toLocaleString()}</b><span>累计得票</span></div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <b>球员介绍</b>
        <p className="subtitle" style={{ lineHeight: 1.7 }}>{player.intro || '暂无介绍'}</p>
      </section>

      {open ? (
        <div className="drawer-mask" onClick={() => setOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="handle" />
            <div className="topbar">
              <div>
                <h2 className="title" style={{ fontSize: 18 }}>为 {player.name} 送礼物</h2>
                <p className="subtitle">演示环境使用积分，不接真实支付</p>
              </div>
              <button className="btn ghost" onClick={() => setOpen(false)}>关闭</button>
            </div>
            <div className="gifts">
              {gifts.map((gift) => (
                <button key={gift.id} className={`gift ${selected?.id === gift.id ? 'active' : ''}`} onClick={() => setSelected(gift)}>
                  <span className="icon">{gift.icon}</span>
                  <b>{gift.name}</b>
                  <div className="player-meta">+{gift.popularity_delta} 人气 · {gift.price} 积分</div>
                </button>
              ))}
            </div>
            <button className="btn block" disabled={busy} onClick={sendGift}>送出</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
