import { useEffect, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

const PADDLE_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN || "";
const PADDLE_ENV = (import.meta.env.VITE_PADDLE_ENV || "sandbox") as "sandbox" | "production";

export const usePaddle = (): Paddle | undefined => {
  const [paddle, setPaddle] = useState<Paddle>();

  useEffect(() => {
    if (!PADDLE_TOKEN) return;
    initializePaddle({
      environment: PADDLE_ENV,
      token: PADDLE_TOKEN,
    }).then((instance) => {
      if (instance) setPaddle(instance);
    });
  }, []);

  return paddle;
};
