import tensorflow as tf
import numpy as np
from PIL import Image
import os

# Define the model path - update this with your actual model path
MODEL_PATH = os.path.join(os.getcwd(), 'model', 'pneumonia_model.h5')

# Check if model file exists
model = None
if os.path.exists(MODEL_PATH):
    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        print(f"Model loaded successfully from {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading model: {e}")
else:
    print(f"Model file not found at {MODEL_PATH}")

# Define image preprocessing function
def preprocess_image(image_path, target_size=(224, 224)):
    """
    Preprocess an X-ray image for the pneumonia detection model.
    
    Args:
        image_path: Path to the image file
        target_size: Target size for the model input
        
    Returns:
        Preprocessed image as a numpy array
    """
    try:
        # Load and convert to RGB (in case the image is grayscale)
        img = Image.open(image_path).convert('RGB')
        
        # Resize the image
        img = img.resize(target_size)
        
        # Convert to numpy array and normalize
        img_array = np.array(img) / 255.0
        
        # Expand dimensions to create batch of size 1
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        return None

# Function to make predictions
def predict_pneumonia(image_path):
    """
    Predict whether an X-ray image shows signs of pneumonia.
    
    Args:
        image_path: Path to the X-ray image
        
    Returns:
        Prediction result and confidence score
    """
    if model is None:
        return "Model not loaded", None
    
    # Preprocess the image
    preprocessed_img = preprocess_image(image_path)
    
    if preprocessed_img is None:
        return "Failed to preprocess image", None
    
    # Make prediction
    prediction = model.predict(preprocessed_img)
    
    # Get the prediction result
    # Assuming binary classification where 1 = pneumonia, 0 = normal
    confidence = float(prediction[0][0])
    
    if confidence > 0.5:
        result = "Pneumonia detected"
    else:
        result = "Normal"
        confidence = 1 - confidence  # Adjust confidence for normal case
    
    return result, confidence

# Example usage
if __name__ == "__main__":
    # Check if model is loaded
    if model is not None:
        # Sample image path - update with your test image
        test_image_path = "path/to/your/test/xray.jpg"
        
        if os.path.exists(test_image_path):
            # Make prediction
            result, confidence = predict_pneumonia(test_image_path)
            
            if confidence is not None:
                print(f"Prediction: {result}")
                print(f"Confidence: {confidence:.2%}")
            else:
                print(result)
        else:
            print(f"Test image not found at {test_image_path}")
    else:
        print("Please ensure the model file exists before running predictions.")