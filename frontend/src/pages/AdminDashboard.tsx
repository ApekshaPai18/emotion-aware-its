import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  total_sessions: number;
  total_questions: number;
  total_correct: number;
}

interface DashboardData {
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    created_at: string;
    total_sessions: number;
    total_questions_answered: number;
    total_correct: number;
    total_attempts: number;
    avg_attempts_per_question: number;
  };
  sessions: Array<{
    id: number;
    start_time: string;
    total_questions: number;
    correct_answers: number;
    total_attempts: number;
    score_percentage: number;
  }>;
  question_attempts: Array<{
    question_id: string;
    attempts: number;
    success: boolean;
  }>;
}

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, userName, userRole } = location.state || {};
  
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Define fetchUsers FIRST (before using it in useEffect)
  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/v1/admin/users/');
      setUsers(res.data);
      if (res.data.length > 0 && !selectedUserId) {
        setSelectedUserId(res.data[0].id);
        fetchUserDashboard(res.data[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
      setLoading(false);
    }
  }, [selectedUserId]);

  // Define fetchUserDashboard
  const fetchUserDashboard = useCallback(async (uid: number) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/v1/admin/dashboard/${uid}`);
      setDashboardData(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load user dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  // Now useEffect can safely use fetchUsers
  useEffect(() => {
    if (!userId || userRole !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [userId, userRole, navigate, fetchUsers]);

  const handleUserChange = (event: any) => {
    const uid = event.target.value;
    setSelectedUserId(uid);
    fetchUserDashboard(uid);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  if (loading && users.length === 0) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading admin dashboard...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Admin Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #dc004e 0%, #b0003a 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4">👑 Admin Dashboard</Typography>
            <Typography variant="subtitle1">
              Welcome, {userName || 'Admin'}! Manage all learners
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/')}
              sx={{ color: 'white', borderColor: 'white' }}
            >
              Home
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/leaderboard')}
              sx={{ color: 'white', borderColor: 'white' }}
            >
              Leaderboard
            </Button>
          </Box>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* User Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <PeopleIcon color="primary" />
          <Typography variant="h6">Select Student to View</Typography>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select Student</InputLabel>
            <Select
              value={selectedUserId || ''}
              onChange={handleUserChange}
              label="Select Student"
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.username} ({user.role})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={() => selectedUserId && fetchUserDashboard(selectedUserId)}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {dashboardData && (
        <>
          {/* User Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SchoolIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">Student</Typography>
                  </Box>
                  <Typography variant="h5">{dashboardData.user.username}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dashboardData.user.email}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">Accuracy</Typography>
                  </Box>
                  <Typography variant="h4">
                    {dashboardData.user.total_questions_answered > 0
                      ? ((dashboardData.user.total_correct / dashboardData.user.total_questions_answered) * 100).toFixed(1)
                      : 0}%
                  </Typography>
                  <Typography variant="caption">
                    {dashboardData.user.total_correct}/{dashboardData.user.total_questions_answered}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Sessions</Typography>
                  <Typography variant="h4">{dashboardData.user.total_sessions}</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Avg Attempts</Typography>
                  <Typography variant="h4">{dashboardData.user.avg_attempts_per_question}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Session History */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>📅 Session History</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Questions</TableCell>
                    <TableCell align="right">Correct</TableCell>
                    <TableCell align="right">Attempts</TableCell>
                    <TableCell align="right">Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{new Date(session.start_time).toLocaleDateString()}</TableCell>
                      <TableCell align="right">{session.total_questions}</TableCell>
                      <TableCell align="right">{session.correct_answers}</TableCell>
                      <TableCell align="right">{session.total_attempts}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={`${session.score_percentage}%`} 
                          size="small"
                          color={getScoreColor(session.score_percentage)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Question Attempt Details */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>📝 Question Attempt Details</Typography>
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {dashboardData.question_attempts.map((q, idx) => (
                <Box key={idx} sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Question {idx + 1}:</strong> {q.question_id}
                    </Typography>
                    <Chip 
                      label={q.success ? 'Solved ✅' : 'Not Solved ❌'} 
                      size="small"
                      color={q.success ? 'success' : 'error'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Attempts: {q.attempts}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default AdminDashboard;
