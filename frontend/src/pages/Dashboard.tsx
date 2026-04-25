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
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SchoolIcon from '@mui/icons-material/School';
import TimelineIcon from '@mui/icons-material/Timeline';
import DownloadIcon from '@mui/icons-material/Download';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
const API_BASE_URL = 'https://emotion-aware-its.onrender.com/api/v1';

interface DashboardData {
  user: {
    id: number;
    username: string;
    email: string;
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
    end_time: string | null;
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

const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = location.state || {};
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Wrap fetchDashboardData in useCallback to avoid recreation on each render
  const fetchDashboardData = useCallback(async () => {
    if (!userId) return;
    
    try {
      const res = await axios.get(`${API_BASE_URL}/dashboard/${userId}`);
      setDashboardData(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  }, [userId]);

  // Fix useEffect - add fetchDashboardData and navigate to dependencies
  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }
    fetchDashboardData();
  }, [userId, navigate, fetchDashboardData]);

  const exportToPDF = () => {
    if (!dashboardData) return;
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Learning Analytics Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated for: ${dashboardData.user.username}`, 20, 30);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
    doc.text(`Email: ${dashboardData.user.email}`, 20, 40);
    
    // User Summary
    doc.setFontSize(14);
    doc.text('User Summary', 20, 50);
    doc.setFontSize(10);
    doc.text(`Total Sessions: ${dashboardData.user.total_sessions}`, 20, 57);
    doc.text(`Total Questions: ${dashboardData.user.total_questions_answered}`, 20, 63);
    doc.text(`Correct Answers: ${dashboardData.user.total_correct}`, 20, 69);
    doc.text(`Total Attempts: ${dashboardData.user.total_attempts}`, 20, 75);
    doc.text(`Avg Attempts per Question: ${dashboardData.user.avg_attempts_per_question}`, 20, 81);
    
    // Session History
    doc.setFontSize(14);
    doc.text('Session History', 20, 91);
    
    const sessionData = dashboardData.sessions.map((s, idx) => [
      idx + 1,
      new Date(s.start_time).toLocaleDateString(),
      s.total_questions,
      s.correct_answers,
      `${s.score_percentage}%`,
      s.total_attempts
    ]);
    
    (doc as any).autoTable({
      startY: 95,
      head: [['#', 'Date', 'Questions', 'Correct', 'Score', 'Attempts']],
      body: sessionData,
      margin: { left: 20 },
    });
    
    // Question Attempts
    const finalY = (doc as any).lastAutoTable?.finalY || 130;
    doc.setFontSize(14);
    doc.text('Question Attempt Details', 20, finalY + 10);
    
    const questionData = dashboardData.question_attempts.map((q, idx) => [
      idx + 1,
      q.question_id,
      q.attempts,
      q.success ? '✅ Yes' : '❌ No'
    ]);
    
    (doc as any).autoTable({
      startY: finalY + 15,
      head: [['#', 'Question ID', 'Attempts', 'Solved']],
      body: questionData,
      margin: { left: 20 },
    });
    
    doc.save(`${dashboardData.user.username}_learning_report.pdf`);
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading dashboard...</Typography>
      </Container>
    );
  }

  if (error || !dashboardData) {
    return (
      <Container sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error">{error || 'No data available'}</Alert>
          <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
            Go Home
          </Button>
        </Paper>
      </Container>
    );
  }

  const totalScore = dashboardData.user.total_correct * 10 - dashboardData.user.total_attempts * 2;
  const accuracy = dashboardData.user.total_questions_answered > 0
    ? (dashboardData.user.total_correct / dashboardData.user.total_questions_answered * 100).toFixed(1)
    : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4">📊 Learning Dashboard</Typography>
            <Typography variant="subtitle1">Welcome back, {dashboardData.user.username}!</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />}
              onClick={exportToPDF}
              sx={{ bgcolor: 'white', color: '#667eea', '&:hover': { bgcolor: '#f0f0f0' } }}
            >
              Export Report
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/')}
              sx={{ color: 'white', borderColor: 'white' }}
            >
              Home
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SchoolIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">Total Score</Typography>
              </Box>
              <Typography variant="h4">{totalScore}</Typography>
              <Typography variant="caption" color="text.secondary">
                {dashboardData.user.total_correct} correct answers
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
              <Typography variant="h4">{accuracy}%</Typography>
              <Typography variant="caption" color="text.secondary">
                {dashboardData.user.total_correct}/{dashboardData.user.total_questions_answered}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimelineIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">Avg Attempts</Typography>
              </Box>
              <Typography variant="h4">{dashboardData.user.avg_attempts_per_question}</Typography>
              <Typography variant="caption" color="text.secondary">
                per question
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EmojiEventsIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">Sessions</Typography>
              </Box>
              <Typography variant="h4">{dashboardData.user.total_sessions}</Typography>
              <Typography variant="caption" color="text.secondary">
                learning sessions
              </Typography>
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
                      color={session.score_percentage >= 70 ? 'success' : session.score_percentage >= 50 ? 'warning' : 'error'}
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
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100, (1 / q.attempts) * 100)} 
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </Box>
          ))}
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button variant="contained" onClick={() => navigate('/')}>
          Start New Learning Session
        </Button>
      </Box>
    </Container>
  );
};

export default Dashboard;
