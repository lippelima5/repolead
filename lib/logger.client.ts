import { toast } from "sonner";
import { AxiosError } from "axios";

type LoggerFunction = (message: string, error?: unknown) => void;

interface Logger {
  success: LoggerFunction;
  error: LoggerFunction;
  info: LoggerFunction;
  warn: LoggerFunction;
}

const logger: Logger = {
  success: (message: string) => {
    console.log(`Success: ${message}`);
    toast.success(message);
  },
  error: (message: string, error?: unknown) => {
    try {
      let _msg = message;
      if (error instanceof AxiosError) {
        _msg = error.response?.data?.message || error.message || message;
      } else if (error instanceof Error) {
        _msg = error.message || message;
      }

      toast.error(_msg);
    } catch (e) {
      console.error(`Error: ${message}`, error);
      console.error(e);
    } finally {
      console.error(`Error: ${message}`, error);
    }
  },
  info: (message: string) => {
    console.info(`Info: ${message}`);
    toast.info(message);
  },
  warn: (message: string) => {
    console.warn(`Warn: ${message}`);
    toast.warning(message);
  },
};

export default logger;
