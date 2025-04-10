import React from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import AnimeDetailsPage from "./pages/AnimeDetailsPage";
import FavoritesPage from "./pages/FavoritesPage";
import LoginPage from "./pages/LoginPage";
import PrivateRoute from "./components/PrivateRoute";
import "./App.css";

function App() {
	return (
		<AuthProvider>
			<Router>
				<div className="App">
					<Header />
					<main className="container">
						<Routes>
							<Route path="/" element={<HomePage />} />
							<Route path="/anime/:id" element={<AnimeDetailsPage />} />
							<Route path="/login" element={<LoginPage />} />
							<Route
								path="/favorites"
								element={
									<PrivateRoute>
										<FavoritesPage />
									</PrivateRoute>
								}
							/>
							<Route path="*" element={<Navigate to="/" />} />
						</Routes>
					</main>
				</div>
			</Router>
		</AuthProvider>
	);
}

export default App;
