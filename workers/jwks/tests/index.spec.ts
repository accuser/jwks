import { createExecutionContext, env, SELF } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';

describe('Integration Tests', () => {
	let ctx: ExecutionContext;

	beforeEach(() => {
		ctx = createExecutionContext();
	});

	describe('Worker', () => {
		it('should serve JWKS via SELF.fetch', async () => {
			const response = await SELF.fetch('http://localhost:8787/.well-known/jwks.json');

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/json');

			const body = await response.json();

			expect(body).toHaveProperty('keys');
		});

		it('should reject non-GET methods via SELF.fetch', async () => {
			const response = await SELF.fetch('https://localhost:8787/.well-known/jwks.json', {
				method: 'POST',
			});

			expect(response.status).toBe(404);
		});
	});

	describe('Environment variables', () => {
		it('should have required KV namespace available', () => {
			expect(env.JWKS_KV).toBeDefined();
			expect(typeof env.JWKS_KV).toBe('object');
		});
	});
});
