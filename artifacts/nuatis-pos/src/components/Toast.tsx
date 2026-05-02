interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  return (
    <div
      className="fixed top-5 right-5 z-[60] px-4 py-3 rounded-xl shadow-lg"
      style={{
        backgroundColor: "white",
        color: "#111827",
        fontFamily: "'Epilogue', sans-serif",
        fontSize: "14px",
        fontWeight: 500,
        animation: "toast-slide 1.5s ease forwards",
        minWidth: "220px",
      }}
    >
      {message}
    </div>
  );
}
