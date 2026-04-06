import React from 'react'
import Link from 'next/link';

const Logo = ({ isDarkBg = false }: { isDarkBg?: boolean }) => {
  return (
    <Link 
      href="/" 
      className={`text-xl sm:text-2xl font-extrabold tracking-tight inline-block ${isDarkBg ? 'text-blue-600' : 'text-blue-600'}`}
    >
      Team<span className={isDarkBg ? 'text-slate-200' : 'text-slate-900'}>Spend</span>
    </Link>
  )
}

export default Logo;