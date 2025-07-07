interface App {
	readonly maxAge: number;
	getJWKSet(): Promise<{ keys: JsonWebKeyWithKid[] }>;
}
