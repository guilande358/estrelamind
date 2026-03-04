import { useEffect, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

const PADDLE_TOKEN = "live_e60c295432d15f2b8e061d1872b";
const PADDLE_ENV = "production" as "sandbox" | "production";

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
