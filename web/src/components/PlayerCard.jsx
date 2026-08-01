import { Link } from 'react-router-dom';

export function Avatar({ name, size = 64 }) {
  return (
    <div className="avatar" style={size ? { width: size, height: size, fontSize: Math.round(size * 0.38) } : undefined}>
      {(name || '球').slice(0, 1)}
    </div>
  );
}

export default function PlayerCard({ player }) {
  return (
    <div className="card player-card">
      <Avatar name={player.name} />
      <div>
        <p className="player-name">{player.name}</p>
        <div className="player-meta">{player.position}{player.number ? ` · ${player.number}号` : ''}</div>
      </div>
      <div className="mono popularity">{Number(player.popularity || 0).toLocaleString()} 人气</div>
      <Link className="btn secondary block" to={`/players/${player.id}`}>为TA助威</Link>
    </div>
  );
}
