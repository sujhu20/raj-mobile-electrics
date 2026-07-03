import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiMail, FiPhone, FiMapPin, FiFacebook, FiInstagram,
  FiTwitter, FiYoutube, FiArrowRight, FiClock, FiExternalLink
} from 'react-icons/fi';
import { APP_NAME } from '../../config/constants';

const FOOTER_LINKS = {
  categories: [
    { to: '/products?category=smartphones', label: 'Smartphones' },
    { to: '/products?category=cameras', label: 'Cameras & Optics' },
    { to: '/products?category=earbuds', label: 'Earbuds & Audio' },
    { to: '/products?category=smart-watches', label: 'Smart Watches' },
    { to: '/products?category=tablets', label: 'Tablets' },
    { to: '/products?category=power-banks', label: 'Power Banks' },
    { to: '/products', label: 'View All Products' },
  ],
  service: [
    { to: '/orders', label: 'Track My Order' },
    { to: '/profile', label: 'My Account' },
    { to: '/cart', label: 'Shopping Cart' },
    { to: '/wishlist', label: 'Wishlist' },
    { href: '#', label: 'Return Policy' },
    { href: '#', label: 'Privacy Policy' },
  ],
};

const SOCIAL_LINKS = [
  { icon: FiFacebook, href: '#', label: 'Facebook', color: 'hover:bg-blue-600 hover:border-blue-600 hover:text-white', external: true },
  { icon: FiInstagram, href: 'https://www.instagram.com/raj_mobile_and_electric/', label: 'Instagram', color: 'hover:bg-pink-600 hover:border-pink-600 hover:text-white', external: true },
  { icon: FiTwitter, href: '#', label: 'Twitter', color: 'hover:bg-sky-500 hover:border-sky-500 hover:text-white', external: true },
  { icon: FiYoutube, href: '#', label: 'YouTube', color: 'hover:bg-red-600 hover:border-red-600 hover:text-white' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto" style={{ background: 'var(--bg-page)', borderTop: '1px solid var(--border-subtle)' }}>
      {/* Newsletter section */}
      <div className="relative overflow-hidden gradient-primary">
        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-40 h-40 rounded-full bg-white/5 translate-y-1/2 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">
                Newsletter
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Stay ahead of the curve
              </h3>
              <p className="text-white/70 text-sm mt-1 max-w-sm">
                Get the latest deals, new arrivals, and exclusive offers delivered to your inbox.
              </p>
            </div>
            <form
              className="flex w-full md:w-auto gap-0 rounded-xl overflow-hidden shadow-xl shadow-blue-900/20"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter your email address"
                className="h-12 px-5 bg-white/15 border-0 text-white placeholder-white/50 outline-none focus:bg-white/25 transition-colors w-full md:w-72 text-sm"
              />
              <button
                type="submit"
                className="h-12 px-5 bg-white text-primary-700 font-bold hover:bg-primary-50 transition-colors whitespace-nowrap flex items-center gap-2 text-sm shrink-0"
              >
                Subscribe <FiArrowRight size={15} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-5 group w-fit">
              <img
                src="/logo.jpg"
                alt={APP_NAME}
                className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:shadow-md transition-shadow"
              />
              <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {APP_NAME}
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
              Your trusted destination for mobiles, accessories, and electronics in Bhaktapur, Nepal. Genuine products, best prices.
            </p>

            {/* Social icons */}
            <div className="flex gap-2">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label, color, external }) => (
                <motion.a
                  key={label}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 ${color}`}
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                  aria-label={label}
                  title={label}
                >
                  <Icon size={16} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest mb-5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Categories
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.categories.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm flex items-center gap-1.5 group transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span
                      className="w-1 h-1 rounded-full bg-primary-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    />
                    <span className="group-hover:text-primary-600 transition-colors">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest mb-5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Customer Service
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.service.map((item) => (
                <li key={item.label}>
                  {'to' in item && item.to ? (
                    <Link
                      to={item.to}
                      className="text-sm flex items-center gap-1.5 group transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <span className="w-1 h-1 rounded-full bg-primary-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      <span className="group-hover:text-primary-600 transition-colors">{item.label}</span>
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="text-sm flex items-center gap-1.5 group transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <span className="w-1 h-1 rounded-full bg-primary-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      <span className="group-hover:text-primary-600 transition-colors">{item.label}</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Visit Our Store */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest mb-5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Visit Our Store
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                  <FiMapPin size={15} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Dudhpati, Bhaktapur
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Nepal</p>
                  <a
                    href="https://www.google.com/maps/place/Raj+Mobile+And+Electric/@27.6719628,85.4200993,17z/data=!3m1!4b1!4m6!3m5!1s0x39eb1aa499e7dbe9:0xc2f627f5027d438b!8m2!3d27.6719628!4d85.4226742!16s%2Fg%2F11b6q4kzpj?entry=ttu&g_ep=EgoyMDI2MDYyMy4wIKXMDSoASAFQAw%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 mt-1 font-medium"
                  >
                    Get directions <FiExternalLink size={11} />
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <FiPhone size={15} className="text-green-600" />
                </div>
                <div>
                  <a
                    href="tel:+9779851068696"
                    className="text-sm font-semibold hover:text-primary-600 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    +977 985-1068696
                  </a>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Call or WhatsApp</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
                  <FiInstagram size={15} className="text-pink-600" />
                </div>
                <div>
                  <a
                    href="https://www.instagram.com/raj_mobile_and_electric/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:text-pink-600 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    @raj__mobile___
                  </a>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Follow on Instagram</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <FiClock size={15} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Mon – Sat</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>10:00 AM – 7:00 PM</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                  <FiMail size={15} className="text-primary-600" />
                </div>
                <div>
                  <a
                    href="mailto:rajmobileandelectrics@gmail.com"
                    className="text-sm font-semibold hover:text-primary-600 transition-colors break-all"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    rajmobileandelectrics@gmail.com
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                &copy; {currentYear} <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{APP_NAME}</span>. All rights reserved.
              </p>
              <span className="hidden sm:block text-xs" style={{ color: 'var(--border-medium)' }}>•</span>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Made with ❤️ in Nepal</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Accepted payments:</span>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/100px-Visa_Inc._logo.svg.png"
                alt="Visa"
                className="h-5 opacity-50 hover:opacity-80 transition-opacity"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
