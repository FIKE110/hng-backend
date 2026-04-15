const GENDERIZE_API = 'https://api.genderize.io';

interface GenderizeResponse {
  name: string;
  gender: string | null;
  probability: number;
  count: number;
}

interface ClassificationData {
  name: string;
  gender: string;
  probability: number;
  sample_size: number;
  is_confident: boolean;
  processed_at: string;
}

interface ErrorResponse {
  status: 'error';
  message: string;
}

interface SuccessResponse {
  status: 'success';
  data: ClassificationData;
}

type ApiResponse = SuccessResponse | ErrorResponse;

async function classifyName(name: string): Promise<ClassificationData | ErrorResponse> {
  const response = await fetch(`${GENDERIZE_API}?name=${encodeURIComponent(name)}`);
  
  if (!response.ok) {
    return {
      status: 'error',
      message: response.status === 502 ? 'External API unavailable' : 'Failed to fetch gender data'
    };
  }

  const data: GenderizeResponse = await response.json();

  if (data.gender === null || data.count === 0) {
    return {
      status: 'error',
      message: 'No prediction available for the provided name'
    };
  }

  const sampleSize = data.count;
  const probability = data.probability;
  const isConfident = probability >= 0.7 && sampleSize >= 100;

  return {
    name: data.name,
    gender: data.gender,
    probability: probability,
    sample_size: sampleSize,
    is_confident: isConfident,
    processed_at: new Date().toISOString()
  };
}

function validateName(name: unknown): { valid: boolean; error?: { code: number; message: string } } {
  if (name === undefined || name === '') {
    return { valid: false, error: { code: 400, message: 'Missing name query parameter' } };
  }

  if (typeof name !== 'string') {
    return { valid: false, error: { code: 422, message: 'Name must be a string' } };
  }

  return { valid: true };
}

function parseQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const queryString = url.split('?')[1] || '';
  queryString.split('&').forEach(param => {
    const [key, value] = param.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });
  return params;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const queryParams = parseQueryParams(request.url);
  const name = queryParams.name;

  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Content-Type', 'application/json');

  const validation = validateName(name);

  if (!validation.valid) {
    return new Response(
      JSON.stringify({ status: 'error', message: validation.error!.message }),
      { status: validation.error!.code, headers }
    );
  }

  const result = await classifyName(name!);

  if (result.status === 'error') {
    return new Response(
      JSON.stringify(result),
      { status: 400, headers }
    );
  }

  const response: ApiResponse = {
    status: 'success',
    data: result as ClassificationData
  };

  return new Response(JSON.stringify(response), { status: 200, headers });
}

export async function POST(request: Request) {
  return GET(request);
}

export async function OPTIONS() {
  return new Response('', {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}