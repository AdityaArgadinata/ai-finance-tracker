"use client";

import { useState } from "react";
import Image from "next/image";

export function AccountAvatar({ name, src }: { name: string; src?: string }) {
  const [failed, setFailed] = useState(false);
  return <div className="account-avatar">{src && !failed ? <Image unoptimized src={src} alt="" width={84} height={84} referrerPolicy="no-referrer" onError={() => setFailed(true)} /> : name.charAt(0).toUpperCase()}</div>;
}
