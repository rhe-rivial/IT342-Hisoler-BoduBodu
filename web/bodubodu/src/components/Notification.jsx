import { useEffect } from "react";
import "../styles/Notification.css";

function Notification({ type, message, onClose }) {

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`notification ${type}`}>
      {message}
    </div>
  );
}

export default Notification;
