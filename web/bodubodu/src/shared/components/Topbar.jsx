import { useEffect, useState } from "react";

function Topbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h3>
          {getGreeting()}, {user?.firstName} 👋
        </h3>
        <p>{getFormattedDate()} · Let's push your limits today.</p>
      </div>
    </div>
  );
}

export default Topbar;