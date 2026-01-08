import React, { ReactNode } from 'react';
import { Button, Space } from 'antd';
import styled from 'styled-components';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  type?: 'primary' | 'default' | 'dashed';
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
}

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  min-height: 300px;
  background: linear-gradient(135deg, rgba(233, 30, 99, 0.02) 0%, rgba(255, 255, 255, 1) 100%);
  border-radius: 8px;
  border: 1px solid rgba(233, 30, 99, 0.1);
`;

const IconWrapper = styled.div`
  font-size: 64px;
  margin-bottom: 24px;
  color: #e91e63;
  opacity: 0.8;
`;

const Title = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
`;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0 0 24px 0;
  max-width: 400px;
`;

const ActionsWrapper = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
`;

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, actions }) => {
  return (
    <EmptyStateContainer>
      <IconWrapper>{icon}</IconWrapper>
      <Title>{title}</Title>
      <Description>{description}</Description>
      {actions && actions.length > 0 && (
        <ActionsWrapper>
          <Space>
            {actions.map((action, index) => (
              <Button
                key={`${action.label}-${index}`}
                type={action.type || (index === 0 ? 'primary' : 'default')}
                onClick={action.onClick}
                style={
                  action.type === 'primary' || index === 0
                    ? { background: '#e91e63', borderColor: '#e91e63' }
                    : {}
                }
              >
                {action.label}
              </Button>
            ))}
          </Space>
        </ActionsWrapper>
      )}
    </EmptyStateContainer>
  );
};

export default EmptyState;
