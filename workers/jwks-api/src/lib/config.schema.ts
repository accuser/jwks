import * as v from 'valibot';

const KEYS = ['access', 'auth', 'id'] as const;

const ConfigSchema = v.recordAsync(v.picklist(KEYS), v.object({ ttl: v.optional(v.number()), grace: v.optional(v.number()) }));

export { ConfigSchema as default };
