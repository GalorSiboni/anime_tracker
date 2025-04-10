import React, { useState, useEffect, useContext } from "react";
import { getAnimeList, getFavorites } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import AnimeCard from "../components/AnimeCard";
import "./HomePage.css";

const HomePage = () => {
	const [animeList, setAnimeList] = useState([]);
	const [favorites, setFavorites] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const { user } = useContext(AuthContext);

	useEffect(() => {
		const fetchAnimeList = async () => {
			try {
				const data = await getAnimeList();
				setAnimeList(data);
				setLoading(false);
			} catch (err) {
				setError("Failed to fetch anime list");
				setLoading(false);
			}
		};

		fetchAnimeList();
	}, []);

	useEffect(() => {
		const fetchFavorites = async () => {
			if (user) {
				try {
					const data = await getFavorites(user.id);
					setFavorites(data.map((fav) => fav._id));
				} catch (err) {
					console.error("Error fetching favorites:", err);
				}
			}
		};

		fetchFavorites();
	}, [user]);

	const handleFavoriteChange = (animeId) => {
		setFavorites((prevFavorites) => {
			if (prevFavorites.includes(animeId)) {
				return prevFavorites.filter((id) => id !== animeId);
			} else {
				return [...prevFavorites, animeId];
			}
		});
	};

	if (loading) return <div className="loading">Loading...</div>;
	if (error) return <div className="error">{error}</div>;

	return (
		<div className="home-page">
			<h1>Anime Shows</h1>
			<div className="anime-grid">
				{animeList.map((anime) => (
					<AnimeCard
						key={anime._id}
						anime={anime}
						isFavorite={favorites.includes(anime._id)}
						onFavoriteChange={handleFavoriteChange}
					/>
				))}
			</div>
		</div>
	);
};

export default HomePage;
