import {JSONSchemaType} from "ajv";
import createAjvValidator from "../utils/createAjvValidator";

// FIX: Defined strong minimum length for passwords (12 characters) to mitigate brute-force attacks.
const MIN_PASSWORD_LENGTH = 12;

export type TLoginDTO = {
  email: string,
  password: string,
  csrfmiddlewaretoken: string,
}

export type TSignupDTO = {
  first_name: string,
  email: string,
  password: string,
  role: number,
  csrfmiddlewaretoken: string,
}

export type TLoginResponseDTO = {
  status: number,
  redirect: string,
}

export type TResetPasswordDTO = {
  email: string,
  csrfmiddlewaretoken: string,
}

export type TUpdateResetPasswordDTO = {
  password: string,
  uidb64: string,
  token: string,
  csrfmiddlewaretoken: string,
}

// --- Schemas for Input Validation (Security Fixes) ---

// FIX: Added schema for TLoginDTO to enforce input constraints (email format, password strength).
const loginSchema: JSONSchemaType<TLoginDTO> = {
  type: "object",
  properties: {
    email: {type: "string", format: "email", minLength: 5, maxLength: 254},
    password: {type: "string", minLength: MIN_PASSWORD_LENGTH},
    csrfmiddlewaretoken: {type: "string", minLength: 1},
  },
  required: ["email", "password", "csrfmiddlewaretoken"],
  additionalProperties: false,
}

// FIX: Added schema for TSignupDTO to enforce input constraints and prevent overly long inputs (DoS/storage issues).
const signupSchema: JSONSchemaType<TSignupDTO> = {
  type: "object",
  properties: {
    first_name: {type: "string", minLength: 2, maxLength: 50},
    email: {type: "string", format: "email", minLength: 5, maxLength: 254},
    password: {type: "string", minLength: MIN_PASSWORD_LENGTH},
    // FIX: Ensure role is a safe integer. Backend must still enforce authorization rules based on context.
    role: {type: "number", minimum: 1, maximum: 100, multipleOf: 1},
    csrfmiddlewaretoken: {type: "string", minLength: 1},
  },
  required: ["first_name", "email", "password", "role", "csrfmiddlewaretoken"],
  additionalProperties: false,
}

// FIX: Added schema for TResetPasswordDTO.
const resetPasswordSchema: JSONSchemaType<TResetPasswordDTO> = {
  type: "object",
  properties: {
    email: {type: "string", format: "email", minLength: 5, maxLength: 254},
    csrfmiddlewaretoken: {type: "string", minLength: 1},
  },
  required: ["email", "csrfmiddlewaretoken"],
  additionalProperties: false,
}

// FIX: Added schema for TUpdateResetPasswordDTO, ensuring the new password meets minimum strength requirements.
const updateResetPasswordSchema: JSONSchemaType<TUpdateResetPasswordDTO> = {
  type: "object",
  properties: {
    password: {type: "string", minLength: MIN_PASSWORD_LENGTH},
    uidb64: {type: "string", minLength: 1, maxLength: 100}, // Constraint length of tokens/IDs
    token: {type: "string", minLength: 1, maxLength: 100},
    csrfmiddlewaretoken: {type: "string", minLength: 1},
  },
  required: ["password", "uidb64", "token", "csrfmiddlewaretoken"],
  additionalProperties: false,
}

// --- Schemas for Output Validation ---

const loginResponseSchema: JSONSchemaType<TLoginResponseDTO> = {
  type: "object",
  properties: {
    status: {type: "number"},
    redirect: {type: "string", minLength: 1},
  },
  required: ["status", "redirect"],
  additionalProperties: false,
}

// --- Exported Validators ---

export const validateLoginDTO = createAjvValidator<TLoginDTO>(loginSchema);
export const validateSignupDTO = createAjvValidator<TSignupDTO>(signupSchema);
export const validateResetPasswordDTO = createAjvValidator<TResetPasswordDTO>(resetPasswordSchema);
export const validateUpdateResetPasswordDTO = createAjvValidator<TUpdateResetPasswordDTO>(updateResetPasswordSchema);

export const validateLoginResponse = crea
