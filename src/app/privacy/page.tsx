
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
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">2. Why Google & Microsoft Login?</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                You might wonder: <em>"If you don't store data, why do I need to log in?"</em>
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                                <li><strong>Security:</strong> It verifies you are a real human and not a bot attacking the site.</li>
                                <li><strong>Access Control:</strong> It allows the application to securely ask <em>Google/Microsoft</em> for permission to read your specific spreadsheet files.</li>
                                <li><strong>Safety:</strong> We never see your password. The entire login process happens on Google's or Microsoft's secure servers.</li>
                            </ul>
                        </section>

                        <section className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">3. Where is the data?</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Your portfolio data files stay where they belong: in your **Google Drive** or **OneDrive**. We simply fetch them, format them into a nice chart, and show them to you. When you close the tab, we forget everything.
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
