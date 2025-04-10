import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { addToFavorites, removeFromFavorites } from "../services/api";
import "./AnimeCard.css";

const AnimeCard = ({ anime, isFavorite, onFavoriteChange }) => {
	const { user } = useContext(AuthContext);
	const [loading, setLoading] = useState(false);

	// Extract the correct properties based on the API response structure
	const animeId = anime.mal_id || anime._id;
	const title = anime.title;
	const description = anime.synopsis || anime.description || "";
	const imageUrl =
		anime.images?.jpg?.image_url ||
		anime.images?.webp?.image_url ||
		anime.image ||
		"";

	const handleFavoriteClick = async (e) => {
		e.preventDefault(); // Prevent navigation to details page
		if (!user) return;

		setLoading(true);
		try {
			if (isFavorite) {
				await removeFromFavorites(user.id, animeId);
			} else {
				await addToFavorites(user.id, animeId);
			}
			onFavoriteChange(animeId);
		} catch (error) {
			console.error("Error updating favorites:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="anime-card">
			<Link to={`/anime/${animeId}`} className="card-link">
				<div className="card-image">
					<img src={imageUrl} alt={title} />
				</div>
				<div className="card-content">
					<h3 className="card-title">{title}</h3>
					<p className="card-description">
						{description.length > 100
							? description.substring(0, 100) + "..."
							: description}
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
