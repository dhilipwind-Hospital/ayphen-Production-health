import React, { useState, useEffect } from 'react';
import { Card, List, Input, Button, Avatar, Badge, Empty, message as antMessage, Space } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import dayjs from 'dayjs';
import styled from 'styled-components';

const { TextArea } = Input;

const Messaging: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
    }
  }, [selectedUser]);

  const loadConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data.data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/messages/${otherUserId}`);
      setMessages(res.data.data || []);
      
      // Mark unread messages as read
      const unreadMessages = res.data.data?.filter((msg: any) => 
        msg.recipient?.id === user?.id && !msg.isRead
      ) || [];
      
      for (const msg of unreadMessages) {
        await api.put(`/messages/${msg.id}/read`);
      }
      
      await loadUnreadCount();
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await api.get('/messages/unread/count');
      setUnreadCount(res.data.count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      await api.post('/messages', {
        recipientId: selectedUser.id,
        content: newMessage
      });

      setNewMessage('');
      await loadMessages(selectedUser.id);
      antMessage.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      antMessage.error('Failed to send message');
    }
  };

  return (
    <MessagingContainer>
      <Card title={`Messages ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}>
        <div style={{ display: 'flex', height: '600px' }}>
          {/* Conversations List */}
          <ConversationsList>
            <h4>Conversations</h4>
            {conversations.length === 0 ? (
              <Empty description="No conversations yet" />
            ) : (
              <List
                dataSource={conversations}
                renderItem={(conv: any) => (
                  <List.Item
                    onClick={() => setSelectedUser(conv)}
                    style={{
                      cursor: 'pointer',
                      background: selectedUser?.id === conv.id ? '#f0f0f0' : 'white',
                      padding: '12px'
                    }}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={`${conv.firstName} ${conv.lastName}`}
                      description={conv.role}
                    />
                  </List.Item>
                )}
              />
            )}
          </ConversationsList>

          {/* Chat Area */}
          <ChatArea>
            {!selectedUser ? (
              <Empty description="Select a conversation to start messaging" />
            ) : (
              <>
                <ChatHeader>
                  <Avatar icon={<UserOutlined />} />
                  <div style={{ marginLeft: 12 }}>
                    <h4 style={{ margin: 0 }}>
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h4>
                    <span style={{ fontSize: 12, color: '#666' }}>
                      {selectedUser.role}
                    </span>
                  </div>
                </ChatHeader>

                <MessagesContainer>
                  {messages.length === 0 ? (
                    <Empty description="No messages yet" />
                  ) : (
                    messages.map((msg: any) => (
                      <MessageBubble
                        key={msg.id}
                        isOwn={msg.sender?.id === user?.id}
                      >
                        <div className="message-content">{msg.content}</div>
                        <div className="message-time">
                          {dayjs(msg.createdAt).format('MMM DD, HH:mm')}
                          {msg.isRead && msg.sender?.id === user?.id && (
                            <span style={{ marginLeft: 8, color: '#52c41a' }}>✓✓</span>
                          )}
                        </div>
                      </MessageBubble>
                    ))
                  )}
                </MessagesContainer>

                <MessageInput>
                  <TextArea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    style={{ marginTop: 8 }}
                  >
                    Send
                  </Button>
                </MessageInput>
              </>
            )}
          </ChatArea>
        </div>
      </Card>
    </MessagingContainer>
  );
};

export default Messaging;

// Styled Components
const MessagingContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const ConversationsList = styled.div`
  width: 300px;
  border-right: 1px solid #f0f0f0;
  overflow-y: auto;
  
  h4 {
    padding: 12px;
    margin: 0;
    border-bottom: 1px solid #f0f0f0;
  }
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #fafafa;
`;

const MessageBubble = styled.div<{ isOwn: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  margin-bottom: 16px;

  .message-content {
    background: ${props => props.isOwn ? '#1890ff' : 'white'};
    color: ${props => props.isOwn ? 'white' : 'black'};
    padding: 12px 16px;
    border-radius: 12px;
    max-width: 60%;
    word-wrap: break-word;
  }

  .message-time {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }
`;

const MessageInput = styled.div`
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  background: white;
`;
