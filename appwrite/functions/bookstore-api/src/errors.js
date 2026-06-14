export class HttpError extends Error {
  constructor(statusCode, type, message, details = undefined) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
  }
}

export function toErrorResponse(error) {
  if (error instanceof HttpError) {
    return {
      statusCode: error.statusCode,
      type: error.type,
      message: error.message,
      details: error.details,
    };
  }

  return {
    statusCode: 500,
    type: 'internal_error',
    message: 'Internal server error',
  };
}
