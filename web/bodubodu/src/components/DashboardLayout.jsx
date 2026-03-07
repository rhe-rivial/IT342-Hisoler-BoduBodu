import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../styles/DashboardLayout.css";

function DashboardLayout() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
