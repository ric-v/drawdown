
import { LoginButton } from "./login-button"
import { AnimatedBackground } from "./animated-background"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export function LoginScreen() {
    return (
        <div className="relative flex items-center justify-center lg:justify-end min-h-screen overflow-hidden">
            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle />
            </div>
            <AnimatedBackground />

            <div className="relative z-10 w-full max-w-md lg:max-w-xl px-4 lg:pr-32 group">
                {/* Glow Effect behind card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 to-blue-500/30 dark:from-white/10 dark:to-gray-500/10 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

                <Card className="relative overflow-hidden border-0 bg-white/70 dark:bg-black/60 backdrop-blur-2xl shadow-2xl transition-all duration-300">
                    {/* Gradient Border */}
                    <div className="absolute inset-0 p-[1px] bg-gradient-to-br from-white/50 via-gray-200/50 to-white/50 dark:from-white/10 dark:via-white/5 dark:to-white/10 rounded-xl pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent dark:from-white/5 dark:to-transparent opacity-50 pointer-events-none" />

                    <CardHeader className="text-center space-y-2 relative z-10">
                        <div className="flex justify-center mb-6">
                            <div className="relative p-4 rounded-3xl bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-white/5 border border-gray-100 dark:border-white/10 ring-1 ring-gray-100/50 dark:ring-white/5">
                                <Image
                                    src="/logo.png"
                                    alt="Logo"
                                    width={56}
                                    height={56}
                                    className="w-14 h-14 object-contain drop-shadow-md"
                                    priority
                                />
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold capitalize bg-clip-text text-transparent bg-gradient-to-br from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-gray-400">
                            Drawdown
                        </CardTitle>
                        <CardDescription className="text-gray-500 dark:text-gray-400 text-base font-medium">
                            Mindful trading performance tracker
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-4 pt-4 pb-8 relative z-10">
                        <LoginButton
                            provider="google"
                            label="Continue with Google"
                            className="w-full h-12 rounded-xl border transition-all duration-200 relative overflow-hidden group/btn font-medium
                                bg-white text-gray-700 border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 hover:text-gray-900 hover:scale-[1.01]
                                dark:bg-[#1a1a1a] dark:text-gray-100 dark:border-[#333] dark:hover:bg-[#252525] dark:hover:border-[#444]"
                            icon="google"
                        />

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200 dark:border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white/50 px-2 text-gray-500 dark:bg-black/50 font-semibold tracking-wider backdrop-blur-md rounded-full">
                                    Or
                                </span>
                            </div>
                        </div>

                        <LoginButton
                            provider="microsoft-entra-id"
                            label="Continue with Microsoft"
                            className="w-full h-12 rounded-xl border transition-all duration-200 relative overflow-hidden group/btn font-medium
                                bg-white text-gray-700 border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 hover:text-gray-900 hover:scale-[1.01]
                                dark:bg-[#1a1a1a] dark:text-gray-100 dark:border-[#333] dark:hover:bg-[#252525] dark:hover:border-[#444]"
                            icon="microsoft"
                        />
                    </CardContent>

                    <div className="px-8 pb-8 text-center text-xs text-gray-400 dark:text-gray-500 relative z-10">
                        <p>By continuing, you agree to our <Link href="/terms" className="underline hover:text-gray-600 dark:hover:text-gray-300">Terms</Link> and <Link href="/privacy" className="underline hover:text-gray-600 dark:hover:text-gray-300">Privacy Policy</Link>.</p>
                    </div>
                </Card>
            </div>
        </div>
    )
}
