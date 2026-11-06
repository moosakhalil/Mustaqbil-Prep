import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

// The start address only decides where to go
export default async function Home() {
  const session = await getSession();
  redirect(session ? "/home" : "/sign-in");
}
