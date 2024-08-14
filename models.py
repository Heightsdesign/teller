from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from werkzeug.security import generate_password_hash, check_password_hash

Base = declarative_base()


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    current_chunk_index = Column(Integer, default=0)
    subscription_type = Column(String, default='free')
    progress = relationship("Progress", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Progress(Base):
    __tablename__ = 'progress'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    book_title = Column(String, nullable=False)
    current_chunk = Column(Integer, nullable=False)
    user = relationship('User', back_populates='progress')

class Chunk(Base):
    __tablename__ = 'chunks'
    id = Column(Integer, primary_key=True)
    book_title = Column(String, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)

DATABASE_URL = 'sqlite:///app.db'  # You can change this to PostgreSQL, MySQL, etc.

engine = create_engine(DATABASE_URL)
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)


Session = sessionmaker(bind=engine)
session = Session()
