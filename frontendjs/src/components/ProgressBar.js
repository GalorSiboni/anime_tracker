import React from "react";
import "./ProgressBar.css";

const ProgressBar = ({ watchedCount, totalCount }) => {
	const percentage =
		totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0;

	return (
		<div className="progress-container">
			<div className="progress-stats">
				<span>
					{watchedCount} / {totalCount} episodes
				</span>
				<span>{percentage}%</span>
			</div>
			<div className="progress-bar">
				<div
					className="progress-filled"
					style={{ width: `${percentage}%` }}
				></div>
			</div>
		</div>
	);
};

export default ProgressBar;
