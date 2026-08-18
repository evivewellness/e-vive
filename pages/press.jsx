import { useEffect } from 'react';
import { useRouter } from 'next/router';
import PageMeta from '../components/PageMeta';

export default function Press() {
  const router = useRouter();
  useEffect(() => { router.replace('/about'); }, [router]);
  return <PageMeta title="Press" path="/about/" noindex />;
}
