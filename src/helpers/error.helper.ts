import { validationResult } from "express-validator";
import { AuthRequest } from "../types/core";

export const errorHelper = (req: AuthRequest) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new Error(
      errors
        .array()
        .map((errors) => errors.msg)
        .join()
        .replace(/[,]/g, " and ")
    );
  }
};
