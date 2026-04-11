import { createPortal } from "react-dom";
import "../styles/ConfirmModal.css";

function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-box">

        <h3>{title}</h3>
        <p>{message}</p>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            {cancelText}
          </button>

          <button className="confirm-btn" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

export default ConfirmModal;