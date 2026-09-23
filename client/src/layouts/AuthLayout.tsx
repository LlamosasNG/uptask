import Logo from "@/components/Logo";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";

export default function AuthLayout() {
  return (
    <>
      <main className="min-h-screen bg-slate-900 px-4 py-10 sm:py-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mx-auto max-w-64"><Logo /></div>
          <div className="mt-8">
            <Outlet />
          </div>
        </div>
      </main>
      <ToastContainer pauseOnHover={false} pauseOnFocusLoss={false} />
    </>
  );
}
