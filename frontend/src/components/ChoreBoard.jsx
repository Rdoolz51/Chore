import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ChoreBoard({ refreshToken }) {
    const [chores, setChores] = useState([]);

    const loadChores = async () => {
        try {
            const res = await api.get('/chores/');
            setChores(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadChores();
    }, [refreshToken]);

    const completeChore = async (id) => {
        try {
            await api.post(`/chores/${id}/complete`);
            loadChores();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteChore = async (id) => {
        try {
            await api.delete(`/chores/${id}`);
            loadChores();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="chore-list">
            <h2>Chores</h2>
            {chores.map((chore) => (
                <div key={chore.id} className="chore-item">
                    <div className="chore-item-text">
                        <div className="chore-item-title">{chore.title}</div>
                        <div className="chore-item-details">
                            Points: {chore.points} | Assigned: {chore.assigned_to}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => completeChore(chore.id)}
                            disabled={Boolean(chore.completed_at)}
                            className="chore-complete-btn"
                        >
                            {chore.completed_at ? 'Completed!' : 'Complete'}
                        </button>
                        <button
                            onClick={() => deleteChore(chore.id)}
                            style={{
                                backgroundColor: 'red',
                                color: '#fff',
                                border: 'none',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
