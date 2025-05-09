"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  uploadFile,
  saveUploadedFiles,
  getUploadedFiles,
  clearAllCache,
  preloadAllData,
  markDataAsLoaded,
} from "../services/api"
import { toast } from "react-hot-toast"
import { Upload, FileText, Check, AlertCircle, Info, RefreshCw, Loader } from "react-feather"
import "./Upload.css"

const UploadPage = () => {
  const [files, setFiles] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isPreloading, setIsPreloading] = useState(false)
  const [preloadProgress, setPreloadProgress] = useState(0)
  const navigate = useNavigate()
  const [loadingUploaded, setLoadingUploaded] = useState(true)

  
  // Tải thông tin về các file đã upload từ localStorage khi component mount
  useEffect(() => {
    const fetchUploadedFiles = async () => {
      const savedFiles = await getUploadedFiles()
      setUploadedFiles(savedFiles)
      setLoadingUploaded(false)
    }
    fetchUploadedFiles()
  }, [])
  

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    const validFiles = selectedFiles.filter((file) => file.name.endsWith(".csv"))

    if (validFiles.length === 0) {
      toast.error("Please select a CSV file")
      return
    }

    if (validFiles.length < selectedFiles.length) {
      toast.warning("Only CSV files are accepted")
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

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const validFiles = droppedFiles.filter((file) => file.name.endsWith(".csv"))

    if (validFiles.length === 0) {
      toast.error("Please select a CSV file")
      return
    }

    if (validFiles.length < droppedFiles.length) {
      toast.warning("Only CSV files are accepted")
    }

    setFiles((prevFiles) => [...prevFiles, ...validFiles])
  }

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
  }

  const simulateProgress = () => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 10
      if (progress > 100) {
        progress = 100
        clearInterval(interval)
      }
      setPreloadProgress(Math.floor(progress))
    }, 1000)

    return () => clearInterval(interval)
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload")
      return
    }

    try {
      setIsUploading(true)

      // Xóa cache hiện tại trước khi upload dữ liệu mới
      clearAllCache()

      // Tạo mảng promises cho việc upload nhiều file
      const uploadPromises = files.map((file) => uploadFile(file))

      // Chờ tất cả các file được upload
      await Promise.all(uploadPromises)

      // Lưu thông tin về các file đã upload vào localStorage
      saveUploadedFiles(files)

      // Cập nhật state với các file đã upload
      const uploaded = await getUploadedFiles()
      setUploadedFiles(uploaded)
      
      // Thông báo thành công với thông tin thêm về thời gian xử lý
      toast.success("Upload success! Preloading data for all pages...", { duration: 6000 })

      setFiles([])
      setIsUploading(false)

      // Bắt đầu tải trước dữ liệu cho tất cả các trang
      setIsPreloading(true)
      const stopSimulation = simulateProgress()

      try {
        // Tải trước tất cả dữ liệu
        await preloadAllData()

        // Đánh dấu dữ liệu đã được tải
        markDataAsLoaded()

        // Dừng mô phỏng tiến trình
        stopSimulation()
        setPreloadProgress(100)

        setTimeout(() => {
          setIsPreloading(false)
          toast.success("All page data has been successfully loaded!")

          // Chuyển hướng đến trang Dashboard sau khi tải xong
          navigate("/")
        }, 1000)
      } catch (error) {
        console.error("Error preloading data:", error)
        stopSimulation()
        setIsPreloading(false)
        toast.error(
          "Error while preloading data. You can still access the pages, but data may take time to load.",
        )

        // Chuyển hướng đến trang Dashboard ngay cả khi có lỗi
        navigate("/")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Error uploading file. Please try again.")
      setIsUploading(false)
    }
  }

  const handleClearUploadedFiles = () => {
    if (
      window.confirm(
        "Are you sure you want to delete all uploaded files? This will clear the cache and require re-uploading the data.",
      )
    ) {
      clearAllCache()
      setUploadedFiles([])
      toast.success("All uploaded files and cache have been deleted.")
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="upload-page">
      <h1 className="page-title">Upload Data</h1>

      {/* Hiển thị tiến trình tải trước dữ liệu */}
      {isPreloading && (
        <div className="preloading-container">
          <div className="preloading-content">
            <Loader className="preloading-icon" />
            <h3>Preloading data for all pages...</h3>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${preloadProgress}%` }}></div>
            </div>
            <p className="preloading-text">{preloadProgress}% completed</p>
            <p className="preloading-note">
            This process may take a few minutes. Please do not close or refresh the page.
            </p>
          </div>
        </div>
      )}

      {/* Hiển thị các file đã upload trước đó */}
      {uploadedFiles.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Uploaded Files</h2>
            <button className="btn btn-secondary" onClick={handleClearUploadedFiles}>
              <RefreshCw size={16} />
              <span>Clear All</span>
            </button>
          </div>
          <div className="card-body">
            <div className="uploaded-files-info">
              <Info size={20} />
              <p>
              Data has been uploaded and is currently in use. To upload new data, please remove existing files first.
              </p>
            </div>
            <div className="uploaded-files-list">
              {uploadedFiles.map((file, index) => (
                <div className="uploaded-file" key={index}>
                  <FileText size={16} />
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                  <span className="file-date">Uploaded: {formatDate(file.uploadedAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form upload file mới */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Upload CSV File</h2>
        </div>
        <div className="card-body">
          <div className="upload-notice">
            <Info size={20} />
            <p>
  After uploading, the system will automatically preload data for all pages. This process may take a few minutes,
  but it will help you access the pages faster afterward. The data will be retained even if you refresh the page.
</p>
          </div>

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
              <p>Drag and drop your CSV files here or</p>
              <label className="upload-button">
              Choose File
                <input type="file" accept=".csv" onChange={handleFileChange} multiple hidden />
              </label>
            </div>
            <p className="upload-note">Only CSV files are supported</p>
          </div>

          {files.length > 0 && (
            <div className="selected-files">
              <h3 className="files-heading">Selected Files ({files.length})</h3>
              <div className="files-list">
                {files.map((file, index) => (
                  <div className="selected-file" key={index}>
                    <FileText size={16} />
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                    <button className="remove-file-btn" onClick={() => removeFile(index)} title="Remove File">
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
              disabled={files.length === 0 || isUploading || isPreloading}
            >
              {isUploading ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Upload  {files.length > 0 ? `(${files.length} file)` : ""}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Instructions</h2>
        </div>
        <div className="card-body">
          <div className="instructions">
            <div className="instruction-item">
              <div className="instruction-icon">
                <Check size={20} color="#4caf50" />
              </div>
              <div className="instruction-text">
                <h3>File Format</h3>
                <p>The system only supports CSV files with properly formatted columns.</p>
              </div>
            </div>

            <div className="instruction-item">
              <div className="instruction-icon">
                <AlertCircle size={20} color="#ff9800" />
              </div>
              <div className="instruction-text">
                <h3>Important Note</h3>
                <p>Uploading new files will clear the cache and update all analysis data.</p>
              </div>
            </div>

            <div className="instruction-item">
              <div className="instruction-icon">
                <FileText size={20} color="#2196f3" />
              </div>
              <div className="instruction-text">
                <h3>Required Files</h3>
                <p>The system requires the following files: df_Customers.csv, df_Orders.csv, df_OrderItems.csv, df_Products.csv</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadPage
