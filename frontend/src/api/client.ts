import axios from 'axios';
import { User, UserCreate, LearnerState, Interaction, Session } from '../types';

// HARDCODED - Using your Render backend URL
const API_BASE_URL = 'https://emotion-aware-backend.onrender.com/api/v1';

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createUser = async (userData: UserCreate): Promise<User> => {
  try {
    const response = await api.post<User>('/users/', userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUser = async (userId: number): Promise<User> => {
  try {
    const response = await api.get<User>(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const createSession = async (userId: number): Promise<{ session_id: number; message: string }> => {
  try {
    const response = await api.post('/sessions/', { user_id: userId });
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const getSession = async (sessionId: number): Promise<Session> => {
  try {
    const response = await api.get<Session>(`/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
};

export const getNextAction = async (state: LearnerState): Promise<{ action: string; state: number[]; exploration: number }> => {
  try {
    const response = await api.post('/rl-decision/', {
      prev_emotion: state.current_emotion,
      current_emotion: state.current_emotion,
      streak: state.streak,
      repeat_count: state.repetition_count,
      face_present: true
    });
    return { action: response.data.action, state: [], exploration: 0 };
  } catch (error) {
    console.error('Error getting next action:', error);
    throw error;
  }
};

export const updateRL = async (
  state: number[],
  action: string,
  reward: number,
  nextState: number[]
): Promise<{ message: string }> => {
  try {
    const response = await api.post('/update-rl/', {
      state,
      action,
      reward,
      next_state: nextState,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating RL:', error);
    throw error;
  }
};

export const recordInteraction = async (interaction: Interaction): Promise<Interaction> => {
  try {
    const response = await api.post<Interaction>('/interactions/', interaction);
    return response.data;
  } catch (error) {
    console.error('Error recording interaction:', error);
    throw error;
  }
};

export default api;
