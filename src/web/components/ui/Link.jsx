import React from 'react';
import useRoute from '../../../hooks/useRoute';

export default function Link({ href, children, className, onClick, ...props }) {
  const { path, navigate } = useRoute();

  const handleClick = (e) => {
    if (onClick) onClick(e);

    if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    e.preventDefault();

    if (href.startsWith('/#') || href.startsWith('#')) {
      const targetId = href.replace(/^\/#?/, '');
      if (path !== '/') {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
          else window.scrollTo(0, 0);
        }, 100);
      } else {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo(0, 0);
      }
      return;
    }

    navigate(href);
  };

  return (
    <a href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}
