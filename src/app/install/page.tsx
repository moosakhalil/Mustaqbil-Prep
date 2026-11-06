import { InstallPage } from "@/components/pwa/install-page";

export const metadata = { title: "Install Mustaqbil Prep", description: "Put Mustaqbil Prep on your phone's home screen. It takes about 20 seconds." };

// Public, like the sign-in page: it is the link to send a friend. It shows the install steps that fit their phone.
export default function InstallRoute() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 py-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/emblem.webp" alt="" width={96} height={100} className="mx-auto h-24 w-auto" />
      <h1 className="mt-3 text-center text-[26px] font-extrabold text-accent">Install Mustaqbil Prep</h1>
      <p className="mb-5 mt-1 text-center text-sm text-soft">It takes about 20 seconds.</p>
      <InstallPage />
    </main>
  );
}
