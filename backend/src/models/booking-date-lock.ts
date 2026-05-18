import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
} from "sequelize";

import sequelize from "../config/database";

class BookingDateLockModel extends Model<
    InferAttributes<BookingDateLockModel>,
    InferCreationAttributes<BookingDateLockModel>
> {
    declare bookingDateLockId: CreationOptional<number>;
    declare bookingId: number;
    declare listingId: number;
    declare reservedDate: string;
    declare status: CreationOptional<string>;
    declare releasedAt: CreationOptional<Date | null>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

BookingDateLockModel.init(
    {
        bookingDateLockId: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            field: "booking_date_lock_id",
        },
        bookingId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: "booking_id",
        },
        listingId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: "listing_id",
        },
        reservedDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "reserved_date",
        },
        status: {
            type: DataTypes.STRING(32),
            allowNull: false,
            defaultValue: "held",
        },
        releasedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "released_at",
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: "booking_date_locks",
        underscored: true,
        timestamps: true,
        indexes: [
            { unique: true, fields: ["booking_id", "reserved_date"] },
            { fields: ["listing_id", "reserved_date"] },
            { fields: ["released_at"] },
        ],
    },
);

export default BookingDateLockModel;
