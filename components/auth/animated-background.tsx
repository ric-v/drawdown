
"use client"

import { motion, useAnimationControls } from "framer-motion"
import { useEffect, useState, useRef } from "react"

// Types for our candle data
interface Candle {
    open: number
    close: number
    high: number
    low: number
    timestamp: number
}

export function AnimatedBackground() {
    const [candles, setCandles] = useState<Candle[]>([])
    const [viewWidth, setViewWidth] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const controls = useAnimationControls()

    // Configuration
    const CANDLE_WIDTH = 10
    const CANDLE_GAP = 6
    const TOTAL_CANDLE_SPACE = CANDLE_WIDTH + CANDLE_GAP
    const INITIAL_CANDLES = 60

    // Generate initial data
    useEffect(() => {
        let currentPrice = 100
        const initialData: Candle[] = []

        for (let i = 0; i < INITIAL_CANDLES; i++) {
            const movement = (Math.random() - 0.5) * 4
            const open = currentPrice
            const close = open + movement
            const high = Math.max(open, close) + Math.random() * 2
            const low = Math.min(open, close) - Math.random() * 2

            initialData.push({ open, close, high, low, timestamp: Date.now() - (INITIAL_CANDLES - i) * 1000 })
            currentPrice = close
        }
        setCandles(initialData)

        // Generate new ticks continuously
        const interval = setInterval(() => {
            setCandles(prev => {
                const last = prev[prev.length - 1]
                const movement = (Math.random() - 0.48) * 3 // Reduced volatility slightly for smoothness
                const open = last.close
                const close = open + movement
                const high = Math.max(open, close) + Math.random() * 1.5
                const low = Math.min(open, close) - Math.random() * 1.5

                const newCandle = { open, close, high, low, timestamp: Date.now() }
                // Keep only last 100 candles
                return [...prev.slice(-100), newCandle]
            })
        }, 500) // Faster 500ms updates

        return () => clearInterval(interval)
    }, [])

    // Calculate Y-scale based on visible high/low
    const minPrice = Math.min(...candles.map(c => c.low))
    const maxPrice = Math.max(...candles.map(c => c.high))
    const priceRange = maxPrice - minPrice || 1

    const getY = (price: number) => {
        // Map price to percentage of height (inverted because SVG y=0 is top)
        return 100 - ((price - minPrice) / priceRange) * 80 - 10 // 10% padding
    }

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-gray-50 dark:bg-black transition-colors duration-700">
            {/* Base Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-emerald-50/50 dark:bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] dark:from-slate-900 dark:via-black dark:to-black opacity-100 transition-opacity duration-700" />

            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1]"
                style={{
                    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Candlestick Chart */}
            <div
                className="absolute inset-0 flex items-center justify-center opacity-40 dark:opacity-50 from-transparent via-black to-transparent"
                style={{
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black, transparent)',
                    maskImage: 'linear-gradient(to right, transparent, black, transparent)',
                }}
            >
                <svg className="w-full h-full" preserveAspectRatio="none">
                    {/* Render candles */}
                    <motion.g
                        initial={{ x: 0 }}
                        animate={{ x: -1 * (candles.length * TOTAL_CANDLE_SPACE - 1000) }} // Simple Drift
                        transition={{ ease: "linear", duration: 0.5 }} // Perfectly synced with 500ms interval
                    >
                        {candles.map((candle, i) => {
                            const isGreen = candle.close >= candle.open
                            const color = isGreen ? "#10b981" : "#ef4444" // Emerald-500 : Red-500
                            const yHigh = getY(candle.high) + "%"
                            const yLow = getY(candle.low) + "%"
                            const yOpen = getY(candle.open) + "%"
                            const yClose = getY(candle.close) + "%"
                            const yTop = getY(Math.max(candle.open, candle.close)) + "%"
                            const height = Math.abs(getY(candle.open) - getY(candle.close)) + "%"

                            // X position needs to be calculated manually since we are in SVG container
                            const x = i * TOTAL_CANDLE_SPACE

                            return (
                                <g key={candle.timestamp} transform={`translate(${x}, 0)`}>
                                    {/* Wick */}
                                    <line
                                        x1={CANDLE_WIDTH / 2} y1={yHigh}
                                        x2={CANDLE_WIDTH / 2} y2={yLow}
                                        stroke={color}
                                        strokeWidth="1"
                                    />
                                    {/* Body */}
                                    <rect
                                        x={0}
                                        y={yTop}
                                        width={CANDLE_WIDTH}
                                        height={height || "1%"} // Min height for visibility
                                        fill={color}
                                    />
                                </g>
                            )
                        })}
                    </motion.g>

                    {/* Moving Average Line Integration (Optional polish) */}
                    <motion.path
                        d={`M ${candles.map((c, i) => `${i * TOTAL_CANDLE_SPACE + CANDLE_WIDTH / 2} ${getY((c.open + c.close) / 2)}`).join(' L ')}`}
                        fill="none"
                        stroke="#fbbf24" // Amber for MA
                        strokeWidth="2"
                        className="opacity-50"
                        initial={false} // Don't animate initial
                        animate={{ d: `M ${candles.map((c, i) => `${i * TOTAL_CANDLE_SPACE + CANDLE_WIDTH / 2} ${getY((c.open + c.close) / 2)}`).join(' L ')}` }}
                        transition={{ duration: 0.2, ease: "linear" }}
                    />

                </svg>
            </div>

            {/* Vignette Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none dark:opacity-70 opacity-0" />
        </div>
    )
}
