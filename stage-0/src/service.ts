import { GenderizeResponse, ClassificationData, ErrorResponse } from './model';

const GENDERIZE_API = 'https://api.genderize.io';

export async function classifyName(name: string): Promise<ClassificationData | ErrorResponse> {
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