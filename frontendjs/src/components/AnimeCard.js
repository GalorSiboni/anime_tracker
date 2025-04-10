import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { addToFavorites, removeFromFavorites } from "../services/api";
import "./AnimeCard.css";

const AnimeCard = ({ anime, isFavorite, onFavoriteChange }) => {
	const { user } = useContext(AuthContext);
	const [loading, setLoading] = useState(false);

	const handleFavoriteClick = async (e) => {
		e.preventDefault(); // Prevent navigation to details page
		if (!user) return;

		setLoading(true);
		try {
			if (isFavorite) {
				await removeFromFavorites(user.id, anime._id);
			} else {
				await addToFavorites(user.id, anime._id);
			}
			onFavoriteChange(anime._id);
		} catch (error) {
			console.error("Error updating favorites:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="anime-card">
			<Link to={`/anime/${anime._id}`} className="card-link">
				<div className="card-image">
					<img src={anime.image} alt={anime.title} />
				</div>
				<div className="card-content">
					<h3 className="card-title">{anime.title}</h3>
					<p className="card-description">
						{anime.description.length > 100
							? anime.description.substring(0, 100) + "..."
							: anime.description}
					</p>
				</div>
			</Link>
			{user && (
				<button
					className={`favorite-btn ${isFavorite ? "favorited" : ""}`}
					onClick={handleFavoriteClick}
					disabled={loading}
				>
					{loading
						? "Loading..."
						: isFavorite
						? "Remove from Favorites"
						: "Add to Favorites"}
				</button>
			)}
		</div>
	);
};

export default AnimeCard;
