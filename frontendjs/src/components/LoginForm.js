import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { loginUser, registerUser } from "../services/auth";
import "./LoginForm.css";

const LoginForm = () => {
	const [isLogin, setIsLogin] = useState(true);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const { login } = useContext(AuthContext);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			let userData;

			if (isLogin) {
				userData = await loginUser(email, password);
			} else {
				userData = await registerUser(name, email, password);
			}

			login(userData);
		} catch (error) {
			setError(error.response?.data?.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	const toggleForm = () => {
		setIsLogin(!isLogin);
		setError("");
	};

	return (
		<div className="auth-form">
			<h2>{isLogin ? "Login" : "Register"}</h2>

			{error && <div className="error-message">{error}</div>}

			<form onSubmit={handleSubmit}>
				{!isLogin && (
					<div className="form-group">
						<label htmlFor="name">Name</label>
						<input
							type="text"
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required={!isLogin}
						/>
					</div>
				)}

				<div className="form-group">
					<label htmlFor="email">Email</label>
					<input
						type="email"
						id="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
				</div>

				<div className="form-group">
					<label htmlFor="password">Password</label>
					<input
						type="password"
						id="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</div>

				<button type="submit" className="submit-btn" disabled={loading}>
					{loading ? "Loading..." : isLogin ? "Login" : "Register"}
				</button>
			</form>

			<p className="toggle-form-text">
				{isLogin ? "Don't have an account? " : "Already have an account? "}
				<button type="button" className="toggle-form-btn" onClick={toggleForm}>
					{isLogin ? "Register" : "Login"}
				</button>
			</p>
		</div>
	);
};

export default LoginForm;
