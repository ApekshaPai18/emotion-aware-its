import React from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Grid,
  Alert 
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface EmotionStats {
  happy: number;
  neutral: number;
  sad: number;
  frustrated: number;
  surprise: number;
  confused: number;
}

interface Stats {
  totalQuestions: number;
  correctAnswers: number;
  emotions: EmotionStats;
  quizAnswers: boolean[];
}

interface ResultsState {
  userId?: number;
  sessionId?: number;
  userName?: string;
  stats: Stats;
}

const Results: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultsState;
  
  if (!state || !state.stats) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          No results data found. Please complete a quiz first.
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Go to Home
        </Button>
      </Container>
    );
  }

  const userName = state.userName || 'User';
  const userId = state.userId;
  const stats = state.stats;
  
  const totalQuestions = stats.totalQuestions || 0;
  const correctAnswers = Math.min(stats.correctAnswers || 0, totalQuestions);
  const successRate = totalQuestions > 0 
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0;

  const emotions = stats.emotions || {
    happy: 0, neutral: 0, sad: 0, frustrated: 0, surprise: 0, confused: 0
  };

  const quizAnswers: boolean[] = Array.isArray(stats.quizAnswers) ? stats.quizAnswers : [];

  const chartData = {
    labels: ['Happy', 'Neutral', 'Sad', 'Frustrated', 'Surprise', 'Confused'],
    datasets: [
      {
        label: 'Times Detected',
        data: [
          emotions.happy,
          emotions.neutral,
          emotions.sad,
          emotions.frustrated,
          emotions.surprise,
          emotions.confused
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 206, 86, 0.8)',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Emotions During Quiz' },
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { stepSize: 1 },
        title: { display: true, text: 'Number of Times' }
      },
      x: { title: { display: true, text: 'Emotion' } }
    },
  };

  const totalEmotions = Object.values(emotions).reduce((a, b) => a + b, 0);
  
  let dominantEmotion = 'neutral';
  let maxCount = 0;
  Object.entries(emotions).forEach(([emotion, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantEmotion = emotion;
    }
  });

  const getEmoji = (emotion: string): string => {
    const emojis: Record<string, string> = {
      happy: '😊', neutral: '😐', sad: '😢',
      frustrated: '😤', surprise: '😲', confused: '🤔'
    };
    return emojis[emotion] || '😐';
  };

  const handleStartNewSession = async () => {
    if (!userId) {
      navigate('/');
      return;
    }
    
    try {
      const sessionRes = await axios.post('http://localhost:8000/api/v1/sessions/', {
        user_id: userId
      });
      
      navigate('/learn', {
        state: {
          userId: userId,
          sessionId: sessionRes.data.session_id,
          userName: userName
        }
      });
    } catch (error) {
      console.error('Failed to create new session:', error);
      navigate('/');
    }
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h3" gutterBottom>
          🎉 Learning Complete!
        </Typography>
        <Typography variant="h5">
          Great job, {userName}!
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Questions
              </Typography>
              <Typography variant="h2" color="primary" align="center">
                {totalQuestions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Correct Answers
              </Typography>
              <Typography variant="h2" color="success.main" align="center">
                {correctAnswers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Success Rate
              </Typography>
              <Typography variant="h2" color="warning.main" align="center">
                {successRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={3} sx={{ p: 3, height: '400px' }}>
            <Bar data={chartData} options={chartOptions} />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={3} sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Emotion Summary
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Total emotions:</strong> {totalEmotions}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Most frequent:</strong> {dominantEmotion} {getEmoji(dominantEmotion)}
              </Typography>
            </Box>

            <Box sx={{ mt: 'auto' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Breakdown:
              </Typography>
              {Object.entries(emotions).map(([emotion, count]) => (
                <Box key={emotion} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    {emotion} {getEmoji(emotion)}:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {count}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Question Results
            </Typography>
            {quizAnswers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No quiz answers recorded.
              </Typography>
            ) : (
              <>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  {quizAnswers.map((correct: boolean, idx: number) => (
                    <Box
                      key={idx}
                      sx={{
                        width: 50,
                        height: 50,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 2,
                        bgcolor: correct ? 'success.main' : 'error.main',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.2rem'
                      }}
                    >
                      {idx + 1}
                    </Box>
                  ))}
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, bgcolor: 'success.main', borderRadius: 1 }} />
                    <Typography variant="body2">Correct</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, bgcolor: 'error.main', borderRadius: 1 }} />
                    <Typography variant="body2">Wrong</Typography>
                  </Box>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleStartNewSession}
          sx={{ px: 4, py: 1.5, background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)' }}
        >
          Start New Session
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate('/dashboard', { state: { userId, userName } })}
          startIcon={<DashboardIcon />}
        >
          Dashboard
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate('/leaderboard')}
          startIcon={<LeaderboardIcon />}
        >
          Leaderboard
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={handleHome}
        >
          Logout / Change User
        </Button>
      </Box>
    </Container>
  );
};

export default Results;