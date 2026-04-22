import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Card,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';

interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  total_score: number;
  total_questions: number;
  correct_answers: number;
  best_streak: number;
  total_sessions: number;
  accuracy: number;
}

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/v1/leaderboard/');
      setLeaderboard(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
      setLoading(false);
    }
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#1976d2';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading leaderboard...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4">🏆 Leaderboard</Typography>
            <Typography variant="subtitle1">Top learners of the week</Typography>
          </Box>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/')}
            sx={{ color: 'white', borderColor: 'white' }}
          >
            Home
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Top 3 Highlight */}
      {leaderboard.length >= 3 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 4, flexWrap: 'wrap' }}>
          {[0, 1, 2].map((idx) => {
            const entry = leaderboard[idx];
            if (!entry) return null;
            return (
              <Card 
                key={entry.rank} 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  textAlign: 'center', 
                  width: 200,
                  background: entry.rank === 1 ? 'linear-gradient(135deg, #FFD700 0%, #FFB347 100%)' :
                              entry.rank === 2 ? 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)' :
                              'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)',
                  color: 'white'
                }}
              >
                <Typography variant="h2">{getRankIcon(entry.rank)}</Typography>
                <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 1, bgcolor: 'white', color: getRankColor(entry.rank) }}>
                  {entry.username.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6">{entry.username}</Typography>
                <Typography variant="h5">{entry.total_score}</Typography>
                <Typography variant="caption">points</Typography>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Full Leaderboard Table */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>📊 Full Ranking</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell align="center">Rank</TableCell>
                <TableCell>User</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell align="right">Correct</TableCell>
                <TableCell align="right">Accuracy</TableCell>
                <TableCell align="right">Best Streak</TableCell>
                <TableCell align="right">Sessions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.map((entry) => (
                <TableRow key={entry.user_id} hover>
                  <TableCell align="center">
                    <Chip 
                      label={`#${entry.rank}`} 
                      size="small"
                      sx={{ 
                        bgcolor: getRankColor(entry.rank),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: getRankColor(entry.rank) }}>
                        {entry.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2">{entry.username}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">{entry.total_score}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    {entry.correct_answers}/{entry.total_questions}
                  </TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={`${entry.accuracy}%`} 
                      size="small"
                      color={entry.accuracy >= 80 ? 'success' : entry.accuracy >= 60 ? 'warning' : 'error'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      <TrendingUpIcon fontSize="small" color="primary" />
                      <Typography variant="body2">{entry.best_streak}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      <SchoolIcon fontSize="small" color="secondary" />
                      <Typography variant="body2">{entry.total_sessions}</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button variant="contained" onClick={() => navigate('/')}>
          Start New Learning Session
        </Button>
      </Box>
    </Container>
  );
};

export default Leaderboard;