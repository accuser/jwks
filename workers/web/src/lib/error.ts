class WorkerError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown,
	) {
		super(message);
		this.name = 'AppError';
	}
}

function error(message: string, cause?: unknown): never {
	throw new WorkerError(message, cause);
}

export { error as default };
