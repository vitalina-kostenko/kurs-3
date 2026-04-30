import { Header } from "@/app/widgets/header/header";
import { Sidebar } from "@/app/widgets/sidebar/sidebar";

export default function MaterialsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
