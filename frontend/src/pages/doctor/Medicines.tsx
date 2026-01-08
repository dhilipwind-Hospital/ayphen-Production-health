import React, { useState } from 'react';
import { Card, Tabs, Modal, Descriptions, Button } from 'antd';
import { MedicineBoxOutlined, FileTextOutlined } from '@ant-design/icons';
import MedicineList from './MedicineList';

const { TabPane } = Tabs;

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brandName: string;
  category: string;
  dosageForm: string;
  strength: string;
  currentStock: number;
  reorderLevel: number;
  description?: string;
  sideEffects?: string;
  contraindications?: string;
}

const DoctorMedicines: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  const handleViewMedicine = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setViewModalVisible(true);
  };

  return (
    <div className="doctor-medicines">
      <Card
        title="Hospital Formulary"
        extra={
          <Button 
            type="primary" 
            icon={<FileTextOutlined />} 
            onClick={() => window.open('/doctor/prescriptions/new', '_blank')}
          >
            Write Prescription
          </Button>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={<span><MedicineBoxOutlined /> All Medicines</span>} 
            key="all"
          >
            <MedicineList onSelectMedicine={handleViewMedicine} />
          </TabPane>
        </Tabs>
      </Card>

      {/* Medicine Details Modal */}
      <Modal
        title="Medicine Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="prescribe" 
            type="primary" 
            onClick={() => {
              setViewModalVisible(false);
              window.open(`/doctor/prescriptions/new?medicineId=${selectedMedicine?.id}`, '_blank');
            }}
          >
            Prescribe This Medicine
          </Button>
        ]}
        width={700}
      >
        {selectedMedicine && (
          <div>
            <h2>{selectedMedicine.name}</h2>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Generic Name">{selectedMedicine.genericName}</Descriptions.Item>
              <Descriptions.Item label="Brand Name">{selectedMedicine.brandName}</Descriptions.Item>
              <Descriptions.Item label="Category">{selectedMedicine.category}</Descriptions.Item>
              <Descriptions.Item label="Dosage Form">{selectedMedicine.dosageForm}</Descriptions.Item>
              <Descriptions.Item label="Strength">{selectedMedicine.strength}</Descriptions.Item>
              <Descriptions.Item label="Current Stock">{selectedMedicine.currentStock}</Descriptions.Item>
            </Descriptions>

            <h3 style={{ marginTop: 16 }}>Clinical Information</h3>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Description">{selectedMedicine.description || 'No description available'}</Descriptions.Item>
              <Descriptions.Item label="Side Effects">{selectedMedicine.sideEffects || 'No side effects listed'}</Descriptions.Item>
              <Descriptions.Item label="Contraindications">{selectedMedicine.contraindications || 'No contraindications listed'}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <h3>Common Dosing Guidelines</h3>
              <p>
                {selectedMedicine.category === 'Analgesic' && 'For pain relief: 1-2 tablets every 4-6 hours as needed. Maximum 8 tablets in 24 hours.'}
                {selectedMedicine.category === 'Antibiotic' && 'For bacterial infections: 1 capsule every 8 hours for 7-10 days. Complete the full course.'}
                {selectedMedicine.category === 'Antidiabetic' && 'For type 2 diabetes: 1 tablet twice daily with meals.'}
                {selectedMedicine.category === 'Statin' && 'For cholesterol management: 1 tablet daily, preferably in the evening.'}
                {selectedMedicine.category === 'Bronchodilator' && 'For asthma/COPD: 1-2 inhalations every 4-6 hours as needed.'}
                {selectedMedicine.category === 'ACE Inhibitor' && 'For hypertension: 1 tablet daily, preferably at the same time each day.'}
                {selectedMedicine.category === 'Proton Pump Inhibitor' && 'For acid reflux: 1 capsule daily before breakfast.'}
                {selectedMedicine.category === 'Calcium Channel Blocker' && 'For hypertension: 1 tablet daily.'}
                {selectedMedicine.category === 'SSRI' && 'For depression/anxiety: 1 tablet daily, preferably in the morning.'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorMedicines;
