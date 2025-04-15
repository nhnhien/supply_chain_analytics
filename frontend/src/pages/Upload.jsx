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
      toast.error("Vui lòng chọn file để tải lên")
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
      toast.success("Tải lên thành công! Đang tải trước dữ liệu cho tất cả các trang...", { duration: 6000 })

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
          toast.success("Đã tải xong dữ liệu cho tất cả các trang!")

          // Chuyển hướng đến trang Dashboard sau khi tải xong
          navigate("/")
        }, 1000)
      } catch (error) {
        console.error("Error preloading data:", error)
        stopSimulation()
        setIsPreloading(false)
        toast.error(
          "Có lỗi khi tải trước dữ liệu. Bạn vẫn có thể truy cập các trang nhưng có thể phải đợi dữ liệu tải.",
        )

        // Chuyển hướng đến trang Dashboard ngay cả khi có lỗi
        navigate("/")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Lỗi khi tải lên file. Vui lòng thử lại.")
      setIsUploading(false)
    }
  }

  const handleClearUploadedFiles = () => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa tất cả file đã upload? Điều này sẽ xóa cache và yêu cầu tải lên lại dữ liệu.",
      )
    ) {
      clearAllCache()
      setUploadedFiles([])
      toast.success("Đã xóa tất cả file đã upload và cache")
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
      <h1 className="page-title">Tải lên dữ liệu</h1>

      {/* Hiển thị tiến trình tải trước dữ liệu */}
      {isPreloading && (
        <div className="preloading-container">
          <div className="preloading-content">
            <Loader className="preloading-icon" />
            <h3>Đang tải trước dữ liệu cho tất cả các trang...</h3>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${preloadProgress}%` }}></div>
            </div>
            <p className="preloading-text">{preloadProgress}% hoàn thành</p>
            <p className="preloading-note">
              Quá trình này có thể mất vài phút. Vui lòng không đóng hoặc tải lại trang.
            </p>
          </div>
        </div>
      )}

      {/* Hiển thị các file đã upload trước đó */}
      {uploadedFiles.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">File đã tải lên</h2>
            <button className="btn btn-secondary" onClick={handleClearUploadedFiles}>
              <RefreshCw size={16} />
              <span>Xóa tất cả</span>
            </button>
          </div>
          <div className="card-body">
            <div className="uploaded-files-info">
              <Info size={20} />
              <p>
                Dữ liệu đã được tải lên và đang được sử dụng. Nếu bạn muốn tải lên dữ liệu mới, hãy xóa các file hiện
                tại trước.
              </p>
            </div>
            <div className="uploaded-files-list">
              {uploadedFiles.map((file, index) => (
                <div className="uploaded-file" key={index}>
                  <FileText size={16} />
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                  <span className="file-date">Đã tải lên: {formatDate(file.uploadedAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form upload file mới */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Tải lên file CSV</h2>
        </div>
        <div className="card-body">
          <div className="upload-notice">
            <Info size={20} />
            <p>
              Sau khi tải lên, hệ thống sẽ tự động tải trước dữ liệu cho tất cả các trang. Quá trình này có thể mất vài
              phút, nhưng sẽ giúp bạn truy cập các trang nhanh hơn sau đó. Dữ liệu sẽ được lưu trữ ngay cả khi bạn tải
              lại trang.
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
              disabled={files.length === 0 || isUploading || isPreloading}
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
