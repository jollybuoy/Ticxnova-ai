import { motion } from 'framer-motion';
import { BackgroundMesh } from '../components/layout/BackgroundMesh';
import { LoginHero } from '../components/auth/LoginHero';
import { LoginForm } from '../components/auth/LoginForm';

export default function Login() {
  return (
    <motion.div
      className="relative min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <BackgroundMesh variant="login" />

      <div className="relative flex min-h-screen flex-col lg:flex-row">
        <section className="relative hidden min-h-[280px] flex-1 lg:block lg:min-h-screen">
          <LoginHero />
        </section>

        <section className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16 lg:py-16">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
              <span className="text-lg font-bold text-white">T</span>
            </div>
            <span className="text-lg font-semibold text-white">Ticxnova-AI</span>
          </div>
          <LoginForm />
        </section>
      </div>
    </motion.div>
  );
}
