import React, { useState, useEffect, useContext, useMemo } from 'react';
import { 
  Row, 
  Col, 
  Typography, 
  Spin, 
  Space, 
  Card, 
  Pagination, 
  DatePicker, 
  Select, 
  Button,
  Empty,
  Badge
} from 'antd';
import RecompenseCard from '../components/RecompenseCard';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  TrophyOutlined, 
  FilterOutlined,
  CalendarOutlined,
  ReloadOutlined,
  StarFilled,
  FireFilled
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ListRecompenses = () => {
  const { idUser } = useContext(AuthContext);
  const [recompenses, setRecompenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [dateRange, setDateRange] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  useEffect(() => {
    const fetchRecompenses = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:8000/recompenses/user/${idUser}`);
        setRecompenses(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (idUser) {
      fetchRecompenses();
    }
  }, [idUser]);

  const filteredRecompenses = useMemo(() => {
    let result = [...recompenses];
    
    // Filtrage par date
    if (dateRange) {
      const [startDate, endDate] = dateRange;
      result = result.filter(r => {
        const rewardDate = dayjs(r.date);
        return rewardDate.isSameOrAfter(startDate) && rewardDate.isSameOrBefore(endDate);
      });
    }
    
    // Tri
    result.sort((a, b) => {
      const dateA = dayjs(a.date);
      const dateB = dayjs(b.date);
      return sortOrder === 'desc' ? dateB.diff(dateA) : dateA.diff(dateB);
    });
    
    return result;
  }, [recompenses, dateRange, sortOrder]);

  const paginatedRecompenses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRecompenses.slice(startIndex, startIndex + pageSize);
  }, [filteredRecompenses, currentPage, pageSize]);

  const resetFilters = () => {
    setDateRange(null);
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Spin tip="Chargement des récompenses..." size="large" />
    </div>
  );

  if (error) return (
    <div style={{ padding: '24px' }}>
      <Card bordered={false}>
        <Text type="danger">Erreur: {error}</Text>
      </Card>
    </div>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        bordered={false}
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space align="center">
            <motion.div
              whileHover={{ rotate: 20 }}
              whileTap={{ scale: 0.9 }}
            >
              <TrophyOutlined style={{ fontSize: '28px', color: '#F36D8F' }} />
            </motion.div>
            <Title level={3} style={{ margin: 0, color: '#3D4A5C' }}>Mes Récompenses</Title>
            <Badge 
              count={recompenses.length} 
              style={{ 
                backgroundColor: '#17B3DE',
                marginLeft: '8px'
              }} 
            />
          </Space>
          
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="text"
              icon={<FilterOutlined />}
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              style={{ 
                color: '#17B3DE',
                padding: '0',
                marginBottom: '8px'
              }}
            >
              {isFilterVisible ? 'Masquer les filtres' : 'Afficher les filtres'}
            </Button>

            <motion.div
              initial={false}
              animate={{ 
                height: isFilterVisible ? 'auto' : 0,
                opacity: isFilterVisible ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <Card 
                bordered={false}
                style={{ 
                  background: '#f9f9f9',
                  borderRadius: '8px'
                }}
              >
                <Space size="middle" align="center">
                  <Space>
                    <CalendarOutlined style={{ color: '#17B3DE' }} />
                    <Text strong>Période :</Text>
                    <RangePicker
                      value={dateRange}
                      onChange={setDateRange}
                      style={{ width: '220px' }}
                    />
                  </Space>

                  <Space>
                    <Text strong>Trier par :</Text>
                    <Select
                      value={sortOrder}
                      onChange={setSortOrder}
                      style={{ width: '120px' }}
                    >
                      <Option value="desc">Plus récent</Option>
                      <Option value="asc">Plus ancien</Option>
                    </Select>
                  </Space>

                  <Button
                    icon={<ReloadOutlined />}
                    onClick={resetFilters}
                    type="text"
                    style={{ color: '#F36D8F' }}
                  >
                    Réinitialiser
                  </Button>
                </Space>
              </Card>
            </motion.div>
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <AnimatePresence>
          {paginatedRecompenses.length > 0 ? (
            paginatedRecompenses.map((recompense) => (
              <Col 
                key={recompense.idRecompense} 
                xs={24} 
                sm={12} 
                md={8} 
                lg={6}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <RecompenseCard recompense={recompense} />
                </motion.div>
              </Col>
            ))
          ) : (
            <Col span={24}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card style={{ borderRadius: '12px' }}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <Text type="secondary" style={{ fontSize: '16px' }}>
                        Aucune récompense trouvée pour ces critères
                      </Text>
                    }
                  >
                    <Button 
                      type="primary" 
                      onClick={resetFilters}
                      style={{ background: '#17B3DE', borderColor: '#17B3DE' }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  </Empty>
                </Card>
              </motion.div>
            </Col>
          )}
        </AnimatePresence>
      </Row>

      {filteredRecompenses.length > 0 && (
        <motion.div 
          style={{ marginTop: '24px', textAlign: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredRecompenses.length}
            onChange={handlePageChange}
            showSizeChanger
            pageSizeOptions={['8', '12', '24', '48']}
            showTotal={(total, range) => (
              <Text style={{ color: '#3D4A5C' }}>
                {range[0]}-{range[1]} sur {total} récompenses
              </Text>
            )}
            itemRender={(page, type, originalElement) => {
              if (type === 'page') {
                return (
                  <motion.div
                    whileHover={{ scale: 1.1, backgroundColor: '#17B3DE20' }}
                    style={{
                      display: 'inline-block',
                      width: '32px',
                      height: '32px',
                      lineHeight: '32px',
                      borderRadius: '6px'
                    }}
                  >
                    {originalElement}
                  </motion.div>
                );
              }
              return originalElement;
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default ListRecompenses;