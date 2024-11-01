import pandas as pd
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load the trained model and scaler
try:
    logger.info("Loading the scaler...")
    scaler = joblib.load('scaler1.joblib')
    logger.info("Scaler loaded successfully.")

    logger.info("Loading the trained model...")
    model = joblib.load('final_model1.joblib')
    logger.info("Model loaded successfully.")
except Exception as e:
    logger.error(f"Error loading model or scaler: {e}")

@app.route('/')
def home():
    return "Welcome to the IHD Prediction API"

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        logger.info(f"Received data for prediction: {data}")

        # Extract input features
        Age = float(data['Age'])
        BP_Syst = float(data['BP_Syst'])
        Chol = float(data['Chol'])
        BMI = float(data['BMI'])
        Stroke = int(data['Stroke'])  # Should be 0 or 1

        # Compute interaction features
        BP_Age_Interaction = BP_Syst * Age
        Chol_Age_Interaction = Chol * Age
        Chol_BMI_Interaction = Chol * BMI
        Stroke_BMI_Interaction = Stroke * BMI

        logger.info("Computed interaction features.")

        # Create DataFrame with the features
        features = pd.DataFrame([{
            'BP_Age_Interaction': BP_Age_Interaction,
            'Chol_Age_Interaction': Chol_Age_Interaction,
            'Chol_BMI_Interaction': Chol_BMI_Interaction,
            'BP_Syst': BP_Syst,
            'Age': Age,
            'Stroke_BMI_Interaction': Stroke_BMI_Interaction
        }])

        logger.info(f"Features for prediction: {features.to_dict(orient='records')}")

        # Scale features
        features_scaled = scaler.transform(features)
        logger.info("Features scaled successfully.")

        # Get prediction and probability
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0][1]  # Probability for class '1'

        logger.info(f"Model prediction: {prediction}, Probability: {probability}")

        # Convert prediction and probability to response format
        prediction_str = "susceptible" if prediction == 1 else "not susceptible"
        response = {
            'prediction': prediction_str,
            'percentage': round(probability * 100, 2)  # Convert to percentage
        }
        logger.info(f"Sending response: {response}")
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 8080))  
    app.run(host='0.0.0.0', port=port)
