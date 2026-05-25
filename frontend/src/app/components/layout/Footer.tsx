import { Link } from "react-router";
import { Mail, Phone, MapPin, Instagram, Linkedin, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-50 text-slate-900 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 sm:gap-10">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center mb-4 sm:mb-6">
              <img 
                src="/Foundation_logo2.png" 
                alt="WombTo18 Foundation" 
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-slate-600 mb-4 sm:mb-6 leading-relaxed max-w-md">
              Nurturing every child from conception to adulthood. Building a foundation of health, education, and opportunity.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Instagram, href: "https://www.instagram.com/wombto18?utm_source=qr&igsh=MXYzYTZrNWV3cGI5NA==", label: "Instagram" },
                { Icon: Linkedin, href: "https://www.linkedin.com/company/wombto18-foundation/", label: "LinkedIn" },
                { Icon: Youtube, href: "https://www.youtube.com/@Wombto18", label: "YouTube" }
              ].map(({ Icon, href, label }) => (
                <a 
                  key={label} 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-slate-900 font-bold mb-3 sm:mb-4">Quick Links</h4>
            {[
              { href: "/about", label: "About Us" },
              { href: "/services", label: "Our Programs" },
              { href: "/impact", label: "Our Impact" },
              { href: "/donate", label: "Donate" },
              { href: "/request-camp", label: "Host a Camp" },
              { href: "/blog", label: "Blog" },
              { href: "/verify", label: "Verify Certificate" },
            ].map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="block text-sm text-slate-600 hover:text-primary py-1 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Programs */}
          <div>
            <h4 className="text-slate-900 font-bold mb-3 sm:mb-4">Programs</h4>
            {[
              "Prenatal Care",
              "Early Childhood",
              "Education Support",
              "Health & Nutrition",
              "Youth Empowerment",
            ].map((item) => (
              <p key={item} className="text-sm text-slate-600 py-1 font-medium">{item}</p>
            ))}
          </div>

          {/* Contact */}
          <div className="col-span-2 lg:col-span-1">
            <h4 className="text-slate-900 font-bold mb-3 sm:mb-4">Contact Us</h4>
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <p className="text-sm text-slate-600 font-medium">#235, Binnamangala, 13th Cross Road, 2nd Stage, Indira Nagar, Karnataka Bengaluru - 560038</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm text-slate-600 font-medium">+91 81218 81880</p>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm text-slate-600 font-medium">info@wombto18.org</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <p className="text-sm text-slate-500 font-medium">&copy; 2026 WombTo18 Foundation. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/get-involved" className="text-sm text-slate-500 hover:text-primary transition-colors font-medium">Get Involved</Link>
            <Link to="/careers" className="text-sm text-slate-500 hover:text-primary transition-colors font-medium">Careers</Link>
            <Link to="/terms-of-use" className="text-sm text-slate-500 hover:text-primary transition-colors font-medium">Terms of Use</Link>
            <Link to="/privacy-policy" className="text-sm text-slate-500 hover:text-primary transition-colors font-medium">Privacy Policy</Link>
            <Link to="/organizer/login" className="text-sm text-slate-400 hover:text-slate-500 transition-colors font-medium">Camp Organiser</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
