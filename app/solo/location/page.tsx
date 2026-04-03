'use client';

import { useEffect, useState } from 'react';
import { session } from '@/lib/session';
import FlowLocationPage from '@/components/flow/FlowLocationPage';

export default function SoloLocationPage() {
  const [backHref, setBackHref] = useState('/solo/people');

  useEffect(() => {
    const mode = session.get<string>('soloMode');
    setBackHref(mode === 'custom' ? '/solo/custom' : '/solo/people');
  }, []);

  return (
    <FlowLocationPage
      backHref={backHref}
      nextHref="/solo/random"
      sessionKey="soloLocation"
    />
  );
}
