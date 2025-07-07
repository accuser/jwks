import { Hono } from 'hono';
import app from './lib/app';

const worker = new Hono().route('/api/v1', app);

export default {
	fetch: worker.fetch,
	scheduled: async (controller, env, ctx) => {
		const { cron } = controller;
		const { API_URL, BEARER_TOKEN } = env;

		try {
			let response: Response;

			switch (cron) {
				case '0 0 * * *': // DAILY
					response = await worker.fetch(
						new Request(`${API_URL}/keys/rotate`, {
							body: JSON.stringify({ keys: ['access', 'auth'] }),
							method: 'POST',
							headers: { Authorization: `Bearer ${BEARER_TOKEN}`, 'Content-Type': 'application/json' },
						}),
						env,
						ctx,
					);
					break;

				case '0 0 * * 1': // WEEKLY
					response = await worker.fetch(
						new Request(`${API_URL}/keys/rotate`, {
							body: JSON.stringify({ keys: ['id'] }),
							method: 'POST',
							headers: { Authorization: `Bearer ${BEARER_TOKEN}`, 'Content-Type': 'application/json' },
						}),
						env,
						ctx,
					);
					break;

				default:
					console.log(`Unknown cron schedule: ${cron}`);
					return;
			}

			if (response.ok === false) {
				throw `Failed to rotate keys: ${response.status} ${response.statusText}`;
			}
		} catch (error) {
			console.error(`scheduled: ${error}`);
		}
	},
} satisfies ExportedHandler<Cloudflare.Env>;
