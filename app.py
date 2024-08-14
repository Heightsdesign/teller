from flask import Flask, request, jsonify, session as flask_session, redirect
import fitz  # PyMuPDF
from flask_cors import CORS
from text_split import split_text_into_chunks
from models import Session, User, Progress, Chunk
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy import create_engine

app = Flask(__name__)
app.secret_key = 'mysupersecretkey123'
CORS(app)  # Enable CORS for all routes

DATABASE_URL = 'sqlite:///app.db'  # You can change this to PostgreSQL, MySQL, etc.

engine = create_engine(DATABASE_URL)

# Scoped session for thread safety
db_session = scoped_session(sessionmaker(bind=engine))

@app.teardown_appcontext
def remove_session(exception=None):
    db_session.remove()

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    subscription_type = data.get('subscription_type', 'free')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if db_session.query(User).filter_by(email=email).first():
        return jsonify({"error": "User already exists"}), 400

    new_user = User(email=email)
    new_user.set_password(password)
    new_user.subscription_type = subscription_type  # Set subscription type
    db_session.add(new_user)
    db_session.commit()

    return jsonify({"message": "User registered successfully"})


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    # Validate the user credentials with the database here
    user = db_session.query(User).filter_by(email=email).first()
    if user and user.check_password(password):
        flask_session['user_id'] = user.id  # Store the user_id in the Flask session
        return jsonify({"message": "Login successful"}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401
    

@app.route('/extract_text', methods=['POST'])
def extract_text():
    if 'pdf' not in request.files:
        return jsonify({"error": "No PDF file provided"}), 400

    try:
        pdf_file = request.files['pdf']
        book_title = request.form.get('title', 'Unknown Title')
        user_email = request.form.get('email')

        if not user_email:
            return jsonify({"error": "User email is required"}), 400

        # Fetch or create the user
        user = db_session.query(User).filter_by(email=user_email).first()
        if not user:
            user = User(email=user_email, subscription_type='free')  # Default to free tier
            db_session.add(user)
            db_session.commit()

        # Check if the user already has progress for this book
        progress = db_session.query(Progress).filter_by(user_id=user.id, book_title=book_title).first()
        if not progress:
            progress = Progress(user_id=user.id, book_title=book_title, current_chunk=0)
            db_session.add(progress)
            db_session.commit()

        # Read the PDF file
        pdf_document = fitz.open(stream=pdf_file.read(), filetype="pdf")
        text = ""
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            text += page.get_text()

        # Split the extracted text into chunks
        chunks = split_text_into_chunks(text, sentences_per_chunk=5)

        # Save the chunks in the database
        for index, chunk_text in chunks.items():
            chunk = Chunk(book_title=book_title, chunk_index=index, text=chunk_text)
            db_session.add(chunk)
        db_session.commit()

        return jsonify({"chunks": chunks})
    except Exception as e:
        db_session.rollback()  # Rollback in case of any error
        return jsonify({"error": str(e)}), 500
    finally:
        db_session.close()  # Ensure the session is closed

@app.route('/logout', methods=['POST'])
def logout():
    if 'user_id' in flask_session:
        flask_session.pop('user_id', None)  # Remove the user_id from the Flask session
        return jsonify({"message": "Logged out successfully"}), 200
    else:
        return jsonify({"error": "User not logged in"}), 400

if __name__ == '__main__':
    app.run(port=5000)
