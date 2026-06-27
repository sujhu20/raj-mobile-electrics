import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-8xl mb-4">🔍</div>
        <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
        <h2 className="text-2xl font-bold text-surface-900 mb-2">Page Not Found</h2>
        <p className="text-surface-700/60 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition"
        >
          Go Home
        </Link>
      </motion.div>
    </div>
  );
}
