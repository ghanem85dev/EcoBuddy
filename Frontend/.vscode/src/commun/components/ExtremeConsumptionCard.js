import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Spin, Tag, Divider } from 'antd';
import { ThunderboltOutlined, PoweroffOutlined, HomeOutlined, BulbOutlined ,BankOutlined} from '@ant-design/icons';
import axios from "axios";

const { Title, Text } = Typography;
const ExtremeConsumptionCard = ({ type, userId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('sites'); // 'sites' ou 'companies'
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let endpoint;
        
        if (type === 'appareil') {
          endpoint = `http://localhost:8000/dashboard/extreme-consuming-devices/${userId}`;
        } else if (type === 'site') {
          endpoint = `http://localhost:8000/dashboard/extreme-consuming-sites/${userId}`;
        } else {
          endpoint = `http://localhost:8000/dashboard/extreme-consuming-companies/${userId}`;
        }
        // Ajouter le mois et l'année courants
        const now = new Date();
        const response = await axios.get(`${endpoint}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
        
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, userId]);

  if (loading) return <Spin tip="Chargement..." />;
  if (error) return <Text type="danger">Erreur: {error}</Text>;
  if (!data) return null;

  const isDevice = type === 'appareil';
  const isCompanyView = type === 'entreprise';
  const icon = isDevice ? <ThunderboltOutlined /> : 
               isCompanyView ? <BankOutlined /> : <HomeOutlined />;
  const getTitle = () => {
    if (isDevice) return 'Appareils extrêmes';
    if (isCompanyView) return 'Entreprises extrêmes';
    return 'Sites extrêmes';
  };
               
  return (
    <Card 
      title={
        <Space style={{ fontSize: '17px' }}>
          {icon}
          {getTitle()}
        </Space>
      }
      bordered={false}
      style={{ 
        width: '100%',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}
      headStyle={{ padding: '12px' }}
      bodyStyle={{ padding: '12px' }}
    >
      <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
        {/* Carte pour le plus consommateur */}
        <Card 
          style={{ 
            flex: 1,
            borderLeft: '3px solid #17B3DE',
            borderRadius: '6px'
          }}
          bodyStyle={{ padding: '12px' }}
        >
          <Space direction="vertical" size="small">
            <Tag 
              color="#17B3DE" 
              icon= {<PoweroffOutlined style={{ fontSize: '12px' }} />}
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              Plus consommateur
            </Tag>
            <Title level={5} style={{ margin: 0, fontSize: '16px' }}>
            {isDevice 
                ? data.most_consuming.appareil_name 
                : isCompanyView
                  ? data.most_consuming.company_name
                  : data.most_consuming.site_name}
            </Title>
            
            <Divider style={{ margin: '4px 0' }} />
            <Space>
              <BulbOutlined style={{ color: '#17B3DE', fontSize: '12px' }} />
              <Text strong style={{ fontSize: '14px' }}>{data.most_consuming.consumption} kWh</Text>
            </Space>
          </Space>
        </Card>

        {/* Carte pour le moins consommateur */}
        <Card 
          style={{ 
            flex: 1,
            borderLeft: '3px solid #53d4c4',
            borderRadius: '6px'
          }}
          bodyStyle={{ padding: '12px' }}
        >
          <Space direction="vertical" size="small">
            <Tag 
              color="#53d4c4" 
              icon={<PoweroffOutlined style={{ fontSize: '12px' }} />}
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              Moins consommateur
            </Tag>
            <Title level={5} style={{ margin: 0, fontSize: '16px' }}>
            {isDevice 
                ? data.least_consuming.appareil_name 
                : isCompanyView
                  ? data.least_consuming.company_name
                  : data.least_consuming.site_name}
            </Title>
            
            <Divider style={{ margin: '4px 0' }} />
            <Space>
              <BulbOutlined style={{ color: '#53d4c4', fontSize: '12px' }} />
              <Text strong style={{ fontSize: '14px' }}>{data.least_consuming.consumption} kWh</Text>
            </Space>
          </Space>
        </Card>
      </div>

      <div style={{ marginTop: '8px', textAlign: 'center' }}>
      <Text type="secondary" style={{ fontSize: '12px', color: '#F36D8F' }}>
  Données pour {new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
</Text>
      </div>
    </Card>
  );
};

export default ExtremeConsumptionCard;