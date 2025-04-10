import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Header.css";

const Header = () => {
	const { user, logout } = useContext(AuthContext);

	return (
		<header className="header">
			<div className="container header-content">
				<div className="logo">
					<Link to="/">Anime Tracker</Link>
				</div>
				<nav className="nav">
					<ul>
						<li>
							<Link to="/">Home</Link>
						</li>
						{user ? (
							<>
								<li>
									<Link to="/favorites">Favorites</Link>
								</li>
								<li>
									<button onClick={logout} className="logout-btn">
										Logout
									</button>
								</li>
							</>
						) : (
							<li>
								<Link to="/login">Login</Link>
							</li>
						)}
					</ul>
				</nav>
			</div>
		</header>
	);
};

export default Header;
