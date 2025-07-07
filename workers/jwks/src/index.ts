import { Hono } from 'hono';
import app from './lib/app';

const worker = new Hono().route('/', app);

export { worker as default };
