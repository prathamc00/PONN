import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, ClipboardCheck, Award, Mail, MapPin, Github, Twitter, Linkedin, ArrowRight, Play, Sparkles, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#030014] text-slate-100 selection:bg-brand-purple/30 selection:text-brand-purple student-theme">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-purple/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-blue/20 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="max-w-7xl mx-auto h-16 glass-panel rounded-2xl flex items-center justify-between px-6">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-blue rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg glow-shadow transition-transform group-hover:scale-110">C</div>
            <span className="font-bold text-2xl tracking-tight gradient-text">Crismatech</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Home</Link>
            <Link to="/courses" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Courses</Link>
            {user ? (
              <Link to={user.role === 'admin' || user.role === 'instructor' ? '/admin/dashboard' : '/dashboard'} className="px-6 py-2.5 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all glow-shadow active:scale-95 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Login</Link>
                <Link to="/register" className="px-6 py-2.5 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all glow-shadow active:scale-95">Register</Link>
              </>
            )}
            <ThemeToggle />
          </div>
          
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-brand-purple" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">The Future of Learning</span>
            </div>
            
            <h1 className="text-6xl lg:text-8xl font-bold leading-[1.05] tracking-tight mb-8">
              Master Your <br />
              <span className="gradient-text">Digital Future</span>
            </h1>
            
            <p className="text-xl text-slate-400 mb-12 leading-relaxed max-w-lg font-medium">
              Join the next generation of tech leaders. Experience a highly polished, interactive learning environment designed for excellence.
            </p>
            
            <div className="flex flex-wrap gap-6">
              <Link to={user ? (user.role === 'admin' || user.role === 'instructor' ? '/admin/dashboard' : '/dashboard') : '/login'} className="group px-8 py-4 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all glow-shadow active:scale-95 flex items-center gap-3">
                {user ? 'Go to Dashboard' : 'Get Started'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden border border-white/10 glow-shadow p-2 bg-white/5 backdrop-blur-3xl">
              <div className="rounded-[2.5rem] overflow-hidden aspect-square">
                <img 
                  src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800&h=800" 
                  alt="Futuristic Tech" 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            
            {/* Floating Glass Cards */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-8 -right-8 z-20 glass-panel p-6 rounded-3xl glow-shadow-blue border-brand-blue/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-blue/20 rounded-2xl flex items-center justify-center text-brand-blue">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified</p>
                  <p className="text-lg font-bold text-white">Certified</p>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">Built for <span className="gradient-text">Excellence</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto font-medium text-lg">Our platform provides all the tools necessary for a modern, immersive learning experience.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: BookOpen, title: 'Course Materials', desc: 'Access high-quality video lectures and PDF notes anytime.', bgGradient: 'from-brand-purple/10', bgColor: 'bg-brand-purple/10', textColor: 'text-brand-purple' },
              { icon: FileText, title: 'Assignments', desc: 'Submit and track your assignments with ease.', bgGradient: 'from-brand-blue/10', bgColor: 'bg-brand-blue/10', textColor: 'text-brand-blue' },
              { icon: ClipboardCheck, title: 'Online Tests', desc: 'Take MCQ and descriptive tests to evaluate your progress.', bgGradient: 'from-brand-purple/10', bgColor: 'bg-brand-purple/10', textColor: 'text-brand-purple' },
              { icon: Award, title: 'Certificates', desc: 'Earn verified certificates upon course completion.', bgGradient: 'from-brand-blue/10', bgColor: 'bg-brand-blue/10', textColor: 'text-brand-blue' }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 rounded-[2.5rem] group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                
                <div className={`w-14 h-14 ${feature.bgColor} rounded-2xl flex items-center justify-center ${feature.textColor} mb-8 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-20 z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-16 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-blue rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg glow-shadow">C</div>
                <span className="font-bold text-2xl tracking-tight gradient-text">Crismatech</span>
              </div>
              <p className="text-slate-400 max-w-md mb-10 font-medium text-lg leading-relaxed">
                Leading the way in digital education and technical training. Join thousands of students learning new skills every day.
              </p>
              <div className="flex gap-6">
                {[Twitter, Linkedin, Github].map((Icon, i) => (
                  <a key={i} href="#" className="w-12 h-12 glass-card rounded-full flex items-center justify-center hover:bg-brand-purple hover:text-white transition-all">
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-sm uppercase tracking-[0.2em] text-slate-500 mb-8">Contact</h4>
              <ul className="space-y-6 text-slate-400 font-medium">
                <li className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-brand-purple group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  info@crismatech.com
                </li>
                <li className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-brand-blue group-hover:scale-110 transition-transform">
                    <MapPin className="w-5 h-5" />
                  </div>
                  123 Education Hub, Tech City
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm uppercase tracking-[0.2em] text-slate-500 mb-8">Navigation</h4>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><Link to="/courses" className="hover:text-brand-purple transition-colors">Courses</Link></li>
                <li><Link to="/login" className="hover:text-brand-purple transition-colors">Login</Link></li>
                <li><Link to="/register" className="hover:text-brand-purple transition-colors">Register</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/5 text-center text-slate-500 text-sm font-medium">
            © 2026 Crismatech Education. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

