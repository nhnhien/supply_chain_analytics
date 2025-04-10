from flask import Flask
from routes.upload import upload_bp
from routes.analyze import analyze_bp
from routes.forecast import forecast_bp
from routes.reorder import reorder_bp

app = Flask(__name__)
app.register_blueprint(upload_bp)
app.register_blueprint(analyze_bp)
app.register_blueprint(forecast_bp)
app.register_blueprint(reorder_bp)

@app.route("/ping")
def ping():
    return {"message": "pong"}

if __name__ == "__main__":
    app.run(debug=True)
