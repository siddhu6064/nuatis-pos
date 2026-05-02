import { SERVICES } from "@/lib/services";
import { ServiceTile } from "@/components/ServiceTile";
import { Header } from "@/components/Header";
import type { AuthUser } from "@workspace/replit-auth-web";

interface RegisterPageProps {
  user: AuthUser;
  onLogout: () => void;
}

export function RegisterPage({ user, onLogout }: RegisterPageProps) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#F8F7F4" }}
    >
      <Header user={user} onLogout={onLogout} />

      <main className="flex-1 px-6 py-5">
        <div className="grid grid-cols-4 gap-3">
          {SERVICES.map((service) => (
            <ServiceTile key={service.id} service={service} />
          ))}
        </div>
      </main>
    </div>
  );
}
