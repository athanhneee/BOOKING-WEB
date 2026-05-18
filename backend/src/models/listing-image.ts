import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
} from "sequelize";

import sequelize from "../config/database";

class ListingImageModel extends Model<
    InferAttributes<ListingImageModel>,
    InferCreationAttributes<ListingImageModel>
> {
    declare id: CreationOptional<number>;
    declare listingId: number;
    declare url: string;
    declare caption: string | null;
    declare sortOrder: number;
    declare isCover: boolean;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

ListingImageModel.init(
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        listingId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: "listing_id",
        },
        url: {
            type: DataTypes.STRING(1024),
            allowNull: false,
        },
        caption: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        sortOrder: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
            field: "sort_order",
        },
        isCover: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "is_cover",
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: "listing_images",
        underscored: true,
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["listing_id", "sort_order"],
            },
            {
                fields: ["listing_id"],
            },
        ],
    },
);

export type ListingImageDocument = ListingImageModel;
export default ListingImageModel;
