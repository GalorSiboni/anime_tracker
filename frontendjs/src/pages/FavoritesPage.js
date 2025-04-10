import React, { useState, useEffect, useContext } from "react";
import { getFavorites } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import AnimeCard from "../components/AnimeCard";
import "./FavoritesPage.css";

const FavoritesPage = () => {
	const [favorites, setFavorites] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const { user } = useContext(AuthContext);

	useEffect(() => {
		const fetchFavorites = async () => {
			if (user) {
				try {
					const data = await getFavorites(user.id);
					setFavorites(data);
					setLoading(false);
				} catch (err) {
					setError("Failed to fetch favorites");
					setLoading(false);
				}
			}
		};

		fetchFavorites();
	}, [user]);

	const handleFavoriteChange = (animeId) => {
		setFavorites((prevFavorites) =>
			prevFavorites.filter((anime) => anime._id !== animeId)
		);
	};

	if (loading) return <div className="loading">Loading...</div>;
	if (error) return <div className="error">{error}</div>;

	return (
		<div className="favorites-page">
			<h1>My Favorites</h1>

			{favorites.length === 0 ? (
				<div className="no-favorites">
					<p>You don't have any favorite anime yet.</p>
				</div>
			) : (
				<div className="anime-grid">
					{favorites.map((anime) => (
						<AnimeCard
							key={anime._id}
							anime={anime}
							isFavorite={true}
							onFavoriteChange={handleFavoriteChange}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default FavoritesPage;
