/**
 * Utility to suppress non-critical console errors in production
 */
const suppressConsoleErrors = () => {
	if (process.env.NODE_ENV === "production") {
		// Store original console methods
		const originalConsoleError = console.error;
		const originalConsoleWarn = console.warn;

		// Override console.error to filter out non-critical errors
		console.error = function (...args) {
			// Check if the error is related to manifest or MutationObserver
			const errorString = args.join(" ");
			const nonCriticalErrors = [
				"Manifest:",
				"MutationObserver",
				"web-client-content-script",
				"Syntax error",
			];

			// Only log critical errors
			if (!nonCriticalErrors.some((term) => errorString.includes(term))) {
				originalConsoleError.apply(console, args);
			}
		};

		// Similarly for warnings
		console.warn = function (...args) {
			const warningString = args.join(" ");
			const nonCriticalWarnings = [
				"Manifest:",
				"MutationObserver",
				"web-client-content-script",
			];

			if (!nonCriticalWarnings.some((term) => warningString.includes(term))) {
				originalConsoleWarn.apply(console, args);
			}
		};
	}
};

export default suppressConsoleErrors;
