import { NavLink } from 'react-router-dom';
import './NavBar.css';

export default function NavBar({ isLoggedIn, onLogout }) {
    return (
        <nav className="nav-container">
            <div className="nav-left">
                <NavLink
                    to="/"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                    Chores
                </NavLink>
                <NavLink
                    to="/scoreboard"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                    Scoreboard
                </NavLink>
            </div>

            <div className="nav-right">
                {isLoggedIn ? (
                    <>
                        <NavLink
                            to="/profile"
                            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                        >
                            Profile
                        </NavLink>
                        <button className="nav-logout-btn" onClick={onLogout}>
                            Logout
                        </button>
                    </>
                ) : (
                    <NavLink
                        to="/auth"
                        className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                    >
                        Sign In / Sign Up
                    </NavLink>
                )}
            </div>
        </nav>
    );
}
