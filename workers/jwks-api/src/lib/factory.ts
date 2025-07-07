import { bearerAuth } from 'hono/bearer-auth';
import { createFactory } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import generateKeys from './generate-keys';
import getConfigFor from './get-config-for';
import getSecretKey from './get-secret-key';

const factory = createFactory<{ Bindings: CloudflareBindings; Variables: { app: App } }>({
	initApp: (app) => {
		app
			.onError((err, c) => {
				if (err instanceof HTTPException) {
					return err.getResponse();
				}

				console.error(err.message);

				return c.newResponse(null, 500);
			})
			.use(
				bearerAuth({
					verifyToken: async (token, c) => {
						const {
							env: { BEARER_TOKEN },
						} = c;

						return token === BEARER_TOKEN;
					},
				})
			)
			.use(async (c, next) => {
				const {
					env: { SECRET_KEY, JWKS_KV },
				} = c;

				const requestId = c.req.header('X-Request-ID') || crypto.randomUUID();
				const requestTimestamp = Date.now();

				c.set('app', {
					requestId,
					requestTimestamp,

					getConfigFor: async (keys: Key[]) => {
						return await getConfigFor(keys, JWKS_KV);
					},

					generateKeys: async () => {
						const secretKey = await getSecretKey(SECRET_KEY);
						return generateKeys(secretKey);
					},
				});

				c.header('X-Request-ID', requestId);

				await next();
			});
	},
});

export default factory;
