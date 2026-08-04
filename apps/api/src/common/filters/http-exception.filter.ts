import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";

interface MinimalResponse {
  status(code: number): MinimalResponse;
  json(body: unknown): void;
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<MinimalResponse>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttp ? exception.getResponse() : undefined;

    const message =
      typeof body === "string"
        ? body
        : typeof body === "object" && body && "message" in body
          ? Array.isArray((body as { message: unknown }).message)
            ? (body as { message: string[] }).message.join("; ")
            : String((body as { message: unknown }).message)
          : isHttp
            ? exception.message
            : "Internal server error";

    const code = isHttp ? HttpStatus[status] ?? "ERROR" : "INTERNAL_ERROR";

    response.status(status).json({
      error: {
        code,
        message,
        details: typeof body === "object" ? body : undefined
      }
    });
  }
}
