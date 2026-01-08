import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Input, Select, Empty, Button, Modal, Typography } from 'antd';
import { EyeOutlined, SearchOutlined, BookOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Paragraph } = Typography;

const HealthArticles: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  useEffect(() => {
    loadCategories();
    loadArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [articles, selectedCategory, searchText]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/health-articles/categories');
      setCategories(res.data.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadArticles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/health-articles');
      setArticles(res.data.data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = [...articles];

    if (selectedCategory) {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    if (searchText) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchText.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchText.toLowerCase()) ||
        article.tags?.some((tag: string) => tag.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    setFilteredArticles(filtered);
  };

  const handleViewArticle = async (article: any) => {
    try {
      const res = await api.get(`/health-articles/${article.id}`);
      setSelectedArticle(res.data.data);
    } catch (error) {
      console.error('Error loading article:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      general_health: 'blue',
      nutrition: 'green',
      exercise: 'orange',
      mental_health: 'purple',
      chronic_disease: 'red',
      preventive_care: 'cyan',
      womens_health: 'magenta',
      mens_health: 'geekblue',
      pediatrics: 'lime',
      senior_care: 'gold'
    };
    return colors[category] || 'default';
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <BookOutlined style={{ marginRight: 8 }} />
            <span>Health Education Library</span>
          </div>
        }
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <Search
              placeholder="Search articles..."
              allowClear
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Filter by category"
              allowClear
              onChange={(value) => setSelectedCategory(value || '')}
              style={{ width: 250 }}
            >
              {categories.map(category => (
                <Option key={category} value={category}>
                  {category.replace(/_/g, ' ').toUpperCase()}
                </Option>
              ))}
            </Select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 8 }}>Quick filters:</span>
            {categories.slice(0, 5).map(category => (
              <Tag
                key={category}
                color={getCategoryColor(category)}
                style={{ cursor: 'pointer', marginBottom: 8 }}
                onClick={() => setSelectedCategory(category)}
              >
                {category.replace(/_/g, ' ')}
              </Tag>
            ))}
          </div>
        </div>

        {filteredArticles.length === 0 ? (
          <Empty description="No articles found" />
        ) : (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3 }}
            dataSource={filteredArticles}
            loading={loading}
            renderItem={(article: any) => (
              <List.Item>
                <Card
                  hoverable
                  cover={
                    article.imageUrl ? (
                      <img
                        alt={article.title}
                        src={article.imageUrl}
                        style={{ height: 200, objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOutlined style={{ fontSize: 48, color: '#ccc' }} />
                      </div>
                    )
                  }
                  actions={[
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewArticle(article)}
                    >
                      Read ({article.viewCount} views)
                    </Button>
                  ]}
                >
                  <Card.Meta
                    title={article.title}
                    description={
                      <>
                        <Paragraph ellipsis={{ rows: 2 }}>
                          {article.summary}
                        </Paragraph>
                        <div style={{ marginTop: 8 }}>
                          <Tag color={getCategoryColor(article.category)}>
                            {article.category.replace(/_/g, ' ')}
                          </Tag>
                          {article.tags?.slice(0, 2).map((tag: string) => (
                            <Tag key={tag}>{tag}</Tag>
                          ))}
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                          {dayjs(article.createdAt).format('MMM DD, YYYY')}
                        </div>
                      </>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title={selectedArticle?.title}
        open={!!selectedArticle}
        onCancel={() => setSelectedArticle(null)}
        footer={null}
        width={800}
      >
        {selectedArticle && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Tag color={getCategoryColor(selectedArticle.category)}>
                {selectedArticle.category.replace(/_/g, ' ')}
              </Tag>
              {selectedArticle.tags?.map((tag: string) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>

            {selectedArticle.imageUrl && (
              <img
                src={selectedArticle.imageUrl}
                alt={selectedArticle.title}
                style={{ width: '100%', marginBottom: 16, borderRadius: 8 }}
              />
            )}

            <div style={{ marginBottom: 16, color: '#666' }}>
              <strong>Summary:</strong> {selectedArticle.summary}
            </div>

            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {selectedArticle.content}
            </div>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0', fontSize: 12, color: '#999' }}>
              <div>Author: {selectedArticle.author?.firstName} {selectedArticle.author?.lastName}</div>
              <div>Published: {dayjs(selectedArticle.createdAt).format('MMMM DD, YYYY')}</div>
              <div>Views: {selectedArticle.viewCount}</div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default HealthArticles;
