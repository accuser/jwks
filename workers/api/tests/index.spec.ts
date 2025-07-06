import { createExecutionContext, env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';

describe('Integration Tests', () => {
	let ctx: ExecutionContext;

	beforeEach(() => {
		ctx = createExecutionContext();
	});

	describe('Environment variables', () => {
		it('should have required API_URL available', () => {
			expect(env.API_URL).toBeDefined();
			expect(typeof env.API_URL).toBe('string');
			expect(new URL(env.API_URL)).toBeInstanceOf(URL);
		});

		it('should have required BEARER_TOKEN available', () => {
			expect(env.BEARER_TOKEN).toBeDefined();
			expect(typeof env.BEARER_TOKEN).toBe('string');
		});

		it('should have required JWKS_KV namespace available', () => {
			expect(env.JWKS_KV).toBeDefined();
			expect(typeof env.JWKS_KV).toBe('object');
		});

		it('should have required SECRET_KEY available', () => {
			expect(env.SECRET_KEY).toBeDefined();
			expect(typeof env.SECRET_KEY).toBe('object');
		});
	});
});
