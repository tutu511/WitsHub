// app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {

  // 默認進入根路徑就導向登錄頁 /login
  redirect("/login");

}
