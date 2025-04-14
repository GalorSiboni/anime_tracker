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
	const { user, getUserId } = useContext(AuthContext);
	const [anime, setAnime] = useState(null);
	const [watchedEpisodes, setWatchedEpisodes] = useState([]);
	const [isFavorite, setIsFavorite] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [favoriteLoading, setFavoriteLoading] = useState(false);
	const [seasons, setSeasons] = useState([]);
	const [seasonWatchStatus, setSeasonWatchStatus] = useState({});

	useEffect(() => {
		const fetchAnimeDetails = async () => {
			try {
				const response = await getAnimeById(id);

				// Handle Jikan API response format
				let processedAnime = response;

				// Check if the response has a data property (Jikan API format)
				if (response && response.data) {
					processedAnime = response.data;
				}

				// Process episodes if they exist in a different format
				if (
					processedAnime &&
					!processedAnime.episodes &&
					processedAnime.data &&
					Array.isArray(processedAnime.data)
				) {
					// This handles the case where episodes are returned separately
					const episodes = processedAnime.data.map((ep, index) => ({
						_id: ep.mal_id || `${id}-${index + 1}`,
						number: ep.mal_id || index + 1,
						title: ep.title || `Episode ${index + 1}`,
						season: 1,
					}));
					processedAnime.episodes = episodes;
				}

				setAnime(processedAnime);
				setLoading(false);
			} catch (err) {
				console.error("Failed to fetch anime details:", err);
				setError("Failed to fetch anime details");
				setLoading(false);
			}
		};

		fetchAnimeDetails();
	}, [id]);

	useEffect(() => {
		// Generate seasons data once anime is loaded
		if (anime && anime.episodes) {
			// Make sure episodes is an array before using reduce
			const episodesArray = Array.isArray(anime.episodes) ? anime.episodes : [];

			// Group episodes by season
			const seasonGroups = episodesArray.reduce((acc, episode) => {
				const season = episode.season || 1;
				if (!acc[season]) {
					acc[season] = [];
				}
				acc[season].push(episode);
				return acc;
			}, {});

			// Convert to array format
			const seasonsList = Object.keys(seasonGroups).map((season) => ({
				number: parseInt(season),
				episodes: seasonGroups[season],
			}));

			setSeasons(seasonsList);
		}
	}, [anime]);

	useEffect(() => {
		// Calculate season watch status based on watched episodes
		if (seasons.length > 0 && watchedEpisodes.length > 0) {
			const status = {};

			seasons.forEach((season) => {
				const totalEpisodes = season.episodes.length;
				const watchedCount = season.episodes.filter((ep) =>
					watchedEpisodes.includes(ep._id)
				).length;

				status[season.number] = {
					total: totalEpisodes,
					watched: watchedCount,
					complete: watchedCount === totalEpisodes && totalEpisodes > 0,
				};
			});

			setSeasonWatchStatus(status);
		} else if (seasons.length > 0) {
			// Initialize with zeroes if no episodes watched
			const status = {};
			seasons.forEach((season) => {
				status[season.number] = {
					total: season.episodes.length,
					watched: 0,
					complete: false,
				};
			});
			setSeasonWatchStatus(status);
		}
	}, [seasons, watchedEpisodes]);

	useEffect(() => {
		// Debug log to see the user object structure
		console.log("Current user object:", user);

		// If not logged in, don't try to fetch user-specific data
		if (!user) {
			setWatchedEpisodes([]);
			setIsFavorite(false);
			return;
		}

		// Get user ID using the utility function
		const userId = getUserId();
		console.log("Using userId:", userId);

		if (!userId) {
			console.error("User is logged in but no ID found in user object:", user);
			return;
		}

		const fetchUserData = async () => {
			try {
				// Fetch watched episodes
				const watched = await getWatchedEpisodes(userId, id);
				setWatchedEpisodes(
					Array.isArray(watched.episodeIds) ? watched.episodeIds : []
				);

				// Check if anime is in favorites
				const favorites = await getFavorites(userId);
				if (Array.isArray(favorites)) {
					setIsFavorite(
						favorites.some(
							(fav) =>
								(fav._id && fav._id === id) ||
								(fav.mal_id && fav.mal_id.toString() === id)
						)
					);
				}
			} catch (err) {
				console.error("Error fetching user data:", err);
			}
		};

		fetchUserData();
	}, [id, user, getUserId]);

	const handleEpisodeToggle = async (episodeId) => {
		if (!user) return;

		// Get userId using the getUserId utility function
		const userId = getUserId();
		if (!userId) return;

		const newWatchedEpisodes = watchedEpisodes.includes(episodeId)
			? watchedEpisodes.filter((id) => id !== episodeId)
			: [...watchedEpisodes, episodeId];

		setWatchedEpisodes(newWatchedEpisodes);

		try {
			await updateWatchedEpisodes(userId, id, newWatchedEpisodes);
		} catch (err) {
			console.error("Error updating watched episodes:", err);
			// Revert changes if update fails
			setWatchedEpisodes(watchedEpisodes);
		}
	};

	const handleSeasonToggle = async (seasonNumber, isChecked) => {
		if (!user || !anime) return;

		const userId = getUserId();
		if (!userId) return;

		const seasonEpisodes =
			seasons.find((s) => s.number === seasonNumber)?.episodes || [];
		const episodeIds = seasonEpisodes.map((episode) => episode._id);

		let newWatchedEpisodes;

		if (isChecked) {
			// Add all season episodes to watched list
			newWatchedEpisodes = [...new Set([...watchedEpisodes, ...episodeIds])];
		} else {
			// Remove all season episodes from watched list
			newWatchedEpisodes = watchedEpisodes.filter(
				(id) => !episodeIds.includes(id)
			);
		}

		setWatchedEpisodes(newWatchedEpisodes);

		try {
			await updateWatchedEpisodes(userId, id, newWatchedEpisodes);
		} catch (err) {
			console.error("Error updating watched episodes:", err);
			// Revert changes if update fails
			setWatchedEpisodes(watchedEpisodes);
		}
	};

	const handleFavoriteToggle = async () => {
		if (!user) return;

		// Get userId using the getUserId utility function
		const userId = getUserId();
		if (!userId) return;

		setFavoriteLoading(true);
		try {
			if (isFavorite) {
				await removeFromFavorites(userId, id);
			} else {
				await addToFavorites(userId, id);
			}
			setIsFavorite(!isFavorite);
		} catch (err) {
			console.error("Error updating favorites:", err);
		} finally {
			setFavoriteLoading(false);
		}
	};

	// Helper function to extract the correct image URL
	const getImageUrl = () => {
		if (!anime) return "";

		// Handle Jikan API format
		if (anime.images && anime.images.jpg) {
			return anime.images.jpg.image_url || anime.images.jpg.large_image_url;
		}

		// Handle your own API format
		return anime.image || "";
	};

	// Helper function to extract trailer URL
	const getTrailerUrl = () => {
		if (!anime) return "";

		// Handle Jikan API format
		if (anime.trailer && anime.trailer.embed_url) {
			return anime.trailer.embed_url;
		}

		// Handle your own API format
		return anime.trailer || "";
	};

	// Helper function to get the correct title
	const getTitle = () => {
		if (!anime) return "";
		return anime.title || anime.title_english || "";
	};

	// Helper function to get the correct description
	const getDescription = () => {
		if (!anime) return "";
		return anime.synopsis || anime.description || "";
	};

	// Helper function to get episodes
	const getEpisodes = () => {
		if (!anime) return [];

		// If anime has episodes property and it's an array, use it
		if (anime.episodes && Array.isArray(anime.episodes)) {
			return anime.episodes;
		}

		// If anime has episodes_count or episodes as a number, generate episode objects
		const episodeCount =
			anime.episodes_count ||
			(typeof anime.episodes === "number" ? anime.episodes : 0);

		if (episodeCount > 0) {
			const episodeArray = [];
			for (let i = 1; i <= episodeCount; i++) {
				episodeArray.push({
					_id: `${id}-${i}`,
					number: i,
					title: `Episode ${i}`,
					season: 1,
				});
			}
			return episodeArray;
		}

		return [];
	};

	if (loading) return <div className="loading">Loading...</div>;
	if (error) return <div className="error">{error}</div>;
	if (!anime) return <div className="error">Anime not found</div>;

	const episodes = getEpisodes();
	const imageUrl = getImageUrl();
	const trailerUrl = getTrailerUrl();
	const title = getTitle();
	const description = getDescription();

	return (
		<div className="anime-details">
			<div className="anime-header">
				<div className="anime-image">
					<img src={imageUrl} alt={title} />
				</div>
				<div className="anime-info">
					<h1>{title}</h1>
					<p className="anime-description">{description}</p>

					{user && (
						<>
							<ProgressBar
								watchedCount={watchedEpisodes.length}
								totalCount={episodes.length}
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

			{trailerUrl && (
				<div className="anime-trailer">
					<h2>Trailer</h2>
					<div className="trailer-container">
						<iframe
							src={trailerUrl}
							title={`${title} trailer`}
							allowFullScreen
							frameBorder="0"
						></iframe>
					</div>
				</div>
			)}

			{user ? (
				<div className="episodes-section">
					<h2>Episodes</h2>

					{seasons.length > 0 && (
						<div className="season-toggles">
							{seasons.map((season) => (
								<div key={season.number} className="season-toggle">
									<label className="season-checkbox-label">
										<input
											type="checkbox"
											checked={
												seasonWatchStatus[season.number]?.complete || false
											}
											onChange={(e) =>
												handleSeasonToggle(season.number, e.target.checked)
											}
										/>
										<span>
											Mark Season {season.number} as watched (
											{seasonWatchStatus[season.number]?.watched || 0}/
											{seasonWatchStatus[season.number]?.total || 0})
										</span>
									</label>
								</div>
							))}
						</div>
					)}

					<EpisodeList
						episodes={episodes}
						watchedEpisodes={watchedEpisodes}
						onEpisodeToggle={handleEpisodeToggle}
					/>
				</div>
			) : (
				<div className="login-prompt">
					<p>Please log in to track your watched episodes</p>
				</div>
			)}
		</div>
	);
};

export default AnimeDetailsPage;
