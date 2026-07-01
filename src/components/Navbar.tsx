"use client";

import { useState } from "react";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <span className="text-xl font-bold text-gray-900">Watch the Hutch</span>
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                            Install App
                        </button>
                    </div>

                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            type="button"
                            className="p-2 focus-visible:outline-2 focus-visible:outline-offset-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            aria-expanded={isOpen}
                            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
                            aria-controls="mobile-navigation"
                        >
                            {isOpen ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            )}
                        </button>
                    </div>

                </div>
            </div>

            <div id="mobile-navigation" className={`${isOpen ? 'block' : 'hidden'} md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-1 shadow-inner`}>
                <div className="pt-4 mt-2">
                    <button className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                        Install App
                    </button>
                </div>
            </div>
        </nav>
    );
}