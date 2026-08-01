import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Rank from './pages/Rank.jsx';
import PlayerDetail from './pages/PlayerDetail.jsx';
import Login from './pages/Login.jsx';
import Result from './pages/Result.jsx';
import Rewards from './pages/Rewards.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminPlayers from './pages/AdminPlayers.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/rank" element={<Rank />} />
      <Route path="/players/:id" element={<PlayerDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/result" element={<Result />} />
      <Route path="/rewards" element={<Rewards />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/players" element={<AdminPlayers />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
