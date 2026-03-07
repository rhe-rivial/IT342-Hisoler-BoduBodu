import "../styles/Button.css";

function Button({ children, onClick, loading }) {
  return (
    <button
      className="btn"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? <span className="spinner"></span> : children}
    </button>
  );
}

export default Button;
