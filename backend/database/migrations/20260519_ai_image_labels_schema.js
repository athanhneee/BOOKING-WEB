require("dotenv/config");

const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");

const databaseName = process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || "booking_room";

const dbUser = process.env.MYSQLUSER || process.env.MYSQL_USER || "booking_app";

if (
    dbUser.toLowerCase() === "root" &&
    process.env.ALLOW_DATABASE_ROOT_USER !== "true"
) {
    throw new Error("Refusing to run migration with MySQL root user.");
}

const ssl =
    process.env.MYSQL_SSL === "true"
        ? {
            rejectUnauthorized: true,
            ...(process.env.MYSQL_SSL_CA && fs.existsSync(path.resolve(process.cwd(), process.env.MYSQL_SSL_CA))
                ? { ca: fs.readFileSync(path.resolve(process.cwd(), process.env.MYSQL_SSL_CA), "utf8") }
                : {}),
        }
        : undefined;

const quoteId = (value) => `\`${String(value).replace(/`/g, "``")}\``;

const createConnection = () =>
    mysql.createConnection({
        host: process.env.MYSQLHOST || process.env.MYSQL_HOST || "127.0.0.1",
        port: Number(process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306),
        user: dbUser,
        password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || "",
        database: databaseName,
        ssl,
        multipleStatements: false,
        decimalNumbers: true,
        charset: "utf8mb4",
    });

const tableExists = async (connection, tableName) => {
    const [rows] = await connection.execute(
        `
        SELECT COUNT(*) AS count
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = ?
        `,
        [tableName],
    );

    return Number(rows[0].count) > 0;
};

const columnExists = async (connection, tableName, columnName) => {
    const [rows] = await connection.execute(
        `
        SELECT COUNT(*) AS count
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = ?
          AND column_name = ?
        `,
        [tableName, columnName],
    );

    return Number(rows[0].count) > 0;
};

const ensureColumn = async (connection, tableName, columnName, definition) => {
    if (!(await tableExists(connection, tableName))) {
        console.info(`Skipped ${tableName}.${columnName}: table missing`);
        return;
    }

    if (await columnExists(connection, tableName, columnName)) {
        return;
    }

    await connection.query(`ALTER TABLE ${quoteId(tableName)} ADD COLUMN ${definition}`);
    console.info(`Added column ${tableName}.${columnName}`);
};

const modifyColumnIfExists = async (connection, tableName, columnName, definition) => {
    if (!(await tableExists(connection, tableName)) || !(await columnExists(connection, tableName, columnName))) {
        return;
    }

    await connection.query(`ALTER TABLE ${quoteId(tableName)} MODIFY COLUMN ${definition}`);
    console.info(`Modified column ${tableName}.${columnName}`);
};

const supportsJsonColumn = async (connection) => {
    const tempTable = `tmp_json_probe_${Date.now()}`;

    try {
        await connection.query(`CREATE TEMPORARY TABLE ${quoteId(tempTable)} (payload JSON NULL)`);
        await connection.query(`DROP TEMPORARY TABLE ${quoteId(tempTable)}`);
        return true;
    } catch {
        return false;
    }
};

const main = async () => {
    const connection = await createConnection();

    try {
        const jsonColumnType = (await supportsJsonColumn(connection)) ? "JSON" : "LONGTEXT";

        await modifyColumnIfExists(connection, "listing_images", "caption", "`caption` TEXT NULL");

        await ensureColumn(connection, "listing_images", "display_title", "`display_title` VARCHAR(120) NULL AFTER `caption`");
        await ensureColumn(connection, "listing_images", "alt_text", "`alt_text` VARCHAR(500) NULL AFTER `display_title`");
        await ensureColumn(connection, "listing_images", "ai_image_type", "`ai_image_type` VARCHAR(50) NULL AFTER `alt_text`");
        await ensureColumn(connection, "listing_images", "ai_scene_tags", `\`ai_scene_tags\` ${jsonColumnType} NULL AFTER \`ai_image_type\``);
        await ensureColumn(connection, "listing_images", "ai_amenity_tags", `\`ai_amenity_tags\` ${jsonColumnType} NULL AFTER \`ai_scene_tags\``);
        await ensureColumn(connection, "listing_images", "ai_description", "`ai_description` TEXT NULL AFTER `ai_amenity_tags`");
        await ensureColumn(connection, "listing_images", "ai_confidence", "`ai_confidence` DECIMAL(5,4) NULL AFTER `ai_description`");
        await ensureColumn(connection, "listing_images", "ai_quality_warnings", `\`ai_quality_warnings\` ${jsonColumnType} NULL AFTER \`ai_confidence\``);

        await ensureColumn(
            connection,
            "listing_images",
            "ai_analysis_status",
            "`ai_analysis_status` ENUM('pending','analyzed','failed') NOT NULL DEFAULT 'pending' AFTER `ai_quality_warnings`",
        );

        await ensureColumn(connection, "listing_images", "ai_error_message", "`ai_error_message` TEXT NULL AFTER `ai_analysis_status`");
        await ensureColumn(connection, "listing_images", "ai_analyzed_at", "`ai_analyzed_at` DATETIME NULL AFTER `ai_error_message`");

        await ensureColumn(connection, "listings", "ai_image_tags", `\`ai_image_tags\` ${jsonColumnType} NULL`);
        await ensureColumn(connection, "listings", "ai_image_summary", "`ai_image_summary` TEXT NULL");

        console.info("AI image labels schema completed");
    } finally {
        await connection.end();
    }
};

main().catch((error) => {
    console.error("AI image labels schema failed");
    console.error(error.message);
    process.exitCode = 1;
});
