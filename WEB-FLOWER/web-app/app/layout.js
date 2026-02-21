import './globals.css';

export const metadata = {
  title: 'Mood Flowers WebApp',
  description: 'Telegram web app for flower shop'
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
