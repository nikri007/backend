import React, { useState, useEffect } from 'react';
import { fileService, shareService, authService } from '../services/api';

function Dashboard({ token, logout }) {
  const [view, setView] = useState('files');
  const [files, setFiles] = useState([]);
  const [shares, setShares] = useState([]);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (view === 'files') loadFiles();
    if (view === 'shares') loadShares();
  }, [view, search, currentPage]);

  const loadFiles = async () => {
    try {
      const res = await fileService.get(`/files?search=${search}&page=${currentPage}`);
      setFiles(res.data.files);
      setTotalPages(res.data.pages);
    } catch (err) { setMsg('Error loading files'); }
  };

  const loadShares = async () => {
    try {
      const res = await shareService.get('/share/my-shares');
      setShares(res.data.shares);
    } catch (err) { setMsg('Error loading shares'); }
  };

  const upload = async (e) => {
    const formData = new FormData();
    [...e.target.files].forEach(file => formData.append('files', file));
    try {
      await fileService.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('Upload successful');
      loadFiles();
    } catch (err) { setMsg('Upload failed'); }
  };

  const deleteFile = async (id) => {
    if (!window.confirm('Delete file?')) return;
    try {
      await fileService.delete(`/files/${id}`);
      setMsg('File deleted');
      loadFiles();
    } catch (err) { setMsg('Delete failed'); }
  };

  // Download function with inline logic (no helpers.js needed)
  const download = async (id, name) => {
    try {
      const res = await fileService.get(`/files/${id}/download`, { responseType: 'blob' });
      
      // Create download link and trigger download
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) { 
      setMsg('Download failed'); 
    }
  };

  return (
    <div className="dashboard">
      <div className="header">
        <h1>File Share</h1>
        <div>
          {['files', 'shares', 'share', 'password'].map(v => (
            <button key={v} onClick={() => setView(v)} className={view === v ? 'active' : ''}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {msg && <div className="message">{msg}</div>}

      {view === 'files' && (
        <FilesView 
          files={files} search={search} setSearch={setSearch} upload={upload} 
          deleteFile={deleteFile} download={download} currentPage={currentPage} 
          setCurrentPage={setCurrentPage} totalPages={totalPages} 
        />
      )}
      
      {view === 'shares' && <SharesView shares={shares} />}
      {view === 'share' && <ShareView setMsg={setMsg} files={files} />}
      {view === 'password' && <PasswordView setMsg={setMsg} />}
    </div>
  );
}

function FilesView({ files, search, setSearch, upload, deleteFile, download, currentPage, setCurrentPage, totalPages }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) upload({ target: { files: e.dataTransfer.files } });
  };

  return (
    <div>
      <div className={`drag-area ${dragActive ? 'active' : ''}`}
           onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
           onClick={() => document.getElementById('file-upload').click()}>
        <p>Drag & Drop Files or Click to Browse</p>
        <input type="file" multiple onChange={upload} id="file-upload" style={{ display: 'none' }} />
      </div>

      <input type="text" placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} />
      
      <div className="files-list">
        {files.length === 0 ? (
          <p>No files uploaded yet</p>
        ) : (
          files.map(f => (
            <div key={f.id} className="file-item">
              <span>{f.filename} ({(f.size/1024/1024).toFixed(2)}MB)</span>
              <div>
                <button onClick={() => download(f.id, f.filename)}>Download</button>
                <button onClick={() => deleteFile(f.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function SharesView({ shares }) {
  return (
    <div>
      <h3>My Shared Files</h3>
      {shares.length === 0 ? (
        <p>No shared files</p>
      ) : (
        shares.map(s => (
          <div key={s.id} className="share-item">
            <span>{s.file_name} → {s.recipient_email}</span>
            <span>{s.accessed ? 'Accessed' : 'Pending'} (Views: {s.access_count})</span>
          </div>
        ))
      )}
    </div>
  );
}

function ShareView({ setMsg, files }) {
  const [data, setData] = useState({ file_id: '', recipient_email: '', expiration_hours: '24', message: '' });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await shareService.post('/share/create', data);
      setMsg('File shared successfully');
      setData({ file_id: '', recipient_email: '', expiration_hours: '24', message: '' });
    } catch (err) {
      setMsg(err.response?.data?.error || 'Share failed');
    }
  };

  return (
    <div>
      <h3>Share a File</h3>
      {files.length === 0 ? (
        <p>Upload files first</p>
      ) : (
        <form onSubmit={submit}>
          <select name="file_id" value={data.file_id} onChange={(e) => setData({ ...data, [e.target.name]: e.target.value })} required>
            <option value="">Choose file...</option>
            {files.map(f => <option key={f.id} value={f.id}>{f.filename}</option>)}
          </select>
          
          <input name="recipient_email" type="email" placeholder="Recipient Email" value={data.recipient_email} 
                 onChange={(e) => setData({ ...data, [e.target.name]: e.target.value })} required />
          
          <select name="expiration_hours" value={data.expiration_hours} 
                  onChange={(e) => setData({ ...data, [e.target.name]: e.target.value })}>
            <option value="1">1 Hour</option>
            <option value="6">6 Hours</option>
            <option value="24">1 Day</option>
            <option value="168">1 Week</option>
            <option value="720">1 Month</option>
          </select>
          
          <textarea name="message" placeholder="Optional message" value={data.message} 
                    onChange={(e) => setData({ ...data, [e.target.name]: e.target.value })} />
          
          <button type="submit">Share File</button>
        </form>
      )}
    </div>
  );
}

function PasswordView({ setMsg }) {
  const [data, setData] = useState({ old_password: '', new_password: '', confirm_password: '' });

  const submit = async (e) => {
    e.preventDefault();
    if (data.new_password !== data.confirm_password) {
      setMsg('Passwords do not match');
      return;
    }
    try {
      await authService.post('/auth/change-password', data);
      setMsg('Password changed successfully');
      setData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <div>
      <h3>Change Password</h3>
      <form onSubmit={submit}>
        <input name="old_password" type="password" placeholder="Current Password" value={data.old_password} 
               onChange={(e) => setData({ ...data, [e.target.name]: e.target.value })} required />
        <input name="new_password" type="password" placeholder="New Password" value={data.new_password} 
               onChange={(e) => setData({ ...data, [e.target.name]: e.target.value })} required />
        <input name="confirm_password" type="password" placeholder="Confirm Password" value={data.confirm_password} 
               onChange={(e) => setData({ ...data, [e.target.name]: e.target.value })} required />
        <button type="submit">Change Password</button>
      </form>
    </div>
  );
}

export default Dashboard;