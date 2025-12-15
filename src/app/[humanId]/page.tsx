"use client";
import Image from "next/image";
import { useParams } from "next/navigation";

export default function Home() {
    const params = useParams();
    const human_id = params["humanId"];
  const handleClick = async () => {
    const response = await fetch("/api/resposes", {
      method: "POST",
      body: JSON.stringify({ human_id: human_id, reaction_time: 100 }),
    });
    const data = await response.json();
    console.log(data);
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      hello pragya is here

      <button onClick={handleClick}>Click me</button>
    </div>
  );
}
