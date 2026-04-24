import { Outlet } from "react-router-dom";
import { ScrollFx } from "./ScrollFx";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function SiteLayout() {
  return (
    <>
      <ScrollFx />
      <Header />

      <main className="min-h-screen w-full flex flex-col">
        <div className="flex-1 w-full flex flex-col">
          <Outlet />
        </div>
      </main>

      <Footer />
    </>
  );
}
