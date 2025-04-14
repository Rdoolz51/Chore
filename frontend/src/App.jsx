import NavBar from './components/NavBar';
import AuthPage from './components/AuthPage'; // new unified auth page
import Profile from './components/Profile';
import HomePage from './components/HomePage';
import Scoreboard from './components/Scoreboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
    // Initialize isLoggedIn by reading directly from localStorage.
    const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));

    useEffect(() => {
        // This ensures that if the token changes in localStorage later, our state is updated.
        // (This is optional if you're already initializing above.)
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
    };

    return (
        <BrowserRouter>
            <header className="app-header">
                <h1>Chore Board</h1>
                <NavBar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
            </header>
            <main className="main-content">
                <Routes>
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute isLoggedIn={isLoggedIn}>
                                <HomePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/scoreboard"
                        element={
                            <ProtectedRoute isLoggedIn={isLoggedIn}>
                                <Scoreboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute isLoggedIn={isLoggedIn}>
                                <Profile isLoggedIn={isLoggedIn} />
                            </ProtectedRoute>
                        }
                    />
                    {/* Unified auth page */}
                    <Route
                        path="/auth"
                        element={<AuthPage onAuthSuccess={() => setIsLoggedIn(true)} />}
                    />
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default App;
