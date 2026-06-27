'use client';

import React, { useEffect, useCallback } from 'react';
import NextLink from 'next/link';
import { useRouter, usePathname, useParams as useNextParams, useSearchParams as useNextSearchParams } from 'next/navigation';

export function Link({ to, children, ...props }) {
  // Convert react-router-dom 'to' to Next.js 'href'
  return (
    <NextLink href={to} {...props}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return useCallback((path, options) => {
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  }, [router]);
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  return {
    pathname,
    search: searchParams ? '?' + searchParams.toString() : '',
    hash: '',
  };
}

export function useParams() {
  return useNextParams();
}

export function useSearchParams() {
  const searchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSearchParams = useCallback((nextParams) => {
    const params = new URLSearchParams(nextParams);
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router]);

  return [searchParams, setSearchParams];
}

export function Navigate({ to, replace }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router]);
  return null;
}
