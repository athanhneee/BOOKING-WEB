import "dotenv/config";

import sequelize from "../config/database";

const defaultRoles = [
    { code: "guest", name: "Guest" },
    { code: "host", name: "Host" },
    { code: "moderator", name: "Moderator" },
    { code: "admin", name: "Admin" },
];

const tableExists = async (tableName: string) => {
    const [rows] = await sequelize.query(
        `
        SELECT COUNT(*) AS count
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = ?
        `,
        {
            replacements: [tableName],
        },
    );

    return Number((rows as Array<{ count: number }>)[0]?.count ?? 0) > 0;
};

const columnExists = async (tableName: string, columnName: string) => {
    const [rows] = await sequelize.query(
        `
        SELECT COUNT(*) AS count
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = ?
          AND column_name = ?
        `,
        {
            replacements: [tableName, columnName],
        },
    );

    return Number((rows as Array<{ count: number }>)[0]?.count ?? 0) > 0;
};

const indexExists = async (tableName: string, indexName: string) => {
    const [rows] = await sequelize.query(
        `
        SELECT COUNT(*) AS count
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = ?
          AND index_name = ?
        `,
        {
            replacements: [tableName, indexName],
        },
    );

    return Number((rows as Array<{ count: number }>)[0]?.count ?? 0) > 0;
};

const getColumnType = async (tableName: string, columnName: string) => {
    const [rows] = await sequelize.query(
        `
        SELECT column_type AS columnType
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = ?
          AND column_name = ?
        LIMIT 1
        `,
        {
            replacements: [tableName, columnName],
        },
    );

    return ((rows as Array<{ columnType?: string }>)[0]?.columnType ?? null) as string | null;
};

const ensureColumn = async (tableName: string, columnName: string, definition: string) => {
    if (await columnExists(tableName, columnName)) {
        return;
    }

    await sequelize.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`);
};

const ensureIndex = async (
    tableName: string,
    indexName: string,
    indexType: "INDEX" | "UNIQUE INDEX",
    columns: string,
) => {
    if (await indexExists(tableName, indexName)) {
        return;
    }

    await sequelize.query(`CREATE ${indexType} \`${indexName}\` ON \`${tableName}\` (${columns})`);
};

const ensureEnumContains = async (
    tableName: string,
    columnName: string,
    values: string[],
    nullSql: "NULL" | "NOT NULL",
    defaultSql?: string,
) => {
    const columnType = await getColumnType(tableName, columnName);

    if (!columnType) {
        return;
    }

    if (values.every((value) => columnType.includes(`'${value}'`))) {
        return;
    }

    const enumSql = values.map((value) => `'${value.replace(/'/g, "''")}'`).join(",");
    await sequelize.query(
        `ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${columnName}\` ENUM(${enumSql}) ${nullSql} ${
            defaultSql ?? ""
        }`,
    );
};

const ensureUsersSchema = async () => {
    if (!(await tableExists("users"))) {
        await sequelize.query(`
            CREATE TABLE \`users\` (
                \`user_id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                \`username\` VARCHAR(255) NULL,
                \`email\` VARCHAR(255) NOT NULL,
                \`phone\` VARCHAR(32) NULL,
                \`full_name\` VARCHAR(255) NOT NULL,
                \`first_name\` VARCHAR(120) NULL,
                \`last_name\` VARCHAR(120) NULL,
                \`password_hash\` VARCHAR(255) NOT NULL,
                \`date_of_birth\` DATE NULL,
                \`dob\` DATE NULL,
                \`bio\` TEXT NULL,
                \`avatar_url\` VARCHAR(1024) NULL,
                \`is_email_verified\` TINYINT(1) NOT NULL DEFAULT 0,
                \`is_phone_verified\` TINYINT(1) NOT NULL DEFAULT 0,
                \`is_host_verified\` TINYINT(1) NOT NULL DEFAULT 0,
                \`host_application_status\` ENUM('pending','approved','rejected') NULL,
                \`status\` ENUM('active','inactive','blocked','suspended','deleted','locked') NOT NULL DEFAULT 'active',
                \`last_login_at\` DATETIME NULL,
                \`deleted_at\` DATETIME NULL,
                \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`user_id\`),
                UNIQUE KEY \`uq_users_email\` (\`email\`),
                UNIQUE KEY \`uq_users_phone\` (\`phone\`),
                UNIQUE KEY \`uq_users_username\` (\`username\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        return;
    }

    await ensureColumn("users", "username", "`username` VARCHAR(255) NULL AFTER `user_id`");
    await ensureColumn("users", "first_name", "`first_name` VARCHAR(120) NULL AFTER `full_name`");
    await ensureColumn("users", "last_name", "`last_name` VARCHAR(120) NULL AFTER `first_name`");
    await ensureColumn("users", "dob", "`dob` DATE NULL AFTER `date_of_birth`");
    await ensureColumn(
        "users",
        "is_email_verified",
        "`is_email_verified` TINYINT(1) NOT NULL DEFAULT 0 AFTER `bio`",
    );
    await ensureColumn("users", "avatar_url", "`avatar_url` VARCHAR(1024) NULL AFTER `bio`");
    await ensureColumn(
        "users",
        "is_phone_verified",
        "`is_phone_verified` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_email_verified`",
    );
    await ensureColumn(
        "users",
        "is_host_verified",
        "`is_host_verified` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_phone_verified`",
    );
    await ensureColumn(
        "users",
        "host_application_status",
        "`host_application_status` ENUM('pending','approved','rejected') NULL AFTER `is_host_verified`",
    );
    await ensureColumn("users", "last_login_at", "`last_login_at` DATETIME NULL AFTER `status`");
    await ensureColumn("users", "deleted_at", "`deleted_at` DATETIME NULL AFTER `last_login_at`");
    await ensureIndex("users", "uq_users_username", "UNIQUE INDEX", "`username`");
    await ensureEnumContains(
        "users",
        "status",
        ["active", "inactive", "blocked", "suspended", "deleted", "locked"],
        "NOT NULL",
        "DEFAULT 'active'",
    );
};

const ensureRolesSchema = async () => {
    if (!(await tableExists("roles"))) {
        await sequelize.query(`
            CREATE TABLE \`roles\` (
                \`role_id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                \`code\` VARCHAR(64) NOT NULL,
                \`name\` VARCHAR(120) NOT NULL,
                \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`role_id\`),
                UNIQUE KEY \`uq_roles_code\` (\`code\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
    }

    if (!(await tableExists("user_role"))) {
        await sequelize.query(`
            CREATE TABLE \`user_role\` (
                \`user_id\` BIGINT UNSIGNED NOT NULL,
                \`role_id\` BIGINT UNSIGNED NOT NULL,
                \`assigned_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`user_id\`, \`role_id\`),
                INDEX \`idx_user_role_role\` (\`role_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
    }

    for (const role of defaultRoles) {
        await sequelize.query(
            `
            INSERT INTO roles (code, name, created_at, updated_at)
            VALUES (?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = NOW()
            `,
            {
                replacements: [role.code, role.name],
            },
        );
    }
};

const ensureAuthOtpSchema = async () => {
    if (await tableExists("auth_otp_tokens")) {
        await ensureEnumContains(
            "auth_otp_tokens",
            "purpose",
            ["sign_up", "forgot_password", "verify_email", "verify_phone", "password_reset"],
            "NOT NULL",
        );
        await sequelize.query(
            "UPDATE auth_otp_tokens SET purpose = 'forgot_password' WHERE purpose = 'password_reset'",
        );
        await ensureEnumContains(
            "auth_otp_tokens",
            "purpose",
            ["sign_up", "forgot_password", "verify_email", "verify_phone"],
            "NOT NULL",
        );
        await sequelize.query(
            "ALTER TABLE `auth_otp_tokens` MODIFY COLUMN `user_id` BIGINT UNSIGNED NULL",
        );
        await ensureColumn("auth_otp_tokens", "used_at", "`used_at` DATETIME NULL AFTER `consumed_at`");
        await ensureColumn(
            "auth_otp_tokens",
            "attempt_count",
            "`attempt_count` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `used_at`",
        );
        return;
    }

    await sequelize.query(`
        CREATE TABLE \`auth_otp_tokens\` (
            \`otp_token_id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            \`user_id\` BIGINT UNSIGNED NULL,
            \`identifier\` VARCHAR(255) NOT NULL,
            \`purpose\` ENUM('sign_up','forgot_password','verify_email','verify_phone') NOT NULL,
            \`token_hash\` VARCHAR(255) NOT NULL,
            \`expires_at\` DATETIME NOT NULL,
            \`consumed_at\` DATETIME NULL,
            \`used_at\` DATETIME NULL,
            \`attempt_count\` INT UNSIGNED NOT NULL DEFAULT 0,
            \`sent_at\` DATETIME NOT NULL,
            \`ip_address\` VARCHAR(255) NULL,
            \`user_agent\` VARCHAR(1024) NULL,
            \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`otp_token_id\`),
            INDEX \`idx_auth_otp_user_purpose_expires\` (\`user_id\`, \`purpose\`, \`expires_at\`),
            INDEX \`idx_auth_otp_identifier_purpose_sent\` (\`identifier\`, \`purpose\`, \`sent_at\`),
            INDEX \`idx_auth_otp_hash\` (\`token_hash\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
};

const ensureAuditLogsSchema = async () => {
    if (await tableExists("audit_logs")) {
        return;
    }

    await sequelize.query(`
        CREATE TABLE \`audit_logs\` (
            \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            \`actor_id\` BIGINT UNSIGNED NULL,
            \`action\` VARCHAR(120) NOT NULL,
            \`target_type\` VARCHAR(80) NOT NULL,
            \`target_id\` BIGINT UNSIGNED NULL,
            \`metadata_json\` JSON NULL,
            \`ip_address\` VARCHAR(255) NULL,
            \`user_agent\` VARCHAR(1024) NULL,
            \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            INDEX \`idx_audit_logs_actor\` (\`actor_id\`),
            INDEX \`idx_audit_logs_action\` (\`action\`),
            INDEX \`idx_audit_logs_target\` (\`target_type\`, \`target_id\`),
            INDEX \`idx_audit_logs_created_at\` (\`created_at\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
};

export const ensureRuntimeSchema = async () => {
    await ensureUsersSchema();
    await ensureRolesSchema();
    await ensureAuthOtpSchema();
    await ensureAuditLogsSchema();
};

if (require.main === module) {
    ensureRuntimeSchema()
        .then(() => {
            console.info("Runtime schema OK");
        })
        .catch((error: unknown) => {
            console.error("Runtime schema FAILED");
            console.error(error);
            process.exitCode = 1;
        })
        .finally(async () => {
            await sequelize.close();
        });
}