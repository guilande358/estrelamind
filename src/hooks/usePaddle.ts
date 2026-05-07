import { useEffect, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

const PADDLE_TOKEN = "live_e60c295432d15f2b8e061d1872b";
const PADDLE_ENV: "sandbox" | "production" = "production";

let paddleSingleton: Paddle | undefined;
let paddlePromise: Promise<Paddle | undefined> | null = null;

const loadPaddle = (): Promise<Paddle | undefined> => {
  if (paddleSingleton) return Promise.resolve(paddleSingleton);
  if (paddlePromise) return paddlePromise;
  paddlePromise = initializePaddle({
    environment: PADDLE_ENV,
    token: PADDLE_TOKEN,
    eventCallback: (ev) => {
      // eslint-disable-next-line no-console
      console.log("[Paddle event]", ev?.name, ev);
    },
  })
    .then((instance) => {
      if (instance) {
        paddleSingleton = instance;
        console.log("[Paddle] initialized in", PADDLE_ENV);
      } else {
        console.error("[Paddle] initialize returned undefined");
      }
      return instance;
    })
    .catch((err) => {
      console.error("[Paddle] initialization failed:", err);
      paddlePromise = null;
      return undefined;
    });
  return paddlePromise;
};

export const usePaddle = (): Paddle | undefined => {
  const [paddle, setPaddle] = useState<Paddle | undefined>(paddleSingleton);

  useEffect(() => {
    if (paddle) return;
    loadPaddle().then((instance) => {
      if (instance) setPaddle(instance);
    });
  }, [paddle]);

  return paddle;
};
