import { Header } from "@/app/widgets/header/header";
import { Sidebar } from "@/app/widgets/sidebar/sidebar";
import { getSession } from "@/pkg/auth/server";
import { redirect } from "next/navigation";

export default async function MaterialsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await getSession();
  const { locale } = await params;

  if (!session || session.user.role !== "admin") {
    redirect(`/${locale}/appointments`);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 ml-64">
        <Header />

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
