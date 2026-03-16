'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, LogOut, Settings, User, Home, TrendingUp, Wallet } from 'lucide-react'

interface NavLink {
  href: string
  label: string
  icon?: React.ReactNode
}

const Navbar = () => {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // 네비게이션 링크
  const navLinks: NavLink[] = [
    { href: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { href: '/trade', label: 'Trade', icon: <TrendingUp className="w-4 h-4" /> },
    { href: '/portfolio', label: 'Portfolio', icon: <Wallet className="w-4 h-4" /> },
  ]

  // 네비게이션 처리
  const handleNavigation = useCallback((href: string) => {
    router.push(href)
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
  }, [router])

  // 로그아웃 처리
  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
      handleNavigation('/login')
    } catch (error) {
      console.error('Logout error:', error)
      handleNavigation('/login')
    }
  }, [handleNavigation])

  // 사용자 메뉴 항목 (handleLogout 선언 후에 위치)
  const userMenuItems = [
    { label: 'Profile', icon: <User className="w-4 h-4" />, onClick: () => handleNavigation('/profile') },
    { label: 'Settings', icon: <Settings className="w-4 h-4" />, onClick: () => handleNavigation('/settings') },
    { label: 'Logout', icon: <LogOut className="w-4 h-4" />, onClick: handleLogout },
  ]

  // 모바일 메뉴 토글
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }, [isMobileMenuOpen])

  // 사용자 메뉴 토글
  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }, [isUserMenuOpen])

  return (
    <nav className="sticky top-0 z-40 w-full bg-gradient-to-b from-k-darker/95 to-k-darker/80 backdrop-blur-md border-b border-k-teal/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-2xl font-bold text-k-teal hover:opacity-80 transition"
            >
              K-Arena
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-1">
              {navLinks.map(link => (
                <button
                  key={link.href}
                  onClick={() => handleNavigation(link.href)}
                  className="text-gray-300 hover:text-k-teal px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 hover:bg-k-teal/10 active:opacity-80"
                >
                  {link.icon}
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* 사용자 메뉴 & 모바일 메뉴 버튼 */}
          <div className="flex items-center gap-4">
            {/* 사용자 메뉴 (데스크톱) */}
            <div className="hidden md:block relative">
              <button
                onClick={toggleUserMenu}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-k-teal/20 hover:bg-k-teal/30 transition text-k-teal font-medium"
              >
                <User className="w-4 h-4" />
                <span>Account</span>
              </button>

              {/* 사용자 메뉴 드롭다운 */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-k-darker border border-k-teal/30 rounded-lg shadow-lg py-1 animate-in fade-in slide-in-from-top-2">
                  {userMenuItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={item.onClick}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-k-teal hover:bg-k-teal/10 flex items-center gap-2 transition"
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-k-teal/20 transition"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-k-teal" />
              ) : (
                <Menu className="w-6 h-6 text-k-teal" />
              )}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-k-teal/20 py-4 space-y-2 animate-in fade-in slide-in-from-top-2">
            {navLinks.map(link => (
              <button
                key={link.href}
                onClick={() => handleNavigation(link.href)}
                className="w-full text-left px-4 py-2 text-gray-300 hover:text-k-teal hover:bg-k-teal/10 rounded-lg transition flex items-center gap-2"
              >
                {link.icon}
                {link.label}
              </button>
            ))}

            {/* 모바일 사용자 메뉴 */}
            <div className="border-t border-k-teal/20 pt-2 mt-2">
              {userMenuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="w-full text-left px-4 py-2 text-gray-300 hover:text-k-teal hover:bg-k-teal/10 rounded-lg transition flex items-center gap-2"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 배경 오버레이 (모바일 메뉴 열려있을 때) */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 -z-10"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </nav>
  )
}

export default Navbar
