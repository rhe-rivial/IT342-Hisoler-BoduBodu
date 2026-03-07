import { useNavigate } from "react-router-dom";

function Topbar() {
  const navigate = useNavigate();

//   const logout = () => {
//     localStorage.removeItem("user");
//     navigate("/login");
//   };

  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="topbar">
      <div>
        <h3>Welcome, {user?.firstName}</h3>
      </div>

      {/* <button className="logout-btn" onClick={logout}>
        Logout
      </button> */}
    </div>
  );
}

export default Topbar;
