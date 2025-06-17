 
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_cors import CORS
import os
from config import Config
from models import db
from routes import register_routes

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    mail = Mail(app)
    jwt = JWTManager(app)
    
    # Setup CORS
    CORS(app, origins=[app.config['FRONTEND_URL']], 
         allow_headers=["Content-Type", "Authorization"])
    
    # Create upload directory
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # JWT Error Handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token expired'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token'}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Token required'}), 401
    
    # Basic routes
    @app.route('/')
    def home():
        return jsonify({'message': 'Fileapp Backend Running'}), 200

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'healthy'}), 200
    
    # Register all routes
    register_routes(app, mail)
    
    # Create database tables
    with app.app_context():
        db.create_all()
        print("Fileapp Database Created")
        print("Server: http://localhost:5000")
        print("Frontend: http://localhost:3000")
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)