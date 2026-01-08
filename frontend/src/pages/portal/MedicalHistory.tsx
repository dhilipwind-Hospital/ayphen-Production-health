import React, { useState, useEffect } from 'react';
import { Card, Timeline, Tabs, Tag, Empty, Spin, Alert, Descriptions, Button } from 'antd';
import { FileTextOutlined, MedicineBoxOutlined, HeartOutlined, WarningOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import dayjs from 'dayjs';
import styled from 'styled-components';

const MedicalHistory: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [vitalSigns, setVitalSigns] = useState<any[]>([]);
  const [allergies, setAllergies] = useState<any[]>([]);

  useEffect(() => {
    loadMedicalHistory();
  }, []);

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);
      const patientId = user?.id;

      // Load all medical data in parallel
      const [consultRes, diagnosisRes, vitalRes, allergyRes] = await Promise.allSettled([
        api.get(`/consultations/patient/${patientId}`),
        api.get(`/diagnoses/patient/${patientId}`),
        api.get(`/vital-signs/patient/${patientId}`),
        api.get(`/allergies/patient/${patientId}`)
      ]);

      if (consultRes.status === 'fulfilled') {
        setConsultations(consultRes.value.data?.data || []);
      }
      if (diagnosisRes.status === 'fulfilled') {
        setDiagnoses(diagnosisRes.value.data?.data || []);
      }
      if (vitalRes.status === 'fulfilled') {
        setVitalSigns(vitalRes.value.data?.data || []);
      }
      if (allergyRes.status === 'fulfilled') {
        setAllergies(allergyRes.value.data?.data || []);
      }
    } catch (error) {
      console.error('Error loading medical history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: any = {
      life_threatening: 'red',
      severe: 'orange',
      moderate: 'gold',
      mild: 'green'
    };
    return colors[severity] || 'default';
  };

  const renderAllergies = () => {
    if (allergies.length === 0) {
      return <Empty description="No allergies recorded" />;
    }

    const activeAllergies = allergies.filter(a => a.isActive);
    const criticalAllergies = activeAllergies.filter(
      a => a.reactionSeverity === 'life_threatening' || a.reactionSeverity === 'severe'
    );

    return (
      <>
        {criticalAllergies.length > 0 && (
          <Alert
            message="Critical Allergies"
            description={
              <div>
                {criticalAllergies.map(allergy => (
                  <div key={allergy.id} style={{ marginTop: 8 }}>
                    <Tag color="red">{allergy.allergenName}</Tag>
                    <span>{allergy.reactionDescription}</span>
                  </div>
                ))}
              </div>
            }
            type="error"
            icon={<WarningOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        {activeAllergies.map(allergy => (
          <AllergyCard key={allergy.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h4 style={{ margin: 0 }}>
                  {allergy.allergenName}
                  <Tag color={getSeverityColor(allergy.reactionSeverity)} style={{ marginLeft: 8 }}>
                    {allergy.reactionSeverity.replace('_', ' ').toUpperCase()}
                  </Tag>
                </h4>
                <p style={{ color: '#666', margin: '4px 0' }}>
                  Type: {allergy.allergenType}
                </p>
                {allergy.reactionDescription && (
                  <p style={{ margin: '8px 0' }}>{allergy.reactionDescription}</p>
                )}
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: '#999' }}>
                {allergy.dateIdentified && (
                  <div>Identified: {dayjs(allergy.dateIdentified).format('MMM DD, YYYY')}</div>
                )}
                {allergy.verifiedBy && (
                  <div>Verified by: Dr. {allergy.verifiedBy.firstName}</div>
                )}
              </div>
            </div>
          </AllergyCard>
        ))}
      </>
    );
  };

  const renderConsultations = () => {
    if (consultations.length === 0) {
      return <Empty description="No consultations recorded" />;
    }

    return (
      <Timeline mode="left">
        {consultations.map(consultation => (
          <Timeline.Item
            key={consultation.id}
            color="blue"
            label={dayjs(consultation.createdAt).format('MMM DD, YYYY')}
          >
            <ConsultationCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: 0 }}>
                    <FileTextOutlined /> Consultation
                  </h4>
                  <p style={{ color: '#666', margin: '4px 0' }}>
                    Dr. {consultation.doctor?.firstName} {consultation.doctor?.lastName}
                  </p>
                </div>
                {consultation.isSigned && (
                  <Tag color="green">Signed</Tag>
                )}
              </div>

              {consultation.chiefComplaint && (
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Chief Complaint">
                    {consultation.chiefComplaint}
                  </Descriptions.Item>
                </Descriptions>
              )}

              {consultation.assessment && (
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Assessment">
                    {consultation.assessment}
                  </Descriptions.Item>
                </Descriptions>
              )}

              {consultation.plan && (
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Plan">
                    {consultation.plan}
                  </Descriptions.Item>
                </Descriptions>
              )}

              {consultation.followUpDate && (
                <div style={{ marginTop: 8, color: '#1890ff' }}>
                  Follow-up: {dayjs(consultation.followUpDate).format('MMM DD, YYYY')}
                </div>
              )}
            </ConsultationCard>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  const renderDiagnoses = () => {
    if (diagnoses.length === 0) {
      return <Empty description="No diagnoses recorded" />;
    }

    const activeDiagnoses = diagnoses.filter(d => !d.resolvedDate);
    const chronicDiagnoses = diagnoses.filter(d => d.isChronic);

    return (
      <>
        {chronicDiagnoses.length > 0 && (
          <Alert
            message="Chronic Conditions"
            description={
              <div>
                {chronicDiagnoses.map(diagnosis => (
                  <Tag key={diagnosis.id} color="orange" style={{ marginTop: 4 }}>
                    {diagnosis.diagnosisName}
                  </Tag>
                ))}
              </div>
            }
            type="warning"
            style={{ marginBottom: 16 }}
          />
        )}

        <Timeline>
          {diagnoses.map(diagnosis => (
            <Timeline.Item
              key={diagnosis.id}
              color={diagnosis.isChronic ? 'orange' : 'blue'}
            >
              <DiagnosisCard>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>
                      {diagnosis.diagnosisName}
                      {diagnosis.icd10Code && (
                        <Tag style={{ marginLeft: 8 }}>{diagnosis.icd10Code}</Tag>
                      )}
                    </h4>
                    <p style={{ color: '#666', margin: '4px 0' }}>
                      Dr. {diagnosis.diagnosedBy?.firstName} {diagnosis.diagnosedBy?.lastName}
                    </p>
                    <div style={{ marginTop: 8 }}>
                      <Tag color={diagnosis.diagnosisType === 'primary' ? 'blue' : 'default'}>
                        {diagnosis.diagnosisType}
                      </Tag>
                      <Tag>{diagnosis.status}</Tag>
                      {diagnosis.severity && <Tag>{diagnosis.severity}</Tag>}
                      {diagnosis.isChronic && <Tag color="orange">Chronic</Tag>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#999' }}>
                    {dayjs(diagnosis.createdAt).format('MMM DD, YYYY')}
                  </div>
                </div>
                {diagnosis.notes && (
                  <p style={{ marginTop: 12, color: '#666' }}>{diagnosis.notes}</p>
                )}
              </DiagnosisCard>
            </Timeline.Item>
          ))}
        </Timeline>
      </>
    );
  };

  const renderVitalSigns = () => {
    if (vitalSigns.length === 0) {
      return <Empty description="No vital signs recorded" />;
    }

    return (
      <Timeline>
        {vitalSigns.slice(0, 10).map(vital => (
          <Timeline.Item
            key={vital.id}
            color="green"
            label={dayjs(vital.recordedAt).format('MMM DD, YYYY HH:mm')}
          >
            <VitalCard>
              <Descriptions column={2} size="small">
                {vital.systolicBp && vital.diastolicBp && (
                  <Descriptions.Item label="Blood Pressure">
                    {vital.systolicBp}/{vital.diastolicBp} mmHg
                  </Descriptions.Item>
                )}
                {vital.heartRate && (
                  <Descriptions.Item label="Heart Rate">
                    {vital.heartRate} bpm
                  </Descriptions.Item>
                )}
                {vital.temperature && (
                  <Descriptions.Item label="Temperature">
                    {vital.temperature}°{vital.temperatureUnit}
                  </Descriptions.Item>
                )}
                {vital.oxygenSaturation && (
                  <Descriptions.Item label="SpO2">
                    {vital.oxygenSaturation}%
                  </Descriptions.Item>
                )}
                {vital.weight && (
                  <Descriptions.Item label="Weight">
                    {vital.weight} {vital.weightUnit}
                  </Descriptions.Item>
                )}
                {vital.bmi && (
                  <Descriptions.Item label="BMI">
                    {vital.bmi}
                  </Descriptions.Item>
                )}
              </Descriptions>
              <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                Recorded by: {vital.recordedBy?.firstName} {vital.recordedBy?.lastName}
              </p>
            </VitalCard>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  const items = [
    {
      key: 'allergies',
      label: (
        <span>
          <WarningOutlined /> Allergies ({allergies.filter(a => a.isActive).length})
        </span>
      ),
      children: renderAllergies()
    },
    {
      key: 'consultations',
      label: (
        <span>
          <FileTextOutlined /> Consultations ({consultations.length})
        </span>
      ),
      children: renderConsultations()
    },
    {
      key: 'diagnoses',
      label: (
        <span>
          <MedicineBoxOutlined /> Diagnoses ({diagnoses.length})
        </span>
      ),
      children: renderDiagnoses()
    },
    {
      key: 'vitals',
      label: (
        <span>
          <HeartOutlined /> Vital Signs ({vitalSigns.length})
        </span>
      ),
      children: renderVitalSigns()
    }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card title="My Medical History">
        <Tabs defaultActiveKey="allergies" items={items} />
      </Card>
    </div>
  );
};

export default MedicalHistory;

// Styled Components
const AllergyCard = styled.div`
  background: #fff1f0;
  border: 1px solid #ffa39e;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const ConsultationCard = styled.div`
  background: #f0f5ff;
  border: 1px solid #adc6ff;
  border-radius: 8px;
  padding: 16px;
`;

const DiagnosisCard = styled.div`
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  padding: 16px;
`;

const VitalCard = styled.div`
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
  padding: 16px;
`;
