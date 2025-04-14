import React, { useState } from "react";
import "./EpisodeList.css";

const EpisodeList = ({ episodes, watchedEpisodes, onEpisodeToggle }) => {
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
			complete: watchedCount === totalEpisodes,
		};

		return acc;
	}, {});

	return (
		<div className="episode-list">
			{Object.keys(seasons).map((season) => (
				<div key={season} className="season-container">
					<h4
						className={`season-title ${
							seasonStatus[season].complete ? "season-complete" : ""
						}`}
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
					</h4>

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
