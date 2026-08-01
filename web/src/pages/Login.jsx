import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, saveAuth } from '../api.js';

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setLoading(true);
    setMessage('');
    try {
      const data = await api('/api/auth/sms/send', { method: 'POST', body: { phone } });
      if (data.dev_code) setCode(data.dev_code);
      setMessage(data.dev_code ? `开发环境验证码：${data.dev_code}` : '验证码已发送');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    setLoading(true);
    setMessage('');
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: { phone, code } });
      saveAuth(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ display: 'grid', alignContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div className="avatar" style={{ margin: '0 auto 12px' }}>篮</div>
        <h1 className="title">人气投票</h1>
        <p className="subtitle">手机号验证码登录</p>
      </div>

      <div className="form">
        <input className="input" placeholder="手机号" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <div className="code-row">
          <input className="input" placeholder="验证码" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn secondary" disabled={loading} onClick={sendCode}>获取验证码</button>
        </div>
        {message ? <div className="notice">{message}</div> : null}
        <button className="btn block" disabled={loading} onClick={login}>登录 / 注册</button>
        <Link className="help" to="/">先随便逛逛 →</Link>
        <p className="help">教练演示账号：13800000000；家长任意手机号</p>
      </div>
    </div>
  );
}
