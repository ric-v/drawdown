
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
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
                        Terms & Conditions
                    </h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed">
                        TL;DR: This is a hobby project. We don't want your data, we don't store your data, and we are not a corporation. Use it to track your portfolio, audit the code if you want, and have fun.
                    </p>

                    <div className="prose dark:prose-invert max-w-none space-y-8">

                        <section className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <h2 className="text-2xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400">1. Just a Hobby, Not a Business</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                This Drawdown project is a non-profit, open-source hobby project. It is created for personal use and shared with the community in the hope that it will be useful. There is no corporate infrastructure, no dedicated support team, and no hidden agenda.
                            </p>
                        </section>

                        <section className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <h2 className="text-2xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400">2. You Own Your Data</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                We do not have a database. We do not have a server farm. All your data lives in your own connected <strong>Google Drive</strong> or <strong>OneDrive</strong>. This website simply acts as a "viewer" — it reads your files and displays them in a pretty dashboard.
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                You can inspect, modify, or delete your files at any time directly from your cloud storage provider. We have no control over it.
                            </p>
                        </section>

                        <section className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <h2 className="text-2xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400">3. No Liability (Seriously)</h2>
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

                        <section className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <h2 className="text-2xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400">4. Open Source & Audit</h2>
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
