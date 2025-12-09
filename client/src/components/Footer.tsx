import { Mail, MapPin, Phone } from 'lucide-react'

const Footer = () => {
    return (
        <footer className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Company Info */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                    NepBio
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                    Advanced batch record management for bioprocessing operations. 
                    </p>
                </div>

                {/* Quick Links */}
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-blue-300">Quick Links</h4>
                    <ul className="space-y-2">
                    <li><a href="/home" className="text-gray-300 hover:text-white transition-colors">Home</a></li>
                    <li><a href="/records" className="text-gray-300 hover:text-white transition-colors">Batch Records</a></li>
                    <li><a href="/products" className="text-gray-300 hover:text-white transition-colors">Products</a></li>
                    <li><a href="/profile" className="text-gray-300 hover:text-white transition-colors">Profile</a></li>
                    </ul>
                </div>

                {/* Support */}
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-green-300">Support</h4>
                    <ul className="space-y-2">
                    <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Documentation</a></li>
                    <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact Support</a></li>
                    </ul>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-purple-300">Contact</h4>
                    <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-gray-300">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span className="text-sm">123 Biotech Avenue<br />Research Park, CA 94301</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-300">
                        <Phone className="w-4 h-4 text-green-400" />
                        <span className="text-sm">+1 (555) 123-4567</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-300">
                        <Mail className="w-4 h-4 text-purple-400" />
                        <span className="text-sm">support@nepbio.com</span>
                    </div>
                    </div>
                </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                <div className="text-gray-400 text-sm mb-4 md:mb-0">
                    2025 NepBio Systems. All rights reserved.
                </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer