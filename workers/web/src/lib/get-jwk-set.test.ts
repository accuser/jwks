import { beforeEach, describe, expect, it, vi } from 'vitest';
import error from './error';
import getJWKSet from './get-jwk-set';

// Mock the error module
vi.mock('./error', () => ({
	default: vi.fn().mockImplementation((message: string, cause?: unknown) => {
		throw new Error(`${message}: ${cause}`);
	}),
}));

describe('getJWKSet', () => {
	let mockKV: KVNamespace;
	const mockError = vi.mocked(error);

	beforeEach(() => {
		vi.clearAllMocks();

		// Create a mock KV namespace
		mockKV = {
			list: vi.fn(),
			get: vi.fn(),
		} as unknown as KVNamespace;
	});

	it('should return an empty array when no keys exist', async () => {
		// Arrange
		(mockKV.list as any).mockResolvedValue({ keys: [] });

		// Act
		const result = await getJWKSet(mockKV);

		// Assert
		expect(result).toEqual({ keys: [] });
		expect(mockKV.list).toHaveBeenCalledWith({ prefix: 'kid:' });
	});

	it('should return filtered JWK keys with kid property', async () => {
		// Arrange
		const mockKeys = [{ name: 'kid:key1' }, { name: 'kid:key2' }, { name: 'kid:key3' }];

		const mockJWKs: JsonWebKeyWithKid[] = [
			{
				kid: 'key1',
				kty: 'RSA',
				use: 'sig',
				n: 'mock-n-value',
				e: 'AQAB',
			},
			{
				kid: 'key2',
				kty: 'EC',
				use: 'sig',
				crv: 'P-256',
				x: 'mock-x-value',
				y: 'mock-y-value',
			},
		];

		(mockKV.list as any).mockResolvedValue({ keys: mockKeys });
		(mockKV.get as any).mockResolvedValueOnce(mockJWKs[0]).mockResolvedValueOnce(mockJWKs[1]).mockResolvedValueOnce(null); // Third key returns null

		// Act
		const result = await getJWKSet(mockKV);

		// Assert
		expect(result).toEqual({ keys: [mockJWKs[0], mockJWKs[1]] });
		expect(mockKV.list).toHaveBeenCalledWith({ prefix: 'kid:' });
		expect(mockKV.get).toHaveBeenCalledTimes(3);
		expect(mockKV.get).toHaveBeenCalledWith('kid:key1', 'json');
		expect(mockKV.get).toHaveBeenCalledWith('kid:key2', 'json');
		expect(mockKV.get).toHaveBeenCalledWith('kid:key3', 'json');
	});

	it('should filter out null values and objects without kid property', async () => {
		// Arrange
		const mockKeys = [{ name: 'kid:key1' }, { name: 'kid:key2' }, { name: 'kid:key3' }, { name: 'kid:key4' }];

		const validJWK: JsonWebKeyWithKid = {
			kid: 'key1',
			kty: 'RSA',
			use: 'sig',
			n: 'mock-n-value',
			e: 'AQAB',
		};

		const invalidJWK = {
			kty: 'RSA',
			use: 'sig',
			n: 'mock-n-value',
			e: 'AQAB',
			// Missing kid property
		};

		(mockKV.list as any).mockResolvedValue({ keys: mockKeys });
		(mockKV.get as any)
			.mockResolvedValueOnce(validJWK)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(invalidJWK)
			.mockResolvedValueOnce({ kid: 123 }); // kid is not a string

		// Act
		const result = await getJWKSet(mockKV);

		// Assert
		expect(result).toEqual({ keys: [validJWK] });
		expect(mockKV.get).toHaveBeenCalledTimes(4);
	});

	it('should handle KV list operation failure', async () => {
		// Arrange
		const listError = new Error('KV list failed');
		(mockKV.list as any).mockRejectedValue(listError);

		// Act & Assert
		await expect(getJWKSet(mockKV)).rejects.toThrow();
		expect(mockError).toHaveBeenCalledWith('getJWKSet', listError);
		expect(mockKV.list).toHaveBeenCalledWith({ prefix: 'kid:' });
	});

	it('should handle KV get operation failure', async () => {
		// Arrange
		const mockKeys = [{ name: 'kid:key1' }];
		const getError = new Error('KV get failed');

		(mockKV.list as any).mockResolvedValue({ keys: mockKeys });
		(mockKV.get as any).mockRejectedValue(getError);

		// Act & Assert
		await expect(getJWKSet(mockKV)).rejects.toThrow();
		expect(mockError).toHaveBeenCalledWith('getJWKSet', getError);
		expect(mockKV.list).toHaveBeenCalledWith({ prefix: 'kid:' });
		expect(mockKV.get).toHaveBeenCalledWith('kid:key1', 'json');
	});

	it('should handle Promise.all rejection', async () => {
		// Arrange
		const mockKeys = [{ name: 'kid:key1' }, { name: 'kid:key2' }];

		(mockKV.list as any).mockResolvedValue({ keys: mockKeys });
		(mockKV.get as any).mockResolvedValueOnce({ kid: 'key1', kty: 'RSA' }).mockRejectedValueOnce(new Error('Second get failed'));

		// Act & Assert
		await expect(getJWKSet(mockKV)).rejects.toThrow();
		expect(mockError).toHaveBeenCalled();
	});

	it('should return keys with valid kid as string only', async () => {
		// Arrange
		const mockKeys = [{ name: 'kid:key1' }, { name: 'kid:key2' }, { name: 'kid:key3' }];

		const validJWK: JsonWebKeyWithKid = {
			kid: 'valid-string-kid',
			kty: 'RSA',
			use: 'sig',
			n: 'mock-n-value',
			e: 'AQAB',
		};

		(mockKV.list as any).mockResolvedValue({ keys: mockKeys });
		(mockKV.get as any)
			.mockResolvedValueOnce(validJWK)
			.mockResolvedValueOnce({ kid: null, kty: 'RSA' }) // kid is null
			.mockResolvedValueOnce({ kid: undefined, kty: 'RSA' }); // kid is undefined

		// Act
		const result = await getJWKSet(mockKV);

		// Assert
		expect(result).toEqual({ keys: [validJWK] });
		expect(result.keys).toHaveLength(1);
		expect(result.keys[0].kid).toBe('valid-string-kid');
	});

	it('should work with empty kid prefix list', async () => {
		// Arrange
		(mockKV.list as any).mockResolvedValue({ keys: [] });

		// Act
		const result = await getJWKSet(mockKV);

		// Assert
		expect(result).toEqual({ keys: [] });
		expect(mockKV.list).toHaveBeenCalledWith({ prefix: 'kid:' });
		expect(mockKV.get).not.toHaveBeenCalled();
	});
});
