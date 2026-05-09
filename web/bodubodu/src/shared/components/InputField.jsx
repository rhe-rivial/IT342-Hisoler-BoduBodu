import "../styles/InputField.css";

function InputField({
  label,
  type = "text",
  value,
  onChange,
  error
}) {
  return (
    <div className="input-group">
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`input ${error ? "error" : ""}`}
        required
      />
      <label className={value ? "floating" : ""}>
        {label}
      </label>

      <div className="input-error-container">
        {error && <span className="input-error">{error}</span>}
      </div>
    </div>
  );
}

export default InputField;
