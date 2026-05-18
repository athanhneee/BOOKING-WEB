import {
    CreationOptional,
    DataTypes,
    FindOptions,
    InferAttributes,
    InferCreationAttributes,
    Model,
} from "sequelize";

import sequelize from "../config/database";
import {
    MySqlQuery,
    buildDocumentQuery,
    countDocumentsByFilter,
    findOneByFilter,
    isFindOptions,
    SimpleFilter,
} from "./mysql-helpers";

export type HostPayoutBookingItemRecord = {
    payoutItemId: number;
    payoutId: number;
    bookingOrderId: number;
    bookingDetailId: number;
    createdAt: Date;
};

class HostPayoutBookingItemModel extends Model<
    InferAttributes<HostPayoutBookingItemModel>,
    InferCreationAttributes<HostPayoutBookingItemModel>
> {
    declare payoutItemId: CreationOptional<number>;
    declare payoutId: number;
    declare bookingOrderId: number;
    declare bookingDetailId: number;
    declare createdAt: CreationOptional<Date>;
}

HostPayoutBookingItemModel.init(
    {
        payoutItemId: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            field: "payout_item_id",
        },
        payoutId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            field: "payout_id",
        },
        bookingOrderId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: "booking_order_id",
        },
        bookingDetailId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: "booking_detail_id",
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "created_at",
        },
    },
    {
        sequelize,
        tableName: "host_payout_booking_item",
        underscored: true,
        timestamps: false,
    },
);

export type HostPayoutBookingItemDocument = HostPayoutBookingItemModel;
type HostPayoutBookingItemWithHelpers = typeof HostPayoutBookingItemModel & {
    find(filter?: SimpleFilter<HostPayoutBookingItemRecord>): MySqlQuery<HostPayoutBookingItemModel>;
    findOne(
        options?: FindOptions | SimpleFilter<HostPayoutBookingItemRecord>,
    ): Promise<HostPayoutBookingItemModel | null>;
    countDocuments(filter?: SimpleFilter<HostPayoutBookingItemRecord>): Promise<number>;
};

const defaultPayoutItemFindOne = HostPayoutBookingItemModel.findOne.bind(
    HostPayoutBookingItemModel,
) as (options?: FindOptions) => Promise<HostPayoutBookingItemModel | null>;

const HostPayoutBookingItem = HostPayoutBookingItemModel as HostPayoutBookingItemWithHelpers;

HostPayoutBookingItem.find = (filter = {}) =>
    buildDocumentQuery<HostPayoutBookingItemModel, HostPayoutBookingItemRecord>(
        HostPayoutBookingItemModel,
        filter,
    );

HostPayoutBookingItem.findOne = (
    options?: FindOptions | SimpleFilter<HostPayoutBookingItemRecord>,
) => {
    if (!options || isFindOptions(options)) {
        return defaultPayoutItemFindOne(options);
    }

    return findOneByFilter<HostPayoutBookingItemModel, HostPayoutBookingItemRecord>(
        { findOne: defaultPayoutItemFindOne },
        options,
    );
};

HostPayoutBookingItem.countDocuments = (filter = {}) =>
    countDocumentsByFilter<HostPayoutBookingItemModel, HostPayoutBookingItemRecord>(
        HostPayoutBookingItemModel,
        filter,
    );

export default HostPayoutBookingItem;
