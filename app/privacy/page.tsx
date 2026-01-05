
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-200 transition-colors duration-300">
            <div className="container max-w-3xl mx-auto px-6 py-12">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <Link href="/">
                        <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-emerald-500">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Button>
                    </Link>
                    <ThemeToggle />
                </div>

                <div className="space-y-8">
                    <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
                        Privacy Policy
                    </h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed">
                        We don't collect your data because we have nowhere to put it. We don't have servers, databases, or analytics teams. It's just you and your files.
                    </p>

                    <div className="prose dark:prose-invert max-w-none space-y-8">
                        
                        <section className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <h2 className="text-2xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400">1. Data Minimization</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                This project strictly adheres to the principle of "access only what is needed". We do not store, sell, share, or even look at your data. 
                            </p>
                        </section>

                        <section className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <h2 className="text-2xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400">2. Why Google & Microsoft Login?</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                You might wonder: <em>"If you don't store data, why do I need to log in?"</em>
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                                <li><strong>Security:</strong> It verifies you are a real human and not a bot attacking the site.</li>
                                <li><strong>Access Control:</strong> It allows the application to securely ask <em>Google/Microsoft</em> for permission to read your specific spreadsheet files.</li>
                                <li><strong>Safety:</strong> We never see your password. The entire login process happens on Google's or Microsoft's secure servers.</li>
                            </ul>
                        </section>

                        <section className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <h2 className="text-2xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400">3. Where is the data?</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Your portfolio data files stay where they belong: in your **Google Drive** or **OneDrive**. We simply fetch them, format them into a nice chart, and show them to you. When you close the tab, we forget everything.
                            </p>
                        </section>

                         <section className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <h2 className="text-2xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400">4. Cookies</h2>
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
