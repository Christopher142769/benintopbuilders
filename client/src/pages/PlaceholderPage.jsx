import { Link } from 'react-router-dom';

export default function PlaceholderPage({ title, description }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center md:px-8">
      <span className="eyebrow justify-center">Bientôt disponible</span>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-lg text-gris">{description}</p>
      <Link to="/" className="btn-orange mt-8 inline-flex">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
