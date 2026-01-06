
import { ThemeToggle } from "@/components/layout/theme-toggle"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
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
                        Terms & Conditions
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                        TL;DR: This is a hobby project. We don't want your data, we don't store your data, and we are not a corporation. Use it to track your portfolio, audit the code if you want, and have fun.
                    </p>

                    <div className="prose dark:prose-invert max-w-none space-y-6">

                        <section className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">1. Just a Hobby, Not a Business</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                This Drawdown project is a non-profit, open-source hobby project. It is created for personal use and shared with the community in the hope that it will be useful. There is no corporate infrastructure, no dedicated support team, and no hidden agenda.
                            </p>
                        </section>

                        <section className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">2. You Own Your Data</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                We do not have a database. We do not have a server farm. All your data lives in your own connected <strong>Google Drive</strong> or <strong>OneDrive</strong>.
                            </p>
                            <div className="mt-4 space-y-3">
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">How It Works:</h3>
                                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                                    <li><strong>Storage Location:</strong> A single compressed file (<code className="text-sm bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">drawdown-portfolio.json.gz</code>) is created in your cloud storage root directory</li>
                                    <li><strong>What's Inside:</strong> Your daily P&L entries, fund transactions (deposits/withdrawals), and initial capital</li>
                                    <li><strong>Read/Write:</strong> The app reads this file to display your dashboard and writes to it when you make changes</li>
                                    <li><strong>Permissions:</strong> We only request access to files created by this app - not your entire Drive/OneDrive</li>
                                    <li><strong>Your Control:</strong> You can download, backup, modify, or delete this file anytime from your cloud storage</li>
                                </ul>
                                <div className="p-4 bg-green-50 dark:bg-green-950/30 border-l-4 border-green-500 rounded mt-4">
                                    <p className="text-sm text-green-900 dark:text-green-200">
                                        <strong>Zero Database Costs:</strong> By using your existing cloud storage, you don't pay us anything, and your data stays under your direct control with automatic backups from Google/Microsoft.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">3. No Liability (Seriously)</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Since we don't store your data, we can't lose it. However, we are also not responsible if:
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400 ml-4">
                                <li>Google or Microsoft has an outage.</li>
                                <li>You accidentally delete your own spreadsheet.</li>
                                <li>The application has a bug (it happens!).</li>
                            </ul>
                            <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">
                                The software is provided "AS IS", without warranty of any kind. You use it entirely at your own risk.
                            </p>
                        </section>

                        <section className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">4. Open Source & Audit</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Don't trust us? You don't have to. The entire source code for this project is available on GitHub. You are free (and encouraged!) to audit the code, run it locally, or fork it to build your own version.
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
