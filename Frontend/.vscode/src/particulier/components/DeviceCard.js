import React from 'react';
import { Card, Tag, Popover, Button } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const DeviceCard = ({ device, colors }) => {
  return (
    <Card
      hoverable
      style={{ borderRadius: 8 }}
      cover={
        <div style={{ 
          height: 120,
          background: colors.background,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <img 
            alt={device.nom} 
            src={`/icons/${device.categorie?.nom || 'default'}.png`} 
            style={{ maxHeight: 80, maxWidth: 120 }}
          />
        </div>
      }
      actions={[
        <Popover content={`Détails pour ${device.nom}`} trigger="hover">
          <InfoCircleOutlined style={{ color: colors.accent }} />
        </Popover>
      ]}
    >
      <Card.Meta
        title={device.nom}
        description={
          <>
            <p>{device.marque} {device.modele}</p>
            <Tag color={colors.accent}>{device.puissance} W</Tag>
            <Tag color={colors.primary}>{device.categorie?.nom || 'N/A'}</Tag>
            <Tag color={colors.secondary}>{device.site?.nom || 'N/A'}</Tag>
          </>
        }
      />
    </Card>
  );
};

export default DeviceCard;