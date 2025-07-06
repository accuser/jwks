type Config = import('valibot').InferOutput<typeof import('./config.schema').default>;
type Key = keyof Config;
