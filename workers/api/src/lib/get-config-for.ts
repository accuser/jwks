import { parseAsync } from 'valibot';
import ConfigSchema from './config.schema';

const configFor = async (keys: Key[], kv: KVNamespace): Promise<Config> => {
	let config: Config;

	try {
		config = await parseAsync(ConfigSchema, kv.get('config', 'json'));
	} catch {
		config = {};
	}

	return Array.from(new Set(keys)).reduce((p, c) => {
		return { ...p, [c]: config[c] };
	}, {} as Config);
};

export { configFor as default };
