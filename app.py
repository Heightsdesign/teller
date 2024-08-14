from flask import Flask, request, jsonify
import fitz  # PyMuPDF
from flask_cors import CORS
from text_split import split_text_into_chunks
from models import Session, User, Progress, Chunk
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

DATABASE_URL = 'sqlite:///app.db'  # You can change this to PostgreSQL, MySQL, etc.

engine = create_engine(DATABASE_URL)

Session = sessionmaker(bind=engine)
session = Session()

@app.route('/register', methods=['POST'])
def register():
    
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if session.query(User).filter_by(email=email).first():
        return jsonify({"error": "User already exists"}), 400

    new_user = User(email=email)
    new_user.set_password(password)
    session.add(new_user)
    session.commit()

    return jsonify({"message": "User registered successfully"})

@app.route('/login', methods=['POST'])
def login():
    
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = session.query(User).filter_by(email=email).first()

    if user and user.check_password(password):
        # Here, you'd typically generate a token or session
        return jsonify({"message": "Login successful"})
    else:
        return jsonify({"error": "Invalid email or password"}), 401

@app.route('/extract_text', methods=['POST'])
def extract_text():
    if 'pdf' not in request.files:
        return jsonify({"error": "No PDF file provided"}), 400

    try:
        pdf_file = request.files['pdf']
        book_title = request.form.get('title', 'Unknown Title')
        user_email = request.form.get('email')

        # Read the PDF file
        pdf_document = fitz.open(stream=pdf_file.read(), filetype="pdf")
        text = ""
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            text += page.get_text()

        # Split the extracted text into chunks
        chunks = split_text_into_chunks(text, sentences_per_chunk=5)

        # Save the chunks in the database
        session = Session()
        for index, chunk_text in chunks.items():
            chunk = Chunk(book_title=book_title, chunk_index=index, text=chunk_text)
            session.add(chunk)
        session.commit()

        # Initialize user progress if not already set
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            user = User(email=user_email, subscription_type='free')  # Default to free tier
            session.add(user)
            session.commit()

        progress = Progress(user_id=user.id, book_title=book_title, current_chunk=0)
        session.add(progress)
        session.commit()

        return jsonify({"chunks": chunks})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)
if __name__ == '__main__':
    app.run(port=5000)

