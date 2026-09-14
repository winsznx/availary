import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from './middleware/auth';
import { requireAuth } from './middleware/auth';
import { logEvent } from './log';
import { health } from './routes/health';
import { careNeeds } from './routes/care-needs';
import { providers } from './routes/providers';
import { observations } from './routes/observations';
import { radar } from './routes/radar';
import { calls } from './routes/calls';
import { account } from './routes/account';

const app = new Hono<AppEnv>();

app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID();
  await next();
  logEvent('request', {
    requestId,
    method: c.req.method,
    path: new URL(c.req.url).pathname,
    status: String(c.res.status),
  });
});

app.use(
  '/api/*',
  cors({
    origin: (origin, c) => {
      const allowed = c.env.APP_ORIGIN.split(',').map((o: string) => o.trim());
      return origin && allowed.includes(origin) ? origin : null;
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

app.route('/api/health', health);

app.use('/api/care-needs/*', requireAuth);
app.use('/api/providers/*', requireAuth);
app.use('/api/observations/*', requireAuth);
app.use('/api/radar/*', requireAuth);
app.use('/api/calls/*', requireAuth);
app.use('/api/account', requireAuth);

app.route('/api/care-needs', careNeeds);
app.route('/api/providers', providers);
app.route('/api/observations', observations);
app.route('/api/radar', radar);
app.route('/api/calls', calls);
app.route('/api/account', account);

app.onError((error, c) => {
  // Never include secret values or raw error bodies that might carry them.
  logEvent('unhandled_error', { path: new URL(c.req.url).pathname, message: error.message });
  return c.json({ error: 'internal_error' }, 500);
});

app.notFound((c) => {
  // Non-API paths fall through to the static asset handler for the SPA.
  if (!new URL(c.req.url).pathname.startsWith('/api/')) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.json({ error: 'not_found' }, 404);
});

export default app;
