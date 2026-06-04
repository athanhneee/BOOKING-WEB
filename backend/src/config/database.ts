import { Sequelize } from "sequelize";
import fs from "node:fs";
import path from "node:path";

import { getEnv } from "./env";

const env = getEnv();
const caPath = env.dbSslCa ? path.resolve(process.cwd(), env.dbSslCa) : undefined;

// Allow override via env: MYSQL_SSL_REJECT_UNAUTHORIZED=false
// Needed for providers with self-signed certs (PlanetScale, Aiven, Railway, etc.)
const sslRejectUnauthorized = (() => {
    const raw = process.env.MYSQL_SSL_REJECT_UNAUTHORIZED;
    if (raw === "false") return false;
    if (raw === "true") return true;
    // Default: strict in production, relaxed in dev
    return env.nodeEnv === "production";
})();

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
                      rejectUnauthorized: sslRejectUnauthorized,
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
