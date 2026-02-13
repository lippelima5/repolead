export class CustomError extends Error {
    /** HTTP status code que você quer retornar (útil p/ APIs). */
    public readonly statusCode: number;
  
    /** Campo opcional com dados extras que você queira logar ou devolver. */
    public readonly details?: unknown;
  
    constructor(message: string, statusCode = 500, details?: unknown) {
      super(message);
      this.name = 'CustomError';
      this.statusCode = statusCode;
      this.details = details;
  
      // Corrige o prototype chain quando transpila p/ ES5.
      Object.setPrototypeOf(this, new.target.prototype);
  
      // Garante que o stack trace aponte p/ o ponto de throw original.
      Error.captureStackTrace?.(this, this.constructor);
    }
  }
  