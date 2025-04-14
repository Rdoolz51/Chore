import { useEffect, useState } from 'react';
import api from '../services/api';

function getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    // getMonth() is zero-based, so add 1 and pad to two digits
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function Scoreboard() {
    const [scores, setScores] = useState([]);
    const [todaysChores, setTodaysChores] = useState([]);
    const [selectedDate, setSelectedDate] = useState(getLocalDateString());

    const loadScoreboard = async () => {
        try {
            const res = await api.get('/scoreboard', {
                params: { date_param: selectedDate }
            });
            setScores(res.data.scores);
            setTodaysChores(res.data.todays_chores);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadScoreboard();
    }, [selectedDate]);

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    return (
        <div className="panel" style={{ width: '100%' }}>
            <h2>Scoreboard</h2>
            {scores.length === 0 ? (
                <p>No points yet!</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                    <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>User</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Points</th>
                    </tr>
                    </thead>
                    <tbody>
                    {scores.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '0.5rem' }}>{item.user}</td>
                            <td style={{ padding: '0.5rem' }}>{item.points}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            <hr style={{ margin: '1rem 0' }} />

            <h2>Completed Chores for {selectedDate}</h2>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="datePicker" style={{ marginRight: '0.5rem' }}>Select Date:</label>
                <input
                    type="date"
                    id="datePicker"
                    value={selectedDate}
                    onChange={handleDateChange}
                />
            </div>

            {todaysChores.length === 0 ? (
                <p>No chores completed on {selectedDate}.</p>
            ) : (
                <ul>
                    {todaysChores.map((chore) => (
                        <li key={chore.id} style={{ marginBottom: '0.5rem' }}>
                            <strong>{chore.title}</strong> ({chore.points} pts) – Assigned to {chore.assigned_to || 'Unassigned'}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
