
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
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">1. Data Accessed</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                <strong>Google User Data:</strong> Our application requests access to the following Google user data:
                            </p>
                            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-600 dark:text-gray-400 ml-4 mb-4">
                                <li><strong>Google Drive File Access:</strong> Limited to the portfolio data file (<code className="text-sm bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">drawdown-portfolio.json.gz</code>) stored in your Google Drive. We use the <code className="text-sm bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">https://www.googleapis.com/auth/drive.file</code> scope, which restricts access to files that Drawdown creates or is explicitly granted access to.</li>
                                <li><strong>User Identity Information:</strong> We access your Google account email, name, and profile picture for authentication and session management purposes only.</li>
                                <li><strong>Limited Scope:</strong> We do not request access to any other files, folders, or personal information in your Google account. We cannot access your emails, contacts, calendar, or any other Google services.</li>
                            </ul>
                            <p className="text-gray-600 dark:text-gray-400">
                                <strong>No Other Data Collection:</strong> We do not collect or access any other personal information, browsing data, device information, or location data.
                            </p>
                        </section>

                        <section className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">2. Data Usage</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                We use the Google user data accessed by our application exclusively for the following purposes:
                            </p>
                            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                                <li><strong>Authentication:</strong> To verify your identity and maintain a secure session while you use the application.</li>
                                <li><strong>Portfolio Data Management:</strong> To read your portfolio data from Google Drive and display your trading performance, daily P&L, fund transactions, and other trading analytics.</li>
                                <li><strong>Data Updates:</strong> To write changes back to your portfolio file when you add, edit, or delete trading records.</li>
                                <li><strong>Real-Time Processing:</strong> To process and analyze your portfolio data for generating KPIs, charts, calendars, and trading insights.</li>
                                <li><strong>Session Maintenance:</strong> To store your access tokens securely for the duration of your session to avoid requiring re-authentication.</li>
                            </ul>
                            <p className="text-gray-600 dark:text-gray-400 mt-4">
                                <strong>What We Do NOT Do:</strong> We do not sell, share, use for marketing, use for machine learning, or otherwise repurpose your Google user data. We do not access, view, process, or retain your data for any purpose other than those explicitly listed above.
                            </p>
                        </section>

                        <section className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">3. Data Sharing</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                <strong>Google User Data is Never Shared with Third Parties.</strong> Your Google portfolio data, access tokens, and personal information are never shared, sold, transferred, or disclosed to any third-party companies, services, or individuals.
                            </p>
                            <div className="mt-4 space-y-3">
                                <p className="text-gray-600 dark:text-gray-400">
                                    <strong>Data Flow:</strong> Your data flows only between your browser and your Google Drive:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                                    <li>Browser → Your Google Drive (direct connection)</li>
                                    <li>Your Google Drive → Browser (direct connection)</li>
                                    <li>No intermediate servers store or access your data</li>
                                </ul>
                            </div>
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 rounded">
                                <p className="text-sm text-blue-900 dark:text-blue-200">
                                    <strong>Complete Transparency:</strong> Since the Drawdown application is open-source, you can audit the entire codebase to verify that no data sharing occurs.
                                </p>
                            </div>
                        </section>

                        <section className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">4. Data Storage & Protection</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Your portfolio data is stored exclusively in your personal cloud storage account and never on our servers:
                            </p>
                            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-600 dark:text-gray-400 ml-4 mb-4">
                                <li><strong>Storage Location:</strong> Portfolio data is stored as a compressed file in your Google Drive root directory.</li>
                                <li><strong>Encryption:</strong> Google Drive provides encryption for data in transit (TLS/SSL) and at rest. Your data benefits from Google's enterprise-grade security infrastructure.</li>
                                <li><strong>File Format:</strong> Data is stored as gzip-compressed JSON, which you can download and inspect at any time.</li>
                                <li><strong>No Server Storage:</strong> We maintain no central database, server-side storage, or backup copies of your data.</li>
                            </ul>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                <strong>Session Data Protection:</strong> While using the application:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                                <li>Your data is loaded into your browser's memory for processing and display.</li>
                                <li>Access tokens are securely stored using HTTP-only cookies to prevent cross-site scripting (XSS) attacks.</li>
                                <li>All communication between your browser and Google's servers is encrypted using HTTPS.</li>
                                <li>When you close the browser tab, session data is cleared from memory and no persistent local storage is retained.</li>
                            </ul>
                        </section>

                        <section className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">5. Data Retention & Deletion</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                <strong>Data Retention Policy:</strong> Your portfolio data is retained indefinitely because it is stored in your own Google Drive, and you maintain complete control over it.
                            </p>
                            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-600 dark:text-gray-400 ml-4 mb-4">
                                <li><strong>Session Tokens:</strong> Google OAuth access tokens are retained for up to 30 days and automatically refreshed when needed. You can revoke access at any time.</li>
                                <li><strong>Cookies:</strong> Session cookies are cleared when you close your browser.</li>
                                <li><strong>Application Data:</strong> No data about your usage is retained on our servers.</li>
                            </ul>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                <strong>Data Deletion & User Rights:</strong> You have complete control over your data:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4 mb-4">
                                <li><strong>Delete Portfolio Data:</strong> You can delete the <code className="text-sm bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">drawdown-portfolio.json.gz</code> file directly from your Google Drive at any time. This will immediately remove all your portfolio data from the application.</li>
                                <li><strong>Revoke Application Access:</strong> You can revoke the Drawdown application's access to your Google account at any time by visiting <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google Account Permissions</a>. This prevents the app from accessing your data in the future.</li>
                                <li><strong>Request Data Deletion:</strong> Since we do not store any data on our servers, there is no data to delete on our end. Your data exists only in your Google Drive, under your complete control.</li>
                            </ul>
                            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 border-l-4 border-green-500 rounded">
                                <p className="text-sm text-green-900 dark:text-green-200">
                                    <strong>Your Control, Your Data:</strong> Unlike traditional web applications that store your data on their servers, Drawdown puts you in control. Your data lives in your Google Drive, and you can delete it or revoke access instantly without contacting us.
                                </p>
                            </div>
                        </section>

                        <section className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">6. Cookies & Authentication</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                We use minimal cookies solely for authentication and session management:
                            </p>
                            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-600 dark:text-gray-400 ml-4 mb-4">
                                <li><strong>Session Cookies:</strong> HTTP-only cookies store your session token to keep you logged in.</li>
                                <li><strong>No Tracking:</strong> We do not use tracking pixels, analytics cookies, advertising cookies, or any form of user tracking.</li>
                                <li><strong>No Third-Party Scripts:</strong> We do not embed third-party tracking, analytics, or advertising services.</li>
                            </ul>
                        </section>

                        <section className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">7. Compliance with Google API Services User Data Policy</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Drawdown is designed and operated in full compliance with the Google API Services User Data Policy and Google APIs Terms of Service. Specifically:
                            </p>
                            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                                <li>We request only the minimum permissions necessary to provide our service.</li>
                                <li>We do not use Google user data for any purpose other than providing the Drawdown service.</li>
                                <li>We do not share Google user data with third parties.</li>
                                <li>We maintain strict data security and protection measures.</li>
                                <li>Users maintain full visibility and control over their data.</li>
                                <li>We are transparent about data practices through this privacy policy and our open-source codebase.</li>
                            </ul>
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
