// app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // 根路徑直接導向 dashboard
  redirect("/dashboard");
}
