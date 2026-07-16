import { Link } from 'react-router-dom';

/** Logo officiel Bénin Top Builders. */
export default function Logo({ to = '/', size = 'md', className = '' }) {
  const dimensions = {
    sm: 'h-12 w-[138px]',
    md: 'h-14 w-[162px]',
    lg: 'h-16 w-[186px]',
  }[size];
  const inner = (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src="/logo.png"
        alt="Bénin Top Builders"
        className={`${dimensions} object-contain object-left`}
      />
    </span>
  );

  if (to === false) return inner;
  return (
    <Link to={to} aria-label="Bénin Top Builders — accueil" className="inline-flex">
      {inner}
    </Link>
  );
}
