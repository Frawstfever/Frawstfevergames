"use client";
import { useRouter } from "next/navigation";

export default function LogoutUserButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/customer-logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={logout} className="btn btn-ghost text-sm">
      Sign out
    </button>
  );
}
