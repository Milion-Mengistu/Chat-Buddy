from datetime import date, datetime
from ChatApp import db
from flask_login import UserMixin

# from sqlalchemy.sql import func

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)
    name = db.Column(db.String(255), nullable=True)
    provider = db.Column(db.String(50), nullable=True)
    provider_id = db.Column(db.String(255), nullable=True)
    profile_picture = db.Column(db.Text, nullable=True)
    created_at = datetime.now()
    oauth_tokens = db.relationship("OAuth", back_populates="user", lazy="dynamic")



    chat_sessions = db.relationship('ChatSession', back_populates='user', lazy=True)


class ChatSession(db.Model):
    __tablename__ = 'chat_sessions'
    id = db.Column(db.Integer, primary_key=True)
    chat_name = db.Column(db.String(255), nullable=False, default='New Chat')
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='chat_sessions')
    messages = db.relationship('Message', back_populates='chat_session', lazy=True)
    # Serialize method to convert the model instance into a dictionary
    def serialize(self):
        return {
            "id": self.id,
            "chat_name": self.chat_name+"_"+str(self.id),
            "user_id": self.user_id,
            
        }

class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    sender = db.Column(db.String(50), nullable=False)  # 'user' or 'bot'
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    chat_id = db.Column(db.Integer, db.ForeignKey('chat_sessions.id'), nullable=False)

    # Relationship to ChatSession
    chat_session = db.relationship('ChatSession', back_populates='messages')

    # Method to serialize the message object
    def serialize(self):
        return {
            "id": self.id,
            "sender": self.sender,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),  # Convert timestamp to ISO format for JSON
            "chat_id": self.chat_id
        }
class OAuth(db.Model):
    __tablename__ = 'oauth'
    id = db.Column(db.Integer, primary_key=True)
    provider = db.Column(db.String(50), nullable=False)
    provider_user_id = db.Column(db.String(255), unique=True, nullable=False)
    token = db.Column(db.JSON, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user = db.relationship('User', back_populates='oauth_tokens')