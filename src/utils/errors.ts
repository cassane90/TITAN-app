export type TitanErrorCode = 
  | 'PROTOCOL_MISMATCH'
  | 'HIGH_VOLTAGE_RISK'
  | 'CONFIDENCE_TOO_LOW' 
  | 'IMAGE_BLURRY'
  | 'IMAGE_TOO_DARK'
  | 'NO_DEVICE_FOUND'
  | 'NETWORK_TIMEOUT'
  | 'API_QUOTA_EXCEEDED'
  | 'LOCATION_DENIED'
  | 'SEARCH_EMPTY'
  | 'UNKNOWN_ERROR';

export class TitanError extends Error {
  public code: TitanErrorCode;
  public userMessage: string;
  public originalError?: unknown;

  constructor(code: TitanErrorCode, message: string, userMessage: string, originalError?: unknown) {
    super(message);
    this.name = 'TitanError';
    this.code = code;
    this.userMessage = userMessage;
    this.originalError = originalError;
  }
}

export const logError = (error: unknown, context: string) => {
  const timestamp = new Date().toISOString();
  
  if (error instanceof TitanError) {
    console.warn(`[TITAN_WARN][${timestamp}][${context}] ${error.code}: ${error.message}`);
    // FUTURE: Send to remote logging (Sentry/Supabase)
  } else {
    console.error(`[TITAN_CRITICAL][${timestamp}][${context}] Unexpected:`, error);
  }
};

export const createError = (code: TitanErrorCode, originalError?: unknown): TitanError => {
  switch (code) {
    case 'PROTOCOL_MISMATCH':
      return new TitanError(code, 'User category does not match identified device', 'Quick Tip: We detected a mismatch between your selection and the device. Proceeding with caution.', originalError);
    case 'HIGH_VOLTAGE_RISK':
      return new TitanError(code, 'High voltage device detected', 'Safety Override: High Risk. This device involves lethal voltage. DIY protocols are locked.', originalError);
    case 'CONFIDENCE_TOO_LOW':
      return new TitanError(code, 'AI confidence below threshold', 'Scan Inconclusive. We couldn\'t clearly identify this hardware. Please retake the photo.', originalError);
    case 'IMAGE_BLURRY':
      return new TitanError(code, 'Image sharpness check failed', 'Image Unclear. The photo is too blurry. Steady your hand and try again.', originalError);
    case 'NETWORK_TIMEOUT':
      return new TitanError(code, 'Request timed out', 'Connection Lost. The link to the Neural Lab timed out. Check your internet.', originalError);
    case 'API_QUOTA_EXCEEDED':
      return new TitanError(code, 'Gemini quota hit', 'System Overload. TITAN is at capacity. Please try again in 1 minute.', originalError);
    case 'NO_DEVICE_FOUND':
        return new TitanError(code, 'No hardware identified in frame', 'No Hardware Detected. We don\'t see any device. Ensure it is centered.', originalError);
    default:
      return new TitanError('UNKNOWN_ERROR', 'An unexpected error occurred', 'Something went wrong. Please try again.', originalError);
  }
};
