import { base64url, calculateJwkThumbprint, EncryptJWT, exportJWK, generateKeyPair } from 'jose';
import error from './error';

const alg = 'EdDSA' as const;
const crv = 'Ed25519' as const;
const kty = 'OKP' as const;
const use = 'sig' as const;

const generateKeys = async (secretKey: CryptoKey | Uint8Array) => {
	try {
		const { privateKey } = await generateKeyPair('Ed25519', { extractable: true });
		const { d, x } = await exportJWK(privateKey);

		if (!d || !x) {
			throw new Error('Failed to export JWK: missing d or x');
		}

		const thumbprint = await calculateJwkThumbprint({ crv, kty, x });
		const kid = base64url.encode(thumbprint);

		const jwk = { alg, crv, kid, kty, use, x };

		const jwe = await new EncryptJWT({ jwk: { ...jwk, d } })
			.setProtectedHeader({ alg: 'dir', enc: 'A256GCM', typ: 'JWE' })
			.setIssuedAt()
			.encrypt(secretKey);

		return { jwe, jwk: JSON.stringify(jwk), kid };
	} catch (e) {
		error('generateKeys', error);
	}
};

export { generateKeys as default };
