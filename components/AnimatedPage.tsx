'use client';

import NavigationWithChat from '@/components/NavigationWithChat'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Skills from '@/components/Skills'
import Experience from '@/components/Experience'
import Projects from '@/components/Projects'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import AnimatedSection from '@/components/AnimatedSection'

interface AnimatedPageProps {
  profile: any;
  siteSettings: any;
  skills?: any[];
  experience?: any[];
  projects?: any[];
  achievements?: any[];
}

export default function AnimatedPage({ profile, siteSettings, skills, experience, projects, achievements }: AnimatedPageProps) {
  return (
    <main className="min-h-screen bg-white">
      <NavigationWithChat siteSettings={siteSettings} />
      
      {/* Hero Section */}
      <section id="home">
        <Hero profile={profile} siteSettings={siteSettings} />
      </section>

      {/* Unified Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* About Section */}
        <AnimatedSection>
          <section id="about" className="py-20">
            <About profile={profile} achievements={achievements} />
          </section>
        </AnimatedSection>

        {/* Subtle Divider */}
        <div className="border-t border-gray-100"></div>

        {/* Skills Section */}
        <AnimatedSection delay={0.1}>
          <section id="skills" className="py-20">
            <Skills skills={skills} />
          </section>
        </AnimatedSection>

        {/* Subtle Divider */}
        <div className="border-t border-gray-100"></div>

        {/* Experience Section */}
        <AnimatedSection delay={0.1}>
          <section id="experience" className="py-20">
            <Experience experience={experience} />
          </section>
        </AnimatedSection>

        {/* Subtle Divider */}
        <div className="border-t border-gray-100"></div>

        {/* Projects Section */}
        <AnimatedSection delay={0.1}>
          <section id="projects" className="py-20">
            <Projects projects={projects} />
          </section>
        </AnimatedSection>

        {/* Subtle Divider */}
        <div className="border-t border-gray-100"></div>

        {/* Contact Section */}
        <AnimatedSection delay={0.1}>
          <section id="contact" className="py-20">
            <Contact />
          </section>
        </AnimatedSection>
      </div>

      <Footer profile={profile} siteSettings={siteSettings} />
    </main>
  );
}
