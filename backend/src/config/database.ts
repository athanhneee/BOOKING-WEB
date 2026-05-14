import { Sequelize } from "sequelize";
import fs from "node:fs";
import path from "node:path";

import { getEnv } from "./env";

const env = getEnv();
const caPath = env.dbSslCa ? path.resolve(process.cwd(), env.dbSslCa) : undefined;

export const sequelize = new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
    host: env.dbHost,
    port: env.dbPort,
    dialect: "mysql",
    timezone: "+00:00",
    dialectOptions: {
        decimalNumbers: true,
        timezone: "+00:00",
        ...(env.dbSsl
            ? {
                  ssl: {
                      rejectUnauthorized: true,
                      ...(caPath && fs.existsSync(caPath) ? { ca: fs.readFileSync(caPath, "utf8") } : {}),
                  },
              }
            : {}),
    },
    define: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
        engine: "InnoDB",
    },
    logging: false,
});

export default sequelize;
