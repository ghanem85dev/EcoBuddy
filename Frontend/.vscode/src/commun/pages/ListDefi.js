import React, { useState, useEffect, useContext, useMemo } from 'react';
import { 
  Row, 
  Col, 
  Typography, 
  Spin, 
  Space, 
  Card, 
  Tabs, 
  Tag, 
  message, 
  Pagination,
  Select,
  DatePicker,
  Button,
  Empty
} from 'antd';
import DefiCard from '../components/DefiCard';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  TrophyOutlined, 
  FireOutlined, 
  CheckCircleOutlined,
  CalendarOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { motion, AnimatePresence } from 'framer-motion';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(weekOfYear);

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const ListDefi = () => {
  const { idUser } = useContext(AuthContext);
  const [allDefis, setAllDefis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [filterMode, setFilterMode] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const now = dayjs();
  const currentWeek = now.week();
  const currentMonth = now.month();
  const currentYear = now.year();

  const getDefiStartDate = (defi) => {
    if (defi.mode_recurrence === 'Saisonnier') {
      return dayjs(defi.date_debut_base).set('year', currentYear);
    } else if (defi.mode_recurrence === 'Mensuel') {
      return dayjs(defi.date_debut_base).set('month', currentMonth).set('year', currentYear);
    } else if (defi.mode_recurrence === 'Hebdomadaire') {
      return dayjs(defi.date_debut_base).set('year', currentYear).week(currentWeek);
    } else { // journalier
      return now;
    }
  };

  const isDefiCurrent = (defi) => {
    const startDate = getDefiStartDate(defi);
    const endDate = startDate.add(defi.duree_jours, 'day');
    return now.isSameOrAfter(startDate) && now.isSameOrBefore(endDate);
  };

  const isDefiUpcoming = (defi) => {
    const startDate = getDefiStartDate(defi);
    return now.isBefore(startDate);
  };

  const isDefiPast = (defi) => {
    const startDate = getDefiStartDate(defi);
    const endDate = startDate.add(defi.duree_jours, 'day');
    return now.isAfter(endDate);
  };

  const filteredDefis = useMemo(() => {
    return allDefis.filter(defi => {
      if (!defi.active) return false;
      
      const startDate = getDefiStartDate(defi);
      const endDate = startDate.add(defi.duree_jours, 'day');
      
      // Filtre par période
      if (activeTab === 'current' && !isDefiCurrent(defi)) return false;
      if (activeTab === 'upcoming' && !isDefiUpcoming(defi)) return false;
      if (activeTab === 'past' && !isDefiPast(defi)) return false;
      
      // Filtre par mode de récurrence
      if (filterMode !== 'all' && defi.mode_recurrence !== filterMode) return false;
      
      // Filtre par date sélectionnée
      if (selectedDate) {
        const selectedDay = selectedDate.startOf('day');
        return selectedDay.isSameOrAfter(startDate.startOf('day')) && 
               selectedDay.isSameOrBefore(endDate.startOf('day'));
      }
      
      return true;
    });
  }, [allDefis, activeTab, filterMode, selectedDate]);

  const paginatedDefis = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredDefis.slice(startIndex, startIndex + pageSize);
  }, [filteredDefis, currentPage, pageSize]);

  const fetchDefis = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/defis/user/${idUser}`, {
        params: { active_only: true }
      });
      
      if (response.data.success) {
        setAllDefis(response.data.data);
      } else {
        message.error('Erreur lors du chargement des défis');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idUser) {
      fetchDefis();
    }
  }, [idUser]);

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1);
    }
  };

  const resetFilters = () => {
    setFilterMode('all');
    setSelectedDate(null);
  };

  const getTabColor = (tabKey) => {
    switch(tabKey) {
      case 'current': return '#2DBDAC';
      case 'upcoming': return '#17B3DE';
      case 'past': return '#F36D8F';
      default: return '#17B3DE';
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Spin tip="Chargement des défis..." size="large" />
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
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FireOutlined style={{ fontSize: '28px', color: '#FF6B6B' }} />
            </motion.div>
            <Title level={3} style={{ margin: 0, color: '#3D4A5C' }}>Mes Défis</Title>
          </Space>
          
          <Space direction="vertical" style={{ width: '100%' }}>
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              tabBarStyle={{ marginBottom: 0 }}
              renderTabBar={(props, DefaultTabBar) => (
                <div style={{ position: 'relative' }}>
                  <DefaultTabBar {...props} />
                  <motion.div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: props.activeKey === 'current' ? '0%' : 
                            props.activeKey === 'upcoming' ? '33.33%' : '66.66%',
                      width: '33.33%',
                      height: '3px',
                      background: getTabColor(props.activeKey),
                      borderRadius: '3px'
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    layoutId="underline"
                  />
                </div>
              )}
            >
              <TabPane 
                tab={
                  <Space>
                    <FireOutlined style={{ color: activeTab === 'current' ? '#2DBDAC' : undefined }} />
                    <Text style={{ color: activeTab === 'current' ? '#2DBDAC' : undefined }}>
                      En cours
                    </Text>
                    {filteredDefis.some(isDefiCurrent) && (
                      <Tag color="#2DBDAC" style={{ borderRadius: '10px' }}>
                        {filteredDefis.filter(isDefiCurrent).length}
                      </Tag>
                    )}
                  </Space>
                } 
                key="current"
              />
              <TabPane 
                tab={
                  <Space>
                    <ClockCircleOutlined style={{ color: activeTab === 'upcoming' ? '#17B3DE' : undefined }} />
                    <Text style={{ color: activeTab === 'upcoming' ? '#17B3DE' : undefined }}>
                      À venir
                    </Text>
                    {filteredDefis.some(isDefiUpcoming) && (
                      <Tag color="#17B3DE" style={{ borderRadius: '10px' }}>
                        {filteredDefis.filter(isDefiUpcoming).length}
                      </Tag>
                    )}
                  </Space>
                } 
                key="upcoming"
              />
              <TabPane 
                tab={
                  <Space>
                    <HistoryOutlined style={{ color: activeTab === 'past' ? '#F36D8F' : undefined }} />
                    <Text style={{ color: activeTab === 'past' ? '#F36D8F' : undefined }}>
                      Passés
                    </Text>
                    {filteredDefis.some(isDefiPast) && (
                      <Tag color="#F36D8F" style={{ borderRadius: '10px' }}>
                        {filteredDefis.filter(isDefiPast).length}
                      </Tag>
                    )}
                  </Space>
                } 
                key="past"
              />
            </Tabs>

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
                  marginTop: '16px',
                  background: '#f9f9f9',
                  borderRadius: '8px'
                }}
              >
                <Space size="large" align="center">
                  <Select
                    value={filterMode}
                    onChange={setFilterMode}
                    style={{ width: 180 }}
                    suffixIcon={<FilterOutlined style={{ color: '#17B3DE' }} />}
                  >
                    <Option value="all">Tous les types</Option>
                    <Option value="Journalier">Journaliers</Option>
                    <Option value="Hebdomadaire">Hebdomadaires</Option>
                    <Option value="Mensuel">Mensuels</Option>
                    <Option value="Saisonnier">Saisonniers</Option>
                  </Select>

                  <DatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    allowClear
                    placeholder="Filtrer par date"
                    style={{ width: 180 }}
                    suffixIcon={<CalendarOutlined style={{ color: '#17B3DE' }} />}
                  />

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

            <Button
              type="text"
              icon={<FilterOutlined />}
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              style={{ 
                color: '#17B3DE',
                padding: '0',
                marginTop: '8px'
              }}
            >
              {isFilterVisible ? 'Masquer les filtres' : 'Afficher les filtres'}
            </Button>
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <AnimatePresence>
          {paginatedDefis.length > 0 ? (
            paginatedDefis.map((defi) => (
              <Col 
                key={`${defi.idDefi}-${getDefiStartDate(defi).format('YYYY-MM-DD')}`} 
                xs={24} 
                sm={12} 
                lg={8} 
                xl={6}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <DefiCard 
                    defi={defi} 
                    startDate={getDefiStartDate(defi)} 
                    isCurrent={isDefiCurrent(defi)}
                  />
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
                        Aucun défi trouvé pour ces critères
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

      {filteredDefis.length > 0 && (
        <motion.div 
          style={{ marginTop: '24px', textAlign: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredDefis.length}
            onChange={handlePageChange}
            showSizeChanger
            pageSizeOptions={['8', '12', '24', '48']}
            showTotal={(total, range) => (
              <Text style={{ color: '#3D4A5C' }}>
                {range[0]}-{range[1]} sur {total} défis
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

export default ListDefi;