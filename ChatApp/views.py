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
api_key = os.getenv('API_KEY' )

# Explicitly configure the API key for the Generative AI library
genai.configure(api_key=api_key)

views = Blueprint('views', __name__)

@views.route('/', methods=['GET'])
def welcome():
    return render_template('welcome.html')

@views.route('/home', methods=['GET', 'POST'])
@login_required  # Ensure that the user is logged in before accessing home
def home():
    
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
@views.route('/about')
@login_required
def about():
    return render_template('about.html')


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

     

        # Return the AI response back to the frontend
        return jsonify({"response": ai_reply})
    else:
        # If no message is received, return an error response
        return jsonify({"error": "No message provided!"}), 400


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
       
        new_chat = ChatSession(user_id=current_user.id, chat_name = "New Chat")
        
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
        sender = data.get('sender')

        if not content or not sender:
            return jsonify({"error": "Content and sender are required!"}), 400

        # Create a new message
        new_message = Message(chat_id=chat_id, content=content, sender=sender, timestamp=datetime.utcnow())
        db.session.add(new_message)
        db.session.commit()

        # Update chat title if the sender is the bot
        if sender == "bot":
            new_title = chat_with_google_ai(f"Summarize this conversation: {content}")
            
            # Use raw SQL for an update query
            db.session.execute(
                "UPDATE chat_session SET chat_name = :new_title WHERE id = :chat_id AND user_id = :user_id",
                {'new_title': new_title.strip(), 'chat_id': chat_id, 'user_id': current_user.id}
            )
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
        return jsonify({"error": str(e)}), 500
    

@views.route('/delete_chat', methods=['POST'])
@login_required
def delete_chat():
    data = request.get_json()
    chat_id = data.get('chatId')

    chat = ChatSession.query.get(chat_id)
    if chat and chat.user_id == current_user.id:
        # Delete associated messages
        messages = Message.query.filter_by(chat_id=chat_id).all()
        for message in messages:
            db.session.delete(message)

        db.session.delete(chat)
        db.session.commit()
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Chat not found or unauthorized"}), 403


@views.route('/<chat_id>/generate_title', methods=['POST'])
@login_required
def generate_title(chat_id):
    data = request.get_json()
    content = data.get('content')

    if not content:
        return jsonify({"error": "Content is required!"}), 400

    # Generate the title using the AI model or function
    new_title = chat_with_google_ai(f"Summarize this conversation to at most 20 character: {content}")

    if new_title:
        # Fetch the ChatSession from the database
        chat_session = ChatSession.query.get(chat_id)

        if not chat_session:
            return jsonify({"error": "ChatSession not found!"}), 404

        # Ensure the user is authorized to update this chat
        if chat_session.user_id != current_user.id:
            return jsonify({"error": "Unauthorized access!"}), 403

        # Update the ChatSession name and save to database
        chat_session.name = new_title.strip()
        db.session.commit()

        return jsonify({"title": new_title.strip(), "status": "success"})
    else:
        return jsonify({"error": "Failed to generate a title!"}), 500

def chat_with_google_ai(message):
    print(f"Sending user input to Generative AI: {message}")
    model = genai.GenerativeModel(model_name="gemini-1.5-flash")
    response = model.generate_content(message)
    ai_reply = response.text
    return ai_reply


