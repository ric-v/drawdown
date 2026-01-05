
"use client"

import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SignOutButton } from "./sign-out-button"
import { LogOut, TrendingUp, Wallet } from "lucide-react"
import { cn } from "@/lib/utils/utils"

interface UserNavProps {
    stats?: {
        currentEquity: number;
        totalPnL: number;
        totalPnLPercentage: number;
    };
}

export function UserNav({ stats }: UserNavProps) {
    const { data: session } = useSession()

    if (!session?.user) return null

    return (
        <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile: Dropdown Menu */}
            <div className="sm:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-slate-800/50 dark:to-slate-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-300 hover:shadow-md active:scale-95">
                            <Avatar className="h-7 w-7 ring-2 ring-white/50 dark:ring-slate-700/50">
                                <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                                <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                    {session.user.name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-gray-200/60 dark:border-slate-800/60 shadow-xl">
                        {/* User Info */}
                        <DropdownMenuLabel className="px-2 pb-2">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 ring-2 ring-blue-500/30">
                                    <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                                    <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                        {session.user.name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                        {session.user.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {session.user.email}
                                    </p>
                                </div>
                            </div>
                        </DropdownMenuLabel>

                        {stats && (
                            <>
                                <DropdownMenuSeparator className="my-2" />
                                
                                {/* Stats Cards in Dropdown */}
                                <div className="space-y-2 px-2 py-2">
                                    {/* Equity Card */}
                                    <div className="px-3 py-2.5 rounded-lg bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-slate-800/50 dark:to-slate-900/50 border border-gray-200/50 dark:border-slate-700/50">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Wallet className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                                Current Equity
                                            </p>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            ₹{stats.currentEquity.toLocaleString('en-IN')}
                                        </p>
                                    </div>

                                    {/* P&L Card */}
                                    <div className="px-3 py-2.5 rounded-lg bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-slate-800/50 dark:to-slate-900/50 border border-gray-200/50 dark:border-slate-700/50">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                                Total P&L
                                            </p>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <p className={cn(
                                                'text-lg font-bold',
                                                stats.totalPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                            )}>
                                                {stats.totalPnL >= 0 ? '+' : ''}₹{stats.totalPnL.toLocaleString('en-IN')}
                                            </p>
                                            <span className={cn(
                                                'text-xs font-semibold px-2 py-0.5 rounded-md',
                                                stats.totalPnL >= 0 
                                                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                                    : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                                            )}>
                                                {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnLPercentage.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <DropdownMenuSeparator className="my-2" />
                        
                        {/* Sign Out */}
                        <DropdownMenuItem 
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="px-3 py-2 cursor-pointer text-rose-600 dark:text-rose-400 focus:text-rose-700 dark:focus:text-rose-300 focus:bg-rose-50 dark:focus:bg-rose-500/10 rounded-lg"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span className="font-medium">Sign Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Desktop: Original Layout */}
            <div className="hidden sm:flex items-center gap-2 md:gap-3">
                <div className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 md:py-2 rounded-xl bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-slate-800/50 dark:to-slate-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-300 hover:shadow-md">
                    <Avatar className="h-7 w-7 md:h-9 md:w-9 ring-2 ring-white/50 dark:ring-slate-700/50 transition-all duration-300 hover:ring-blue-500/50">
                        <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                        <AvatarFallback className="text-xs md:text-sm font-semibold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            {session.user.name?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:flex flex-col min-w-0">
                        <p className="text-xs md:text-sm font-semibold leading-none text-gray-900 dark:text-white truncate">
                            {session.user.name}
                        </p>
                        <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {session.user.email}
                        </p>
                    </div>
                </div>
                
                {/* Sign Out Button - Premium Style */}
                <SignOutButton />
            </div>
        </div>
    )
}
