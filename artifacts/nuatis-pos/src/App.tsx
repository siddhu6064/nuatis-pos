import { useAuth } from "@workspace/replit-auth-web";
import { RegisterPage } from "@/pages/RegisterPage";
import { LoginPage } from "@/pages/LoginPage";
import { ManagerOverrideProvider } from "@/hooks/useManagerOverride";
import { ActiveVerticalProvider } from "@/hooks/useActiveVertical";
import { runMigrations } from "@/lib/storage";

// Run once on module load — migrates legacy localStorage keys into vertical-namespaced
// keys before any hook reads from storage.
runMigrations();

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

  return (
    <ActiveVerticalProvider>
      <ManagerOverrideProvider>
        <RegisterPage user={user} onLogout={logout} />
      </ManagerOverrideProvider>
    </ActiveVerticalProvider>
  );
}

export default App;
