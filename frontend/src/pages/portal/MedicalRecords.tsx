import React, { useEffect, useMemo, useState } from 'react';
import { Table, Tag, Typography, Card, Alert, Spin, Button, DatePicker, Select, Input, Space, message, Modal, Upload, Tooltip } from 'antd';
import { DownloadOutlined, UploadOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import medicalRecordsService from '../../services/medicalRecords.service';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;

interface MedicalRecord {
  id: string;
  title: string;
  type: string;
  description?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  fileUrl?: string;
  recordDate: string;
  doctor?: { firstName: string; lastName: string };
  patient?: { firstName: string; lastName: string };
  source?: string;
  status?: string;
  prescriptionItems?: PrescriptionItem[];
}

interface PrescriptionItem {
  id: string;
  medicine: {
    name: string;
    strength: string;
    dosageForm: string;
  };
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
}

const MedicalRecords: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [range, setRange] = useState<[string | undefined, string | undefined]>([undefined, undefined]);
  const [type, setType] = useState<string>('all');
  const [q, setQ] = useState<string>('');
  const [msgApi, msgCtx] = message.useMessage();
  const [viewRec, setViewRec] = useState<MedicalRecord | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const load = async (opts?: { page?: number }) => {
    setLoading(true);
    setError(null);
    try {
      // Use aggregated records endpoint - combines medical records, prescriptions, and lab orders
      const response = await medicalRecordsService.getAggregatedRecords(user?.id);
      let items = response.data || [];
      
      // Apply filters
      if (type && type !== 'all') {
        items = items.filter((item: any) => item.type === type);
      }
      
      if (q) {
        const searchLower = q.toLowerCase();
        items = items.filter((item: any) => 
          item.title?.toLowerCase().includes(searchLower)
        );
      }
      
      if (range[0] && range[1]) {
        const startDate = dayjs(range[0]);
        const endDate = dayjs(range[1]);
        items = items.filter((item: any) => {
          const itemDate = dayjs(item.date);
          return itemDate.isAfter(startDate) && itemDate.isBefore(endDate);
        });
      }
      
      // Sort by date descending
      items.sort((a: any, b: any) => dayjs(b.date).unix() - dayjs(a.date).unix());
      
      // Map to component format
      const mappedItems = items.map((item: any) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        recordDate: item.date,
        doctor: item.doctor ? { firstName: item.doctor.split(' ')[1] || '', lastName: item.doctor.split(' ')[2] || '' } : undefined,
        patient: item.patient ? { firstName: item.patient.split(' ')[0] || '', lastName: item.patient.split(' ')[1] || '' } : undefined,
        hasFile: item.hasFile,
        source: item.source
      }));
      
      setData(mappedItems);
      setTotal(mappedItems.length);
      if (opts?.page) setPage(opts.page);
    } catch (e: any) {
      console.error('Error loading medical records:', e);
      setError(e?.response?.data?.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load({ page: 1 }); }, []);

  const fetchPrescriptionDetails = async (prescriptionId: string) => {
    try {
      setLoadingDetails(true);
      const response = await medicalRecordsService.getPrescriptionDetails(prescriptionId);
      return response.data;
    } catch (error) {
      console.error('Error fetching prescription details:', error);
      message.error('Failed to load prescription details');
      return null;
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewRecord = async (record: MedicalRecord) => {
    if (record.type === 'prescription' && record.source === 'prescription') {
      // Fetch full prescription details
      const details = await fetchPrescriptionDetails(record.id);
      if (details) {
        setViewRec({
          ...record,
          prescriptionItems: details.items,
          diagnosis: details.diagnosis,
          medications: details.notes
        });
      } else {
        setViewRec(record);
      }
    } else {
      setViewRec(record);
    }
  };

  const columns: ColumnsType<MedicalRecord> = [
    {
      title: 'Date',
      dataIndex: 'recordDate',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.recordDate).unix() - dayjs(b.recordDate).unix(),
      defaultSortOrder: 'descend',
      width: 120
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_: any, record: MedicalRecord) => 
        record.patient ? `${record.patient.firstName} ${record.patient.lastName}` : user?.role === 'patient' ? 'You' : '—',
      width: 150
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="blue">{type.replace('_', ' ').toUpperCase()}</Tag>
      ),
      width: 120
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (_: any, record: MedicalRecord) => 
        record.doctor ? `Dr. ${record.doctor.firstName} ${record.doctor.lastName}` : '—',
      width: 180
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: MedicalRecord) => (
        <Space>
          <Button size="small" onClick={() => handleViewRecord(record)}>View</Button>
          <Tooltip title={record.fileUrl ? 'Download attachment' : 'No file attached to this record'}>
            <Button 
              size="small" 
              icon={<DownloadOutlined />}
              disabled={!record.fileUrl}
              onClick={() => record.fileUrl && window.open(record.fileUrl, '_blank')}
            >
              Download
            </Button>
          </Tooltip>
        </Space>
      ),
      width: 180
    }
  ];

  const typeOptions = useMemo(() => [
    { value: 'all', label: 'All types' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'lab_report', label: 'Lab Report' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'discharge_summary', label: 'Discharge Summary' },
    { value: 'imaging', label: 'Imaging' }
  ], []);

  const exportCsv = () => {
    const rows = [
      ['Date','Title','Type','Doctor','Description'],
      ...data.map((r) => [
        dayjs(r.recordDate).format('YYYY-MM-DD'),
        r.title,
        r.type,
        r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : '',
        (r.description || '').replace(/\s+/g,' ').slice(0, 300)
      ])
    ];
    const csv = rows.map(r => r.map(v => String(v ?? '').replace(/"/g,'""')).map(v => `"${v}`+`"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medical_records.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Spin size="large" />;
  if (error) return <Alert type="error" message={error} showIcon />;

  return (
    <div>
      {msgCtx}
      <Title level={2}>Medical Records</Title>
      <Card className="print-scope-records">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Input.Search
            placeholder="Search title/description/diagnosis"
            allowClear
            onSearch={(val) => { setQ(val); load({ page: 1 }); }}
            style={{ maxWidth: 320 }}
          />
          <Select
            options={typeOptions}
            value={type}
            onChange={(v) => { setType(v); load({ page: 1 }); }}
            style={{ width: 200 }}
          />
          <DatePicker.RangePicker
            onChange={(vals) => {
              const start = vals?.[0]?.toDate?.()?.toISOString?.();
              const end = vals?.[1]?.toDate?.()?.toISOString?.();
              setRange([start, end]);
              load({ page: 1 });
            }}
          />
          <Button onClick={() => load({ page: 1 })}>Refresh</Button>
          <Button onClick={exportCsv}>Export CSV</Button>
          <Button onClick={() => window.print()}>Print</Button>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{ current: page, pageSize, total, showSizeChanger: false }}
          onChange={(p) => load({ page: p.current || 1 })}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ margin: 0 }}>
                {record.description && <p><strong>Description:</strong> {record.description}</p>}
                {record.diagnosis && <p><strong>Diagnosis:</strong> {record.diagnosis}</p>}
                {record.treatment && <p><strong>Treatment:</strong> {record.treatment}</p>}
                {record.medications && <p><strong>Medications:</strong> {record.medications}</p>}
              </div>
            ),
            rowExpandable: (record) => !!(record.description || record.diagnosis || record.treatment || record.medications)
          }}
        />
        <Modal
          open={!!viewRec}
          title={viewRec ? viewRec.title : ''}
          onCancel={() => setViewRec(null)}
          footer={
            <Button 
              type="primary" 
              onClick={() => setViewRec(null)}
              style={{ background: '#EC407A', borderColor: '#EC407A' }}
            >
              Close
            </Button>
          }
        >
          {viewRec && (
            <div>
              {viewRec.patient && (
                <p><strong>Patient:</strong> {viewRec.patient.firstName} {viewRec.patient.lastName}</p>
              )}
              <p><strong>Date:</strong> {dayjs(viewRec.recordDate).format('MMM DD, YYYY')}</p>
              <p><strong>Type:</strong> {String(viewRec.type).replace('_',' ').toUpperCase()}</p>
              <p><strong>Doctor:</strong> {viewRec.doctor ? `Dr. ${viewRec.doctor.firstName} ${viewRec.doctor.lastName}` : '—'}</p>
              {viewRec.status && (
                <p>
                  <strong>Status:</strong>{' '}
                  <Tag color={
                    viewRec.status === 'dispensed' ? 'green' :
                    viewRec.status === 'partially_dispensed' ? 'orange' :
                    viewRec.status === 'cancelled' ? 'red' : 'blue'
                  }>
                    {String(viewRec.status).replace('_', ' ').toUpperCase()}
                  </Tag>
                </p>
              )}
              {viewRec.description && <p><strong>Description:</strong> {viewRec.description}</p>}
              {viewRec.diagnosis && <p><strong>Diagnosis:</strong> {viewRec.diagnosis}</p>}
              {viewRec.treatment && <p><strong>Treatment:</strong> {viewRec.treatment}</p>}
              {viewRec.medications && !viewRec.prescriptionItems && <p><strong>Medications:</strong> {viewRec.medications}</p>}
              
              {/* Display prescription items if available */}
              {viewRec.prescriptionItems && viewRec.prescriptionItems.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ marginBottom: 12 }}>Medications:</h4>
                  {viewRec.prescriptionItems.map((item, index) => (
                    <Card 
                      key={item.id} 
                      size="small" 
                      style={{ marginBottom: 12, background: '#f5f5f5' }}
                    >
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>
                        {index + 1}. {item.medicine.name} {item.medicine.strength} ({item.medicine.dosageForm})
                      </p>
                      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <p style={{ margin: 0 }}><strong>Dosage:</strong> {item.dosage}</p>
                        <p style={{ margin: 0 }}><strong>Frequency:</strong> {item.frequency}</p>
                        <p style={{ margin: 0 }}><strong>Duration:</strong> {item.duration}</p>
                        <p style={{ margin: 0 }}><strong>Quantity:</strong> {item.quantity}</p>
                      </div>
                      {item.instructions && (
                        <p style={{ margin: '8px 0 0 0', fontStyle: 'italic', color: '#666' }}>
                          <strong>Instructions:</strong> {item.instructions}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
              
              <div style={{ marginTop: 16 }}>
                {viewRec.fileUrl ? (
                  <Button 
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => window.open(viewRec.fileUrl!, '_blank')}
                    style={{ background: '#EC407A', borderColor: '#EC407A' }}
                  >
                    Download Attachment
                  </Button>
                ) : viewRec.type !== 'prescription' && (
                  <Alert 
                    message="No attachment available for this record" 
                    type="info" 
                    showIcon 
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default MedicalRecords;
