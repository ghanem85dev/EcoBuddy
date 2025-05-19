import React, { useState } from 'react';
import { Card, Typography, Space, Tag, Divider, Progress, Badge, Tooltip, Image } from 'antd';
import { 
  TrophyOutlined, 
  FieldTimeOutlined, 
  CalendarOutlined,
  BulbOutlined,
  FlagOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  FireFilled,
  StarFilled,
  CheckCircleFilled,
  PlayCircleFilled,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

// Import des images
import defiEnCours from '../../assets/defiEnCours.png';
import defiPasse from '../../assets/defiPasse.png';
import defiAVenir from '../../assets/defiAVenir.png';

const { Text, Title } = Typography;

const DefiCard = ({ defi, startDate, isCurrent }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const endDate = startDate.add(defi.duree_jours, 'day');
  const now = dayjs();
  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      (now.diff(startDate, 'day') / defi.duree_jours) * 100
    )
  );

  // Sélection de l'image en fonction du statut
  const getStatusImage = () => {
    if (isCurrent) return defiEnCours;
    if (now.isBefore(startDate)) return defiAVenir;
    return defiPasse;
  };

  const renderRecurrence = () => {
    if (!defi.mode_recurrence) return null;
    
    const modes = {
      'journalier': { text: 'Journalier', color: '#17B3DE', icon: <FieldTimeOutlined /> },
      'hebdomadaire': { text: 'Hebdomadaire', color: '#2DBDAC', icon: <CalendarOutlined /> },
      'mensuel': { text: 'Mensuel', color: '#F36D8F', icon: <BulbOutlined /> },
      'saisonnier': { text: 'Saisonnier', color: '#FFA940', icon: <FlagOutlined /> }
    };
    
    const mode = modes[defi.mode_recurrence] || { 
      text: defi.mode_recurrence, 
      color: '#17B3DE', 
      icon: <SyncOutlined /> 
    };

    return (
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Tag 
          icon={mode.icon} 
          color={mode.color}
          style={{ 
            borderRadius: '12px',
            padding: '0 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            margin: 0,
            cursor: 'pointer'
          }}
        >
          {mode.text}
        </Tag>
      </motion.div>
    );
  };

  const renderDateRange = () => (
    <motion.div 
      style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: '8px 0'
      }}
      whileHover={{ scale: 1.02 }}
    >
      <motion.div
        animate={{ rotate: isHovered ? 360 : 0 }}
        transition={{ duration: 1 }}
      >
        <CalendarOutlined style={{ 
          color: '#17B3DE',
          fontSize: '16px'
        }} />
      </motion.div>
      <Title 
        level={5} 
        style={{ 
          margin: 0,
          color: '#3D4A5C',
          fontWeight: 600,
          fontSize: '16px'
        }}
      >
        {startDate.format('DD/MM/YYYY')} → {endDate.format('DD/MM/YYYY')}
      </Title>
    </motion.div>
  );

  const getStatusProps = () => {
    if (isCurrent) {
      return { 
        text: "EN COURS", 
        color: "#2DBDAC",
        icon: <PlayCircleFilled />,
        bgColor: 'rgba(45, 189, 172, 0.1)'
      };
    }
    if (now.isBefore(startDate)) {
      return { 
        text: "À VENIR", 
        color: "#17B3DE",
        icon: <ClockCircleOutlined />,
        bgColor: 'rgba(23, 179, 222, 0.1)'
      };
    }
    return { 
      text: "TERMINÉ", 
      color: "#F36D8F",
      icon: <CheckCircleFilled />,
      bgColor: 'rgba(243, 109, 143, 0.1)'
    };
  };

  const status = getStatusProps();

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Badge.Ribbon 
        text={
          <Space size={4}>
            {status.icon}
            {status.text}
          </Space>
        } 
        color={status.color}
        style={{ 
          fontWeight: 600,
          fontSize: '12px',
          padding: '0 8px',
          height: '24px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Card
          hoverable
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            borderRadius: '12px',
            boxShadow: isHovered 
              ? '0 8px 24px rgba(45, 189, 172, 0.2)' 
              : '0 4px 12px rgba(0, 0, 0, 0.1)',
            height: '100%',
            transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
            borderTop: `4px solid ${status.color}`,
            overflow: 'hidden',
            background: isHovered ? status.bgColor : 'white'
          }}
          bodyStyle={{ padding: '16px' }}
          cover={
            <>
              {isCurrent && (
                <div style={{ padding: '8px 16px 0' }}>
                  <Progress 
                    percent={progressPercent} 
                    strokeColor={{
                      '0%': '#17B3DE',
                      '100%': '#2DBDAC',
                    }}
                    showInfo={false}
                    strokeWidth={6}
                    trailColor="#f0f0f0"
                  />
                </div>
              )}
              <motion.div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '16px 0',
                  background: 'linear-gradient(135deg, #f5fdfe 0%, #e6f7fb 100%)'
                }}
                animate={{
                  y: isImageHovered ? [0, -5, 5, 0] : 0,
                  scale: isImageHovered ? 1.05 : 1
                }}
                transition={{ duration: 1 }}
              >
                <Tooltip title={`Défi ${status.text.toLowerCase()}`}>
                  <Image
                    src={getStatusImage()}
                    preview={false}
                    width={120}
                    style={{
                      filter: isHovered 
                        ? 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))'
                        : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={() => setIsImageHovered(true)}
                    onMouseLeave={() => setIsImageHovered(false)}
                  />
                </Tooltip>
              </motion.div>
            </>
          }
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Tooltip 
                  title={`${defi.points} points à gagner`} 
                  color="gold"
                >
                  <Tag 
                    icon={<TrophyOutlined />}
                    style={{ 
                      background: 'linear-gradient(135deg, #FFD70020, #FFA94020)',
                      borderColor: '#FFD700',
                      color: '#D48806',
                      borderRadius: '12px',
                      padding: '0 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 600,
                      margin: 0
                    }}
                  >
                    <motion.div
                      animate={{ rotate: isHovered ? [0, 20, -20, 0] : 0 }}
                      transition={{ duration: 0.7 }}
                    >
                    </motion.div>
                    {defi.points} pts
                  </Tag>
                </Tooltip>
              </motion.div>

              {defi.points > 100 && (
                <Tooltip title="Défi premium!">
                  <motion.div
                    animate={{ 
                      scale: isHovered ? [1, 1.2, 1] : 1,
                      rotate: isHovered ? [0, 10, -10, 0] : 0
                    }}
                    transition={{ duration: 0.7 }}
                  >
                    <FireFilled style={{ 
                      color: '#FF7D45', 
                      fontSize: '20px',
                      filter: isHovered ? 'drop-shadow(0 0 8px #FF7D45)' : 'none',
                      transition: 'all 0.3s ease'
                    }} />
                  </motion.div>
                </Tooltip>
              )}
            </div>

            <motion.div 
              whileHover={{ x: 5 }}
              whileTap={{ x: 10 }}
            >
              <Title 
                level={4} 
                style={{ 
                  margin: 0, 
                  color: '#3D4A5C',
                  fontWeight: 600,
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {defi.titre}
                <Tooltip title={defi.description}>
                  <InfoCircleOutlined style={{ 
                    color: '#17B3DE', 
                    fontSize: '16px',
                    cursor: 'help'
                  }} />
                </Tooltip>
              </Title>
              <Text 
                type="secondary" 
                style={{ 
                  display: 'block', 
                  marginTop: '4px',
                  fontSize: '14px'
                }}
              >
                {defi.description}
              </Text>
            </motion.div>

            <Divider style={{ 
              margin: '8px 0', 
              borderColor: '#f0f0f0',
              borderWidth: '2px'
            }} />

            {renderDateRange()}
            {renderRecurrence()}

            {isCurrent && (
              <>
                <Divider style={{ 
                  margin: '8px 0', 
                  borderColor: '#f0f0f0',
                  borderWidth: '2px'
                }} />
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  <Text strong style={{ color: '#3D4A5C', fontSize: '14px' }}>
                    Progression
                  </Text>
                  <Space size={4} style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {Math.floor(progressPercent)}% complété
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {endDate.diff(now, 'day')} jours restants
                    </Text>
                  </Space>
                </Space>
              </>
            )}
          </Space>
        </Card>
      </Badge.Ribbon>
    </motion.div>
  );
};

export default DefiCard;