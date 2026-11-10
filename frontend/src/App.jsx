import AppShell from './components/AppShell';
import { ErrorState } from './components/ui/States';
import { Routes, Route, Navigate } from "react-router";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import { checkAuth } from "./authSlice"
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, lazy, Suspense } from "react";
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const ProblemPage = lazy(() => import("./pages/ProblemPage"));
import Admin from "./pages/Admin";
import AdminDelete from "./components/AdminDelete"
import AdminVideo from "./components/AdminVideo"
const AdminUpload = lazy(() => import("./components/AdminUpload"));

const AdminUpdate = lazy(() => import("./pages/AdminUpdate"));

const Bookmarks = lazy(() => import("./pages/Bookmarks"));

function App() {

  // Code for isAuthentciated
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth); // read isAuthenticated from the store. 'auth' is the name of the slice. And state.auth returns { user: null, isAuthenticated: false, loading: false, error: null}


  const [checking, setChecking] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [sessionAttempt, setSessionAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setChecking(true);
    setConnectionError(false);
    dispatch(checkAuth()).then(action => {
      if (!active) return;
      // Only an explicit unauthorised response establishes a signed-out session.
      // An unavailable API must not look like an expired session.
      const unavailable = checkAuth.rejected.match(action) && action.payload?.response?.status !== 401;
      setConnectionError(unavailable);
      setChecking(false);
    });
    return () => { active = false; };
  }, [dispatch, sessionAttempt]);

  // console.log(user)
  // console.log(isAuthenticated);

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg" role="status" aria-label="Checking your session"></span>
    </div>;
  } // If data is loading execute this.

  if (connectionError) {
    return <AppShell><ErrorState
      message="We could not connect to check your session. Check your connection and try again."
      onRetry={() => setSessionAttempt(attempt => attempt + 1)}
    /></AppShell>;
  }

  return (
    <AppShell>
      <Suspense fallback={<div className="state-panel" role="status"><span className="loading loading-spinner" />Loading workspace…</div>}>
      <Routes>
        <Route path="*" element={<div className="state-panel"><h1>Page not found</h1><a className="btn" href="/">Back to problems</a></div>} />
        <Route path="/" element={isAuthenticated ? <Homepage></Homepage> : <Navigate to="/login" />}></Route>
        <Route path="/bookmarks" element={isAuthenticated ? <Bookmarks key={user?._id} /> : <Navigate to="/login" />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login></Login>}></Route>
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/" /> : <Signup></Signup>}></Route>
        { /* <Route path="/admin" element={<AdminPanel />}></Route> */} {/* Anyone can access this route. But we want only admin to access this route. So we will check if the user is authenticated and if the user is admin or not. If both are true, then we will show the admin panel. Else we will redirect to homepage. */}
        {/* <Route
          path="/admin"
          element={
            isAuthenticated && user?.role === 'admin' ?
              <AdminPanel /> :
              <Navigate to="/" />
          }
        /> */}

        <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
        <Route path="/admin/update" element={isAuthenticated && user?.role === 'admin' ? <AdminUpdate /> : <Navigate to="/" />} />
        <Route path="/admin/update/:problemId" element={isAuthenticated && user?.role === 'admin' ? <AdminUpdate /> : <Navigate to="/" />} />
        <Route path="/admin/create" element={isAuthenticated && user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />} />
        <Route path="/admin/delete" element={isAuthenticated && user?.role === 'admin' ? <AdminDelete /> : <Navigate to="/" />} />
        <Route path="/admin/video" element={isAuthenticated && user?.role === 'admin' ? <AdminVideo /> : <Navigate to="/" />} />
        <Route path="/admin/upload/:problemId" element={isAuthenticated && user?.role === 'admin' ? <AdminUpload /> : <Navigate to="/" />} />
        <Route path="/problem/:problemId" element={<ProblemPage />}></Route>
      </Routes></Suspense>
    </AppShell>
  )
}

export default App;

// isAuthenticated ?<Homepage></Homepage>:<Navigate to="/signup" :- If authenticated, then go to homepage else go to signup page. This is for the root route. If the user is authenticated, then he should not be able to go to login or signup page. So we check if he is authenticated, then we redirect him to homepage. If he is not authenticated, then we redirect him to login or signup page.

// element={isAuthenticated?<Navigate to="/" />:<Login></Login>} :- if user is already logged in, then he should not be able to go to login page. So we check if he is authenticated, then we redirect him to homepage. If he is not authenticated, then we show him the login page. Same for signup page.

// dispatch(checkAuth()) :- This will check if the user is authenticated or not. It will send a request to the backend to check if the user is authenticated or not. If he is authenticated, then it will set isAuthenticated to true in the store. If he is not authenticated, then it will set isAuthenticated to false in the store. And based on that we will redirect the user to the appropriate page.