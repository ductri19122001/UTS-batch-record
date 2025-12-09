import "./index.css";
import Login from "./components/Login";
import Home from "./components/Home";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import NavBar from "./components/NavBar";
import Admin from "./components/Admin";
import AuditLog from "./components/auditLog/AuditLog";
import TemplateMaker from "./components/TemplateMaker/index";
import { useAuth0 } from "@auth0/auth0-react";
import BatchRecordEditor from "./components/BatchRecordEditor";
import Records from "./components/Records";
import Products from "./components/Products";
import FilteredRecords from "./components/FilteredRecords";
import BatchEditRequest from "./components/BatchEditRequest/BatchEditRequest";
import ApprovalsPage from "./components/ApprovalsPage";
import { useEffect } from "react";
import axios from "axios";
import UserList from "./components/UserList";

const Profile = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">Profile</h1>
    <p>Profile page coming soon...</p>
  </div>
);

function App() {
  let { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

  useEffect(() => {
    async function syncAuth0User() {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            scope: "openid profile email",
          }
        })

        await axios.post(`${serverUrl}/api/users/sync`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      catch (error) {
        console.error("Error syncing Auth0 user with server:", error);
      }
    }

    if (isAuthenticated) {
      syncAuth0User();
    }

  }, [isAuthenticated, getAccessTokenSilently])

  return (
    <div className="App min-h-screen bg-gray-50">
      {isAuthenticated && <NavBar></NavBar>}
      <main className="min-h-screen">
        <Routes>
          <Route index path="/" element={<Login />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute
                children={Home}
                requiredRoles={["USER", "ADMIN", "QA", "QC"]}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute children={Admin} requiredRoles={["ADMIN"]} />
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute children={UserList} requiredRoles={["ADMIN"]} />
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute
                children={AuditLog}
                requiredRoles={["USER", "ADMIN"]}
              />
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute
                children={Products}
                requiredRoles={["user", "admin"]}
              />
            }
          />
          <Route
            path="/records"
            element={
              <ProtectedRoute
                children={Records}
                requiredRoles={["USER", "ADMIN", "QA", "QC"]}
              />
            }
          />
          <Route
            path="/records/filtered"
            element={
              <ProtectedRoute
                children={FilteredRecords}
                requiredRoles={["USER", "ADMIN"]}
              />
            }
          />
          <Route
            path="/BatchRecordsEditor"
            element={
              <ProtectedRoute
                children={BatchRecordEditor}
                requiredRoles={["USER", "ADMIN"]}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute
                children={Profile}
                requiredRoles={["USER", "ADMIN"]}
              />
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute
                children={TemplateMaker}
                requiredRoles={["ADMIN", "QA", "QC"]}
              />
            }
          />
          <Route
            path="/batch-edit-request"
            element={<BatchEditRequest />} />
          <Route
            path="/approvals"
            element={
              <ProtectedRoute
                children={ApprovalsPage}
                requiredRoles={["admin"]}
              />
            }
          />
        </Routes>
      </main>
      {/* {isAuthenticated && <Footer />} */}
    </div>
  );
}

export default App;
