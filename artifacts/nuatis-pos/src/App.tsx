import { useAuth } from "@workspace/replit-auth-web";
import { RegisterPage } from "@/pages/RegisterPage";
import { LoginPage } from "@/pages/LoginPage";

function App() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F8F7F4" }}
      >
        <span
          className="text-[14px] font-medium text-gray-400"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Loading...
        </span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage onLogin={login} />;
  }

  return <RegisterPage user={user} onLogout={logout} />;
}

export default App;
