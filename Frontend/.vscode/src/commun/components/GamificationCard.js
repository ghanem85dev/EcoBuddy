import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Spin, Progress, Tooltip, Badge, Button, Row, Col } from 'antd';
import { StarFilled, CrownFilled, FireFilled } from '@ant-design/icons';
import axios from "axios";

const { Title, Text } = Typography;

const GamificationCard = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [badgeData, setBadgeData] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const pointsResponse = await axios.get(`http://localhost:8000/recompenses/user/${userId}/points`);
        const userPoints = pointsResponse.data.total || 0;
        setPoints(userPoints);
        
        try {
          const badgeResponse = await axios.get(`http://localhost:8000/api/badges/user/${userId}/latest`);
          setBadgeData(badgeResponse.data);
          setProgress(Math.min(100, (userPoints / (badgeResponse.data.badge?.minPoints + 100 || 200)) * 100));
        } catch (badgeErr) {
          if (badgeErr.response?.status !== 404) {
            console.error("Erreur récupération badge:", badgeErr);
          }
        }
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000000);
    return () => clearInterval(interval);
  }, [userId]);

  const getBadgeImage = () => {
    if (!badgeData?.idBadge) return null;
    const badgeImages = {
      1: require('../../assets/badge1.png'),
      2: require('../../assets/badge2.png'),
      3: require('../../assets/badge3.png'),
      4: require('../../assets/badge4.png')
    };
    return badgeImages[badgeData.idBadge] || null;
  };

  const getNextLevelPoints = () => {
    return badgeData?.badge ? badgeData.badge.minPoints + 100 : 100;
  };

  if (loading) return <Spin tip="Chargement..." />;
  if (error) return <Text type="danger">Erreur: {error}</Text>;

  return (
    <Card 
      title={
        <Space style={{ fontSize: '17px', color: '#2DBDAC' }}>
          <CrownFilled style={{ color: '#F36D8F' }} />
          <span>Votre Progression Éco-Responsable</span>
        </Space>
      }
      bordered={false}
      style={{ 
        width: '100%',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
        background: 'linear-gradient(135deg, #f8f9fa, #ffffff)'
      }}
      headStyle={{ 
        padding: '16px 24px',
        borderBottom: '1px solid #e8e8e8',
        background: 'linear-gradient(90deg, #2DBDAC20, #17B3DE20)'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      {/* Badge positionné entre le titre et la progression */}
      {badgeData && (
        <Row justify="center" style={{ margin: '0 0 20px 0' }}>
          <Col>
            <div 
              style={{
                textAlign: 'center',
                transition: 'transform 0.3s ease',
                transform: hovered ? 'scale(1.1)' : 'scale(1)'
              }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              <Tooltip title={badgeData.badge?.description}>
                <img 
                  src={getBadgeImage()} 
                  alt="Badge" 
                  style={{ 
                    width: '100px', // Taille augmentée
                    height: '100px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))'
                  }}
                />
              </Tooltip>
              <Text strong style={{ 
                display: 'block', 
                color: '#F36D8F',
                fontSize: '16px',
                marginTop: '8px'
              }}>
                {badgeData.badge?.titre}
              </Text>
            </div>
          </Col>
        </Row>
      )}

      <div>
        {/* Barre de progression */}
        <div style={{ marginBottom: '24px' }}>
          <Space size="large" align="center" style={{ marginBottom: '8px' }}>
            <FireFilled style={{ color: '#F36D8F', fontSize: '20px' }} />
            <Text strong style={{ color: '#2DBDAC', fontSize: '16px' }}>
              Progression vers le niveau {badgeData ? badgeData.idBadge + 1 : 1}
            </Text>
            <Badge 
              count={`${Math.round(progress)}%`} 
              style={{ 
                backgroundColor: '#17B3DE',
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Space>
          <Progress 
            percent={progress}
            strokeColor={{
              '0%': '#2DBDAC',
              '100%': '#17B3DE',
            }}
            trailColor="#f0f0f0"
            strokeWidth={12}
            showInfo={false}
          />
        </div>

        {/* Points et objectif */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '24px 0',
          gap: '16px'
        }}>
          <div style={{ 
            flex: 1,
            background: 'linear-gradient(135deg, #2DBDAC10, #17B3DE20)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid #2DBDAC20',
            boxShadow: '0 2px 12px rgba(45, 189, 172, 0.1)'
          }}>
            <Text strong style={{ display: 'block', color: '#2DBDAC', marginBottom: '8px' }}>
              Vos Points
            </Text>
            <Title level={2} style={{ margin: 0, color: '#2DBDAC' }}>
              {points}
            </Title>
          </div>

          <div style={{ 
            flex: 1,
            background: 'linear-gradient(135deg, #F36D8F10, #F36D8F20)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid #F36D8F20',
            boxShadow: '0 2px 12px rgba(243, 109, 143, 0.1)'
          }}>
            <Text strong style={{ display: 'block', color: '#F36D8F', marginBottom: '8px' }}>
              Prochain Niveau
            </Text>
            <Title level={2} style={{ margin: 0, color: '#F36D8F' }}>
              {getNextLevelPoints()}
            </Title>
          </div>
        </div>

        {/* Bouton d'action */}
        <Button 
          type="primary" 
          size="large"
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #2DBDAC, #17B3DE)',
            border: 'none',
            height: '48px',
            fontWeight: 'bold',
            fontSize: '16px',
            marginTop: '16px'
          }}
          icon={<StarFilled />}
        >
          Voir les défis disponibles
        </Button>
      </div>

      <div style={{ 
        marginTop: '24px', 
        textAlign: 'center',
        fontSize: '12px',
        color: '#888'
      }}>
        <Text>Mis à jour à {new Date().toLocaleTimeString('fr-FR')}</Text>
      </div>
    </Card>
  );
};

export default GamificationCard;