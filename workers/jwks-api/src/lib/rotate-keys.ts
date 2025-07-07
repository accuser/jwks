import { vValidator as validator } from '@hono/valibot-validator';
import * as v from 'valibot';
import error from './error';
import factory from './factory';

const DEFAULT_GRACE = 60 * 15; // 15 minutes grace period for JWKs
const DEFAULT_TTL = 60 * 60 * 24; // 1 day

const rotate = factory.createHandlers(
	validator(
		'json',
		v.object({
			keys: v.optional(v.array(v.picklist(['access', 'auth', 'id'])), ['access', 'auth', 'id']),
		}),
		(res, c) => {
			if (res.success === false) {
				return c.json({ error: res.issues }, 400);
			}
		}
	),
	async (c) => {
		const { generateKeys, getConfigFor } = c.get('app');
		const { keys } = c.req.valid('json');

		const config = await getConfigFor(keys);

		try {
			const result = await Promise.allSettled(
				Object.entries(config).map(async ([key, { grace = DEFAULT_GRACE, ttl = DEFAULT_TTL } = {}]) => {
					try {
						const { jwe, jwk, kid } = await generateKeys();

						await Promise.all([
							c.env.JWKS_KV.put(`kid:${kid}`, jwk, {
								expirationTtl: ttl + grace,
							}),
							c.env.JWKS_KV.put(`jwe:${key}`, jwe, {
								expirationTtl: ttl,
							}),
						]);
					} catch (e) {
						error(`rotate ${key}`, e);
					}
				})
			);
		} catch (error) {
			return c.json({ error: 'Failed to rotate keys' }, 500);
		}

		return c.json(null, { status: 202, statusText: 'Accepted' });
	}
);

export { rotate as default };
