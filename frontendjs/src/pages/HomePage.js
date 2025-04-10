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

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [itemsPerPage] = useState(12);

	useEffect(() => {
		const fetchAnimeList = async () => {
			setLoading(true);
			try {
				const response = await getAnimeList(currentPage, itemsPerPage);
				console.log("API Response:", response); // Debug log to see the structure

				// Handle the specific structure from your animeApi.js
				if (response && response.data && Array.isArray(response.data)) {
					setAnimeList(response.data);

					// Get pagination info if available
					if (response.pagination) {
						setTotalPages(response.pagination.last_visible_page || 1);
					}
				} else if (Array.isArray(response)) {
					// If the response is directly an array
					setAnimeList(response);
					setTotalPages(Math.ceil(response.length / itemsPerPage) || 1);
				} else {
					console.error("Unexpected API response format:", response);
					setAnimeList([]);
					setError("Unexpected data format from API");
				}

				setLoading(false);
			} catch (err) {
				console.error("Error fetching anime list:", err);
				setError("Failed to fetch anime list");
				setAnimeList([]);
				setLoading(false);
			}
		};

		fetchAnimeList();
	}, [currentPage, itemsPerPage]);

	useEffect(() => {
		const fetchFavorites = async () => {
			if (user) {
				try {
					const data = await getFavorites(user.id);
					if (Array.isArray(data)) {
						setFavorites(data.map((fav) => fav._id || fav.mal_id));
					} else {
						console.error("Unexpected favorites data format:", data);
						setFavorites([]);
					}
				} catch (err) {
					console.error("Error fetching favorites:", err);
					setFavorites([]);
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

	const handlePageChange = (pageNumber) => {
		setCurrentPage(pageNumber);
		window.scrollTo(0, 0); // Scroll to top when page changes
	};

	// Generate array of page numbers for pagination
	const generatePageNumbers = () => {
		const pageNumbers = [];
		const maxPagesToShow = 5;

		if (totalPages <= maxPagesToShow) {
			// If we have few pages, show all of them
			for (let i = 1; i <= totalPages; i++) {
				pageNumbers.push(i);
			}
		} else {
			// Show first page, last page, current page, and one page before and after current
			pageNumbers.push(1);

			// Current page and surrounding pages
			for (
				let i = Math.max(2, currentPage - 1);
				i <= Math.min(totalPages - 1, currentPage + 1);
				i++
			) {
				if (i === 2 && currentPage > 3) {
					pageNumbers.push("...");
				} else if (i === totalPages - 1 && currentPage < totalPages - 2) {
					pageNumbers.push("...");
				} else {
					pageNumbers.push(i);
				}
			}

			pageNumbers.push(totalPages);

			// Remove duplicates
			return [...new Set(pageNumbers)];
		}

		return pageNumbers;
	};

	const pageNumbers = generatePageNumbers();

	if (loading) return <div className="loading">Loading...</div>;

	return (
		<div className="home-page">
			<h1>Anime Shows</h1>
			{error && <div className="error">{error}</div>}

			{Array.isArray(animeList) && animeList.length > 0 ? (
				<div className="anime-grid">
					{animeList.map((anime, index) => (
						<AnimeCard
							key={anime.mal_id || anime._id || index}
							anime={anime}
							isFavorite={favorites.includes(anime.mal_id || anime._id)}
							onFavoriteChange={handleFavoriteChange}
						/>
					))}
				</div>
			) : (
				<div className="no-anime">No anime shows available</div>
			)}

			{totalPages > 1 && (
				<div className="pagination">
					<button
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage === 1}
						className="pagination-button"
					>
						Previous
					</button>

					<div className="page-numbers">
						{pageNumbers.map((number, index) =>
							number === "..." ? (
								<span key={`ellipsis-${index}`} className="ellipsis">
									...
								</span>
							) : (
								<button
									key={number}
									onClick={() => handlePageChange(number)}
									className={`page-number ${
										currentPage === number ? "active" : ""
									}`}
								>
									{number}
								</button>
							)
						)}
					</div>

					<button
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={currentPage === totalPages}
						className="pagination-button"
					>
						Next
					</button>
				</div>
			)}
		</div>
	);
};

export default HomePage;
