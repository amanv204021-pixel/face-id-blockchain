import { motion } from 'framer-motion'
import { useStore } from '../../store'

export default function IntroOverlay() {
  const start = useStore((s) => s.start)
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center">
      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}
        className="text-center">
        <div className="text-[64px] font-black leading-none tracking-[0.22em] text-cyan-200 neon-text-cyan">FACE ID</div>
        <div className="mt-1 text-[30px] font-bold tracking-[0.34em] text-fuchsia-300 neon-text-magenta">BLOCKCHAIN VERIFICATION</div>
        <div className="mt-3 text-[13px] tracking-[0.28em] text-slate-400">
          AI-POWERED IDENTITY INTEGRITY & TAMPER-EVIDENT VERIFICATION
        </div>
      </motion.div>
      <motion.button initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.9 }}
        whileHover={{ scale: 1.06, boxShadow: '0 0 40px rgba(52,211,153,0.5)' }}
        whileTap={{ scale: 0.97 }}
        onClick={start}
        className="pointer-events-auto mt-12 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-10 py-4 text-[15px] font-black tracking-[0.3em] text-emerald-200 backdrop-blur-md">
        ▶ START VERIFICATION
      </motion.button>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
        className="mt-6 text-center text-[9.5px] leading-relaxed tracking-wider text-slate-500">
        HACKATHON DEMO · SYNTHETIC & AUTHORIZED IMAGES ONLY · IMAGE SIMILARITY ≠ IDENTITY
        <br />
        OpenCV YuNet + SFace · SHA-256 anchoring · simulated chain / EVM testnet
      </motion.div>
    </div>
  )
}
