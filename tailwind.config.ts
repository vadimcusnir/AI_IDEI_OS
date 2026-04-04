import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1440px",
      "2xl": "1536px",
    },
    fontFamily: {
      display: ['var(--font-display)'],
      sans: ['var(--font-sans)'],
      mono: ['var(--font-mono)'],
    },
    extend: {
      fontSize: {
        /** Dense UI utilities — canonical replacements for arbitrary text-[Npx] */
        'nano': ['0.5625rem', { lineHeight: '1.4' }],    /* 9px — badges, stats only */
        'micro': ['0.625rem', { lineHeight: '1.4' }],     /* 10px — tags, metadata */
        'dense': ['0.6875rem', { lineHeight: '1.45' }],   /* 11px — compact labels */
        'compact': ['0.8125rem', { lineHeight: '1.5' }],  /* 13px — dense body */
      },
      colors: {
        toolbar: {
          DEFAULT: "hsl(var(--toolbar-bg))",
          border: "hsl(var(--toolbar-border))",
          active: "hsl(var(--toolbar-active))",
        },
        panel: {
          DEFAULT: "hsl(var(--panel-bg))",
          border: "hsl(var(--panel-border))",
          header: "hsl(var(--panel-header))",
        },
        status: {
          draft: "hsl(var(--status-draft))",
          validated: "hsl(var(--status-validated))",
          published: "hsl(var(--status-published))",
        },
        graph: {
          node: "hsl(var(--graph-node))",
          edge: "hsl(var(--graph-edge))",
          highlight: "hsl(var(--graph-highlight))",
        },
        ai: {
          DEFAULT: "hsl(var(--ai-bg))",
          border: "hsl(var(--ai-border))",
          accent: "hsl(var(--ai-accent))",
        },
        note: {
          yellow: "hsl(var(--note-yellow))",
          green: "hsl(var(--note-green))",
          blue: "hsl(var(--note-blue))",
          pink: "hsl(var(--note-pink))",
          purple: "hsl(var(--note-purple))",
          default: "hsl(var(--note-default))",
        },
        semantic: {
          emerald: "hsl(var(--color-emerald))",
          amber: "hsl(var(--color-amber))",
          blue: "hsl(var(--color-blue))",
          purple: "hsl(var(--color-purple))",
          rose: "hsl(var(--color-rose))",
          cyan: "hsl(var(--color-cyan))",
          teal: "hsl(var(--color-teal))",
          indigo: "hsl(var(--color-indigo))",
        },
        tier: {
          vip: "hsl(var(--tier-vip))",
          pro: "hsl(var(--tier-pro))",
          free: "hsl(var(--tier-free))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      spacing: {
        'sp-1': 'var(--sp-1)',
        'sp-2': 'var(--sp-2)',
        'sp-3': 'var(--sp-3)',
        'sp-4': 'var(--sp-4)',
        'sp-6': 'var(--sp-6)',
        'sp-8': 'var(--sp-8)',
        'sp-10': 'var(--sp-10)',
        'sp-12': 'var(--sp-12)',
        'sp-16': 'var(--sp-16)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(8px)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        "text-reveal": {
          "0%": { opacity: "0", transform: "translateY(20px) rotateX(-10deg)" },
          "100%": { opacity: "1", transform: "translateY(0) rotateX(0deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "text-reveal": "text-reveal 0.6s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
