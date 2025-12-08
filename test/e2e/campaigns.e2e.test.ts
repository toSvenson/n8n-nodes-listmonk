import nock from 'nock';

const baseUrl = 'http://localhost:9000';
const apiBase = `${baseUrl}/api`;
const authHeader = 'Basic ' + Buffer.from('api_user:password').toString('base64');

async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = {
    ...(init.headers || {}),
    Authorization: authHeader,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  } as Record<string, string>;
  const res = await fetch(`${apiBase}${path}`, { ...init, headers });
  const contentType = res.headers.get('content-type') || '';
  let body: any = null;
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else if (contentType.includes('text/html')) {
    body = await res.text();
  }
  return { status: res.status, body };
}

describe('E2E: Campaign lifecycle (mocked)', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  test('create, update status, get, delete campaign', async () => {
    const campaignInput = {
      name: 'E2E Campaign',
      subject: 'Hello',
      lists: [1],
      content_type: 'html',
      body: '<p>Hi</p>',
      template_id: 1,
    };

    // Create campaign
    nock(baseUrl)
      .post('/api/campaigns', (body) => !!body)
      .matchHeader('authorization', authHeader)
      .reply(200, { data: { id: 42 } });

    const created = await apiFetch('/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignInput),
    });
    expect(created.status).toBe(200);
    expect(created.body?.data?.id).toBe(42);

    // Update status
    nock(baseUrl)
      .put('/api/campaigns/42/status', (body) => body && body.status === 'paused')
      .matchHeader('authorization', authHeader)
      .reply(200, { data: true });

    const statusResp = await apiFetch('/campaigns/42/status', {
      method: 'PUT',
      body: JSON.stringify({ status: 'paused' }),
    });
    expect(statusResp.status).toBe(200);
    expect(statusResp.body?.data).toBe(true);

    // Get campaign by id
    nock(baseUrl)
      .get('/api/campaigns/42')
      .matchHeader('authorization', authHeader)
      .reply(200, { data: { id: 42, name: 'E2E Campaign' } });

    const got = await apiFetch('/campaigns/42', { method: 'GET' });
    expect(got.status).toBe(200);
    expect(got.body?.data?.id).toBe(42);

    // Delete campaign
    nock(baseUrl)
      .delete('/api/campaigns/42')
      .matchHeader('authorization', authHeader)
      .reply(200, { data: true });

    const del = await apiFetch('/campaigns/42', { method: 'DELETE' });
    expect(del.status).toBe(200);
    expect(del.body?.data).toBe(true);
  });

  test('bulk delete campaigns', async () => {
    // Bulk delete
    nock(baseUrl)
      .delete('/api/campaigns', (body) => Array.isArray(body?.ids) && body.ids.includes(42))
      .matchHeader('authorization', authHeader)
      .reply(200, { data: true });

    const resp = await apiFetch('/campaigns', {
      method: 'DELETE',
      body: JSON.stringify({ ids: [42, 43] }),
    });
    expect(resp.status).toBe(200);
    expect(resp.body?.data).toBe(true);
  });
});
