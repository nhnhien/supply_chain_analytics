"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { uploadFile } from "../services/api"
import { toast } from "react-hot-toast"
import { Upload, FileText, Check, AlertCircle } from "react-feather"
import "./Upload.css"

const UploadPage = () => {
  // Thay đổi state từ file đơn lẻ thành mảng files
  const [files, setFiles] = useState([])
  // Thay thế state file cũ
  // const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const navigate = useNavigate()

  // Cập nhật hàm xử lý khi chọn file
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    const validFiles = selectedFiles.filter((file) => file.name.endsWith(".csv"))

    if (validFiles.length === 0) {
      toast.error("Vui lòng chọn file CSV")
      return
    }

    if (validFiles.length < selectedFiles.length) {
      toast.warning("Chỉ các file CSV được chấp nhận")
    }

    setFiles((prevFiles) => [...prevFiles, ...validFiles])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  // Cập nhật hàm xử lý khi kéo thả file
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const validFiles = droppedFiles.filter((file) => file.name.endsWith(".csv"))

    if (validFiles.length === 0) {
      toast.error("Vui lòng chọn file CSV")
      return
    }

    if (validFiles.length < droppedFiles.length) {
      toast.warning("Chỉ các file CSV được chấp nhận")
    }

    setFiles((prevFiles) => [...prevFiles, ...validFiles])
  }

  // Thêm hàm xóa file
  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
  }

  // Cập nhật hàm upload để xử lý nhiều file
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Vui lòng chọn file để tải lên")
      return
    }

    try {
      setIsUploading(true)

      // Tạo mảng promises cho việc upload nhiều file
      const uploadPromises = files.map((file) => uploadFile(file))

      // Chờ tất cả các file được upload
      await Promise.all(uploadPromises)

      toast.success("Tải lên thành công!")
      setFiles([])
      setIsUploading(false)

      // Chuyển hướng đến trang Dashboard sau khi tải lên thành công
      navigate("/")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Lỗi khi tải lên file. Vui lòng thử lại.")
      setIsUploading(false)
    }
  }

  return (
    <div className="upload-page">
      <h1 className="page-title">Tải lên dữ liệu</h1>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Tải lên file CSV</h2>
        </div>
        <div className="card-body">
          <div
            className={`upload-area ${isDragging ? "dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-icon">
              <Upload size={48} />
            </div>
            <div className="upload-text">
              <p>Kéo và thả file CSV vào đây hoặc</p>
              <label className="upload-button">
                Chọn file
                <input type="file" accept=".csv" onChange={handleFileChange} multiple hidden />
              </label>
            </div>
            <p className="upload-note">Chỉ hỗ trợ file CSV</p>
          </div>

          {files.length > 0 && (
            <div className="selected-files">
              <h3 className="files-heading">File đã chọn ({files.length})</h3>
              <div className="files-list">
                {files.map((file, index) => (
                  <div className="selected-file" key={index}>
                    <FileText size={16} />
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                    <button className="remove-file-btn" onClick={() => removeFile(index)} title="Xóa file">
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="upload-actions">
            <button
              className="btn btn-primary upload-submit"
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Đang tải lên...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Tải lên {files.length > 0 ? `(${files.length} file)` : ""}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Hướng dẫn</h2>
        </div>
        <div className="card-body">
          <div className="instructions">
            <div className="instruction-item">
              <div className="instruction-icon">
                <Check size={20} color="#4caf50" />
              </div>
              <div className="instruction-text">
                <h3>Định dạng file</h3>
                <p>Hệ thống chỉ hỗ trợ file CSV với các cột dữ liệu đúng định dạng.</p>
              </div>
            </div>

            <div className="instruction-item">
              <div className="instruction-icon">
                <AlertCircle size={20} color="#ff9800" />
              </div>
              <div className="instruction-text">
                <h3>Lưu ý quan trọng</h3>
                <p>Việc tải lên file mới sẽ xóa cache và cập nhật toàn bộ dữ liệu phân tích.</p>
              </div>
            </div>

            <div className="instruction-item">
              <div className="instruction-icon">
                <FileText size={20} color="#2196f3" />
              </div>
              <div className="instruction-text">
                <h3>Các file cần thiết</h3>
                <p>Hệ thống cần các file sau: df_Customers.csv, df_Orders.csv, df_OrderItems.csv, df_Products.csv</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadPage
