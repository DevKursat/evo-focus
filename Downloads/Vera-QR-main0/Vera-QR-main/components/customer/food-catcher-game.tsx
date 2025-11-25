'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Play, RotateCcw, Trophy } from 'lucide-react'

// Game constants
const PLAYER_WIDTH = 60
const PLAYER_HEIGHT = 60
const ITEM_SIZE = 40
const GRAVITY = 3 // Increased speed
const SPAWN_RATE = 1000 // ms

export default function FoodCatcherGame({ onScoreUpdate }: { onScoreUpdate?: (score: number) => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [score, setScore] = useState(0)
    const [gameOver, setGameOver] = useState(false)

    // Game constants


    useEffect(() => {
        if (!isPlaying || gameOver) return

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Game state
        let playerX = canvas.width / 2 - PLAYER_WIDTH / 2
        let items: { x: number, y: number, type: 'food' | 'bomb' }[] = []
        let animationFrameId: number
        let lastSpawnTime = 0

        const foods = ['🍔', '🍕', '🍟', '🌭', '🌮']
        const bombs = ['💣', '💥']

        const handleTouch = (e: TouchEvent) => {
            e.preventDefault() // Prevent scrolling
            const touch = e.touches[0]
            const rect = canvas.getBoundingClientRect()
            playerX = touch.clientX - rect.left - PLAYER_WIDTH / 2
            // Clamp player
            if (playerX < 0) playerX = 0
            if (playerX > canvas.width - PLAYER_WIDTH) playerX = canvas.width - PLAYER_WIDTH
        }

        const handleMouse = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            playerX = e.clientX - rect.left - PLAYER_WIDTH / 2
            // Clamp player
            if (playerX < 0) playerX = 0
            if (playerX > canvas.width - PLAYER_WIDTH) playerX = canvas.width - PLAYER_WIDTH
        }

        canvas.addEventListener('touchmove', handleTouch, { passive: false })
        canvas.addEventListener('mousemove', handleMouse)

        const gameLoop = (timestamp: number) => {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Spawn items
            if (timestamp - lastSpawnTime > SPAWN_RATE) {
                const isBomb = Math.random() > 0.8
                items.push({
                    x: Math.random() * (canvas.width - ITEM_SIZE),
                    y: -ITEM_SIZE,
                    type: isBomb ? 'bomb' : 'food'
                })
                lastSpawnTime = timestamp
            }

            // Update and draw items
            for (let i = items.length - 1; i >= 0; i--) {
                const item = items[i]
                item.y += GRAVITY

                // Draw item
                ctx.font = '30px Arial'
                ctx.fillText(item.type === 'food' ? foods[0] : '💣', item.x, item.y + 30)

                // Collision detection
                if (
                    item.x < playerX + PLAYER_WIDTH &&
                    item.x + ITEM_SIZE > playerX &&
                    item.y < canvas.height - 10 &&
                    item.y + ITEM_SIZE > canvas.height - PLAYER_HEIGHT
                ) {
                    if (item.type === 'food') {
                        setScore(s => {
                            const newScore = s + 10
                            onScoreUpdate?.(newScore)
                            return newScore
                        })
                        items.splice(i, 1)
                    } else {
                        setGameOver(true)
                        setIsPlaying(false)
                    }
                } else if (item.y > canvas.height) {
                    items.splice(i, 1)
                }
            }

            // Draw player (Chef)
            ctx.font = '50px Arial'
            ctx.fillText('👨‍🍳', playerX, canvas.height - 10)

            if (!gameOver) {
                animationFrameId = requestAnimationFrame(gameLoop)
            }
        }

        animationFrameId = requestAnimationFrame(gameLoop)

        return () => {
            cancelAnimationFrame(animationFrameId)
            canvas.removeEventListener('touchmove', handleTouch)
            canvas.removeEventListener('mousemove', handleMouse)
        }
    }, [isPlaying, gameOver, onScoreUpdate])

    const startGame = () => {
        setScore(0)
        setGameOver(false)
        setIsPlaying(true)
    }

    return (
        <div className="flex flex-col items-center gap-4 p-4 bg-card rounded-xl shadow-lg border">
            <div className="flex justify-between w-full items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Trophy className="text-yellow-500" />
                    Skor: {score}
                </h3>
                {!isPlaying && !gameOver && (
                    <Button onClick={startGame} size="sm">
                        <Play className="w-4 h-4 mr-2" /> Başla
                    </Button>
                )}
                {gameOver && (
                    <Button onClick={startGame} variant="destructive" size="sm">
                        <RotateCcw className="w-4 h-4 mr-2" /> Tekrar
                    </Button>
                )}
            </div>

            <div className="relative border-2 border-dashed border-primary/30 rounded-lg overflow-hidden bg-background/50">
                <canvas
                    ref={canvasRef}
                    width={320}
                    height={400}
                    className="touch-none cursor-crosshair"
                />
                {!isPlaying && !gameOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-bold">
                        Yemekleri Yakala!
                    </div>
                )}
                {gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
                        <span className="text-2xl font-bold mb-2">Oyun Bitti!</span>
                        <span>Skorun: {score}</span>
                    </div>
                )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
                Parmağını veya fareyi kaydırarak şefi hareket ettir. Bombalardan kaç!
            </p>
        </div>
    )
}
