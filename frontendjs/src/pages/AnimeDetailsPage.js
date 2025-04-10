import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import {
	getAnimeById,
	getWatchedEpisodes,
	updateWatchedEpisodes,
	addToFavorites,
	removeFromFavorites,
	getFavorites,
} from "../services/api";
import { AuthContext } from "../context/AuthContext";
import ProgressBar from "../components/ProgressBar";
import EpisodeList from "../components/EpisodeList";
import "./AnimeDetailsPage.css";

const AnimeDetailsPage = () => {
	const { id } = useParams();
	const { user } = useContext(AuthContext);
	const [anime, setAnime] = useState(null);
	const [watchedEpisodes, setWatchedEpisodes] = useState([]);
	const [isFavorite, setIsFavorite] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [favoriteLoading, setFavoriteLoading] = useState(false);

	useEffect(() => {
		const fetchAnimeDetails = async () => {
			try {
				const data = await getAnimeById(id);
				setAnime(data);
				setLoading(false);
			} catch (err) {
				setError("Failed to fetch anime details");
				setLoading(false);
			}
		};

		fetchAnimeDetails();
	}, [id]);

	useEffect(() => {
		if (!user) {
			setWatchedEpisodes([]);
			setIsFavorite(false);
			return;
		}

		const fetchUserData = async () => {
			try {
				// Fetch watched episodes
				const watched = await getWatchedEpisodes(user.id, id);
				setWatchedEpisodes(watched.episodeIds || []);

				// Check if anime is in favorites
				const favorites = await getFavorites(user.id);
				setIsFavorite(favorites.some((fav) => fav._id === id));
			} catch (err) {
				console.error("Error fetching user data:", err);
			}
		};

		fetchUserData();
	}, [id, user]);

	const handleEpisodeToggle = async (episodeId) => {
		if (!user) return;

		const newWatchedEpisodes = watchedEpisodes.includes(episodeId)
			? watchedEpisodes.filter((id) => id !== episodeId)
			: [...watchedEpisodes, episodeId];

		setWatchedEpisodes(newWatchedEpisodes);

		try {
			await updateWatchedEpisodes(user.id, id, newWatchedEpisodes);
		} catch (err) {
			console.error("Error updating watched episodes:", err);
			// Revert changes if update fails
			setWatchedEpisodes(watchedEpisodes);
		}
	};

	const handleFavoriteToggle = async () => {
		if (!user) return;

		setFavoriteLoading(true);
		try {
			if (isFavorite) {
				await removeFromFavorites(user.id, id);
			} else {
				await addToFavorites(user.id, id);
			}
			setIsFavorite(!isFavorite);
		} catch (err) {
			console.error("Error updating favorites:", err);
		} finally {
			setFavoriteLoading(false);
		}
	};

	if (loading) return <div className="loading">Loading...</div>;
	if (error) return <div className="error">{error}</div>;
	if (!anime) return <div className="error">Anime not found</div>;

	return (
		<div className="anime-details">
			<div className="anime-header">
				<div className="anime-image">
					<img src={anime.image} alt={anime.title} />
				</div>
				<div className="anime-info">
					<h1>{anime.title}</h1>
					<p className="anime-description">{anime.description}</p>

					{user && (
						<>
							<ProgressBar
								watchedCount={watchedEpisodes.length}
								totalCount={anime.episodes?.length || 0}
							/>

							<button
								className={`favorite-btn ${isFavorite ? "favorited" : ""}`}
								onClick={handleFavoriteToggle}
								disabled={favoriteLoading}
							>
								{favoriteLoading
									? "Loading..."
									: isFavorite
									? "Remove from Favorites"
									: "Add to Favorites"}
							</button>
						</>
					)}
				</div>
			</div>

			{anime.trailer && (
				<div className="anime-trailer">
					<h2>Trailer</h2>
					<div className="trailer-container">
						<iframe
							src={anime.trailer}
							title={`${anime.title} trailer`}
							allowFullScreen
							frameBorder="0"
						></iframe>
					</div>
				</div>
			)}

			{user ? (
				<EpisodeList
					episodes={anime.episodes || []}
					watchedEpisodes={watchedEpisodes}
					onEpisodeToggle={handleEpisodeToggle}
				/>
			) : (
				<div className="login-prompt">
					<p>Please log in to track your watched episodes</p>
				</div>
			)}
		</div>
	);
};

export default AnimeDetailsPage;
