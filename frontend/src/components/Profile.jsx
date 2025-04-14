// src/components/Profile.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Modal.css'; // For modal styling
import './Profile.css';

export default function Profile({ isLoggedIn }) {
    const [user, setUser] = useState(null);
    const [spouse, setSpouse] = useState(null);
    const [children, setChildren] = useState([]);
    const navigate = useNavigate();

    // Modal states for spouse invitation
    const [showSpouseModal, setShowSpouseModal] = useState(false);
    const [spouseName, setSpouseName] = useState('');
    const [spouseEmail, setSpouseEmail] = useState('');

    // Modal states for adding a child
    const [showChildModal, setShowChildModal] = useState(false);
    const [childName, setChildName] = useState('');

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/auth');
            return;
        }
        loadProfile();
    }, [isLoggedIn]);

    const loadProfile = async () => {
        try {
            const res = await api.get('/users/me');
            setUser(res.data.user);
            setSpouse(res.data.spouse);
            setChildren(res.data.children);
        } catch (err) {
            console.error(err);
        }
    };

    // Handlers to open/close modals
    const openSpouseModal = () => {
        setSpouseName('');
        setSpouseEmail('');
        setShowSpouseModal(true);
    };

    const closeSpouseModal = () => setShowSpouseModal(false);

    const openChildModal = () => {
        setChildName('');
        setShowChildModal(true);
    };

    const closeChildModal = () => setShowChildModal(false);

    // Submit spouse invitation (note: password not required)
    const handleSubmitSpouse = async () => {
        if (!spouseName || !spouseEmail) {
            alert('Please provide both a name and email for your spouse.');
            return;
        }
        try {
            // Calls the invitation endpoint for spouse
            const res = await api.post('/users/spouse/invite', {
                username: spouseName,
                email: spouseEmail,
            });
            // For development, log the invitation link (in production, you would email it)
            console.log("Invitation link:", res.data.invite_link);
            alert('Invitation sent! Please ask your spouse to register using the link provided in the email.');
            closeSpouseModal();
            loadProfile();
        } catch (err) {
            console.error(err);
            alert('Failed to add spouse: ' + err.response.data.detail);
        }
    };

    // Submit to add a child
    const handleSubmitChild = async () => {
        if (!childName) {
            alert('Please provide a name for the child.');
            return;
        }
        try {
            await api.post('/users/child', {
                username: childName,
            });
            closeChildModal();
            loadProfile();
        } catch (err) {
            console.error(err);
            alert('Failed to add child');
        }
    };

    if (!user) return <div>Loading profile...</div>;

    return (
        <div className="profile-container">
            <h2>Profile</h2>
            <table className="family-table">
                <thead>
                <tr>
                    <th>User Role</th>
                    <th>Username</th>
                    <th>Email</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>{user.role}</td>
                    <td>{user.username}</td>
                    <td>{user.email || 'N/A'}</td>
                </tr>
                {spouse && (
                    <tr>
                        <td>{spouse.role === 'spouse' ? 'parent' : spouse.role}</td>
                        <td>{spouse.username}</td>
                        <td>{spouse.email || 'N/A'}</td>
                    </tr>
                )}
                {children.map(child => (
                    <tr key={child.id}>
                        <td>{child.role}</td>
                        <td>{child.username}</td>
                        <td>{child.email || 'N/A'}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            <div className="profile-buttons">
                {!spouse && (
                    <button className="profile-btn" onClick={openSpouseModal}>Add Spouse</button>
                )}
                <button className="profile-btn" onClick={openChildModal}>Add Child</button>
            </div>

            {/* Spouse Modal */}
            {showSpouseModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add Spouse</h3>
                        <div className="modal-field">
                            <label>Spouse Name</label>
                            <input
                                type="text"
                                value={spouseName}
                                onChange={(e) => setSpouseName(e.target.value)}
                            />
                        </div>
                        <div className="modal-field">
                            <label>Spouse Email</label>
                            <input
                                type="email"
                                value={spouseEmail}
                                onChange={(e) => setSpouseEmail(e.target.value)}
                            />
                        </div>
                        <div className="modal-buttons">
                            <button onClick={handleSubmitSpouse}>Save Spouse</button>
                            <button onClick={closeSpouseModal}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Child Modal */}
            {showChildModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add Child</h3>
                        <div className="modal-field">
                            <label>Child Name</label>
                            <input
                                type="text"
                                value={childName}
                                onChange={(e) => setChildName(e.target.value)}
                            />
                        </div>
                        <div className="modal-buttons">
                            <button onClick={handleSubmitChild}>Save Child</button>
                            <button onClick={closeChildModal}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
