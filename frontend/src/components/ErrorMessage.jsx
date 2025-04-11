const ErrorMessage = ({ message }) => {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <div className="error-message">{message || "Đã xảy ra lỗi. Vui lòng thử lại sau."}</div>
      </div>
    )
  }
  
  export default ErrorMessage
  