import factory from './factory';
import rotateKeys from './rotate-keys';

const app = factory.createApp();

app
	.get('/health', (c) => {
		return c.json({ status: 'ok' });
	})
	.post('/keys/rotate', ...rotateKeys);

export { app as default };
