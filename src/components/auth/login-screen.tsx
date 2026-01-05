
import { LoginButton } from "./login-button"
import { AnimatedBackground } from "./animated-background"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export function LoginScreen() {
    return (
        <div className="relative flex items-center justify-center lg:justify-end min-h-screen overflow-hidden">
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle />
            </div>
            <AnimatedBackground />

            <div className="relative z-10 w-full max-w-md lg:max-w-lg px-6 lg:pr-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Subtle Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-blue-500/5 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-out" />

                <Card className="relative overflow-hidden border border-gray-200/50 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500 ease-out">
                    {/* Subtle Top Shine */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />

                    <CardHeader className="text-center space-y-3 pt-10 pb-6 relative z-10">
                        <div className="flex justify-center mb-4">
                            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 shadow-lg dark:shadow-blue-500/5 border border-blue-100/50 dark:border-blue-500/10 transition-transform duration-300 hover:scale-105">
                                <Image
                                    src="/logo.png"
                                    alt="Logo"
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 object-contain"
                                    priority
                                />
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold capitalize text-gray-900 dark:text-white tracking-tight">
                            Drawdown
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400 text-sm font-normal max-w-xs mx-auto">
                            Mindful trading performance tracker
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-3 px-8 pb-8 relative z-10">
                        <LoginButton
                            provider="google"
                            label="Continue with Google"
                            className="w-full h-11 rounded-lg border transition-all duration-300 ease-out relative overflow-hidden group/btn font-medium
                                bg-white/50 text-gray-700 border-gray-200/80 hover:bg-white hover:shadow-lg hover:border-gray-300 hover:text-gray-900 hover:scale-[1.02] active:scale-[0.98]
                                dark:bg-slate-800/50 dark:text-gray-100 dark:border-slate-700/50 dark:hover:bg-slate-800 dark:hover:border-slate-600 dark:hover:shadow-lg dark:hover:shadow-blue-500/10"
                            icon="google"
                        />

                        <div className="relative py-3">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200/60 dark:border-slate-700/60" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                                <span className="bg-white/90 dark:bg-slate-900/90 px-3 py-1 text-gray-400 dark:text-gray-500 font-medium tracking-widest backdrop-blur-sm rounded-full">
                                    Or
                                </span>
                            </div>
                        </div>

                        <LoginButton
                            provider="microsoft-entra-id"
                            label="Continue with Microsoft"
                            className="w-full h-11 rounded-lg border transition-all duration-300 ease-out relative overflow-hidden group/btn font-medium
                                bg-white/50 text-gray-700 border-gray-200/80 hover:bg-white hover:shadow-lg hover:border-gray-300 hover:text-gray-900 hover:scale-[1.02] active:scale-[0.98]
                                dark:bg-slate-800/50 dark:text-gray-100 dark:border-slate-700/50 dark:hover:bg-slate-800 dark:hover:border-slate-600 dark:hover:shadow-lg dark:hover:shadow-purple-500/10"
                            icon="microsoft"
                        />
                    </CardContent>

                    <div className="px-8 pb-8 text-center text-[11px] text-gray-500 dark:text-gray-400 relative z-10 leading-relaxed">
                        <p>By continuing, you agree to our <Link href="/terms" className="underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">Terms</Link> and <Link href="/privacy" className="underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">Privacy Policy</Link>.</p>
                    </div>
                </Card>
            </div>
        </div>
    )
}
