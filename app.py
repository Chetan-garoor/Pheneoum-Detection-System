from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import uuid
from werkzeug.utils import secure_filename
from model import predict_pneumonia

# Initialize Flask app
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # limit to 5MB
app.config['DEMO_MODE'] = True  # Set to False when your real model is ready

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Serve the main application page"""
    return render_template('index.html')

@app.route('/check-mode')
def check_mode():
    """Return whether the system is in demo mode"""
    return jsonify({'demo_mode': app.config['DEMO_MODE']})

@app.route('/predict', methods=['POST'])
def predict():
    """Handle image upload and prediction"""
    # Check if a file was sent
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    # Check if file is empty
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Check if file has allowed extension
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Please upload a JPG, JPEG, or PNG file.'}), 400
    
    try:
        # Generate unique filename
        unique_filename = str(uuid.uuid4()) + '_' + secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        # Get prediction
        if app.config['DEMO_MODE']:
            # In demo mode, we don't actually use the model
            import random
            import time
            # Simulate processing time
            time.sleep(1)
            
            # Simulate a prediction
            is_pneumonia = random.random() > 0.5
            confidence = 70 + random.random() * 25  # Random confidence between 70-95%
            
            result = {
                'prediction': 'Pneumonia Detected' if is_pneumonia else 'Normal (No Pneumonia)',
                'confidence': f'{confidence:.2f}%',
                'confidence_raw': float(f'{confidence:.2f}'),
                'filename': file.filename,
                'status': 'success'
            }
        else:
            # Use the actual model for prediction
            result = predict_pneumonia(filepath)
        
        return jsonify(result)
    
    except Exception as e:
        # Log the error
        app.logger.error(f"Error processing file: {str(e)}")
        return jsonify({'error': 'Error processing the image'}), 500

@app.route('/static/images/<path:filename>')
def serve_images(filename):
    """Serve static images"""
    return send_from_directory(os.path.join(app.static_folder, 'images'), filename)

if __name__ == '__main__':
    app.run(debug=True) 