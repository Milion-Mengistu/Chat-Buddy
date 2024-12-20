# ChatBUDDY AI assistant

A multi-functional ChatApp powered by Google Gemini AI and Flask. Designed to assist users in various domains, from educational support and creative ideation to general queries, this ChatApp offers intuitive and interactive user experiences.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [API Endpoints](#api-endpoints)
5. [Demo Screenshots](#demo-screenshots)
6. [Future Enhancements](#future-enhancements)

---

## Overview

This multi-purpose AI ChatApp leverages Google Gemini AI to provide intelligent, context-aware, and creative responses. It supports user authentication, real-time conversation tracking, and persistent chat history with a dynamic and responsive interface.

---

## Features

- **AI-Powered Conversations**: Utilizes Google Gemini AI for generating intelligent and creative responses.
- **Multi-Purpose Functionality**:
  - Answer FAQs and provide topic explanations.
  - Assist with creative ideation and general queries.
- **User Authentication**:
  - Traditional signup and login with secure password hashing.
  - Support for third-party login (e.g., Google).
- **Chat Features**:
  - Start new chats with AI generated titles.
  - Save, delete, and revisit chat histories.
  - Generate concise titles for conversations using AI.
- **Secure and Persistent**:
  - User data and chat history stored securely using Flask SQLAlchemy.
  - Session management with Flask-Login.
- **Streaming Response**:
  - Stream response for better user experience.
- **Web Application**:
  - Modern and responsive interface built with Flask.

---

## Technologies Used

- **Backend**: Flask, Flask-Login, Flask-SQLAlchemy
- **Frontend**: HTML, CSS, JavaScript
- **AI Integration**: Google Gemini AI
- **Environment Variables**: Managed using `python-dotenv`

---

## API Endpoints

### User Authentication

- **POST** `/auth/login`: Authenticate and log in a user.
- **POST** `/auth/signup`: Register a new user.

### Chat Functionality

- **GET** `/chat/<int:chat_id>`: Render the chat interface.
- **POST** `/chat`: Send a message and receive a response.
- **POST** `/user/chat`: Create a new chat with an optional title.
- **POST** `/<chat_id>/generate_title`: Save a custom title for an existing chat.
- **GET** `/api/load_chat/<recent_id>`: Load messages for a specific chat.
- **DELETE** `/delete_chat`: Delete a chat and its associated messages.

### AI Integration

- **POST** `/<chat_id>/generate_title`: Generate a concise title for a conversation using AI.

---

## Demo Screenshots

1. **welcome page**
   ![alt text](<ChatApp/static//Welcome page.png>)
2.  **home page**
   ![alt text](<ChatApp/static//homepage.png>)
2. **Login and Signup Pages**
   ![alt text](ChatApp/static/Login.png)
   ![alt text](ChatApp/static/Sign-Up.png)
3. **Chat Interface**
   ![alt text](<ChatApp/static//Realtime streaming.png>)

---

## Future Enhancements

- **Memory**: Enable the ChatApp to remember past conversations and context.
- **Improved AI Responses**: Refine answers for better accuracy and relevance.
- **Advanced UI Features**: Add enhanced interactivity.
- **Usage Analytics**: Implement user interaction metrics for insights and improvements.

---