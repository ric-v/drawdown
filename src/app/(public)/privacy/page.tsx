
import { ThemeToggle } from "@/components/layout/theme-toggle"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-700">
            <div className="container max-w-3xl mx-auto px-6 py-12">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <Link href="/">
                        <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Button>
                    </Link>
                    <ThemeToggle />
                </div>

                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Privacy Policy
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                        We don't collect your data because we have nowhere to put it. We don't have servers, databases, or analytics teams. It's just you and your files.
                    </p>

                    <div className="prose dark:prose-invert max-w-none space-y-6">
                        
                        <section className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">1. Data Minimization</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                This project strictly adheres to the principle of "access only what is needed". We do not store, sell, share, or even look at your data. 
                            </p>
                        </section>

                        <section className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">2. Why Google Drive & OneDrive Access?</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                When you sign in with Google or Microsoft, we request limited access to your cloud storage. Here's exactly what we do:
                            </p>
                            <ul className="list-disc list-inside mt-4 space-y-3 text-gray-600 dark:text-gray-400 ml-4">
                                <li><strong>File Storage:</strong> We store your portfolio data as a compressed file (<code className="text-sm bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">drawdown-portfolio.json.gz</code>) in your own Google Drive or OneDrive.</li>
                                <li><strong>Read Access:</strong> We read this file to display your trading performance, daily P&L, and fund transactions.</li>
                                <li><strong>Write Access:</strong> When you add or update trades, we write the changes back to your file in real-time.</li>
                                <li><strong>Limited Scope:</strong> We only access the specific portfolio file we create. We cannot see, read, or access any other files in your Drive/OneDrive.</li>
                                <li><strong>No Central Database:</strong> Your data never touches our servers. It goes directly from your browser to your cloud storage.</li>
                            </ul>
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 rounded">
                                <p className="text-sm text-blue-900 dark:text-blue-200">
                                    <strong>Why this approach?</strong> By storing data in your own cloud storage, you maintain complete ownership and control. You can view, backup, or delete the file at any time without our involvement.
                                </p>
                            </div>
                        </section>

                        <section className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">3. Data Storage & Security</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Your portfolio data is stored as a compressed file in your personal cloud storage:
                            </p>
                            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                                <li><strong>Google users:</strong> File stored in your Google Drive root directory</li>
                                <li><strong>Microsoft users:</strong> File stored in your OneDrive root directory</li>
                                <li><strong>Compression:</strong> Data is compressed using gzip to save space and bandwidth</li>
                                <li><strong>Format:</strong> Plain JSON format - you can download and read it with any text editor</li>
                            </ul>
                            <p className="text-gray-600 dark:text-gray-400 mt-4">
                                When you use the app, we load this file into your browser's memory, display it, and when you close the tab, everything is cleared. We have no persistent storage or cache of your data.
                            </p>
                        </section>

                         <section className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">4. Cookies</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                We use a few essential cookies just to keep you logged in while you browse the site. That's it. No tracking pixels, no advertising cookies, no creepy stuff.
                            </p>
                        </section>

                    </div>

                    <div className="pt-8 text-center text-sm text-gray-400">
                        Last updated: January 2026
                    </div>
                </div>
            </div>
        </div>
    )
}
