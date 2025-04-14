import React, { useState } from 'react';
import NewChore from './NewChore';
import ChoreBoard from './ChoreBoard';
import './HomePage.css';

export default function HomePage() {
    const [refreshToken, setRefreshToken] = useState(0);

    const handleChoreAdded = () => {
        // Increment refresh token to signal the ChoreBoard to re-fetch data
        setRefreshToken(prev => prev + 1);
    };

    return (
        <div className="home-page">
            <div className="panel">
                <NewChore onChoreAdded={handleChoreAdded} />
            </div>
            <div className="panel">
                <ChoreBoard refreshToken={refreshToken} />
            </div>
        </div>
    );
}
