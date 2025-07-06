import { cors } from 'hono/cors';
import { createFactory } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import getJWKSet from './get-jwk-set';

const factory = createFactory<{ Bindings: CloudflareBindings; Variables: { app: App } }>({
	initApp: (app) => {
		app
			.onError((err, c) => {
				if (err instanceof HTTPException) {
					return err.getResponse();
				}

				if (err instanceof Error) {
					console.error(`Error: ${err.message}`);
				}

				return c.newResponse(null, 500);
			})
			.use(async (c, next) => {
				const {
					env: { JWKS_KV },
				} = c;

				c.set('app', {
					get maxAge() {
						const now = new Date();
						return Math.max(3600 - (now.getMinutes() * 60 + now.getSeconds()), 60);
					},
					getJWKSet: () => getJWKSet(JWKS_KV),
				});

				await next();
			})
			.use(
				cors({
					allowHeaders: ['Content-Type'],
					allowMethods: ['GET', 'OPTIONS'],
					credentials: false,
					origin: '*',
				}),
			);
	},
});

export { factory as default };
