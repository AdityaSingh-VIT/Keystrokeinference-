from datetime import datetime
import json
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class AudioSample(db.Model):
    """Stores information about uploaded audio samples"""
    __tablename__ = 'audio_samples'
    
    id = Column(Integer, primary_key=True)
    filename = Column(String(255), nullable=False)
    duration = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    feedback = db.relationship('UserFeedback', back_populates='audio_sample', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<AudioSample {self.filename}>'

class UserFeedback(db.Model):
    """Stores user feedback about model predictions"""
    __tablename__ = 'user_feedback'
    
    id = Column(Integer, primary_key=True)
    audio_sample_id = Column(Integer, ForeignKey('audio_samples.id'), nullable=False)
    predicted_text = Column(Text, nullable=True)
    correct_text = Column(Text, nullable=True)
    accuracy_rating = Column(Integer, nullable=True)  # User rating of accuracy (1-5)
    accuracy_percentage = Column(Float, nullable=True)  # Calculated accuracy percentage
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    audio_sample = db.relationship('AudioSample', back_populates='feedback')
    
    def __repr__(self):
        return f'<UserFeedback id={self.id}, rating={self.accuracy_rating}>'

class TrainingDataset(db.Model):
    """Stores information about training datasets"""
    __tablename__ = 'training_datasets'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    num_samples = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_trained = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f'<TrainingDataset {self.name}>'

class TrainedModel(db.Model):
    """Stores information about trained models and their performance"""
    __tablename__ = 'trained_models'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    model_type = Column(String(50), nullable=False)  # CNN, HMM, or Combined
    version = Column(String(50), nullable=True)
    num_samples = Column(Integer, default=0)
    accuracy = Column(Float, nullable=True)  # Overall accuracy percentage
    parameters = Column(Text, nullable=True)  # JSON representation of model parameters/settings
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    evaluations = db.relationship('ModelEvaluation', back_populates='model', cascade='all, delete-orphan')
    
    def set_parameters(self, params_dict):
        """Store parameters as JSON string"""
        self.parameters = json.dumps(params_dict)
    
    def get_parameters(self):
        """Retrieve parameters as dictionary"""
        if self.parameters:
            return json.loads(self.parameters)
        return {}
    
    def __repr__(self):
        return f'<TrainedModel {self.name}, accuracy={self.accuracy}>'

class ModelEvaluation(db.Model):
    """Stores evaluation metrics for trained models"""
    __tablename__ = 'model_evaluations'
    
    id = Column(Integer, primary_key=True)
    model_id = Column(Integer, ForeignKey('trained_models.id'), nullable=False)
    evaluation_type = Column(String(50), nullable=False)  # Test, Validation, Real-world
    dataset_size = Column(Integer, nullable=True)
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    confusion_matrix = Column(Text, nullable=True)  # Store as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    model = db.relationship('TrainedModel', back_populates='evaluations')
    
    def set_confusion_matrix(self, matrix):
        """Store confusion matrix as JSON string"""
        self.confusion_matrix = json.dumps(matrix)
    
    def get_confusion_matrix(self):
        """Retrieve confusion matrix as list/dictionary"""
        if self.confusion_matrix:
            return json.loads(self.confusion_matrix)
        return []
    
    def __repr__(self):
        return f'<ModelEvaluation model_id={self.model_id}, accuracy={self.accuracy}>'
