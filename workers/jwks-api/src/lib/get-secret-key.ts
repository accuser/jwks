import { importJWK, type JWK } from 'jose';
import error from './error';

const getSecretKey = async (secret: SecretsStoreSecret) => {
	try {
		const value = await secret.get();
		const { k, kty }: JWK = JSON.parse(atob(value));

		const secretKey = await importJWK({ k, kty }, 'A256GCM');

		return secretKey;
	} catch (e) {
		error('getSecretKey', e);
	}
};

export { getSecretKey as default };
