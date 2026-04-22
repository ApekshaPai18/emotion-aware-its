"""
API routes for the application.
"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import desc
import logging
import random
from typing import Dict, List
from datetime import datetime

from ..models.database import get_db, User, LearningSession, UserInteraction, UserAchievement, LeaderboardEntry
from ..models.schemas import UserCreate, UserResponse, InteractionCreate
from ..core.q_agent import QLearningAgent

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize Q-Learning Agent
rl_agent = QLearningAgent(
    actions=["normal", "hint", "repeat", "simplify", "motivate"],
    alpha=0.1,
    gamma=0.9,
    epsilon=0.2
)

rl_agent.load("q_table.json")

# ============ USER ENDPOINTS ============
@router.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        existing_user = db.query(User).filter(
            (User.username == user.username) | (User.email == user.email)
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Username or email already exists")
        
        db_user = User(username=user.username, email=user.email)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Create leaderboard entry
        leaderboard_entry = LeaderboardEntry(user_id=db_user.id)
        db.add(leaderboard_entry)
        db.commit()
        
        return db_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@router.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ============ SESSION ENDPOINTS ============
@router.post("/sessions/")
async def create_session(request: Dict, db: Session = Depends(get_db)):
    try:
        user_id = request.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        session = LearningSession(user_id=user_id)
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return {"session_id": session.id, "message": "Session created successfully"}
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")

@router.get("/sessions/{session_id}")
async def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(LearningSession).filter(LearningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

# ============ INTERACTION ENDPOINTS ============
@router.post("/interactions/")
async def record_interaction(interaction: InteractionCreate, db: Session = Depends(get_db)):
    try:
        # Get existing interactions for this question to count attempts
        existing_interactions = db.query(UserInteraction).filter(
            UserInteraction.user_id == interaction.user_id,
            UserInteraction.session_id == interaction.session_id,
            UserInteraction.question_id == interaction.question_id
        ).count()
        
        attempts = existing_interactions + 1
        
        db_interaction = UserInteraction(
            user_id=interaction.user_id,
            session_id=interaction.session_id,
            current_lesson_id=interaction.lesson_id,
            question_id=interaction.question_id,
            is_correct=interaction.is_correct,
            attempts=attempts,
            detected_emotion=interaction.detected_emotion,
            emotion_confidence=interaction.emotion_confidence,
            rl_action=interaction.rl_action
        )
        db.add(db_interaction)
        
        # Update session stats
        session = db.query(LearningSession).filter(LearningSession.id == interaction.session_id).first()
        if session:
            session.total_attempts += 1
            if interaction.is_correct:
                session.correct_answers += 1
            session.total_questions += 1
        
        db.commit()
        db.refresh(db_interaction)
        
        return db_interaction
    except Exception as e:
        logger.error(f"Error recording interaction: {e}")
        raise HTTPException(status_code=500, detail="Error recording interaction")

# ============ USER DASHBOARD ENDPOINTS ============
@router.get("/dashboard/{user_id}")
async def get_user_dashboard(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get all sessions
        sessions = db.query(LearningSession).filter(LearningSession.user_id == user_id).all()
        
        # Get interactions for attempt tracking
        interactions = db.query(UserInteraction).filter(UserInteraction.user_id == user_id).all()
        
        # Calculate stats per question
        question_attempts = {}
        for interaction in interactions:
            if interaction.question_id:
                key = interaction.question_id
                if key not in question_attempts:
                    question_attempts[key] = {'attempts': 0, 'correct': False}
                question_attempts[key]['attempts'] += 1
                if interaction.is_correct:
                    question_attempts[key]['correct'] = True
        
        total_questions_attempted = len(question_attempts)
        avg_attempts = sum(v['attempts'] for v in question_attempts.values()) / max(1, total_questions_attempted)
        
        dashboard_data = {
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "created_at": user.created_at.isoformat(),
                "total_sessions": len(sessions),
                "total_questions_answered": sum(s.total_questions for s in sessions),
                "total_correct": sum(s.correct_answers for s in sessions),
                "total_attempts": sum(s.total_attempts for s in sessions),
                "avg_attempts_per_question": round(avg_attempts, 2)
            },
            "sessions": [
                {
                    "id": s.id,
                    "start_time": s.start_time.isoformat(),
                    "end_time": s.end_time.isoformat() if s.end_time else None,
                    "total_questions": s.total_questions,
                    "correct_answers": s.correct_answers,
                    "total_attempts": s.total_attempts,
                    "score_percentage": round((s.correct_answers / max(1, s.total_questions)) * 100, 2)
                }
                for s in sorted(sessions, key=lambda x: x.start_time, reverse=True)
            ],
            "question_attempts": [
                {
                    "question_id": qid,
                    "attempts": data['attempts'],
                    "success": data['correct']
                }
                for qid, data in question_attempts.items()
            ]
        }
        
        return dashboard_data
    except Exception as e:
        logger.error(f"Error getting dashboard: {e}")
        raise HTTPException(status_code=500, detail="Error getting dashboard data")

# ============ LEADERBOARD ENDPOINTS ============
@router.get("/leaderboard/")
async def get_leaderboard(db: Session = Depends(get_db)):
    try:
        entries = db.query(LeaderboardEntry).order_by(desc(LeaderboardEntry.total_score)).limit(20).all()
        
        leaderboard = []
        for entry in entries:
            user = db.query(User).filter(User.id == entry.user_id).first()
            leaderboard.append({
                "rank": len(leaderboard) + 1,
                "user_id": entry.user_id,
                "username": user.username if user else "Unknown",
                "total_score": entry.total_score,
                "total_questions": entry.total_questions,
                "correct_answers": entry.correct_answers,
                "best_streak": entry.best_streak,
                "total_sessions": entry.total_sessions,
                "accuracy": round((entry.correct_answers / max(1, entry.total_questions)) * 100, 2)
            })
        
        return leaderboard
    except Exception as e:
        logger.error(f"Error getting leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Error getting leaderboard")

@router.post("/leaderboard/update/{user_id}")
async def update_leaderboard(user_id: int, db: Session = Depends(get_db)):
    try:
        # Calculate user's total stats from all sessions
        sessions = db.query(LearningSession).filter(LearningSession.user_id == user_id).all()
        interactions = db.query(UserInteraction).filter(UserInteraction.user_id == user_id).all()
        
        total_questions = sum(s.total_questions for s in sessions)
        correct_answers = sum(s.correct_answers for s in sessions)
        total_attempts = sum(s.total_attempts for s in sessions)
        total_sessions = len(sessions)
        
        # Calculate best streak
        current_streak = 0
        best_streak = 0
        for interaction in sorted(interactions, key=lambda x: x.timestamp):
            if interaction.is_correct:
                current_streak += 1
                best_streak = max(best_streak, current_streak)
            else:
                current_streak = 0
        
        # Calculate total score
        total_score = (correct_answers * 10) - (total_attempts * 2) + (best_streak * 5)
        
        # Update or create leaderboard entry
        entry = db.query(LeaderboardEntry).filter(LeaderboardEntry.user_id == user_id).first()
        if entry:
            entry.total_score = total_score
            entry.total_questions = total_questions
            entry.correct_answers = correct_answers
            entry.best_streak = best_streak
            entry.total_sessions = total_sessions
            entry.last_updated = datetime.utcnow()
        else:
            entry = LeaderboardEntry(
                user_id=user_id,
                total_score=total_score,
                total_questions=total_questions,
                correct_answers=correct_answers,
                best_streak=best_streak,
                total_sessions=total_sessions
            )
            db.add(entry)
        
        db.commit()
        
        return {
            "message": "Leaderboard updated successfully", 
            "total_score": total_score,
            "correct_answers": correct_answers,
            "total_questions": total_questions
        }
    except Exception as e:
        logger.error(f"Error updating leaderboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))
# ============ RL ENDPOINTS ============
@router.post("/rl-decision/")
async def rl_decision(request: Dict):
    try:
        prev_emotion = request.get("prev_emotion", "Neutral")
        current_emotion = request.get("current_emotion", "Neutral")
        streak = request.get("streak", 0)
        repeat_count = request.get("repeat_count", 0)
        face_present = request.get("face_present", True)
        
        state = (prev_emotion, current_emotion, streak, repeat_count, face_present)
        action = rl_agent.choose_action(state)
        
        return {"action": action}
    except Exception as e:
        logger.error(f"RL Decision Error: {e}")
        return {"action": "normal"}

@router.post("/update-rl/")
async def update_rl(request: Dict):
    try:
        prev_emotion = request.get("prev_emotion", "Neutral")
        current_emotion = request.get("current_emotion", "Neutral")
        streak = request.get("streak", 0)
        repeat_count = request.get("repeat_count", 0)
        face_present = request.get("face_present", True)
        action = request.get("action", "normal")
        correct = request.get("correct", False)
        
        state = (prev_emotion, current_emotion, streak, repeat_count, face_present)
        
        reward = 10 if correct else -5
        
        negative = ["Frustrated", "Confused", "Sad"]
        positive = ["Happy", "Neutral"]
        
        if prev_emotion in negative and current_emotion in positive:
            reward += 3
        elif prev_emotion in positive and current_emotion in negative:
            reward -= 2
        
        reward -= repeat_count
        
        rl_agent.update(state, action, reward, state)
        
        if random.random() < 0.1:
            rl_agent.save("q_table.json")
        
        return {"reward": reward, "action": action}
    except Exception as e:
        logger.error(f"RL Update Error: {e}")
        return {"reward": 0, "action": "normal"}

@router.websocket("/ws/emotion/{session_id}")
async def websocket_emotion(websocket: WebSocket, session_id: int):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            await websocket.send_json({"status": "received"})
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        
# Add these new endpoints after your existing code

# ============ ADMIN ENDPOINTS ============
@router.get("/admin/users/")
async def get_all_users(db: Session = Depends(get_db)):
    """Get all users (Admin only)"""
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at.isoformat(),
            "total_sessions": len(u.sessions),
            "total_questions": sum(s.total_questions for s in u.sessions),
            "total_correct": sum(s.correct_answers for s in u.sessions)
        }
        for u in users
    ]
@router.get("/users/by-username/{username}")
async def get_user_by_username(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at.isoformat()
    }
    
@router.get("/admin/dashboard/{user_id}")
async def get_admin_dashboard(user_id: int, db: Session = Depends(get_db)):
    """Get dashboard for any user (Admin only)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get all sessions
        sessions = db.query(LearningSession).filter(LearningSession.user_id == user_id).all()
        
        # Get interactions for attempt tracking
        interactions = db.query(UserInteraction).filter(UserInteraction.user_id == user_id).all()
        
        # Calculate stats per question
        question_attempts = {}
        for interaction in interactions:
            if interaction.question_id:
                key = interaction.question_id
                if key not in question_attempts:
                    question_attempts[key] = {'attempts': 0, 'correct': False}
                question_attempts[key]['attempts'] += 1
                if interaction.is_correct:
                    question_attempts[key]['correct'] = True
        
        total_questions_attempted = len(question_attempts)
        avg_attempts = sum(v['attempts'] for v in question_attempts.values()) / max(1, total_questions_attempted)
        
        dashboard_data = {
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "created_at": user.created_at.isoformat(),
                "total_sessions": len(sessions),
                "total_questions_answered": sum(s.total_questions for s in sessions),
                "total_correct": sum(s.correct_answers for s in sessions),
                "total_attempts": sum(s.total_attempts for s in sessions),
                "avg_attempts_per_question": round(avg_attempts, 2)
            },
            "sessions": [
                {
                    "id": s.id,
                    "start_time": s.start_time.isoformat(),
                    "end_time": s.end_time.isoformat() if s.end_time else None,
                    "total_questions": s.total_questions,
                    "correct_answers": s.correct_answers,
                    "total_attempts": s.total_attempts,
                    "score_percentage": round((s.correct_answers / max(1, s.total_questions)) * 100, 2)
                }
                for s in sorted(sessions, key=lambda x: x.start_time, reverse=True)
            ],
            "question_attempts": [
                {
                    "question_id": qid,
                    "attempts": data['attempts'],
                    "success": data['correct']
                }
                for qid, data in question_attempts.items()
            ]
        }
        
        return dashboard_data
    except Exception as e:
        logger.error(f"Error getting admin dashboard: {e}")
        raise HTTPException(status_code=500, detail="Error getting dashboard data")        