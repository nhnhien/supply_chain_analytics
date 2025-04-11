import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from utils.cache import _cache_store  # ✅ Import cache store để clear

upload_bp = Blueprint("upload", __name__, url_prefix="/upload")

UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
ALLOWED_EXTENSIONS = {"csv"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route("/", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        file.save(os.path.join(UPLOAD_FOLDER, filename))

        # ✅ Xóa cache sau khi upload thành công
        for key in list(_cache_store.keys()):
            if key.startswith("chart_") or key.startswith("eda_") or key.startswith("forecast_") or key.startswith("reorder_"):
                del _cache_store[key]

        return jsonify({"message": "File uploaded successfully", "filename": filename}), 200

    return jsonify({"error": "Invalid file type"}), 400
