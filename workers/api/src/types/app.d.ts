interface App {
	readonly requestId: string;
	readonly requestTimestamp: number;
	readonly generateKeys: () => Promise<{ jwe: string; jwk: string; kid: string }>;
	readonly getConfigFor: (keys: Key[]) => Promise<Config>;
}
