import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AuthForm.css';
import { useLocation } from 'react-router-dom';
export default function AuthPage({ onAuthSuccess }) {
    const [isSignIn, setIsSignIn] = useState(true);
    const navigate = useNavigate();

    // State for sign-in form
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // State for sign-up form
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');

    const location = useLocation();
    const inviteToken = new URLSearchParams(location.search).get('invite');
    const handleSignIn = async () => {
        try {
            const res = await api.post('/auth/login', {
                email: loginEmail,
                password: loginPassword,
            });
            localStorage.setItem('token', res.data.access_token);
            if (onAuthSuccess) onAuthSuccess();
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Login failed');
        }
    };

    const handleSignUp = async () => {
        try {
            const res = await api.post('/auth/register', {
                username: registerUsername,
                email: registerEmail,
                password: registerPassword,
            });
            localStorage.setItem('token', res.data.access_token);
            if (onAuthSuccess) onAuthSuccess();
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Registration failed');
        }
    };

    const handleInviteRegister = async (inviteToken) => {
        try {
            const res = await api.post(`/auth/register-invite?token=${inviteToken}`, {
                password: registerPassword,
                username: registerUsername,
            });
            localStorage.setItem('token', res.data.access_token);
            if (onAuthSuccess) onAuthSuccess();
            navigate('/');
        } catch (err) {
            console.error(err);
            alert("Invitation registration failed: " + (err.response?.data?.detail || "Unknown error"));
        }
    };


    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-tabs">
                    <div
                        className={`auth-tab ${isSignIn ? 'active' : ''}`}
                        onClick={() => setIsSignIn(true)}
                    >
                        SIGN IN
                    </div>
                    <div
                        className={`auth-tab ${!isSignIn ? 'active' : ''}`}
                        onClick={() => setIsSignIn(false)}
                    >
                        SIGN UP
                    </div>
                </div>

                {/* If an invite token is present, render the invite registration form */}
                {inviteToken ? (
                    <>
                        <div className="auth-field">
                            <label>Username (optional)</label>
                            <input
                                type="text"
                                placeholder="Enter username (or leave to use invite's default)"
                                value={registerUsername}
                                onChange={(e) => setRegisterUsername(e.target.value)}
                            />
                        </div>
                        <div className="auth-field">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="Set a secure password"
                                value={registerPassword}
                                onChange={(e) => setRegisterPassword(e.target.value)}
                            />
                        </div>
                        <button
                            className="auth-submit-btn"
                            onClick={() => handleInviteRegister(inviteToken)}
                        >
                            Complete Invitation Registration
                        </button>
                    </>
                ) : (
                    // Otherwise, render the normal forms:
                    isSignIn ? (
                        <>
                            <div className="auth-field">
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="example@email.com"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                />
                            </div>
                            <div className="auth-field">
                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                />
                            </div>
                            <button className="auth-submit-btn" onClick={handleSignIn}>
                                SIGN IN
                            </button>
                            <div className="forgot-pw">Forgot Password?</div>
                        </>
                    ) : (
                        <>
                            <div className="auth-field">
                                <label>Username</label>
                                <input
                                    type="text"
                                    placeholder="Choose a username"
                                    value={registerUsername}
                                    onChange={(e) => setRegisterUsername(e.target.value)}
                                />
                            </div>
                            <div className="auth-field">
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="example@email.com"
                                    value={registerEmail}
                                    onChange={(e) => setRegisterEmail(e.target.value)}
                                />
                            </div>
                            <div className="auth-field">
                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="Set a secure password"
                                    value={registerPassword}
                                    onChange={(e) => setRegisterPassword(e.target.value)}
                                />
                            </div>
                            <button className="auth-submit-btn" onClick={handleSignUp}>
                                SIGN UP
                            </button>
                        </>
                    )
                )}
            </div>
        </div>
    );
}
