import { Hono } from 'hono';
import { classifyName } from './service';
import { ApiResponse, ClassificationData } from './model';

const app = new Hono();

app.use('*', async (c, next) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  await next();
});

app.options('*', (c) => {
  return c.text('', 204);
});

async function validateName(name: unknown): Promise<{ valid: boolean; error?: { code: number; message: string } }> {
  if (name === undefined || name === '') {
    return { valid: false, error: { code: 400, message: 'Missing name query parameter' } };
  }

  if (typeof name !== 'string') {
    return { valid: false, error: { code: 422, message: 'Name must be a string' } };
  }

  return { valid: true };
}

app.get('/api/classify', async (c) => {
  const name = c.req.query('name');

  const validation = await validateName(name);
  if (!validation.valid) {
    return c.json<ApiResponse>({ status: 'error', message: validation.error!.message }, validation.error!.code);
  }

  const result = await classifyName(name!);

  if (result.status === 'error') {
    return c.json<ApiResponse>(result, 400);
  }

  return c.json<ApiResponse>({
    status: 'success',
    data: result as ClassificationData
  });
});

export default app;