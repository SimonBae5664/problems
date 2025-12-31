import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ProblemList from './pages/Problems/ProblemList'
import ProblemDetail from './pages/Problems/ProblemDetail'
import SubmitProblem from './pages/SubmitProblem/SubmitProblem'
import MyProblems from './pages/MyProblems/MyProblems'
import FileList from './pages/Files/FileList'
import AdminDashboard from './pages/Admin/AdminDashboard'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<ProblemList />} />
                <Route path="/problems" element={<ProblemList />} />
                <Route path="/problems/:id" element={<ProblemDetail />} />
                <Route path="/submit" element={<SubmitProblem />} />
                <Route path="/my-problems" element={<MyProblems />} />
                <Route path="/files" element={<FileList />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

