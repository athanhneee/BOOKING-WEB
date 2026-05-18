import "dotenv/config";

import type { Server } from "node:http";

import app from "./app";
import sequelize from "./config/database";
import { getEnv } from "./config/env";
import { logger } from "./config/logger";
import "./models";
import { ensureRuntimeSchema } from "./scripts/ensure-runtime-schema";

type ExitProcess = (code: number) => never | void;

export const shutdownServer = async (
    server: Server | undefined,
    signal: NodeJS.Signals,
    exitProcess: ExitProcess = (code) => process.exit(code),
) => {
    logger.info("Shutdown signal received", { signal });

    try {
        if (server) {
            await new Promise<void>((resolve, reject) => {
                server.close((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            });
        }

        await sequelize.close();
        logger.info("Shutdown complete", { signal });
        exitProcess(0);
    } catch (error) {
        logger.error("Shutdown failed", error, { signal });
        exitProcess(1);
    }
};

export const startServer = async () => {
    const env = getEnv();
    const { port } = env;
    let server: Server | undefined;

    process.once("SIGTERM", () => {
        void shutdownServer(server, "SIGTERM");
    });
    process.once("SIGINT", () => {
        void shutdownServer(server, "SIGINT");
    });

    try {
        await sequelize.authenticate();

        if (env.nodeEnv !== "production" || env.allowProductionAutoSchemaSync) {
            await ensureRuntimeSchema();
            await sequelize.sync();
        } else {
            logger.info("Skipped automatic schema sync in production");
        }

        logger.info("MySQL connected successfully");

        server = app.listen(port, () => {
            logger.info(`Server running at http://localhost:${port}`);
        });

        return server;
    } catch (error) {
        logger.error("Failed to start server", error);
        process.exit(1);
    }
};

export default app;