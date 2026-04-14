export interface GenderizeResponse {
  name: string;
  gender: string | null;
  probability: number;
  count: number;
}

export interface ClassificationData {
  name: string;
  gender: string;
  probability: number;
  sample_size: number;
  is_confident: boolean;
  processed_at: string;
}

export interface SuccessResponse {
  status: 'success';
  data: ClassificationData;
}

export interface ErrorResponse {
  status: 'error';
  message: string;
}

export type ApiResponse = SuccessResponse | ErrorResponse;