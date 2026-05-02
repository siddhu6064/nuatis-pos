interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#F8F7F4" }}
    >
      <div className="text-center max-w-sm w-full px-8">
        <h1
          className="text-[32px] font-bold text-gray-900 mb-2"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Nuatis POS
        </h1>
        <p
          className="text-[14px] text-gray-500 mb-8"
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          Salon point of sale
        </p>
        <button
          onClick={onLogin}
          className="
            w-full py-3.5 px-6
            bg-gray-900 text-white
            text-[15px] font-semibold
            rounded-xl
            hover:bg-gray-800
            active:scale-[0.98]
            transition-all duration-150
          "
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          Log in
        </button>
      </div>
    </div>
  );
}
