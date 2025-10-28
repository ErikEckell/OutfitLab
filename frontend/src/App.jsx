import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Weather from "./pages/Weather";
import Closet from "./pages/Closet";
import Laboratory from "./pages/Laboratory";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Loading from "./pages/Loading";
import CameraScreen from "./pages/CameraScreen";
import ByFilesScreen from "./pages/ByFiles";
import ConfirmClothes from "./pages/ConfirmClothes";

const getIsAuthenticated = () =>
  typeof window !== "undefined" && localStorage.getItem("accessToken");

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = getIsAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

const RootRedirect = () => {
  const isAuthenticated = getIsAuthenticated();
  return <Navigate to={isAuthenticated ? "/home" : "/login"} replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<RootRedirect />}
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route
          path="/weather"
          element={
            <ProtectedRoute>
              <Weather />
            </ProtectedRoute>
          }
        />
        <Route
          path="/closet"
          element={
            <ProtectedRoute>
              <Closet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/laboratory"
          element={
            <ProtectedRoute>
              <Laboratory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/loading"
          element={
            <ProtectedRoute>
              <Loading />
            </ProtectedRoute>
          }
        />

        <Route
          path="/camera"
          element={
            <ProtectedRoute>
              <CameraScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/byfiles"
          element={
            <ProtectedRoute>
              <ByFilesScreen />
            </ProtectedRoute>
          }
        />


        <Route
          path="/confirm-clothes"
          element={
            <ProtectedRoute>
              <ConfirmClothes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />


        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;
