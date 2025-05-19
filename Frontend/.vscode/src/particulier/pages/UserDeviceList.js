import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { Table, Spin, Alert, Card, Typography, Input, Select, Row, Col } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { AuthContext } from "../../commun/context/AuthContext";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const UserDevicesList = () => {
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { idUser } = useContext(AuthContext);
  const [searchText, setSearchText] = useState('');
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // **Seuls changements : Ajout de vos couleurs dans une palette**
  const COLORS = ['#2DBDAC', '#F36D8F', '#17B3DE', '#2DBDAC80', '#F36D8F80', '#17B3DE80'];

  // **Tout le reste reste strictement identique**
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`http://localhost:8000/appareils/user/${idUser}`);
        setDevices(res.data);
        setFilteredDevices(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (idUser) fetchData();
  }, [idUser]);

  useEffect(() => {
    applyFilters();
  }, [searchText, selectedSite, selectedCategory, devices]);

  const applyFilters = () => {
    let result = [...devices];
    if (searchText) {
      const s = searchText.toLowerCase();
      result = result.filter(d =>
        d.nom.toLowerCase().includes(s) ||
        d.marque.toLowerCase().includes(s) ||
        d.modele.toLowerCase().includes(s) ||
        (d.categorie?.nom && d.categorie.nom.toLowerCase().includes(s)) ||
        (d.site?.nom && d.site.nom.toLowerCase().includes(s))
    )}
    if (selectedSite) result = result.filter(d => d.site?.idSite === selectedSite);
    if (selectedCategory) result = result.filter(d => d.categorie?.idCategorieAppareil === selectedCategory);
    setFilteredDevices(result);
  };

  const { uniqueSites, uniqueCategories, pieChartData } = useMemo(() => {
    const siteMap = new Map();
    const catMap = new Map();
    const catCount = {};

    devices.forEach(d => {
      if (d.site) siteMap.set(d.site.idSite, { id: d.site.idSite, name: d.site.nom });
      if (d.categorie) {
        catMap.set(d.categorie.idCategorieAppareil, { id: d.categorie.idCategorieAppareil, name: d.categorie.nom });
        const name = d.categorie.nom;
        catCount[name] = (catCount[name] || 0) + 1;
      }
    });

    const total = filteredDevices.length;
    const pieData = Object.keys(catCount).map(name => ({
      name,
      value: catCount[name],
      percent: total > 0 ? (catCount[name] / total) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    return {
      uniqueSites: Array.from(siteMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      uniqueCategories: Array.from(catMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      pieChartData: pieData
    };
  }, [devices, filteredDevices]);

  // **Seule modification : Ajout de couleurs dans les colonnes**
  const columns = [
    {
      title: 'Nom',
      dataIndex: 'nom',
      key: 'nom',
      sorter: (a, b) => a.nom.localeCompare(b.nom)
    },
    {
      title: 'Marque',
      dataIndex: 'marque',
      key: 'marque',
      sorter: (a, b) => a.marque.localeCompare(b.marque)
    },
    {
      title: 'Modèle',
      dataIndex: 'modele',
      key: 'modele',
      sorter: (a, b) => a.modele.localeCompare(b.modele)
    },
    {
      title: 'Puissance (W)',
      dataIndex: 'puissance',
      key: 'puissance',
      render: val => <span style={{ color: '#17B3DE', fontWeight: '500' }}>{val} W</span>,
      sorter: (a, b) => a.puissance - b.puissance
    },
    {
      title: 'Catégorie',
      dataIndex: ['categorie', 'nom'],
      key: 'categorie',
      render: text => <span style={{ color: '#2DBDAC', fontWeight: '500' }}>{text || 'N/A'}</span>
    },
    {
      title: 'Site',
      dataIndex: ['site', 'nom'],
      key: 'site',
      render: text => <span style={{ color: '#F36D8F', fontWeight: '500' }}>{text || 'N/A'}</span>
    }
  ];

  if (!idUser) {
    return <Alert message="Erreur" description="Utilisateur non identifié" type="error" showIcon />;
  }

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" tip="Chargement en cours..." /></div>;
  }

  if (error) {
    return (
      <Alert 
        message="Erreur"
        description={`${error}\nVeuillez vérifier que le backend est bien démarré sur le port 8000.`} 
        type="error" 
        showIcon 
      />
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card style={{ marginBottom: '20px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Rechercher un appareil"
              allowClear
              enterButton
              size="middle"
              onChange={e => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filtrer par site"
              style={{ width: '100%' }}
              size="middle"
              allowClear
              onChange={setSelectedSite}
              showSearch
              filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
            >
              {uniqueSites.map(site => (
                <Option key={site.id} value={site.id}>{site.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filtrer par catégorie"
              style={{ width: '100%' }}
              size="middle"
              allowClear
              onChange={setSelectedCategory}
              showSearch
              filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
            >
              {uniqueCategories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="APPAREILS">
            <Table 
              dataSource={filteredDevices}
              columns={columns}
              rowKey="idAppareil"
              pagination={{ 
                pageSize: 5,
                showSizeChanger: false,
                showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} appareils`
              }}
              locale={{ emptyText: 'Aucun appareil trouvé' }}
              size="middle"
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="RÉPARTITION PAR CATÉGORIE">
            {pieChartData.length > 0 ? (
              <div style={{ width: '100%', height: 380 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${percent.toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} appareils`, 'Quantité']}
                      labelFormatter={(label) => `Catégorie: ${label}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Text>Aucune donnée à afficher</Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserDevicesList;