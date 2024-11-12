import pandas as pd
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://ihdpredictionsystem.netlify.app"}})

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

def classify_risk_level(probability):
    if probability <= 10:
        return "Low Risk"
    elif 10 <= probability < 20:
        return "Moderate Risk"
    elif 20 <= probability < 30:
        return "High Risk"
    else:
        return "Very High Risk"

def determine_susceptibility(probability):
    return "not susceptible" if probability == 0 else "susceptible"


@app.route('/')
def home():
    return "Welcome to the IHD Prediction API"

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        logger.info(f"Received data for prediction: {data}")

        # Validate that all required fields are present
        required_fields = ['Stroke', 'BP_Syst', 'BP_Dias', 'Chol', 'Age', 'BMI']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            error_msg = f"Missing fields in input data: {', '.join(missing_fields)}"
            logger.error(error_msg)
            return jsonify({'error': error_msg}), 400

        # Extract and validate input features
        try:
            Stroke = int(data['Stroke'])
            if Stroke not in [0, 1]:
                raise ValueError("Stroke must be 0 or 1.")
        except ValueError as e:
            logger.error(f"Invalid input for Stroke: {e}")
            return jsonify({'error': str(e)}), 400

        try:
            BP_Syst = float(data['BP_Syst'])
            BP_Dias = float(data['BP_Dias'])
            Chol = float(data['Chol'])
            Age = float(data['Age'])
            BMI = float(data['BMI'])

            # Check for non-negative values
            if any(x < 0 for x in [BP_Syst, BP_Dias, Chol, Age, BMI]):
                raise ValueError("BP_Syst, BP_Dias, Chol, Age, and BMI must be non-negative numbers.")
        except ValueError as e:
            logger.error(f"Invalid input type or value: {e}")
            return jsonify({'error': f"Invalid input type or value: {e}"}), 400

        # Create DataFrame with input features
        user_df = pd.DataFrame([{
            'Stroke': Stroke,
            'BP_Syst': BP_Syst,
            'BP_Dias': BP_Dias,
            'Chol': Chol,
            'Age': Age,
            'BMI': BMI
        }])

        logger.info(f"Features for prediction: {user_df.to_dict(orient='records')}")

        # Scale features
        features_scaled = scaler.transform(user_df)
        logger.info("Features scaled successfully.")

        # Get prediction and probability
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0][1]*100/2  # Probability for class '1'

        logger.info(f"Model prediction: {prediction}, Probability: {probability}")

        # Convert probability to percentage
        risk_percentage = round(probability, 2)

        # Determine susceptibility based on threshold 
        susceptibility = determine_susceptibility(risk_percentage)

        # Classify risk level based on percentage
        risk_level_description = classify_risk_level(risk_percentage)

        # Prepare response
        response = {
            'prediction': susceptibility,
            'percentage': risk_percentage,           
            'risk_level': risk_level_description     
        }

        logger.info(f"Sending response: {response}")
        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 8080))  
    app.run(host='0.0.0.0', port=port)