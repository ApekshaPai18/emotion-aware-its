import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  IconButton,
  CircularProgress
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CloseIcon from '@mui/icons-material/Close';

const LESSONS = [
  {
    id: 1,
    title: "What is Python?",
    content: "Python is a high-level, interpreted programming language.\n\nKey Features:\n• Simple, easy-to-read syntax\n• Dynamically typed\n• Interpreted language\n\nExample:\nprint('Hello, World!')",
    quiz: {
      question: "What type of language is Python?",
      options: ["Compiled", "Interpreted", "Machine", "Assembly"],
      correct: 1,
      explanation: "Python is an interpreted language."
    }
  },
  {
    id: 2,
    title: "Variables in Python",
    content: "Variables store data values.\n\nRules:\n• Start with letter or underscore\n• Cannot start with number\n• Case-sensitive\n\nExamples:\nname = 'John'\nage = 25",
    quiz: {
      question: "Which is a valid variable name?",
      options: ["2var", "my-var", "my_var", "my var"],
      correct: 2,
      explanation: "my_var uses underscore, which is allowed."
    }
  },
  {
    id: 3,
    title: "Data Types",
    content: "Python data types:\n• int: 1, 2, 100\n• float: 3.14, 2.5\n• str: 'Hello'\n• bool: True/False",
    quiz: {
      question: "What data type is: x = 3.14",
      options: ["int", "float", "str", "bool"],
      correct: 1,
      explanation: "Numbers with decimals are float."
    }
  },
  {
    id: 4,
    title: "If Statements",
    content: "if statements make decisions.\n\nSyntax:\nif condition:\n    # code\nelif another:\n    # code\nelse:\n    # code",
    quiz: {
      question: "Which keyword is used for conditional statements?",
      options: ["for", "while", "if", "def"],
      correct: 2,
      explanation: "if is used for conditional execution."
    }
  },
  {
    id: 5,
    title: "Loops",
    content: "Loops repeat code.\n\nFor loop:\nfor i in range(5):\n    print(i)\n\nWhile loop:\nwhile count < 3:\n    print(count)",
    quiz: {
      question: "Which loop runs while condition is true?",
      options: ["for", "while", "if", "else"],
      correct: 1,
      explanation: "while loop continues as long as condition is True."
    }
  }
];

// Simplified content for each lesson
const SIMPLIFIED_LESSONS: { [key: number]: string } = {
  1: "🐍 Python is a language that helps you talk to computers. It's like learning a new way to give instructions that computers understand easily.\n\nThink of it as a translator between human English and computer language. You write simple English-like code, and Python converts it to something the computer can run.\n\nSimple Example:\nprint('Hello') → This tells Python to show 'Hello' on screen.",
  
  2: "📦 Variables are like storage boxes with labels.\n\nImagine you have a box labeled 'age' and you put 25 inside it. Whenever you say 'age', Python knows you mean 25.\n\nSimple Examples:\nname = 'John'  # Store 'John' in box named 'name'\nage = 25       # Store 25 in box named 'age'\n\nRules: Box names must start with a letter (not a number), no spaces, use underscore _ instead.",
  
  3: "🔢 Data types tell Python what kind of information you're working with.\n\n• Numbers (int/float) → for math calculations\n• Text (string) → for words and sentences  \n• True/False (boolean) → for yes/no questions\n\nSimple Example:\n5 + 3 = 8  (numbers math)\n'Hello' + ' World' = 'Hello World' (text joining)",
  
  4: "🤔 If statements help Python make decisions.\n\nThink of it like a fork in the road: If it's raining, take an umbrella; otherwise, enjoy the sun.\n\nSimple Example:\nage = 18\nif age >= 18:\n    print('Adult')   # This runs if age is 18 or more\nelse:\n    print('Minor')   # This runs otherwise",
  
  5: "🔄 Loops help you repeat tasks without writing the same code many times.\n\nInstead of writing 'brush teeth' 100 times, just say 'repeat brushing 100 times'. That's a loop!\n\nSimple Example:\nfor i in range(3):\n    print(i)   # Prints 0, 1, 2\n\n# While loop - keeps going until condition is false\ncount = 0\nwhile count < 3:\n    print(count)\n    count = count + 1"
};

// Examples for each concept
const EXAMPLES_BY_LESSON: { [key: number]: string } = {
  1: "Try this in your mind:\nprint('Hello, World!')\n\nThis is the first program most people write. It just says 'Hello, World!' on the screen.",
  
  2: "Try these examples:\nage = 25\nname = 'John'\nheight = 5.9\nis_student = True\n\nprint(name, age)  # Shows: John 25",
  
  3: "Try this:\nx = 10        # integer (whole number)\ny = 3.14      # float (decimal)\nz = 'Hello'   # string (text)\n\nprint(type(x))  # Shows: <class 'int'>\nprint(type(y))  # Shows: <class 'float'>\nprint(type(z))  # Shows: <class 'str'>",
  
  4: "Try this:\nscore = 85\nif score >= 90:\n    print('A grade')\nelif score >= 80:\n    print('B grade')\nelse:\n    print('C grade')\n\n# This will print 'B grade' because 85 is between 80 and 89",
  
  5: "Try these examples:\n# For loop - repeat 5 times\nfor i in range(5):\n    print('Hello', i)  # Prints Hello 0 to Hello 4\n\n# While loop\ncount = 0\nwhile count < 3:\n    print('Count is', count)\n    count = count + 1"
};

const Learn: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, userName } = location.state || {};

  const [currentLesson, setCurrentLesson] = useState(0);
  const [mode, setMode] = useState<'lesson' | 'quiz'>('lesson');
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [emotion, setEmotion] = useState('Neutral');
  const [prevEmotion, setPrevEmotion] = useState('Neutral');
  const [faceDetected, setFaceDetected] = useState(false);
  const [showFaceWarning, setShowFaceWarning] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [streak, setStreak] = useState(0);
  const [repeatCount, setRepeatCount] = useState(0);
  const [rlAction, setRlAction] = useState('');
  
  const [emotionHistory, setEmotionHistory] = useState<{[key: string]: number}>({
    happy: 0, neutral: 0, sad: 0, frustrated: 0, surprise: 0, confused: 0
  });

  const [quizAnswers, setQuizAnswers] = useState<boolean[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  
  // Attempts tracking state
  const [questionAttempts, setQuestionAttempts] = useState<{[key: string]: number}>({});

  // States for simplified mode
  const [isSimplified, setIsSimplified] = useState(false);
  const [simplifiedContent, setSimplifiedContent] = useState('');

  // Simplified face and emotion detection (no face-api.js)
  const detectFaceAndEmotion = () => {
    if (!videoRef.current || !webcamActive) return;
    
    setPrevEmotion(emotion);
    
    // Simulate face detection (always true when webcam is active)
    setFaceDetected(true);
    
    // Simulate emotion based on quiz performance
    let detectedEmotion = 'neutral';
    
    if (quizSubmitted && mode === 'quiz') {
      const lastAnswerCorrect = quizAnswer !== null && 
        quizAnswer === LESSONS[currentLesson].quiz.correct;
      
      if (lastAnswerCorrect) {
        detectedEmotion = 'happy';
      } else if (streak === 0 && repeatCount > 0) {
        detectedEmotion = 'frustrated';
      } else if (repeatCount > 2) {
        detectedEmotion = 'sad';
      } else {
        detectedEmotion = 'neutral';
      }
    } else {
      const emotions = ['neutral', 'neutral', 'neutral', 'happy', 'confused'];
      detectedEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    }
    
    const displayEmotion = detectedEmotion.charAt(0).toUpperCase() + detectedEmotion.slice(1);
    setEmotion(displayEmotion);
    
    setEmotionHistory(prev => {
      const newHistory = { ...prev };
      const emotionKey = detectedEmotion.toLowerCase();
      newHistory[emotionKey] = (newHistory[emotionKey] || 0) + 1;
      return newHistory;
    });
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setWebcamActive(true);
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
          }
          detectionIntervalRef.current = setInterval(detectFaceAndEmotion, 2000);
        };
      }
    } catch (err) {
      console.error('Webcam error:', err);
      setMessage('Failed to access webcam. Please grant permission.');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    setWebcamActive(false);
    setFaceDetected(false);
    setShowFaceWarning(false);
  };

  const getRLDecision = async () => {
    try {
      const res = await axios.post('http://localhost:8000/api/v1/rl-decision/', {
        prev_emotion: prevEmotion,
        current_emotion: emotion,
        streak: streak,
        repeat_count: repeatCount,
        face_present: faceDetected
      });
      return res.data.action;
    } catch (err) {
      console.error('RL API error');
      if (emotion === 'Frustrated') return 'motivate';
      if (emotion === 'Confused') return 'hint';
      if (repeatCount > 1) return 'repeat';
      return 'normal';
    }
  };

  const updateRL = async (correct: boolean, action: string) => {
    try {
      await axios.post('http://localhost:8000/api/v1/update-rl/', {
        prev_emotion: prevEmotion,
        current_emotion: emotion,
        streak: streak,
        repeat_count: repeatCount,
        face_present: faceDetected,
        action: action,
        correct: correct
      });
    } catch (err) {
      console.error('RL update error');
    }
  };

  const resetSimplifiedMode = () => {
    setIsSimplified(false);
    setSimplifiedContent('');
  };

  const handleQuizSubmit = async () => {
    if (!faceDetected) {
      setShowFaceWarning(true);
      setSnackbarOpen(true);
      return;
    }
    
    if (quizAnswer === null) return;
    
    setLoading(true);
    const correct = quizAnswer === LESSONS[currentLesson].quiz.correct;
    
    const questionId = `${LESSONS[currentLesson].id}_q${currentLesson + 1}`;
    const currentAttempts = (questionAttempts[questionId] || 0) + 1;
    setQuestionAttempts(prev => ({ ...prev, [questionId]: currentAttempts }));
    
    const newQuizAnswers = [...quizAnswers, correct];
    setQuizAnswers(newQuizAnswers);
    
    if (correct) {
      const newScore = score + 1;
      setScore(newScore);
      setStreak(streak + 1);
      setMessage(`✅ Correct! ${LESSONS[currentLesson].quiz.explanation}`);
      setQuizSubmitted(true);
      await updateRL(true, 'normal');
      
      resetSimplifiedMode();
      
      try {
        await axios.post('http://localhost:8000/api/v1/interactions/', {
          user_id: userId,
          session_id: location.state?.sessionId,
          lesson_id: LESSONS[currentLesson].id.toString(),
          question_id: questionId,
          is_correct: true,
          detected_emotion: emotion.toLowerCase(),
          emotion_confidence: 0.8,
          rl_action: 'normal'
        });
      } catch (err) {
        console.error('Failed to record interaction:', err);
      }
      
      setTimeout(async () => {
        const isLastLesson = currentLesson === LESSONS.length - 1;
        
        if (isLastLesson) {
          try {
            await axios.post(`http://localhost:8000/api/v1/leaderboard/update/${userId}`);
            console.log('Leaderboard updated successfully');
          } catch (err) {
            console.error('Failed to update leaderboard:', err);
          }
          
          navigate('/results', {
            state: {
              userId: userId,
              userName: userName,
              stats: {
                totalQuestions: LESSONS.length,
                correctAnswers: newScore,
                emotions: emotionHistory,
                quizAnswers: newQuizAnswers
              }
            }
          });
        } else {
          setCurrentLesson(currentLesson + 1);
          setMode('lesson');
          setQuizAnswer(null);
          setQuizSubmitted(false);
          setMessage('');
          setRlAction('');
          resetSimplifiedMode();
        }
        setLoading(false);
      }, 1500);
      
    } else {
      setStreak(0);
      const action = await getRLDecision();
      setRlAction(action);
      await updateRL(false, action);
      setMessage(`❌ Incorrect. ${LESSONS[currentLesson].quiz.explanation}`);
      
      try {
        await axios.post('http://localhost:8000/api/v1/interactions/', {
          user_id: userId,
          session_id: location.state?.sessionId,
          lesson_id: LESSONS[currentLesson].id.toString(),
          question_id: questionId,
          is_correct: false,
          detected_emotion: emotion.toLowerCase(),
          emotion_confidence: 0.8,
          rl_action: action
        });
      } catch (err) {
        console.error('Failed to record interaction:', err);
      }
      
      setTimeout(() => {
        let actionMessage = '';
        switch(action) {
          case 'hint':
            actionMessage = `💡 HINT: ${LESSONS[currentLesson].quiz.explanation}`;
            setMessage(actionMessage);
            break;
          case 'repeat':
            setRepeatCount(repeatCount + 1);
            actionMessage = '🔄 Reviewing the lesson again';
            setMessage(actionMessage);
            setTimeout(() => setMode('lesson'), 500);
            break;
          case 'simplify':
            setIsSimplified(true);
            setSimplifiedContent(SIMPLIFIED_LESSONS[currentLesson + 1] || 
              `Let me explain ${LESSONS[currentLesson].title} simply:\n\n` +
              LESSONS[currentLesson].content.split('.')[0] + 
              "\n\nTake it step by step. Practice with small examples first.");
            setMode('lesson');
            setMessage('');
            setQuizSubmitted(false);
            setQuizAnswer(null);
            break;
          case 'example':
            const exampleContent = EXAMPLES_BY_LESSON[currentLesson + 1] || 
              `Examples for ${LESSONS[currentLesson].title}:\n\n` +
              "Try creating your own simple version of this concept.\n" +
              "Start with small numbers and simple cases.";
            setMessage(`📝 ${exampleContent}`);
            break;
          case 'motivate':
            actionMessage = '💪 You can do this! Try again!';
            setMessage(actionMessage);
            break;
          default:
            actionMessage = 'Try again!';
            setMessage(actionMessage);
        }
        
        setTimeout(() => {
          if (action !== 'repeat' && action !== 'simplify') {
            setQuizSubmitted(false);
            setQuizAnswer(null);
          }
          setRlAction('');
          setLoading(false);
        }, 2000);
      }, 500);
    }
  };

  const handleTakeQuiz = () => {
    if (!faceDetected) {
      setShowFaceWarning(true);
      setSnackbarOpen(true);
      return;
    }
    resetSimplifiedMode();
    setMode('quiz');
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const progress = ((currentLesson + 1) / LESSONS.length) * 100;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Face Warning Dialog */}
      <Dialog open={showFaceWarning} onClose={() => setShowFaceWarning(false)}>
        <DialogTitle sx={{ bgcolor: '#ff9800', color: 'white' }}>
          ⚠️ Face Not Detected
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography>
            Please ensure your face is visible to the camera.
            The system needs to detect your face to adapt the learning experience.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFaceWarning(false)}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for quick warning */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message="⚠️ Face not detected! Please look at the camera to continue."
        action={
          <IconButton size="small" color="inherit" onClick={handleCloseSnackbar}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{ bottom: { xs: 16, sm: 24 } }}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              {userName ? `Welcome, ${userName}!` : 'Python Learning'}
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
              <span>Lesson {currentLesson + 1} of {LESSONS.length}</span>
              <span>Score: {score}/{LESSONS.length}</span>
            </Typography>
          </Box>

          {/* Lesson display with simplified mode support */}
          {mode === 'lesson' && (
            <>
              <Typography variant="h4" gutterBottom sx={{ color: '#1976d2' }}>
                {isSimplified ? `📖 Simplified: ${LESSONS[currentLesson].title}` : LESSONS[currentLesson].title}
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {isSimplified ? simplifiedContent : LESSONS[currentLesson].content}
              </Typography>
              {isSimplified && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  💡 This is a simplified version of the lesson. Take your time to understand the concepts.
                  <br />
                  When you're ready, click below to try the quiz again!
                </Alert>
              )}
              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                {!isSimplified ? (
                  <Button 
                    variant="contained" 
                    onClick={handleTakeQuiz} 
                    size="large"
                    disabled={!faceDetected}
                    sx={{ px: 4 }}
                  >
                    Take Quiz
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    onClick={() => {
                      resetSimplifiedMode();
                      handleTakeQuiz();
                    }} 
                    size="large"
                    sx={{ px: 4, bgcolor: '#4caf50' }}
                  >
                    Try Quiz Again
                  </Button>
                )}
              </Box>
            </>
          )}
          
          {mode === 'quiz' && (
            <>
              <Typography variant="h4" gutterBottom>📝 Quiz: {LESSONS[currentLesson].title}</Typography>
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                {LESSONS[currentLesson].quiz.question}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {LESSONS[currentLesson].quiz.options.map((opt, idx) => (
                  <Button
                    key={idx}
                    variant={quizAnswer === idx ? 'contained' : 'outlined'}
                    onClick={() => !quizSubmitted && setQuizAnswer(idx)}
                    disabled={quizSubmitted || !faceDetected}
                    sx={{ justifyContent: 'flex-start', p: 2, textTransform: 'none' }}
                  >
                    {String.fromCharCode(65 + idx)}. {opt}
                  </Button>
                ))}
              </Box>
              
              {message && <Alert severity="info" sx={{ mt: 3 }}>{message}</Alert>}
              
              {rlAction && <Chip label={`🤖 RL Action: ${rlAction}`} color="secondary" sx={{ mt: 2 }} />}
              
              <Button
                variant="contained"
                onClick={handleQuizSubmit}
                disabled={quizAnswer === null || quizSubmitted || loading || !faceDetected}
                sx={{ mt: 3, py: 1.5 }}
                fullWidth
              >
                {loading ? 'Processing...' : 'Submit Answer'}
              </Button>
            </>
          )}
        </Paper>

        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>🎥 Face & Emotion Detection</Typography>
          
          <div style={{ position: 'relative' }}>
            <video
              ref={videoRef}
              style={{ width: '100%', borderRadius: 8, backgroundColor: '#000', transform: 'scaleX(-1)' }}
              autoPlay
              playsInline
              muted
            />
          </div>
          
          {!webcamActive ? (
            <Button 
              variant="contained" 
              startIcon={<VideocamIcon />} 
              onClick={startWebcam} 
              sx={{ mt: 2 }} 
              fullWidth
            >
              Start Webcam
            </Button>
          ) : (
            <Button variant="outlined" startIcon={<VideocamOffIcon />} onClick={stopWebcam} sx={{ mt: 2 }} fullWidth color="error">
              Stop Webcam
            </Button>
          )}

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Chip 
              label={`😊 Emotion: ${emotion}`}
              color={
                emotion === 'Happy' ? 'success' : 
                emotion === 'Frustrated' ? 'error' : 
                emotion === 'Confused' ? 'warning' : 
                emotion === 'No Face' ? 'error' : 'default'
              }
              sx={{ fontSize: '1rem', py: 2, px: 2 }}
            />
            <Chip 
              label={faceDetected ? '✅ Face Detected' : '❌ No Face'}
              color={faceDetected ? 'success' : 'error'}
              sx={{ mt: 1, ml: 1 }}
            />
          </Box>

          {!faceDetected && webcamActive && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              ⚠️ Face not detected! Please look at the camera to continue learning.
            </Alert>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>📊 RL Stats:</strong> Streak: {streak} | Repeat: {repeatCount}
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Emotions Tracked:</strong>
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
              {Object.entries(emotionHistory).map(([em, count]) => count > 0 && (
                <Chip key={em} label={`${em}: ${count}`} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>

          {/* Display attempts for current question */}
          {mode === 'quiz' && (
            <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="caption" color="text.secondary">
                <strong>📊 Question Attempts:</strong>
              </Typography>
              <Typography variant="body2" color="primary">
                This question: {questionAttempts[`${LESSONS[currentLesson].id}_q${currentLesson + 1}`] || 0} attempts
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Learn;
