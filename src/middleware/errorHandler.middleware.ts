import { Application, NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";

class ErrorHandlerMiddleware {
  constructor(expressApp: Application) {
    expressApp.use((req, res, next) => next(new createHttpError.NotFound()));
    expressApp.use(this.errorHandler);
  }

  private errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    res.status(err.status || 500);
    const errorMessage = err.errors
      ? Object.entries(err.errors)
          .map((error: any) => error[1].message)
          .join()
      : err.message?.includes("duplicate")
      ? `${Object.entries(err.keyValue)[0][0]
          .toString()
          .split(/(?=[A-Z])/)
          .join(" ")
          .split(".")
          .join(" ")
          .replace(/^\w/, (c) => c.toUpperCase())} is already exist!`
      : err?.message || err?.error?.description || "Something went wrong";
    // console.log({ err });
    res.json({
      error: errorMessage,
      status: err.status || 500,
    });
  }
}

export default ErrorHandlerMiddleware;
