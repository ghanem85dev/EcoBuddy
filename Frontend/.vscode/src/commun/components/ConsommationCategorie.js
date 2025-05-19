import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';

ChartJS.register(ArcElement, Tooltip, Legend);

const TopSitesDoughnutChart = ({ userId, type = 'site' }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [rawData, setRawData] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showAppareilsDetails, setShowAppareilsDetails] = useState(false);
  const [appareilsData, setAppareilsData] = useState([]);
  const [appareilsLoading, setAppareilsLoading] = useState(false);

  // Déterminer les textes en fonction du type
  const entityName = type === 'entreprise' ? 'entreprise' : 'site';
  const EntityName = type === 'entreprise' ? 'Entreprise' : 'Site';
  const title = type === 'entreprise' ? 'Top 3 entreprises énergivores' : 'Top 3 sites énergivores';
  const detailsTitle = type === 'entreprise' ? 'Détails par entreprise' : 'Détails par site';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const endpoint = type === 'entreprise' 
          ? `http://localhost:8000/dashboard/top-entreprises/${userId}`
          : `http://localhost:8000/dashboard/top-sites/${userId}`;
        
        const response = await axios.get(endpoint, {
          params: {
            month,
            year,
            limit: 5
          }
        });
        
        if (response.data && response.data.length > 0) {
          const total = response.data.reduce((sum, item) => sum + item.consumption, 0);
          setRawData(response.data);
          
          const data = {
            labels: response.data.map(item => type === 'entreprise' ? item.entreprise_name : item.site_name),
            datasets: [
              {
                data: response.data.map(item => item.consumption),
                backgroundColor: [
                  '#17B3DE',
                  '#2DBDAC',
                  '#D3D3D3',
                ],
                hoverBackgroundColor: [
                  '#17B3DE',
                  '#2DBDAC',
                  '#C0C0C0',
                ],
                borderWidth: 1,
                borderColor: '#fff',
              }
            ],
            total: total,
            ids: response.data.map(item => type === 'entreprise' ? item.entreprise_id : item.site_id)
          };
          setChartData(data);
        } else {
          setChartData(null);
          setRawData([]);
        }
      } catch (err) {
        const errorMessage = err.response?.data?.detail 
          || err.response?.data?.message 
          || err.message 
          || 'Erreur lors de la récupération des données';
          
        setError(errorMessage);
        setChartData(null);
        setRawData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, month, year, type]);

  const fetchAppareilsDetails = async (id) => {
    try {
      setAppareilsLoading(true);
      const endpoint = type === 'entreprise' 
        ? `http://localhost:8000/consommation/entreprise/${id}/details`
        : `http://localhost:8000/consommation/site/${id}/details`;
      
      const response = await axios.get(endpoint, {
        params: {
          month,
          year
        }
      });
      setAppareilsData(response.data);
    } catch (err) {
      console.error(`Erreur lors de la récupération des appareils:`, err);
      setAppareilsData([]);
    } finally {
      setAppareilsLoading(false);
    }
  };

  const handleEntityClick = async (id) => {
    setSelectedId(id);
    await fetchAppareilsDetails(id);
    setShowAppareilsDetails(true);
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.chart.data.total || 1;
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value.toFixed(2)} kWh (${percentage}%)`;
          }
        },
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
        padding: 10,
        displayColors: true,
        caretPadding: 10,
        bodySpacing: 5
      }
    },
    cutout: '65%',
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const id = chartData.ids[index];
        handleEntityClick(id);
      }
    }
  };

  const handleMonthYearChange = (e) => {
    const [selectedYear, selectedMonth] = e.target.value.split('-');
    setMonth(parseInt(selectedMonth));
    setYear(parseInt(selectedYear));
  };

  const getCurrentMonthYear = () => {
    return `${year}-${month.toString().padStart(2, '0')}`;
  };

  const closeAppareilsDetails = () => {
    setShowAppareilsDetails(false);
    setSelectedId(null);
    setAppareilsData([]);
  };

  const getSelectedEntityName = () => {
    if (!selectedId) return '';
    const entity = rawData.find(item => 
      (type === 'entreprise' ? item.entreprise_id : item.site_id) === selectedId
    );
    return entity ? (type === 'entreprise' ? entity.entreprise_name : entity.site_name) : '';
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      padding: '20px',
      marginBottom: '20px',
      height: '90%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Modal des appareils */}
      {showAppareilsDetails && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(5px)',
            zIndex: 100,
          }} onClick={closeAppareilsDetails} />
          
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '20px',
            width: '80%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflowY: 'auto',
            zIndex: 101,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#333',
                margin: 0
              }}>
                Appareils de {entityName}: {getSelectedEntityName()}
              </h3>
              <button 
                onClick={closeAppareilsDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            {appareilsLoading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100px',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div className="spinner"></div>
                <p style={{ color: '#666' }}>Chargement des appareils...</p>
              </div>
            ) : appareilsData.length > 0 ? (
              <div style={{
                overflowX: 'auto',
                borderRadius: '6px',
                border: '1px solid #eee'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#f5f5f5',
                      textAlign: 'left'
                    }}>
                      <th style={{ padding: '10px 12px', borderBottom: '1px solid #eee' }}>Appareil</th>
                      <th style={{ padding: '10px 12px', borderBottom: '1px solid #eee' }}>Marque/Modèle</th>
                      <th style={{ padding: '10px 12px', borderBottom: '1px solid #eee', textAlign: 'right' }}>Puissance (W)</th>
                      <th style={{ padding: '10px 12px', borderBottom: '1px solid #eee', textAlign: 'right' }}>Consommation (kWh)</th>
                      <th style={{ padding: '10px 12px', borderBottom: '1px solid #eee', textAlign: 'right' }}>Moyenne/jour</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appareilsData.map((appareil, index) => (
                      <tr 
                        key={index} 
                        style={{
                          borderBottom: '1px solid #eee',
                          ':last-child': {
                            borderBottom: 'none'
                          }
                        }}
                      >
                        <td style={{ padding: '10px 12px' }}>{appareil.appareil_nom}</td>
                        <td style={{ padding: '10px 12px' }}>{appareil.marque} {appareil.modele}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>{appareil.puissance}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>{appareil.consommation_totale.toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>{appareil.consommation_moyenne_journaliere.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ 
                color: '#666',
                textAlign: 'center',
                padding: '20px'
              }}>
                Aucun appareil trouvé pour cette {entityName}
              </div>
            )}
          </div>
        </>
      )}

      {/* Contenu principal */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#333',
          margin: 0
        }}>
          {title}
        </h3>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="month"
            value={getCurrentMonthYear()}
            onChange={handleMonthYearChange}
            style={{ 
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>
      
      {loading && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '300px',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div className="spinner"></div>
          <p style={{ color: '#666' }}>Chargement des données...</p>
        </div>
      )}
      
      {error && (
        <div style={{ 
          color: '#d32f2f', 
          backgroundColor: '#fdecea', 
          padding: '12px 16px', 
          borderRadius: '6px',
          marginBottom: '20px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#d32f2f">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <div>
            <strong>Erreur :</strong> {error}
          </div>
        </div>
      )}
      
      <div style={{ 
        height: '180px',
        position: 'relative',
        flexGrow: 0,
        cursor: 'pointer'
      }}>
        {chartData ? (
          <>
            <Doughnut 
              data={chartData} 
              options={{
                ...options,
                plugins: {
                  ...options.plugins,
                  legend: {
                    display: false
                  },
                  tooltip: {
                    ...options.plugins.tooltip,
                    bodyFont: {
                      size: 10
                    }
                  }
                }
              }} 
            />
            {chartData.total && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  {chartData.total.toFixed(2)} kWh
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#666'
                }}>
                  Total
                </div>
              </div>
            )}
          </>
        ) : !loading && !error ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: '#666',
            fontSize: '14px'
          }}>
            <p>Aucune donnée disponible pour cette période</p>
          </div>
        ) : null}
      </div>
      
      {/* Légende personnalisée */}
      {chartData && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px',
          margin: '10px 0',
          padding: '10px 0'
        }}>
          {chartData.labels.map((label, index) => {
            const value = chartData.datasets[0].data[index];
            const percentage = Math.round((value / chartData.total) * 100);
            const color = chartData.datasets[0].backgroundColor[index];
            const id = chartData.ids[index];
            
            return (
              <div 
                key={index} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#f5f5f5',
                  cursor: 'pointer'
                }}
                onClick={() => handleEntityClick(id)}
              >
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: color,
                  borderRadius: '50%'
                }}></div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '500'
                }}>{label}</span>
                <span style={{
                  fontSize: '12px',
                  color: '#666'
                }}>({percentage}%)</span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Tableau de détails */}
      {rawData.length > 0 && (
        <div style={{
          marginTop: '10px',
          borderTop: '1px solid #eee',
          paddingTop: '15px'
        }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#333',
            marginBottom: '10px'
          }}>
            {detailsTitle}
          </h4>
          
          <div style={{
            overflowX: 'auto',
            borderRadius: '6px',
            border: '1px solid #eee'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: '#f5f5f5',
                  textAlign: 'left'
                }}>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid #eee' }}>{EntityName}</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid #eee', textAlign: 'right' }}>Consommation (kWh)</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid #eee', textAlign: 'right' }}>Pourcentage</th>
                </tr>
              </thead>
              <tbody>
                {rawData.map((item, index) => {
                  const percentage = Math.round((item.consumption / chartData.total) * 100);
                  const color = chartData.datasets[0].backgroundColor[index];
                  const id = type === 'entreprise' ? item.entreprise_id : item.site_id;
                  
                  return (
                    <tr 
                      key={index} 
                      style={{
                        borderBottom: '1px solid #eee',
                        ':last-child': {
                          borderBottom: 'none'
                        }
                      }}
                      onClick={() => handleEntityClick(id)}
                    >
                      <td style={{ 
                        padding: '10px 12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        cursor: 'pointer'
                      }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          backgroundColor: color,
                          borderRadius: '50%'
                        }}></div>
                        {type === 'entreprise' ? item.entreprise_name : item.site_name}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', cursor: 'pointer' }}>{item.consumption.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', cursor: 'pointer' }}>{percentage}%</td>
                    </tr>
                  );
                })}
                <tr style={{
                  backgroundColor: '#f5f5f5',
                  fontWeight: '600'
                }}>
                  <td style={{ padding: '10px 12px' }}>Total</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{chartData.total.toFixed(2)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div style={{
        marginTop: '15px',
        fontSize: '12px',
        color: '#666',
        textAlign: 'center',
        paddingTop: '10px',
        borderTop: rawData.length > 0 ? 'none' : '1px solid #eee'
      }}>
      </div>
    </div>
  );
};

export default TopSitesDoughnutChart;