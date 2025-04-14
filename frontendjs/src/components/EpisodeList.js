import React, { useState } from "react";
import "./EpisodeList.css";

const EpisodeList = ({
	episodes,
	watchedEpisodes,
	onEpisodeToggle,
	onSeasonToggle,
}) => {
	const [expandedSeason, setExpandedSeason] = useState(1);

	// Group episodes by season
	const seasons = Array.isArray(episodes)
		? episodes.reduce((acc, episode) => {
				const season = episode.season || 1;
				if (!acc[season]) {
					acc[season] = [];
				}
				acc[season].push(episode);
				return acc;
		  }, {})
		: {};

	const toggleSeason = (season) => {
		setExpandedSeason(expandedSeason === season ? null : season);
	};

	// Calculate watched status for each season
	const seasonStatus = Object.keys(seasons).reduce((acc, season) => {
		const totalEpisodes = seasons[season].length;
		const watchedCount = seasons[season].filter((ep) =>
			watchedEpisodes.includes(ep._id)
		).length;

		acc[season] = {
			total: totalEpisodes,
			watched: watchedCount,
			complete: watchedCount === totalEpisodes && totalEpisodes > 0,
		};

		return acc;
	}, {});

	const handleSeasonCheckboxClick = (e, season) => {
		e.stopPropagation();

		// Call the parent's season toggle function directly
		const isChecking = !seasonStatus[season].complete;
		onSeasonToggle(Number(season), isChecking);
	};

	return (
		<div className="episode-list">
			{Object.keys(seasons).map((season) => (
				<div key={season} className="season-container">
					<div
						className={`season-title ${
							seasonStatus[season].complete ? "season-complete" : ""
						}`}
					>
						<div
							className="season-checkbox"
							onClick={(e) => handleSeasonCheckboxClick(e, season)}
						>
							<input
								type="checkbox"
								checked={seasonStatus[season].complete}
								readOnly // Using readOnly since we handle the change manually
							/>
						</div>

						<div
							className="season-title-text"
							onClick={() => toggleSeason(Number(season))}
						>
							Season {season}
							<span className="season-progress">
								{seasonStatus[season].watched} / {seasonStatus[season].total}{" "}
								episodes watched
							</span>
							<span className="toggle-icon">
								{expandedSeason === Number(season) ? "▼" : "►"}
							</span>
						</div>
					</div>

					{expandedSeason === Number(season) && (
						<div className="episodes-container">
							{seasons[season].map((episode) => (
								<div
									key={episode._id}
									className={`episode-item ${
										watchedEpisodes.includes(episode._id) ? "watched" : ""
									}`}
								>
									<label className="episode-label">
										<input
											type="checkbox"
											checked={watchedEpisodes.includes(episode._id)}
											onChange={() => onEpisodeToggle(episode._id)}
										/>
										<span className="episode-number">
											Episode {episode.number}
										</span>
										<span className="episode-title">{episode.title}</span>
									</label>
								</div>
							))}
						</div>
					)}
				</div>
			))}
		</div>
	);
};

export default EpisodeList;
