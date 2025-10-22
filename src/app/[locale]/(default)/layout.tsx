import { ReactNode } from "react";

export default async function DefaultLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <main className="overflow-x-hidden">{children}</main>;
}
