import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
} from "sequelize";

import sequelize from "../config/database";

class NotificationLog extends Model<
    InferAttributes<NotificationLog>,
    InferCreationAttributes<NotificationLog>
> {
    declare notificationLogId: CreationOptional<number>;
    declare eventType: string;
    declare targetType: string;
    declare targetId: string;
    declare recipient: string;
    declare status: CreationOptional<"pending" | "sent" | "failed" | "skipped">;
    declare provider: string | null;
    declare providerMessageId: string | null;
    declare errorMessage: string | null;
    declare sentAt: Date | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

NotificationLog.init(
    {
        notificationLogId: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            field: "notification_log_id",
        },
        eventType: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "event_type",
        },
        targetType: {
            type: DataTypes.STRING(64),
            allowNull: false,
            field: "target_type",
        },
        targetId: {
            type: DataTypes.STRING(64),
            allowNull: false,
            field: "target_id",
        },
        recipient: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("pending", "sent", "failed", "skipped"),
            allowNull: false,
            defaultValue: "pending",
        },
        provider: {
            type: DataTypes.STRING(64),
            allowNull: true,
        },
        providerMessageId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "provider_message_id",
        },
        errorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "error_message",
        },
        sentAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "sent_at",
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "created_at",
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "updated_at",
        },
    },
    {
        sequelize,
        tableName: "notification_logs",
        modelName: "NotificationLog",
        underscored: true,
        timestamps: true,
        indexes: [
            {
                unique: true,
                name: "uniq_notification_event_target_recipient",
                fields: ["event_type", "target_type", "target_id", "recipient"],
            },
            {
                name: "idx_notification_logs_status",
                fields: ["status"],
            },
            {
                name: "idx_notification_logs_target",
                fields: ["target_type", "target_id"],
            },
        ],
    },
);

export default NotificationLog;
