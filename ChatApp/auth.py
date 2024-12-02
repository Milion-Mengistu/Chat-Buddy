from flask import Blueprint, request, render_template, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash
from .models import User
from . import db
from flask_login import login_required, login_user, logout_user
from . import oauth
from .models import OAuth

auth = Blueprint('auth', __name__)

google = oauth.google

# Route to login
@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user,remember=True)
            flash("Logged in successfully!", "success")  # Flash success message
            return redirect(url_for('views.home'))  # Redirect to home after successful login
        else:
            flash("Invalid email or password", "danger")  # Flash error message

    return render_template('login.html')


# Route to logout
@auth.route('/logout', methods=['POST', 'GET'])
@login_required
def logout():
    logout_user()
    flash("Logged out successfully!", "info")  # Flash info message
    return redirect(url_for('auth.login'))


@auth.route('/login/google')
def login_google():
    redirect_uri = url_for('auth.google_login', _external=True)
    return google.authorize_redirect(redirect_uri)


# Route to sign-up
@auth.route('/sign-up', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        password_confirm = request.form.get('password-confirm')

        # Check if the password and confirmation match
        if password != password_confirm:
            flash("Passwords do not match", "danger")  # Flash error message
            return redirect(url_for('auth.signup'))

        # Check if the user already exists
        existing_user = User.query.filter_by(email=email).first()

        if existing_user:
            flash("Email already in use", "danger")  # Flash error message
            return redirect(url_for('auth.signup'))

        # Create a new user
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256:600000')
        new_user = User(name=name, email=email, password_hash=hashed_password, )
        
        # Save the user to the database
        db.session.add(new_user)
        db.session.commit()

        # Log the user in after registration
        login_user(new_user)
        flash("Sign-up successful!", "success")  # Flash success message
        return redirect(url_for('views.home'))  # Redirect to home after sign-up

    return render_template('signup.html')


@auth.route('/login/google/authorized')
def google_login():
    try:
        print("Request Args:", request.args) 
        token = google.authorize_access_token()
        print("Token:",token)
        resp = google.get('https://www.googleapis.com/oauth2/v2/userinfo')
        user_info = resp.json()
        if user_info:
            email = user_info.get("email")
            name = user_info.get("name")
            profile_picture = user_info.get("picture")
            provider_id = user_info.get("id")
            user = User.query.filter_by(email=email).first()
            if not user:
                user = User.query.filter_by(provider="google", provider_id=provider_id).first()

            if not user:
                # If no user found, create a new user
                user = User(
                    email=email,
                    name=name,
                    profile_picture=profile_picture,
                    provider="google",
                    provider_id=provider_id
                )
                db.session.add(user)
                db.session.commit()  # Commit the new user to the database

            # Log the user in
            login_user(user)

            # Create or update the OAuth token association
            oauth = OAuth.query.filter_by(provider="google", provider_user_id=provider_id).first()
            if not oauth:
                oauth = OAuth(
                    provider="google",
                    provider_user_id=provider_id,
                    token= token,
                    user_id=user.id
                )
                db.session.add(oauth)
                db.session.commit()
    except Exception as e: # Print detailed exception 
        print(f"An error occurred: {e}") 
        flash("An error occurred during Google login.","error")
        return redirect(url_for("auth.login"))
    return redirect(url_for('views.home'))  # Redirect to home after successful login
