// src/components/NewChore.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function NewChore({ onChoreAdded }) {
    const [title, setTitle] = useState('');
    const [points, setPoints] = useState(0);
    const [assignedTo, setAssignedTo] = useState('');
    const [family, setFamily] = useState([]); // will hold [{ username, id, role }...]

    // Load the current user’s family
    useEffect(() => {
        const loadFamily = async () => {
            try {
                const res = await api.get('/users/me');
                const { user, spouse, children } = res.data;
                // build an array of options
                const members = [{ username: user.username, role: user.role }];
                if (spouse) members.push({ username: spouse.username, role: spouse.role });
                children.forEach(c => members.push({ username: c.username, role: c.role }));
                setFamily(members);
                // default to the first member
                if (members.length) setAssignedTo(members[0].username);
            } catch (err) {
                console.error('Failed to load family:', err);
            }
        };
        loadFamily();
    }, []);

    const addChore = async () => {
        if (!title) {
            alert('Please provide a chore title!');
            return;
        }
        try {
            await api.post('/chores/', {
                title,
                points: parseInt(points, 10) || 0,
                assigned_to: assignedTo,
            });
            // clear form
            setTitle('');
            setPoints(0);
            // notify parent to refresh
            if (onChoreAdded) onChoreAdded();
        } catch (err) {
            console.error(err);
            alert('Failed to add chore');
        }
    };

    return (
        <div>
            <h2>Add a New Chore</h2>

            <div className="form-group">
                <label>Title</label>
                <input
                    type="text"
                    placeholder="e.g., Take out the trash"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Points</label>
                <input
                    type="number"
                    placeholder="e.g., 5"
                    value={points}
                    onChange={e => setPoints(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Assigned To</label>
                <select
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                >
                    {family.map(member => (
                        <option key={member.username} value={member.username}>
                            {member.username} ({member.role})
                        </option>
                    ))}
                </select>
            </div>

            <button className="add-chore-btn" onClick={addChore}>
                Add Chore
            </button>
        </div>
    );
}
