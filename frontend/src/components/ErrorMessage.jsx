const ErrorMessage = ({ message }) => {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <div className="error-message">{message || "An error has occurred. Please try again later."}</div>
      </div>
    )
  }
  
  export default ErrorMessage
  