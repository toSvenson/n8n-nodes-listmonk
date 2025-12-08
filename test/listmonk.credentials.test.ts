import { listmonkApi } from '../credentials/listmonkApi.credentials';

describe('listmonkApi credentials', () => {
  test('has expected metadata', () => {
    const creds = new listmonkApi();
    expect(creds.name).toBe('listmonkApi');
    expect(creds.displayName).toBe('Listmonk API');
    expect(Array.isArray(creds.properties)).toBe(true);
    const propNames = creds.properties.map((p) => p.name);
    expect(propNames).toEqual(['baseUrl', 'username', 'password']);
  });

  test('authenticate uses Basic Auth credentials mapping', () => {
    const creds = new listmonkApi();
    // structure check
    expect(creds.authenticate.type).toBe('generic');
    // templated values for username/password from $credentials
    // n8n resolves these at runtime; here we assert template strings are present
    const auth: any = (creds.authenticate as any).properties?.auth;
    expect(auth).toBeDefined();
    expect(auth.username).toBe('={{$credentials.username}}');
    expect(auth.password).toBe('={{$credentials.password}}');
  });

  test('test request hits /api/lists with baseURL from credentials', () => {
    const creds = new listmonkApi();
    const req: any = (creds.test as any).request;
    expect(req).toBeDefined();
    expect(req.method).toBe('GET');
    expect(req.url).toBe('=/api/lists');
    expect(req.baseURL).toBe('={{$credentials.baseUrl}}');
  });
});
