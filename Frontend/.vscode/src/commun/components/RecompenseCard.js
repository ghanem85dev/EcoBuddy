import React, { useState } from 'react';
import { Card, Typography, Space, Tag, Divider, Image, Badge, Tooltip } from 'antd';
import { 
  TrophyOutlined, 
  StarFilled, 
  HomeOutlined, 
  CalendarOutlined, 
  IdcardOutlined,
  CrownFilled,
  FireFilled,
  FlagFilled
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { motion } from 'framer-motion';
import recompenseImage from '../../assets/recompense.png';

dayjs.locale('fr');

const { Text, Title } = Typography;

const RecompenseCard = ({ recompense }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card
        hoverable
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          borderRadius: '16px',
          boxShadow: isHovered 
            ? '0 8px 24px rgba(23, 179, 222, 0.2)' 
            : '0 4px 12px rgba(0, 0, 0, 0.1)',
          height: '100%',
          transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
          borderTop: '4px solid #17B3DE',
          overflow: 'hidden',
          position: 'relative'
        }}
        bodyStyle={{ padding: '16px' }}
        cover={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '24px 0 16px',
            background: 'linear-gradient(135deg, #f5fdfe 0%, #e6f7fb 100%)'
          }}>
            <motion.div
              animate={{
                y: isImageHovered ? [-5, 5, -5] : 0,
                rotate: isImageHovered ? [0, 5, -5, 0] : 0
              }}
              transition={{ duration: 0.8 }}
            >
              <Tooltip title="Médaille de réussite" color="#17B3DE">
                <Image 
                  src={recompenseImage} 
                  preview={false}
                  width={100}
                  style={{
                    filter: isHovered 
                      ? 'drop-shadow(0 4px 8px rgba(243, 109, 143, 0.3))' 
                      : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setIsImageHovered(true)}
                  onMouseLeave={() => setIsImageHovered(false)}
                  onClick={() => console.log('Médaille cliquée!')}
                />
              </Tooltip>
            </motion.div>
          </div>
        }
      >
        {/* Badge pour récompenses spéciales */}
        {recompense.isSpecial && (
          <div style={{ position: 'absolute', top: 16, right: 16 }}>
            <Badge.Ribbon 
              text="Spécial" 
              color="#F36D8F"
              style={{ 
                fontSize: '12px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
          </div>
        )}

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Tag 
                color="#17B3DE" 
                icon={<IdcardOutlined />}
                style={{ 
                  borderRadius: '12px',
                  padding: '0 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                Récompense #{recompense.idRecompense}
              </Tag>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }}>
              <Tag
                icon={<CalendarOutlined />}
                style={{ 
                  background: '#F36D8F20', 
                  borderColor: '#F36D8F',
                  color: '#F36D8F',
                  borderRadius: '12px',
                  padding: '0 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                {dayjs(recompense.date).format('DD MMM YYYY')}
              </Tag>
            </motion.div>
          </div>

          {recompense.defi && (
            <>
              <Divider 
                orientation="left" 
                plain
                style={{
                  borderColor: '#D9D9D9',
                  color: '#17B3DE',
                  fontWeight: '600',
                  fontSize: '14px',
                  margin: '12px 0'
                }}
              >
                <motion.div 
                  animate={{ rotate: isHovered ? [0, 10, -10, 0] : 0 }}
                  transition={{ duration: 0.7 }}
                  style={{ display: 'inline-block' }}
                >
                  <TrophyOutlined style={{ marginRight: '8px' }} />
                </motion.div>
                Défi accompli
              </Divider>
              
              <motion.div whileTap={{ scale: 0.98 }}>
                <Title level={5} style={{ 
                  margin: 0, 
                  color: '#3D4A5C', 
                  fontWeight: '600',
                  fontSize: '16px'
                }}>
                  {recompense.defi.titre}
                </Title>
                <Space style={{ marginTop: '8px' }}>
                  <motion.div
                    animate={{ scale: isHovered ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <StarFilled style={{ color: '#FFD700', fontSize: '18px' }} />
                  </motion.div>
                  <Text strong style={{ color: '#3D4A5C', fontSize: '14px' }}>
                    {recompense.defi.points} points
                  </Text>
                  {recompense.defi.points > 100 && (
                    <Tooltip title="Score exceptionnel!">
                      <FireFilled style={{ color: '#FF7D45', fontSize: '16px' }} />
                    </Tooltip>
                  )}
                </Space>
              </motion.div>
            </>
          )}

          <Divider 
            orientation="left" 
            plain
            style={{
              borderColor: '#D9D9D9',
              color: '#17B3DE',
              fontWeight: '600',
              fontSize: '14px',
              margin: '16px 0 8px'
            }}
          >
            <HomeOutlined style={{ marginRight: '8px' }} />
            Site
          </Divider>
          
          <motion.div 
            whileHover={{ x: 5 }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeOutlined style={{ color: '#1890ff', fontSize: '16px', marginRight: '8px' }} />
            <Text strong style={{ color: '#3D4A5C', fontSize: '14px' }}>
              {recompense.site.nom}
            </Text>
            {recompense.site.isHeadquarters && (
              <Tooltip title="Siège principal">
                <CrownFilled style={{ 
                  color: '#FFC53D', 
                  fontSize: '16px', 
                  marginLeft: '8px',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                }} />
              </Tooltip>
            )}
          </motion.div>

          
        </Space>
      </Card>
    </motion.div>
  );
};

export default RecompenseCard;