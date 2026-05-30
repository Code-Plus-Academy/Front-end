'use client';
/**
 * HelmetShim — Drop-in replacement for react-helmet-async's <Helmet> in Next.js App Router.
 * Updates document.title and basic meta tags on the client side.
 * For SSR metadata, use Next.js generateMetadata() in page.jsx files.
 */
import { useEffect } from 'react';

export function Helmet({ children }) {
  useEffect(() => {
    if (!children) return;
    const childArray = Array.isArray(children) ? children : [children];
    childArray.forEach(child => {
      if (!child?.type) return;
      if (child.type === 'title') {
        document.title = child.props.children || '';
      } else if (child.type === 'meta') {
        const { name, property, content } = child.props;
        if (!content) return;
        const selector = name
          ? `meta[name="${name}"]`
          : property
          ? `meta[property="${property}"]`
          : null;
        if (!selector) return;
        let el = document.querySelector(selector);
        if (!el) {
          el = document.createElement('meta');
          if (name) el.setAttribute('name', name);
          if (property) el.setAttribute('property', property);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      }
    });
  });
  return null;
}

export function HelmetProvider({ children }) {
  return children;
}
