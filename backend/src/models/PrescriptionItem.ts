import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Prescription from './Prescription';
import Medicine from './Medicine';

class PrescriptionItem extends Model {
  public id!: string;
  public prescriptionId!: string;
  public medicineId!: string;
  public dosage!: string;
  public frequency!: string;
  public duration!: string;
  public quantity!: number;
  public instructions?: string;
  public status!: 'pending' | 'dispensed' | 'out_of_stock' | 'cancelled';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PrescriptionItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    prescriptionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'prescriptions',
        key: 'id',
      },
    },
    medicineId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'medicines',
        key: 'id',
      },
    },
    dosage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    frequency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    instructions: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM('pending', 'dispensed', 'out_of_stock', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'prescription_items',
    modelName: 'PrescriptionItem',
  }
);

// Define associations
PrescriptionItem.belongsTo(Prescription, { foreignKey: 'prescriptionId' });
PrescriptionItem.belongsTo(Medicine, { foreignKey: 'medicineId', as: 'medicine' });

export default PrescriptionItem;
