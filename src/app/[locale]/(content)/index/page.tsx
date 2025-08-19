import { redirect } from "next/navigation";

export default function ContentIndexPage() {
  redirect("/content/tools");
  return null;
} 