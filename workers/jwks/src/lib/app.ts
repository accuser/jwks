import factory from './factory';

const app = factory.createApp();

app.get('/.well-known/jwks.json', async (c) => {
	const { getJWKSet, maxAge } = c.get('app');

	const { keys } = await getJWKSet();

	if (keys.length === 0) {
		return c.json({ keys });
	} else {
		return c.json(
			{ keys },
			{
				headers: {
					'Cache-Control': `max-age=${maxAge}, must-revalidate, public`,
				},
			},
		);
	}
});

export { app as default };
