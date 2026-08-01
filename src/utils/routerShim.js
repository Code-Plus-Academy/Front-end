'use client';

import React, { useEffect, useCallback, Suspense } from 'react';
import NextLink from 'next/link';
import { useRouter, usePathname, useParams as useNextParams, useSearchParams as useNextSearchParams } from 'next/navigation';

export function Link({ to, href, children, ...props }) {
  // Convert react-router-dom 'to' to Next.js 'href'
  return (
    <NextLink href={to || href || '/'} {...props}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return useCallback((path, options) => {
    if (!path) return;
    const target = typeof path === 'number' ? path : String(path);
    if (typeof target === 'number') {
      window.history.go(target);
    } else if (options?.replace) {
      router.replace(target);
    } else {
      router.push(target);
    }
  }, [router]);
}

export function useLocation() {
  const pathname = usePathname();
  let search = '';
  if (typeof window !== 'undefined') {
    search = window.location.search || '';
  }
  return {
    pathname: pathname || '/',
    search,
    hash: '',
    state: null,
  };
}

export function useParams() {
  return useNextParams();
}

export function useSearchParams() {
  const router = useRouter();
  const pathname = usePathname();

  const setSearchParams = useCallback((nextParams) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(nextParams);
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router]);

  let searchParams = new URLSearchParams();
  if (typeof window !== 'undefined') {
    searchParams = new URLSearchParams(window.location.search);
  }

  return [searchParams, setSearchParams];
}

export function Navigate({ to, replace }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!to) return;
    const targetPath = to.split('?')[0];
    // Guard against navigating to the exact path we are already on to prevent reload loops
    if (pathname === targetPath) return;

    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router, pathname]);
  return null;
}

// Stub — BrowserRouter is a no-op in Next.js (routing handled by Next)
export function BrowserRouter({ children }) {
  return <>{children}</>;
}

// Route/Switch/Routes stubs (in case any component imports them)
export function Routes({ children }) { return <>{children}</>; }
export function Route() { return null; }
export function Switch({ children }) { return <>{children}</>; }
