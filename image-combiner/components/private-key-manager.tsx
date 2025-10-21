"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Dithering } from "@paper-design/shaders-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ConversionResult {
  input: string
  output: string
  conversionType: string
}

// Base58 alphabet for encoding/decoding
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

export function PrivateKeyManager() {
  const [inputText, setInputText] = useState<string>("")
  const [conversionMode, setConversionMode] = useState<"base58-to-bytes" | "bytes-to-base58">("base58-to-bytes")
  const [isLoading, setIsLoading] = useState(false)
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null)
  const [showAnimation, setShowAnimation] = useState(false)
  const [progress, setProgress] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Base58 to Byte Array conversion
  const base58ToBytes = (base58: string): Uint8Array => {
    if (!base58) return new Uint8Array(0)
    
    // Remove leading zeros and count them
    let leadingZeros = 0
    while (base58[leadingZeros] === '1') {
      leadingZeros++
    }
    
    // Convert base58 to big integer
    let num = BigInt(0)
    let base = BigInt(58)
    
    for (let i = 0; i < base58.length; i++) {
      const char = base58[i]
      const index = BASE58_ALPHABET.indexOf(char)
      if (index === -1) {
        throw new Error(`Invalid Base58 character: ${char}`)
      }
      num = num * base + BigInt(index)
    }
    
    // Convert to bytes
    const bytes: number[] = []
    while (num > 0) {
      bytes.unshift(Number(num % BigInt(256)))
      num = num / BigInt(256)
    }
    
    // Add leading zeros back
    const result = new Uint8Array(leadingZeros + bytes.length)
    result.fill(0, 0, leadingZeros)
    result.set(bytes, leadingZeros)
    return result
  }

  // Byte Array to Base58 conversion
  const bytesToBase58 = (bytes: Uint8Array): string => {
    if (bytes.length === 0) return ""
    
    // Count leading zeros
    let leadingZeros = 0
    while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
      leadingZeros++
    }
    
    // Convert to big integer
    let num = BigInt(0)
    let base = BigInt(256)
    
    for (let i = 0; i < bytes.length; i++) {
      num = num * base + BigInt(bytes[i])
    }
    
    // Convert to base58
    let result = ""
    while (num > 0) {
      result = BASE58_ALPHABET[Number(num % BigInt(58))] + result
      num = num / BigInt(58)
    }
    
    // Add leading zeros back
    return "1".repeat(leadingZeros) + result
  }

  const canConvert = inputText.trim().length > 0

  // Handle paste events for private key input
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        // Handle text paste
        if (item.type === "text/plain") {
          item.getAsString((text) => {
            const trimmedText = text.trim()
              const activeElement = document.activeElement
            const isInputFocused = activeElement?.tagName === "TEXTAREA"

            // If focused on the textarea, let it handle the paste naturally
            if (isInputFocused) {
                return
              }

              // Otherwise, handle it globally
              e.preventDefault()
            setInputText(trimmedText)
          })
          return
        }
      }
    }

    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [])

  const performConversion = async () => {
    if (!canConvert) return

    setIsLoading(true)
    setConversionResult(null)
    setProgress(0)
    setShowAnimation(true)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) {
          return Math.min(prev + 0.1, 98)
        } else if (prev >= 90) {
          return prev + 0.3
        } else if (prev >= 75) {
          return prev + 0.6
        } else if (prev >= 50) {
          return prev + 0.9
        } else if (prev >= 25) {
          return prev + 1.1
        } else {
          return prev + 1.3
        }
      })
    }, 100)

    try {
      let output: string
      
      if (conversionMode === "base58-to-bytes") {
        const bytes = base58ToBytes(inputText.trim())
        output = `[${Array.from(bytes).join(', ')}]`
      } else {
        // Parse byte array string to bytes
        const byteArrayString = inputText.trim()
        
        // Remove brackets and parse the array
        const cleanString = byteArrayString.replace(/^\[|\]$/g, '').trim()
        if (!cleanString) {
          throw new Error("Empty byte array")
        }
        
        const byteStrings = cleanString.split(',').map(s => s.trim())
        const bytes = new Uint8Array(byteStrings.length)
        
        for (let i = 0; i < byteStrings.length; i++) {
          const byteValue = parseInt(byteStrings[i], 10)
          if (isNaN(byteValue) || byteValue < 0 || byteValue > 255) {
            throw new Error(`Invalid byte value: ${byteStrings[i]}. Must be between 0 and 255.`)
          }
          bytes[i] = byteValue
        }
        
        output = bytesToBase58(bytes)
      }

      clearInterval(progressInterval)
      setProgress(99)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setProgress(100)

      setConversionResult({
        input: inputText.trim(),
        output,
        conversionType: conversionMode
      })
      
      setIsLoading(false)
      setShowAnimation(false)
      setProgress(0)
      showToast("Conversion completed successfully!", "success")
    } catch (error) {
      clearInterval(progressInterval)
      setProgress(0)
      setShowAnimation(false)
      console.error("Error performing conversion:", error)

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      showToast(`Conversion failed: ${errorMessage}`, "error")
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast("Copied to clipboard!", "success")
      } catch (error) {
      console.error("Error copying to clipboard:", error)
      showToast("Failed to copy to clipboard", "error")
    }
  }

  const clearInput = () => {
    setInputText("")
    setConversionResult(null)
  }


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      if (canConvert && !isLoading) {
        performConversion()
      }
    }
  }

  return (
    <div className="bg-background min-h-screen flex items-center justify-center select-none">
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300 select-none">
          <div
            className={cn(
              "bg-black/90 backdrop-blur-sm border rounded-lg p-4 shadow-lg max-w-sm",
              toast.type === "success" ? "border-green-500/50 text-green-100" : "border-red-500/50 text-red-100",
            )}
          >
            <div className="flex items-center gap-3">
              {toast.type === "success" ? (
                <svg
                  className="w-5 h-5 text-green-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-red-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12m0 0l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              )}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          </div>
        </div>
      )}


      <div className="fixed inset-0 z-0 select-none">
        <Dithering
          colorBack="#00000000"
          colorFront="#614B00"
          speed={0.43}
          shape="wave"
          type="4x4"
          pxSize={3}
          scale={1.13}
          style={{
            backgroundColor: "#000000",
            height: "100vh",
            width: "100vw",
          }}
        />
      </div>

      <div className="relative z-10 p-2 md:p-6 w-full max-w-6xl mx-auto select-none">
        <div className="bg-black/70 backdrop-blur-sm border-0 p-3 md:p-8 rounded-xl">
          <div className="mb-4 md:mb-8">
            <h1 className="text-lg md:text-2xl font-bold text-white select-none">Private Key Manager</h1>
            <p className="text-sm text-gray-400 mt-2">Convert between Base58 and Byte Array formats</p>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-12">
            {/* Input Section */}
            <div className="space-y-4 md:space-y-8">
              <div className="flex flex-nowrap items-center justify-between gap-1 md:gap-2 select-none">
                <h3 className="text-sm md:text-lg font-semibold flex items-center gap-1 md:gap-2 text-white flex-shrink-0">
                  <svg
                    className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
                  </svg>
                  <span className="hidden sm:inline">Input</span>
                </h3>
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  <Select value={conversionMode} onValueChange={(value: "base58-to-bytes" | "bytes-to-base58") => setConversionMode(value)}>
                    <SelectTrigger className="w-auto bg-black/50 border border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base58-to-bytes">Base58 to Byte Array</SelectItem>
                      <SelectItem value="bytes-to-base58">Byte Array to Base58</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 md:space-y-6">
                <div className="flex items-center justify-between mb-3 md:mb-6 select-none">
                  <label className="text-xs md:text-sm font-medium text-gray-300">
                    {conversionMode === "base58-to-bytes" ? "Enter Base58 private key" : "Enter byte array"}
                  </label>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    conversionMode === "base58-to-bytes"
                      ? "Enter your Base58 private key here..."
                      : "Enter byte array (e.g., [123, 45, 67, 89, ...])"
                  }
                  className="w-full h-16 md:h-32 p-2 md:p-4 bg-black/50 border border-gray-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-white text-white text-xs md:text-base select-text"
                  style={{
                    fontSize: "16px", // Prevents zoom on iOS Safari
                    WebkitUserSelect: "text",
                    userSelect: "text",
                  }}
                />
              </div>

              <div className="lg:hidden">
                <Button
                  onClick={performConversion}
                  disabled={!canConvert || isLoading}
                  className="w-full h-10 text-sm font-semibold bg-white text-black hover:bg-gray-200 rounded"
                >
                  {isLoading ? "Converting..." : "Convert"}
                </Button>
              </div>

              <div className="pt-3 hidden lg:block">
                <Button
                  onClick={performConversion}
                  disabled={!canConvert || isLoading}
                  className="w-full h-10 md:h-12 text-sm md:text-base font-semibold bg-white text-black hover:bg-gray-200 rounded"
                >
                  {isLoading ? "Converting..." : "Convert"}
                </Button>
              </div>
            </div>

            {/* Result Section */}
            <div className="space-y-4 md:space-y-8 select-none">
              <div className="flex items-center justify-between">
                <h3 className="text-sm md:text-lg font-semibold flex items-center gap-2 text-white">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Result
                </h3>
                {conversionResult && (
                  <div className="flex gap-1 md:gap-2">
                    <Button
                      onClick={() => copyToClipboard(conversionResult.output)}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2 bg-transparent border-gray-600 text-white hover:bg-gray-700 flex items-center gap-1"
                      title="Copy Result"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v9a2 2 0 01-2 2H5z" />
                      </svg>
                      <span className="hidden sm:inline">Copy Result</span>
                    </Button>
                    <Button
                      onClick={clearInput}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2 bg-transparent border-gray-600 text-white hover:bg-gray-700 flex items-center gap-1"
                      title="Clear"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="hidden sm:inline">Clear</span>
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center h-48 md:h-80">
                {isLoading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center px-4 select-none">
                    <div className="w-full max-w-md">
                      <div
                        className="relative h-4 md:h-8 bg-black/50 border border-gray-600 rounded overflow-hidden mb-4"
                        style={{ zIndex: 30 }}
                      >
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{
                            backgroundImage: `
                              linear-gradient(90deg, transparent 0%, transparent 49%, #333 49%, #333 51%, transparent 51%),
                              linear-gradient(0deg, transparent 0%, transparent 49%, #333 49%, #333 51%, transparent 51%)
                            `,
                            backgroundSize: "8px 8px",
                          }}
                        />

                        <div
                          className="absolute top-0 left-0 h-full transition-all duration-100 ease-out"
                          style={{
                            width: `${progress}%`,
                            backgroundImage: `
                              repeating-linear-gradient(
                                90deg,
                                #614B00 0px,
                                #614B00 6px,
                                #735B00 6px,
                                #735B00 8px
                              ),
                              repeating-linear-gradient(
                                0deg,
                                #614B00 0px,
                                #614B00 6px,
                                #735B00 6px,
                                #735B00 8px
                              )
                            `,
                            backgroundSize: "8px 8px",
                          }}
                        />

                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs md:text-sm font-mono text-white/80" style={{ zIndex: 40 }}>
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-xs md:text-sm font-medium text-white animate-pulse">Converting...</p>
                      </div>
                    </div>
                  </div>
                ) : conversionResult ? (
                  <div className="w-full h-full flex flex-col select-none">
                    <div className="flex-1 flex items-center justify-center max-h-36 md:max-h-64 relative group">
                      <div className="w-full max-w-full p-4 bg-black/50 border border-gray-600 rounded">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-400 font-medium">Input:</label>
                            <div className="mt-1 p-2 bg-black/30 border border-gray-700 rounded text-xs font-mono text-gray-300 break-all">
                              {conversionResult.input}
                        </div>
                      </div>
                          <div>
                            <label className="text-xs text-gray-400 font-medium">Output:</label>
                            <div className="mt-1 p-2 bg-black/30 border border-gray-700 rounded text-xs font-mono text-white break-all">
                              {conversionResult.output}
                      </div>
                    </div>
                  </div>
                      </div>
                    </div>
                    <div className="mt-2 md:mt-4 p-2 md:p-3 bg-black/50 border border-gray-600 rounded">
                      <p className="text-xs md:text-sm text-gray-300">
                        <span className="font-semibold text-white">Conversion:</span> {conversionResult.conversionType === "base58-to-bytes" ? "Base58 to Byte Array" : "Byte Array to Base58"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 select-none">
                    <div className="w-8 h-8 md:w-16 md:h-16 mx-auto mb-3 border border-gray-600 rounded flex items-center justify-center bg-black/50">
                      <svg
                        className="w-4 h-4 md:w-8 md:h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-400 font-medium py-1 md:py-2">Ready to convert</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-8 pt-3 md:pt-6 border-t border-gray-600/50 select-none">
            <div className="flex items-center justify-center">
              <a
                href="https://github.com/vict0rcarvalh0/private-key-manager"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs md:text-sm text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2"
              >
                <span>This project is open source</span>
                <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
