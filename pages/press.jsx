import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Press() {
  const router = useRouter();
  useEffect(() => { router.replace('/about'); }, [router]);
  return null;
}
