import React, { useState, useEffect, useContext } from "react";
import {
	getFavorites,
	updateAnimeStatus,
	getNextEpisodes,
} from "../services/api";
import { AuthContext } from "../context/AuthContext";
import AnimeCard from "../components/AnimeCard";
import "./FavoritesPage.css";

const FavoritesPage = () => {
	const [favorites, setFavorites] = useState([]);
	const [nextEpisodes, setNextEpisodes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const { user, getUserId } = useContext(AuthContext);
	const [activeTab, setActiveTab] = useState("all");

	useEffect(() => {
		const fetchFavorites = async () => {
			if (user) {
				try {
					const userId = getUserId();
					if (!userId) return;

					setLoading(true);
					const data = await getFavorites(userId);

					// Add default status if not present
					const processedFavorites = data.map((anime) => ({
						...anime,
						status: anime.status || "in-progress",
					}));

					setFavorites(processedFavorites);
					setLoading(false);
				} catch (err) {
					setError("Failed to fetch favorites");
					setLoading(false);
				}
			}
		};

		const fetchNextEpisodes = async () => {
			try {
				// This could be fetched from a real API that provides airing schedules
				const data = await getNextEpisodes();
				setNextEpisodes(data);
			} catch (err) {
				console.error("Error fetching next episodes:", err);
			}
		};

		fetchFavorites();
		fetchNextEpisodes();
	}, [user, getUserId]);

	const handleFavoriteChange = (animeId) => {
		setFavorites((prevFavorites) =>
			prevFavorites.filter((anime) => anime._id !== animeId)
		);
	};

	const handleStatusChange = async (animeId, newStatus) => {
		const userId = getUserId();
		if (!userId) return;

		try {
			await updateAnimeStatus(userId, animeId, newStatus);

			// Update local state
			setFavorites((prevFavorites) =>
				prevFavorites.map((anime) =>
					anime._id === animeId ? { ...anime, status: newStatus } : anime
				)
			);
		} catch (err) {
			console.error("Error updating anime status:", err);
		}
	};

	// Filter favorites based on active tab
	const filteredFavorites =
		activeTab === "all"
			? favorites
			: activeTab === "upcoming"
			? nextEpisodes
			: favorites.filter((anime) => anime.status === activeTab);

	const getTimeRemaining = (releaseDate) => {
		const now = new Date();
		const release = new Date(releaseDate);
		const diffTime = Math.abs(release - now);
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays === 1 ? "1 day" : `${diffDays} days`;
	};

	if (loading) return <div className="loading">Loading...</div>;

	return (
		<div className="favorites-page">
			<h1>My Anime Collection</h1>

			<div className="favorites-tabs">
				<button
					className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
					onClick={() => setActiveTab("all")}
				>
					All
				</button>
				<button
					className={`tab-btn ${activeTab === "in-progress" ? "active" : ""}`}
					onClick={() => setActiveTab("in-progress")}
				>
					In Progress
				</button>
				<button
					className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
					onClick={() => setActiveTab("completed")}
				>
					Completed
				</button>
				<button
					className={`tab-btn ${activeTab === "waiting" ? "active" : ""}`}
					onClick={() => setActiveTab("waiting")}
				>
					Waiting for Next Season
				</button>
				<button
					className={`tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
					onClick={() => setActiveTab("upcoming")}
				>
					Upcoming Episodes
				</button>
			</div>

			{error && <div className="error">{error}</div>}

			{activeTab === "upcoming" ? (
				<div className="upcoming-episodes">
					<h2>Upcoming Episodes</h2>
					{nextEpisodes.length === 0 ? (
						<div className="no-favorites">No upcoming episodes found.</div>
					) : (
						<div className="upcoming-list">
							{nextEpisodes.map((episode) => (
								<div key={episode._id} className="upcoming-item">
									<div className="upcoming-image">
										<img src={episode.image} alt={episode.title} />
									</div>
									<div className="upcoming-details">
										<h3>{episode.title}</h3>
										<p className="episode-info">
											Episode {episode.nextEpisode}
										</p>
										<div className="countdown">
											<div className="countdown-time">
												{getTimeRemaining(episode.releaseDate)}
											</div>
											<div className="countdown-bar">
												<div
													className="countdown-progress"
													style={{
														width: `${Math.min(
															100,
															(1 -
																Math.min(
																	7,
																	getTimeRemaining(episode.releaseDate).split(
																		" "
																	)[0]
																) /
																	7) *
																100
														)}%`,
													}}
												></div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			) : (
				<>
					{filteredFavorites.length === 0 ? (
						<div className="no-favorites">
							<p>
								You don't have any {activeTab !== "all" ? activeTab + " " : ""}
								anime yet.
							</p>
						</div>
					) : (
						<div className="anime-grid">
							{filteredFavorites.map((anime) => (
								<div key={anime._id} className="anime-card-container">
									<AnimeCard
										anime={anime}
										isFavorite={true}
										onFavoriteChange={handleFavoriteChange}
									/>
									<div className="status-selector">
										<select
											value={anime.status || "in-progress"}
											onChange={(e) =>
												handleStatusChange(anime._id, e.target.value)
											}
										>
											<option value="in-progress">In Progress</option>
											<option value="completed">Completed</option>
											<option value="waiting">Waiting for Next Season</option>
										</select>
									</div>
								</div>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default FavoritesPage;
