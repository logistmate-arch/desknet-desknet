import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface PremiumButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  glow?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const PremiumButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = "", 
  glow = false,
  icon,
  disabled = false
}: PremiumButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Magnetic effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    // Magnetic pull (limited to 15px)
    x.set(distanceX * 0.2);
    y.set(distanceY * 0.2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const variants = {
    primary: "bg-brand-teal text-brand-dark shadow-[0_0_20px_rgba(45,212,191,0.2)]",
    secondary: "bg-white/5 border border-white/10 text-white backdrop-blur-md hover:bg-white/10",
    outline: "bg-transparent border-2 border-brand-teal text-brand-teal",
    ghost: "bg-transparent text-white/60 hover:text-white"
  };

  return (
    <motion.button
      ref={buttonRef}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      initial="initial"
      whileHover="hovered"
      whileTap={disabled ? {} : { scale: 0.95 }}
      className={`
        group relative px-6 py-3 rounded-xl font-bold transition-all duration-300
        flex items-center justify-center gap-3 overflow-hidden
        ${variants[variant]}
        ${glow && variant === 'primary' ? 'shadow-[0_0_40px_rgba(45,212,191,0.4)]' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {/* Background Fill Animation */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        variants={{
          initial: { scale: 0, opacity: 0 },
          hovered: { scale: 1.5, opacity: 1 }
        }}
        transition={{ duration: 0.5, ease: "circOut" }}
      >
        <div className={`
          w-full h-full rounded-full blur-3xl
          ${variant === 'primary' ? 'bg-white/20' : 'bg-brand-teal/20'}
        `} />
      </motion.div>

      {/* Border Glow (for outline/secondary) */}
      {(variant === 'outline' || variant === 'secondary') && (
        <motion.div
          layoutId="button-glow"
          className="absolute inset-0 border-2 border-brand-teal/50 rounded-xl blur-sm"
          variants={{
            initial: { opacity: 0 },
            hovered: { opacity: 1 }
          }}
        />
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        <span className="font-bold">{children}</span>
        {icon && (
          <motion.span
            variants={{
              initial: { x: 0, scale: 1 },
              hovered: { x: 4, scale: 1.1 }
            }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {icon}
          </motion.span>
        )}
      </span>

      {/* Scanning Line Effect */}
      <motion.div
        variants={{
          initial: { top: "-100%", opacity: 0 },
          hovered: { top: "200%", opacity: 0.5 }
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute left-0 right-0 h-[1px] bg-white/20 blur-[1px] z-20 pointer-events-none"
      />
    </motion.button>
  );
};
