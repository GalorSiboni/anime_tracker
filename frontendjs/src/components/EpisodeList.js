import React, { useState } from "react";
import "./EpisodeList.css";

const EpisodeList = ({ episodes, watchedEpisodes, onEpisodeToggle }) => {
	const [expandedSeason, setExpandedSeason] = useState(1);

	// Group episodes by season
	const seasons = episodes.reduce((acc, episode) => {
		const season = episode.season || 1;
		if (!acc[season]) {
			acc[season] = [];
		}
		acc[season].push(episode);
		return acc;
	}, {});

	const toggleSeason = (season) => {
		setExpandedSeason(expandedSeason === season ? null : season);
	};

	return (
		<div className="episode-list">
			<h3>Episodes</h3>
			{Object.keys(seasons).map((season) => (
				<div key={season} className="season-container">
					<h4
						className="season-title"
						onClick={() => toggleSeason(Number(season))}
					>
						Season {season}
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
