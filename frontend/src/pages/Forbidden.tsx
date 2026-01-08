import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Forbidden: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const homePath = (
    role === 'nurse' ? '/queue/triage' :
    role === 'receptionist' ? '/queue/reception' :
    role === 'doctor' ? '/queue/doctor' :
    role === 'pharmacist' ? '/pharmacy' :
    role === 'lab_technician' ? '/laboratory/dashboard' :
    role === 'accountant' ? '/billing/management' :
    role === 'patient' ? '/portal' :
    (role === 'admin' || role === 'super_admin') ? '/admin/appointments' :
    '/'
  );
  return (
    <Result
      status="403"
      title="403"
      subTitle="Sorry, you are not authorized to access this page."
      extra={<Button type="primary" onClick={() => navigate(homePath)}>Back Home</Button>}
    />
  );
};

export default Forbidden;
