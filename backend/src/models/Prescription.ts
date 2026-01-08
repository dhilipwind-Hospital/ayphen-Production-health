import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Patient from './Patient';
import PrescriptionItem from './PrescriptionItem';

class Prescription extends Model {
  public id!: string;
  public patientId!: string;
  public doctorId!: string;
  public diagnosis!: string;
  public notes?: string;
  public prescriptionDate!: Date;
  public status!: 'pending' | 'dispensed' | 'partially_dispensed' | 'cancelled';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Prescription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id',
      },
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    prescriptionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'dispensed', 'partially_dispensed', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'prescriptions',
    modelName: 'Prescription',
  }
);

// Define associations
Prescription.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });
Prescription.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Prescription.hasMany(PrescriptionItem, { foreignKey: 'prescriptionId', as: 'items' });

export default Prescription;
