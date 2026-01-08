import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Descriptions, Modal, Empty } from 'antd';
import { FileTextOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../../services/api';
import styled from 'styled-components';

const Container = styled.div`
  padding: 24px;
`;

interface LabResult {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  doctorName: string;
  testName: string;
  testCode: string;
  result: {
    id: string;
    resultValue: string;
    units: string;
    referenceRange: string;
    interpretation: string;
    flag: string;
    resultTime: string;
    isVerified: boolean;
    comments: string;
  };
}

const PatientLabResults: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LabResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      // Get current user's patient ID
      const userResponse = await api.get('/auth/me');
      const patientId = userResponse.data.id;

      const response = await api.get(`/lab/results/patient/${patientId}`);
      console.log('Patient lab results:', response.data);
      setResults(response.data || []);
    } catch (error) {
      console.error('Error fetching lab results:', error);
      // Fallback demo data
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getFlagColor = (flag: string) => {
    const colors: Record<string, string> = {
      normal: 'green',
      abnormal: 'orange',
      critical: 'red'
    };
    return colors[flag] || 'default';
  };

  const viewDetails = (result: LabResult) => {
    setSelectedResult(result);
    setModalVisible(true);
  };

  const downloadReport = (result: LabResult) => {
    // TODO: Implement PDF download
    console.log('Download report for:', result);
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: LabResult, b: LabResult) => 
        new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    },
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber'
    },
    {
      title: 'Test',
      dataIndex: 'testName',
      key: 'testName',
      render: (text: string, record: LabResult) => (
        <>
          {text}
          <br />
          <small style={{ color: '#888' }}>{record.testCode}</small>
        </>
      )
    },
    {
      title: 'Result',
      key: 'result',
      render: (_: any, record: LabResult) => (
        <>
          <strong>{record.result.resultValue}</strong> {record.result.units}
        </>
      )
    },
    {
      title: 'Reference Range',
      key: 'referenceRange',
      render: (_: any, record: LabResult) => record.result.referenceRange || 'N/A'
    },
    {
      title: 'Status',
      key: 'flag',
      render: (_: any, record: LabResult) => (
        <Tag color={getFlagColor(record.result.flag)}>
          {record.result.flag.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Verified',
      key: 'verified',
      render: (_: any, record: LabResult) => (
        record.result.isVerified ? 
          <Tag color="green">✓ Verified</Tag> : 
          <Tag color="orange">Pending</Tag>
      )
    },
    {
      title: 'Doctor',
      dataIndex: 'doctorName',
      key: 'doctorName'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: LabResult) => (
        <>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => viewDetails(record)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => downloadReport(record)}
          >
            Download
          </Button>
        </>
      )
    }
  ];

  return (
    <Container>
      <h1>📋 My Lab Results</h1>

      <Card>
        {results.length === 0 && !loading ? (
          <Empty description="No lab results found" />
        ) : (
          <Table
            columns={columns}
            dataSource={results}
            rowKey={(record) => `${record.orderId}-${record.result.id}`}
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <Modal
        title="Lab Result Details"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={() => selectedResult && downloadReport(selectedResult)}>
            Download PDF
          </Button>,
          <Button key="close" type="primary" onClick={() => setModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedResult && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Order Number" span={2}>
                {selectedResult.orderNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Order Date">
                {new Date(selectedResult.orderDate).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Result Date">
                {new Date(selectedResult.result.resultTime).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Ordered By" span={2}>
                Dr. {selectedResult.doctorName}
              </Descriptions.Item>
              <Descriptions.Item label="Test Name" span={2}>
                {selectedResult.testName} ({selectedResult.testCode})
              </Descriptions.Item>
              <Descriptions.Item label="Result" span={2}>
                <strong style={{ fontSize: '18px' }}>
                  {selectedResult.result.resultValue} {selectedResult.result.units}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Reference Range" span={2}>
                {selectedResult.result.referenceRange}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag color={getFlagColor(selectedResult.result.flag)} style={{ fontSize: '14px' }}>
                  {selectedResult.result.flag.toUpperCase()}
                </Tag>
                {selectedResult.result.isVerified && (
                  <Tag color="green" style={{ fontSize: '14px', marginLeft: 8 }}>
                    ✓ VERIFIED
                  </Tag>
                )}
              </Descriptions.Item>
              {selectedResult.result.interpretation && (
                <Descriptions.Item label="Interpretation" span={2}>
                  {selectedResult.result.interpretation}
                </Descriptions.Item>
              )}
              {selectedResult.result.comments && (
                <Descriptions.Item label="Comments" span={2}>
                  {selectedResult.result.comments}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedResult.result.flag === 'critical' && (
              <div style={{ 
                marginTop: 16, 
                padding: 16, 
                background: '#fff2e8', 
                border: '1px solid #ffbb96',
                borderRadius: 4
              }}>
                <strong style={{ color: '#ff4d4f' }}>⚠️ Critical Result</strong>
                <p>This result requires immediate medical attention. Please contact your doctor.</p>
              </div>
            )}
          </>
        )}
      </Modal>
    </Container>
  );
};

export default PatientLabResults;
