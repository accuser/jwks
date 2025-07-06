import error from './error';

const getJWKSet = async (kv: KVNamespace): Promise<{ keys: JsonWebKeyWithKid[] }> => {
	try {
		const list = await kv.list({ prefix: 'kid:' });

		const keys = await Promise.all(
			list.keys.map(({ name }) => {
				return kv.get<JsonWebKeyWithKid>(name, 'json');
			}),
		);

		return { keys: keys.filter((key): key is JsonWebKeyWithKid => key !== null && 'kid' in key && typeof key.kid === 'string') };
	} catch (e) {
		error('getJWKSet', e);
	}
};

export { getJWKSet as default };
