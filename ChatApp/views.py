from flask import Blueprint, render_template, request, jsonify, session
from flask_login import login_required, current_user
import google.generativeai as genai  # Correct import
from dotenv import load_dotenv
import os
from datetime import datetime


from ChatApp.models import User
from ChatApp.models import ChatSession
from ChatApp.models import Message
from . import db

# Load environment variables from .env file
load_dotenv()

# Access the API key from the environment
api_key = os.getenv('API_KEY')

# Explicitly configure the API key for the Generative AI library
genai.configure(api_key=api_key)

views = Blueprint('views', __name__)

@views.route('/', methods=['GET'])
def welcome():
    return render_template('welcome.html')

@views.route('/home', methods=['GET', 'POST'])
@login_required  # Ensure that the user is logged in before accessing home
def home():
    users = User.query.all()

    for user in users:
        print(user.name)
    return render_template('home.html' , user = current_user)

@views.route('/chat/<int:chat_id>', methods=['GET', 'POST'])
@login_required
def chatPage(chat_id):
    # Fetch the chat session and messages for the logged-in user
    chat = ChatSession.query.filter_by(id=chat_id, user_id=current_user.id).first()
    if not chat:
        return jsonify({"error": "Chat not found or unauthorized access"}), 404
    messages = Message.query.filter_by(chat_id=chat_id).order_by(Message.timestamp).all()    
    # Render the chat page with the chat details and messages
    return render_template('chat.html', current_chat=chat, messages=messages)


@views.route('/chat', methods=['POST'])
@login_required  # Ensure that the user is logged in before accessing chat
def chat():
    # Parse the incoming JSON data from the request
    access_token = request.get_json()

    # Get the message sent from the frontend
    message = access_token.get('message')

    if message:
        # Call the function to interact with Google's Generative AI
        ai_reply = chat_with_google_ai(message)

        print("Received message:", message)  # Log the message to check
        print("AI response:", ai_reply)  # Log the AI response

        # Return the AI response back to the frontend
        return jsonify({"response": ai_reply})
    else:
        # If no message is received, return an error response
        return jsonify({"error": "No message provided!"}), 400

def chat_with_google_ai(message):
    print(f"Sending user input to Generative AI: {message}")
    model = genai.GenerativeModel(model_name="gemini-1.5-flash")
    response = model.generate_content(message)
    ai_reply = response.text
    return ai_reply

@views.route('/user/chats', methods=['GET'])
@login_required  # Ensure the user is logged in
def chats():
    from ChatApp.models import ChatSession
    # Query the chats for the logged-in user
    chats = ChatSession.query.filter_by(user_id=current_user.id).all()
    # Serialize the chat data to return as JSON
    return jsonify([chat.serialize() for chat in chats])
@views.route('/user/chat', methods=['POST'])
@login_required
def create_chat():
    try:
        # Create a new chat session for the current user
        new_chat = ChatSession(user_id=current_user.id, chat_name="New Chat")
        db.session.add(new_chat)
        db.session.commit()

        # Return a success response with the new chat's details
        return jsonify({
            "message": "Chat session created successfully",
            "chat_id": new_chat.id,
            "chat_name": new_chat.chat_name
        }), 201
    except Exception as e:
        # Handle any database or server errors gracefully
        return jsonify({"error": str(e)}), 500
    


# For loading all messages for the chat    
# @views.route('/chat/<int:chat_id>/messages', methods=['GET'])
# @login_required
def chat_messages(chat_id):
    from ChatApp.models import ChatSession, Message

    # Ensure the chat session belongs to the logged-in user
    chat = ChatSession.query.filter_by(id=chat_id, user_id=current_user.id).first()
    if not chat:
        return jsonify({"error": "Chat not found or unauthorized access"}), 404

    # Query messages for the specific chat
    messages = Message.query.filter_by(chat_id=chat_id).order_by(Message.timestamp).all()

    # Serialize and return the chat messages
    return jsonify([message.serialize() for message in messages])

# For creating a new message in the chat
@views.route('/chat/<int:chat_id>/message', methods=['POST'])
@login_required
def create_message(chat_id):
    try:
        data = request.get_json()
        content = data.get('content')
        sender = data.get('sender')  # 'user' or 'bot'

        if not content or not sender:
            return jsonify({"error": "Content and sender are required!"}), 400

        # # Check if the chat session exists and belongs to the logged-in user
        # chat = ChatSession.query.filter_by(id=chat_id, user_id=current_user.id).first()
        # if not chat:
        #     return jsonify({"error": "Chat session not found or unauthorized access"}), 404

        # Create a new message
        new_message = Message(chat_id=chat_id, content=content, sender=sender, timestamp=datetime.utcnow())
        db.session.add(new_message)
        db.session.commit()

        # Return a success response with the new message's details
        return jsonify({
            "message": "Message created successfully",
            "id": new_message.id,
            "chat_id": new_message.chat_id,
            "sender": new_message.sender,
            "content": new_message.content,
            "timestamp": new_message.timestamp.isoformat()
        }), 201

    except Exception as e:
        # Handle any database or server errors gracefully
        return jsonify({"error": str(e)}), 500
