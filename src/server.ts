import express from "express";
import { getPayloadClient } from "./get-playload";
import { nextApp, nextHandler } from "./next-utils";
import { appRouter } from "./trpc";
import * as trpcExpress from "@trpc/server/adapters/express";
import { inferAsyncReturnType } from "@trpc/server";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const createContext =
  () =>
  ({ req, res }: trpcExpress.CreateExpressContextOptions) => ({
    req,
    res,
  });

export type ExpressContext = inferAsyncReturnType<typeof createContext>;

const start = async () => {
  const payload = await getPayloadClient({
    initOptions: {
      express: app,
      onInit: async (cms) => {
        cms.logger.info(`Admin URL ${cms.getAdminURL()}`);
      },
    },
  });

  app.use(
    "/api/trpc",
    trpcExpress.createExpressMiddleware({ router: appRouter, createContext: createContext() })
  );

  app.use((req, res) => nextHandler(req, res));
  nextApp.prepare().then(() => {
    payload.logger.info("Next.js Started");
    app.listen(PORT, async () => {
      payload.logger.info(
        `Nextjs App URL:${process.env.NEXT_PUBLIC_SERVER_URL}`
      );
    });
  });
};

start();

// app.get('/', (req, res) => {
//   res.send('Hello World');
// });
