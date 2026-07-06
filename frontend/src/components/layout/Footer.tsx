import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMapPin, FiPhone } from 'react-icons/fi';
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';
import { APP_NAME } from '../../config/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      icon: FaFacebook,
      href: 'https://www.facebook.com/profile.php?id=100063920367208',
      label: 'Facebook',
      color: 'hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]',
    },
    {
      icon: FaInstagram,
      href: 'https://www.instagram.com/raj_mobile_and_electric/',
      label: 'Instagram',
      color: 'hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white hover:border-transparent',
    },
    {
      icon: FaTiktok,
      href: 'https://www.tiktok.com/@raj_mobile_and_electric',
      label: 'TikTok',
      color: 'hover:bg-black hover:text-white hover:border-black',
    },
  ];

  const contactLinks = [
    {
      icon: FiPhone,
      href: 'tel:+9779851068696',
      label: '+977 985-1068696',
      sublabel: 'Call Us',
      bgClass: 'bg-amber-50 text-amber-600',
    },
    {
      icon: FaWhatsapp,
      href: 'https://wa.me/9779851068696',
      label: 'WhatsApp Chat',
      sublabel: 'Message Us',
      bgClass: 'bg-green-50 text-green-600',
    },
    {
      icon: FiMapPin,
      href: 'https://www.google.com/maps/place/Raj+Mobile+And+Electric/@27.6719628,85.4200993,17z/data=!3m1!4b1!4m6!3m5!1s0x39eb1aa499e7dbe9:0xc2f627f5027d438b!8m2!3d27.6719628!4d85.4226742!16s%2Fg%2F11b6q4kzpj?entry=ttu&g_ep=EgoyMDI2MDYyMy4wIKXMDSoASAFQAw%3D%3D',
      label: 'Dudhpati, Bhaktapur',
      sublabel: 'Find Us on Map',
      bgClass: 'bg-blue-50 text-blue-600',
    },
  ];

  return (
    <footer className="mt-auto border-t border-[#F0EDE6] bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#F0EDE6]">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.jpg"
              alt={APP_NAME}
              className="w-9 h-9 rounded-xl object-cover shadow-sm group-hover:shadow-md transition-shadow"
            />
            <span className="text-base font-extrabold tracking-tight text-[#2C2620] group-hover:text-primary-600 transition-colors">
              {APP_NAME}
            </span>
          </Link>

          {/* Social Links (TikTok, Facebook, Instagram) */}
          <div className="flex gap-2.5">
            {socialLinks.map(({ icon: Icon, href, label, color }) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`w-9 h-9 rounded-xl border border-[#F0EDE6] flex items-center justify-center text-[#706557] bg-white transition-all duration-200 ${color}`}
                aria-label={label}
                title={label}
              >
                <Icon size={16} />
              </motion.a>
            ))}
          </div>
        </div>

        {/* Contact Links & Map logo (Phone, WhatsApp, Location Map) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6">
          {contactLinks.map(({ icon: Icon, href, label, sublabel, bgClass }) => (
            <motion.a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              whileHover={{ scale: 1.01 }}
              className="flex items-center gap-3.5 p-3 rounded-2xl border border-[#F0EDE6] hover:border-primary-300 hover:shadow-sm bg-white transition-all duration-300 group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgClass} transition-transform group-hover:scale-105`}>
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#A39684]">{sublabel}</p>
                <p className="text-sm font-bold text-[#2C2620] truncate group-hover:text-primary-600 transition-colors">{label}</p>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-xs text-[#A39684]">
          <p>
            &copy; {currentYear} <span className="font-semibold text-[#706557]">{APP_NAME}</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <p>Made with ❤️ in Nepal</p>
            <span className="text-[#D1C9BC]">•</span>
            <div className="flex items-center gap-1.5 opacity-60">
              <span className="font-medium">Payments:</span>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/100px-Visa_Inc._logo.svg.png"
                alt="Visa"
                className="h-4 object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
