import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { contactService } from '../services/api';
import { logout } from '../utils/auth';
import ContactCard from '../components/ContactCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    pages: 1
  });
  
  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        console.log('Fetching contacts...');
        const response = await contactService.getAll(pagination.page, pagination.perPage, search);
        console.log('Contacts fetched successfully:', response.data);
        setContacts(response.data.contacts);
        setPagination({
          page: response.data.page,
          perPage: response.data.per_page,
          total: response.data.total,
          pages: response.data.pages
        });
      } catch (err) {
        console.error('Error fetching contacts:', err);
        // Only redirect on auth errors, don't show toast
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.error('Authentication error, redirecting to login');
          // Clear auth data
          logout();
          navigate('/login');
        } else {
          toast.error('Failed to fetch contacts');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchContacts();
  }, [search, pagination.page, pagination.perPage, navigate]);
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await contactService.delete(id);
        setContacts(contacts.filter(contact => contact.id !== id));
        toast.success('Contact deleted successfully');
      } catch (err) {
        toast.error('Failed to delete contact');
      }
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchContacts(1, search);
  };
  
  const handlePageChange = (page) => {
    fetchContacts(page, search);
  };
  
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Your Contacts</h2>
        <Link to="/add-contact" className="btn btn-primary">
          <i className="fas fa-plus"></i> Add New Contact
        </Link>
      </div>
      
      <div className="search-bar">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            <i className="fas fa-search"></i>
          </button>
        </form>
      </div>
      
      {loading ? (
        <div className="loading">Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div className="empty-state">
          <p>You don't have any contacts yet.</p>
          <Link to="/add-contact" className="btn btn-primary">
            Add Your First Contact
          </Link>
        </div>
      ) : (
        <>
          <div className="contacts-grid">
            {contacts.map(contact => (
              <ContactCard 
                key={contact.id} 
                contact={contact} 
                onDelete={handleDelete} 
              />
            ))}
          </div>
          
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="btn btn-sm"
              >
                Previous
              </button>
              <span className="page-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="btn btn-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;