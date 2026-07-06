import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-[#FAF9F6] to-[#F3F0E9] relative overflow-hidden">
        {/* Subtle gold-tinted grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8b5e0005_1px,transparent_1px),linear-gradient(to_bottom,#8b5e0005_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none" />
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
