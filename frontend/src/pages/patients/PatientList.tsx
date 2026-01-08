import React, { useState, useEffect } from 'react';
import type { TablePaginationConfig } from 'antd/es/table';
import type { SorterResult, ColumnsType, TableCurrentDataSource } from 'antd/es/table/interface';
import type { FilterValue } from 'antd/es/table/interface';
import { 
  Table, 
  Button, 
  Space, 
  Input, 
  Card, 
  Typography, 
  Tag, 
  Badge, 
  Avatar, 
  Select, 
  Row, 
  Col, 
  Dropdown, 
  Modal,
  Form,
  DatePicker,
  message
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined, 
  FilterOutlined, 
  DownloadOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Patient } from '../../types/patient';
import patientService from '../../services/patientService';
import { debounce } from 'lodash';

const { Title, Text } = Typography;
const { Search } = Input;

const PatientListContainer = styled.div`
  .patient-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .search-box {
    width: 300px;
  }
`;

type PatientFilters = {
  status?: string[];
  gender?: string; // single selection
  bloodGroup?: string; // single selection
  [key: string]: string[] | string | undefined;
};

interface FetchParams {
  pagination?: { current: number; pageSize: number };
  filters?: PatientFilters;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  searchText?: string;
}

interface PatientListState {
  data: Patient[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  loading: boolean;
  searchText: string;
  filters: {
    status?: string[];
    gender?: string;
    bloodGroup?: string;
  };
  selectedRowKeys: React.Key[];
}

const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [state, setState] = useState<PatientListState>({
    data: [],
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    loading: false,
    searchText: '',
    filters: {
      status: [] as string[],
      gender: undefined,
      bloodGroup: undefined,
    },
    selectedRowKeys: [],
  });

  const navigate = useNavigate();

  const fetchPatients = async (params: FetchParams = {}) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const { pagination, filters, searchText } = state;
      
      const response = await patientService.getPatients({
        page: params.pagination?.current || pagination.current,
        limit: params.pagination?.pageSize || pagination.pageSize,
        search: params.searchText !== undefined ? params.searchText : searchText,
        ...(params.filters || filters),
        sortBy: params.sortField,
        sortOrder: params.sortOrder,
      });

      setState(prev => ({
        ...prev,
        loading: false,
        data: response.data,
        pagination: {
          ...prev.pagination,
          total: response.pagination.total,
          current: response.pagination.page,
          pageSize: response.pagination.limit,
        },
        ...(params.filters && { filters: params.filters }),
        ...(params.searchText !== undefined && { searchText: params.searchText }),
      }));
    } catch (error) {
      console.error('Error fetching patients:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // Debounced search
  const debouncedSearch = debounce((value: string) => {
    fetchPatients({ 
      searchText: value,
      pagination: { ...state.pagination, current: 1 },
    });
  }, 500);

  useEffect(() => {
    fetchPatients();
  }, []);

  // Search handler is now using debouncedSearch directly in the Search component

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Patient> | SorterResult<Patient>[],
    _extra: TableCurrentDataSource<Patient>
  ) => {
    const nextPagination = {
      current: pagination.current ?? state.pagination.current,
      pageSize: pagination.pageSize ?? state.pagination.pageSize,
    };

    const nextFilters: PatientFilters = {
      ...state.filters,
      status: (filters.status as string[] | null) ?? state.filters.status,
      gender: ((filters.gender as string[] | null)?.[0]) ?? state.filters.gender,
      bloodGroup: ((filters.bloodGroup as string[] | null)?.[0]) ?? state.filters.bloodGroup,
    };

    fetchPatients({
      pagination: nextPagination,
      filters: nextFilters,
      sortField: Array.isArray(sorter) || !sorter.field ? undefined : String(sorter.field),
      sortOrder: Array.isArray(sorter) || !sorter.order ? undefined : sorter.order === 'ascend' ? 'asc' : 'desc',
    });
  };

  const handleStatusFilter = (status: string) => {
    const newFilters = { 
      ...state.filters, 
      status: status === 'all' ? undefined : [status] 
    };
    
    if (status === 'all') {
      const { status: _omit, ...rest } = newFilters;
      fetchPatients({ filters: rest, pagination: { ...state.pagination, current: 1 } });
      return;
    }
    fetchPatients({ filters: newFilters, pagination: { ...state.pagination, current: 1 } });
  };

  const confirmDelete = async (id: string) => {
    try {
      await patientService.deletePatient(id);
      message.success('Patient deleted successfully');
      fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await patientService.bulkDeletePatients(state.selectedRowKeys as string[]);
      message.success('Selected patients deleted successfully');
      setState(prev => ({ ...prev, selectedRowKeys: [] }));
      fetchPatients();
    } catch (error) {
      console.error('Error deleting patients:', error);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const blob = await patientService.exportPatients(format, state.filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patients_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting patients:', error);
    }
  };

  const columns: ColumnsType<Patient> = [
    {
      title: 'Patient',
      dataIndex: 'firstName',
      key: 'name',
      sorter: true,
      render: (_: any, record: Patient) => (
        <Space 
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/patients/${record.id}`)}
        >
          <Avatar icon={<UserOutlined />} />
          <span style={{ color: '#1890ff' }}>{record.firstName} {record.lastName}</span>
        </Space>
      ),
    },
    {
      title: 'Contact',
      dataIndex: 'email',
      key: 'email',
      render: (email: string | undefined, record: Patient) => (
        <div>
          <div>{email || '—'}</div>
          <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{record.phone || '—'}</span>
        </div>
      ),
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      filters: [
        { text: 'Male', value: 'male' },
        { text: 'Female', value: 'female' },
        { text: 'Other', value: 'other' },
      ],
      filteredValue: state.filters.gender ? [state.filters.gender] : [],
    },
    {
      title: 'Blood Group',
      dataIndex: 'bloodGroup',
      key: 'bloodGroup',
      filters: [
        { text: 'A+', value: 'A+' },
        { text: 'A-', value: 'A-' },
        { text: 'B+', value: 'B+' },
        { text: 'B-', value: 'B-' },
        { text: 'AB+', value: 'AB+' },
        { text: 'AB-', value: 'AB-' },
        { text: 'O+', value: 'O+' },
        { text: 'O-', value: 'O-' },
      ],
      filteredValue: state.filters.bloodGroup ? [state.filters.bloodGroup] : [],
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string | undefined) => {
        const s = (status || 'unknown').toString().toLowerCase();
        const color = s === 'active' ? 'green' : s === 'inactive' ? 'red' : 'default';
        return (
          <Tag color={color}>
            {s.toUpperCase()}
          </Tag>
        );
      },
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      filteredValue: state.filters.status ?? [],
    },
    {
      title: 'Last Visit',
      dataIndex: 'lastVisit',
      key: 'lastVisit',
      sorter: true,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Patient) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', icon: <UserOutlined />, label: 'View Details', onClick: () => navigate(`/patients/${record.id}`) },
              { key: 'edit', icon: <EditOutlined />, label: 'Edit', onClick: () => navigate(`/patients/${record.id}/edit`) },
              { type: 'divider' as const },
              { key: 'delete', danger: true, icon: <DeleteOutlined />, label: 'Delete', onClick: () => {
                  Modal.confirm({
                    title: 'Delete Patient',
                    content: `Are you sure you want to delete ${record.firstName} ${record.lastName}?`,
                    okText: 'Yes, delete',
                    okType: 'danger',
                    cancelText: 'Cancel',
                    onOk: () => confirmDelete(record.id),
                  });
                }
              },
            ]
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys: state.selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      setState(prev => ({ ...prev, selectedRowKeys }));
    },
  };

  const hasSelected = state.selectedRowKeys.length > 0;

  // Removed duplicate function declarations

  return (
    <PatientListContainer>
      <div className="patient-header">
        <Title level={4} style={{ margin: 0 }}>Patients</Title>
        <Space>
          <Search
            placeholder="Search patients..."
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={debouncedSearch}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="search-box"
          />
          
          <Dropdown
            menu={{
              items: [
                { key: 'export-csv', label: 'Export as CSV', onClick: () => handleExport('csv') },
                { key: 'export-pdf', label: 'Export as PDF', onClick: () => handleExport('pdf') },
              ]
            }}
          >
            <Button icon={<DownloadOutlined />}>
              Export
            </Button>
          </Dropdown>
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/patients/new')}
          >
            Add Patient
          </Button>
        </Space>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              onClick={() => handleStatusFilter('active')}
              danger={state.filters.status?.includes('active')}
            >
              Active
            </Button>
            <Button
              onClick={() => handleStatusFilter('inactive')}
              danger={state.filters.status?.includes('inactive')}
            >
              Inactive
            </Button>
            <Button
              type={!state.filters.status ? 'primary' : 'default'}
              onClick={() => handleStatusFilter('all')}
            >
              All
            </Button>
            
            {hasSelected && (
              <span style={{ marginLeft: 8 }}>
                <Button 
                  danger 
                  onClick={handleBulkDelete}
                  loading={state.loading}
                >
                  Delete Selected ({state.selectedRowKeys.length})
                </Button>
              </span>
            )}
          </Space>
        </div>
        
        <Table
          columns={columns}
          rowSelection={rowSelection}
          dataSource={state.data}
          rowKey="id"
          loading={state.loading}
          pagination={{
            ...state.pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} patients`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </PatientListContainer>
  );
};

export default PatientList;
