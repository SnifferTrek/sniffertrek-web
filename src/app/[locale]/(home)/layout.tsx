import { Caveat } from "next/font/google";
import "../v2/v2.css";

const script = Caveat({
  subsets: ["latin"],
  variable: "--font-v2-script",
});

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <div className={script.variable}>{children}</div>;
}
