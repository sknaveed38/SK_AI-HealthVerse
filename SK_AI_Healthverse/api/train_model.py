import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

# Create synthetic health data for training
# Features: [Heart Rate, Oxygen Level, Steps (normalized)]
# Target: 0 (Low Risk), 1 (High Risk)
def generate_data(n_samples=1000):
    np.random.seed(42)
    hr = np.random.randint(60, 110, n_samples)
    ox = np.random.randint(90, 100, n_samples)
    steps = np.random.randint(1000, 15000, n_samples)
    
    # Simple logic for risk: High HR + Low Oxygen = Higher Risk
    # Risk increases if HR > 90 and Oxygen < 94
    risk = ((hr > 90) & (ox < 94)).astype(int)
    
    # Add some noise
    noise = np.random.choice([0, 1], size=n_samples, p=[0.9, 0.1])
    risk = np.logical_xor(risk, noise).astype(int)
    
    df = pd.DataFrame({
        'heart_rate': hr,
        'oxygen_level': ox,
        'steps': steps,
        'risk': risk
    })
    return df

print("Generating synthetic data...")
data = generate_data()

X = data[['heart_rate', 'oxygen_level', 'steps']]
y = data['risk']

print("Training Random Forest model...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# Save the model
model_path = 'health_risk_model.joblib'
joblib.dump(model, model_path)
print(f"Model saved to {model_path}")
