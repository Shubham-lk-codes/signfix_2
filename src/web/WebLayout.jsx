import React from 'react';
import { TopBar } from './components/layout/TopBar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

export default function WebLayout({ children }) {
  return (
    <div className="bg-paper text-muted font-body min-h-screen flex flex-col antialiased">
      <TopBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
