import React, { useState, useEffect } from 'react';
import { shareService } from '../services/api';
import { downloadFile } from '../utils/helpers';

function PublicShare({ token }) {
  const [info, setInfo] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await shareService.get(`/share/public/${token}`);
        setInfo(res.data);
      } catch (err) {
        setMsg('Share not found or expired');
      }
    };
    load();
  }, [token]);

  const download = async () => {
    try {
      const res = await shareService.get(`/share/public/${token}/download`, { responseType: 'blob' });
      downloadFile(res.data, info.filename);
    } catch (err) {
      setMsg('Download failed');
    }
  };

  if (msg) return <div className="error">{msg}</div>;
  if (!info) return <div>Loading...</div>;

  return (
    <div className="public-share">
      <h2>Shared File</h2>
      <p>File: {info.filename}</p>
      <p>Size: {(info.size/1024/1024).toFixed(2)}MB</p>
      <p>From: {info.sender}</p>
      {info.message && <p>Message: {info.message}</p>}
      <button onClick={download}>Download File</button>
    </div>
  );
}

export default PublicShare; 
