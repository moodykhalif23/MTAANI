import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative h-16 w-16 md:h-20 md:w-20 p-2 rounded-2xl bg-gradient-to-br from-[#0A558C]/10 to-[#0A558C]/5 shadow-lg">
                <Image
                  src="/mtaani-high-resolution-logo-transparent.png"
                  alt="Mtaani"
                  fill
                  className="object-contain p-1 filter drop-shadow-sm"
                />
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">Connecting communities, one local business at a time.</p>
          </div>

          <div>
            <h5 className="font-bold mb-4 text-gray-900">Explore</h5>
            <ul className="space-y-3 text-gray-600">
              <li>
                <Link href="/businesses" className="hover:text-[#0A558C] transition-colors duration-200">
                  Local Businesses
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-[#0A558C] transition-colors duration-200">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/calendar" className="hover:text-[#0A558C] transition-colors duration-200">
                  Calendar
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-[#0A558C] transition-colors duration-200">
                  Community
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold mb-4 text-gray-900">For Business</h5>
            <ul className="space-y-3 text-gray-600">
              <li>
                <Link href="/submit-business" className="hover:text-[#0A558C] transition-colors duration-200">
                  List Your Business
                </Link>
              </li>
              <li>
                <Link href="/submit-event" className="hover:text-[#0A558C] transition-colors duration-200">
                  Create Event
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-[#0A558C] transition-colors duration-200">
                  Business Resources
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0A558C] transition-colors duration-200">
                  Advertise With Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold mb-4 text-gray-900">Support</h5>
            <ul className="space-y-3 text-gray-600">
              <li>
                <a href="#" className="hover:text-[#0A558C] transition-colors duration-200">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0A558C] transition-colors duration-200">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0A558C] transition-colors duration-200">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 text-center text-gray-500">
          <p>&copy; 2024 Mtaani. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
