// Clean About component following the user's example structure.
// Uses profile data when available. Minimal dependencies.

 'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Download, MapPin } from 'lucide-react';
import IconPreview from './IconPreview';
import Achievements from './Achievements';

type Props = { profile?: any; achievements?: any[] };

export default function About({ profile, achievements }: Props) {
  const description = profile?.aboutDescription || profile?.description || 'Write a short about description in the admin panel.';

  const skills = profile?.skills || [
    { name: 'React/Next.js', level: 90 },
    { name: 'TypeScript', level: 85 },
    { name: 'Node.js', level: 80 },
  ];

  const interests = profile?.interests || [
    { icon: 'code', label: 'Coding', description: 'Building useful apps' },
    { icon: 'coffee', label: 'Coffee', description: 'Keeps me going' },
    { icon: 'music', label: 'Music', description: 'Piano & guitar' },
    { icon: 'heart', label: 'Mentoring', description: 'Helping others grow' },
  ];

  // IconPreview will dynamically import lucide-react icons by key

  return (
    <section id="about" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <h2 className="text-4xl font-bold">About Me</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">{profile?.subtitle || 'A short subtitle goes here.'}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left: description + meta */}
          <div>
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              {description.split('\n\n').map((p: string, i: number) => (
                <p key={i} className="text-gray-700 mb-4 text-justify">{p}</p>
              ))}

              <div className="mt-6 flex flex-wrap gap-4 items-center">
                <a href={profile?.cvUrl || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 bg-clover-700 hover:bg-clover-900 text-white rounded-md transition-colors">
                  <Download className="w-4 h-4 mr-2" />
                  Resume
                </a>

                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{profile?.location || 'Location'}</span>
                </div>
              </div>
              {/* Achievements inserted under the main about description */}
              <Achievements achievements={achievements} />
            </motion.div>
          </div>

          {/* Right: skills & interests */}
          <div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-4">Skills</h3>
                <div className="space-y-4">
                  {skills.map((s: any, idx: number) => (
                    <div key={s.name}>
                      <div className="flex justify-between text-sm text-gray-700 mb-1">
                        <span>{s.name}</span>
                        <span>{s.level}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-clover-500 to-clover-700 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${s.level}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.08 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4">Interests</h3>
                <div className="grid grid-cols-2 gap-4">
                  {interests.map((it: any) => {
                    return (
                      <motion.div
                        key={it.label}
                        className="p-4 border rounded-lg flex gap-3 items-center bg-white"
                        whileHover={{ y: -6 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <div className="transition-colors duration-200 text-clover-700 group-hover:text-clover-900">
                          {typeof it.icon === 'string' ? (
                            <IconPreview name={it.icon} className="w-6 h-6 text-clover-700" />
                          ) : (
                            // if icon is already a component
                            React.isValidElement(it.icon) ? it.icon : <div className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{it.label}</div>
                          <div className="text-sm text-gray-600">{it.description}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
