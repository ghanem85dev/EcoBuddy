import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  MenuItem,
  Select,
  Pagination,
  Stack,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress,
  Box,
  Avatar,
  Typography,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';

const UsersAdminPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('nom');
  const [sortDirection, setSortDirection] = useState('asc');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(8);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  // Couleurs personnalisées
  const colors = {
    primary: '#2DBDAC',
    secondary: '#F36D8F',
    accent: '#17B3DE',
    background: '#f8fafc',
    text: '#334155'
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, sortField, sortDirection]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/users');
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      setLoading(false);
      console.error(err);
    }
  };

  const filterAndSortUsers = () => {
    let result = [...users];
    
    // Filtrage
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        (user.nom && user.nom.toLowerCase().includes(term)) ||
        (user.prenom && user.prenom.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term)) ||
        (user.role && user.role.toLowerCase().includes(term))
      );
    }
    
    // Tri
    result.sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredUsers(result);
    setPage(1);
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(selectedUser?.id === user.id ? null : user);
  };

  const handleEditUser = (userId, e) => {
    e.stopPropagation();
    navigate(`/admin/users/edit/${userId}`);
  };

  const handleDeleteClick = (user, e) => {
    e.stopPropagation();
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:8000/api/users/${userToDelete.id}`);
      setSnackbar({ open: true, message: 'Utilisateur supprimé avec succès', severity: 'success' });
      fetchUsers();
    } catch (err) {
      setSnackbar({ open: true, message: 'Erreur lors de la suppression', severity: 'error' });
      console.error(err);
    }
    setOpenDeleteDialog(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Pagination
  const count = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress style={{ color: colors.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: colors.background,
      minHeight: '100vh'
    }}>
      <Box sx={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        padding: '24px'
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <Typography variant="h4" style={{ 
            color: colors.text,
            fontWeight: '600'
          }}>
            Gestion des Utilisateurs
          </Typography>
          
        
        </Box>
        
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '16px'
        }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon style={{ 
                  marginRight: '8px', 
                  color: colors.text 
                }} />
              ),
              style: {
                borderRadius: '8px',
                backgroundColor: colors.background
              }
            }}
            fullWidth
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Typography variant="body2" style={{ color: colors.text }}>
              Trier par:
            </Typography>
            <Select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              size="small"
              style={{
                minWidth: '120px',
                borderRadius: '8px',
                backgroundColor: colors.background
              }}
            >
              <MenuItem value="nom">Nom</MenuItem>
              <MenuItem value="prenom">Prénom</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="role">Rôle</MenuItem>
            </Select>
            <IconButton 
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              size="small"
              style={{ 
                color: colors.primary,
                backgroundColor: colors.background,
                borderRadius: '8px'
              }}
            >
              {sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
            </IconButton>
          </Box>
        </Box>
        
        <TableContainer component={Paper} style={{ 
          borderRadius: '12px',
          border: `1px solid #e2e8f0`,
          marginBottom: '24px'
        }}>
          <Table>
            <TableHead>
              <TableRow style={{ 
                backgroundColor: colors.background 
              }}>
                <TableCell style={{ 
                  fontWeight: '600',
                  color: colors.text
                }}>
                  Utilisateur
                </TableCell>
                <TableCell style={{ 
                  fontWeight: '600',
                  color: colors.text
                }}>
                  Email
                </TableCell>
                <TableCell style={{ 
                  fontWeight: '600',
                  color: colors.text
                }}>
                  Rôle
                </TableCell>
                <TableCell style={{ 
                  fontWeight: '600',
                  color: colors.text
                }}>
                  Budget
                </TableCell>
                
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <TableRow 
                      hover 
                      onClick={() => handleUserClick(user)}
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: selectedUser?.id === user.id ? '#f0fdf4' : 'inherit'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Avatar style={{ 
                            backgroundColor: colors.accent,
                            color: 'white'
                          }}>
                            {user.prenom?.charAt(0) || user.nom?.charAt(0) || 'U'}
                          </Avatar>
                          <Box>
                            <Typography style={{ fontWeight: '500' }}>
                              {user.prenom} {user.nom}
                            </Typography>
                            <Typography variant="body2" style={{ color: '#64748b' }}>
                              {user.telephone || '-'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography style={{ color: colors.text }}>
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 12px',
                          borderRadius: '16px',
                          backgroundColor: user.role === 'admin' ? '#e0f2fe' : '#ecfdf5',
                          color: user.role === 'admin' ? colors.accent : colors.primary
                        }}>
                          {user.role}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography style={{ 
                          fontWeight: '500',
                          color: colors.text
                        }}>
                          {user.budget_max ? `${user.budget_max} €` : '-'}
                        </Typography>
                      </TableCell>
                      
                    </TableRow>
                    {selectedUser?.id === user.id && (
                      <TableRow>
                        <TableCell colSpan={5} style={{ 
                          backgroundColor: '#f8fafc',
                          padding: '16px 24px'
                        }}>
                          <Box sx={{ 
                            display: 'flex',
                            gap: '24px',
                            alignItems: 'flex-start'
                          }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" style={{ 
                                marginBottom: '12px',
                                color: colors.text,
                                fontWeight: '500'
                              }}>
                                Détails de l'utilisateur
                              </Typography>
                              <Box sx={{ 
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '12px'
                              }}>
                                <div>
                                  <Typography variant="body2" style={{ color: '#64748b' }}>
                                    Nom complet
                                  </Typography>
                                  <Typography>
                                    {user.prenom} {user.nom}
                                  </Typography>
                                </div>
                                <div>
                                  <Typography variant="body2" style={{ color: '#64748b' }}>
                                    Email
                                  </Typography>
                                  <Typography>
                                    {user.email}
                                  </Typography>
                                </div>
                                <div>
                                  <Typography variant="body2" style={{ color: '#64748b' }}>
                                    Téléphone
                                  </Typography>
                                  <Typography>
                                    {user.telephone || '-'}
                                  </Typography>
                                </div>
                                <div>
                                  <Typography variant="body2" style={{ color: '#64748b' }}>
                                    Rôle
                                  </Typography>
                                  <Typography>
                                    {user.role}
                                  </Typography>
                                </div>
                                <div>
                                  <Typography variant="body2" style={{ color: '#64748b' }}>
                                    Budget maximum
                                  </Typography>
                                  <Typography>
                                    {user.budget_max ? `${user.budget_max} €` : '-'}
                                  </Typography>
                                </div>
                                <div>
                                  <Typography variant="body2" style={{ color: '#64748b' }}>
                                    Adresse
                                  </Typography>
                                  <Typography>
                                    {user.adresse || '-'}
                                  </Typography>
                                </div>
                              </Box>
                            </Box>
                            <Box sx={{ 
                              width: '200px',
                              backgroundColor: '#f1f5f9',
                              borderRadius: '8px',
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Avatar style={{ 
                                width: '80px',
                                height: '80px',
                                backgroundColor: colors.accent,
                                color: 'white',
                                marginBottom: '12px',
                                fontSize: '32px'
                              }}>
                                {user.prenom?.charAt(0) || user.nom?.charAt(0) || 'U'}
                              </Avatar>
                              <Typography style={{ 
                                fontWeight: '500',
                                textAlign: 'center'
                              }}>
                                {user.prenom} {user.nom}
                              </Typography>
                              <Typography variant="body2" style={{ 
                                color: '#64748b',
                                textAlign: 'center'
                              }}>
                                {user.role}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                    <Typography variant="body1" style={{ color: colors.text }}>
                      Aucun utilisateur trouvé
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px'
        }}>
          <Typography variant="body2" style={{ color: '#64748b' }}>
            {filteredUsers.length} utilisateurs trouvés
          </Typography>
          <Pagination
            count={count}
            page={page}
            onChange={(event, value) => setPage(value)}
            color="primary"
            shape="rounded"
            style={{
              '& .MuiPaginationItem-root': {
                borderRadius: '8px'
              },
              '& .Mui-selected': {
                backgroundColor: `${colors.primary} !important`,
                color: 'white'
              }
            }}
          />
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
            style={{
              color: colors.text,
              textTransform: 'none'
            }}
          >
            Actualiser
          </Button>
        </Box>
      </Box>
      
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          style: {
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle style={{ color: colors.text }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <DialogContentText style={{ color: colors.text }}>
            Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete?.email}</strong> ?
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDeleteDialog(false)}
            style={{ 
              color: colors.text,
              textTransform: 'none'
            }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            style={{ 
              backgroundColor: colors.secondary,
              color: 'white',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#e0557b'
              }
            }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          style={{
            backgroundColor: snackbar.severity === 'success' ? colors.primary : colors.secondary,
            color: 'white'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default UsersAdminPage;