# Portfolio Website

A modern, fully-featured portfolio website with an intelligent AI assistant. Built with Next.js 14, TypeScript, Tailwind CSS, Firebase, and powered by Google's Gemini AI.

## ✨ Key Features

### 🎨 **Modern Design**
- Clean, professional interface with custom theme colors
- Fully responsive design optimized for all devices
- Primary color: `#1c332f`, Secondary: `#e0d39f`, Text: `#ffffff`
- Smooth animations and modern UI components


### 🔧 **Comprehensive Admin Panel**
- Secure authentication with password reset functionality
- Real-time content management for all portfolio sections
- Firebase Storage integration for image uploads
- Live content preview and editing
- Dashboard with portfolio insights

### 🚀 **Performance Optimized**
- Next.js 14 App Router with TypeScript
- Server-side rendering and static generation
- Optimized images and bundle splitting
- SEO-friendly with meta tags and Open Graph

### 📧 **Contact Management**
- Contact form with email notifications
- Real-time form validation
- Contact submission management in admin panel

### 📊 **Analytics & Insights**
- Google Analytics 4 integration with custom event tracking
- User behavior analytics (scroll depth, time on site, section views)
- Portfolio interaction tracking (project views, contact form submissions)
- Admin dashboard usage analytics

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 with App Router |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | Firebase Firestore |
| **Storage** | Firebase Storage |
| **Authentication** | Custom JWT + NextAuth.js |
| **AI Integration** | Google Gemini AI (@google/genai) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Email** | Nodemailer |
| **Text Editor** | React Quill |
| **Markdown** | React Markdown |
| **Deployment** | Vercel |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Firebase project set up
- Google Gemini API key
- Git installed

### Installation

1. **Clone and setup**
   ```bash
   git clone https://github.com/KyawMyo78/calla-portfolio.git
   cd calla-portfolio
   npm install
   ```

2. **Environment configuration**
   Create a `.env.local` file with the required variables (see [Environment Setup](#environment-setup))

3. **Generate admin credentials**
   ```bash
   node generate-admin-hash.js
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Visit your site**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔧 Environment Setup

Create a `.env.local` file with these essential configurations:

### Firebase Configuration
```env
# Client-side Firebase config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Server-side Firebase config
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_PROJECT_ID=your_project_id
```

### AI Configuration
```env
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

### Authentication & Security
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD_HASH=your_bcrypt_hashed_password
ADMIN_SECRET=your_admin_secret_key
```

### Email Configuration (Optional)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="Your Name <your_email@gmail.com>"
```

### Site Configuration
```env
SITE_URL=http://localhost:3000
SITE_NAME="Calla Portfolio"
```

### Analytics Configuration (Optional)
```env
# Google Analytics tracking ID
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## 🎯 Admin Panel Features

Access your admin dashboard at `/admin/login`

### Core Admin Features
- **📊 Dashboard**: Portfolio overview and insights
- **👤 Profile**: Personal information and bio management
- **💼 Experience**: Work history and career timeline
- **🚀 Projects**: Project showcase with rich media
- **🛠️ Skills**: Technical and soft skills organization
- **🏆 Achievements**: Awards and accomplishments
- **✍️ Blog**: Article creation and management
- **📬 Contacts**: Contact form submission management
- **🤖 AI Chat**: Intelligent assistant (AP's Clover) for portfolio help
- **⚙️ Site Settings**: Global site configuration

### AI Assistant (AP's Clover)
- **Smart Assistance**: Understands your portfolio structure and content
- **Personalized Responses**: Knows your skills, experience, and projects
- **Chat History**: Remembers previous conversations
- **Floating Access**: Available from all admin pages except chat
- **Markdown Support**: Rich text formatting in responses
- **Context Awareness**: Provides specific guidance for admin tasks

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Connect to Vercel**
   - Push your code to GitHub
   - Connect repository to Vercel
   - Import project

2. **Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Update `SITE_URL` and `NEXTAUTH_URL` to your production domain
   - Add `GEMINI_API_KEY` for AI functionality

3. **Deploy**
   - Automatic deployment on every push to main branch

### Other Deployment Options
- **Netlify**: Compatible with Next.js hosting
- **AWS Amplify**: Connect via GitHub repository
- **Railway**: Zero-config deployment
- **DigitalOcean App Platform**: Node.js app deployment

## 🎨 Customization

### Theme Colors
The portfolio uses a custom color scheme defined in `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1c332f',
          light: '#2d5a4f',
          dark: '#0d1a17'
        },
        secondary: {
          DEFAULT: '#e0d39f',
          light: '#f0e8c7',
          dark: '#cbbf7a'
        },
        text: {
          DEFAULT: '#ffffff',
          light: '#f8f9fa',
          dark: '#e9ecef'
        }
      }
    }
  }
}
```

### Customizing Components
Update components in the `/components` directory:
- `Hero.tsx` - Landing page hero section
- `About.tsx` - About me section
- `Projects.tsx` - Projects showcase
- `Skills.tsx` - Skills display
- `Experience.tsx` - Work experience
- `ChatUI.tsx` - AI chat interface
- `FloatingAIButton.tsx` - Floating AI assistant button

## 📁 Project Structure

```
calla-portfolio/
├── app/                          # Next.js App Router
│   ├── admin/                   # Admin panel pages
│   │   ├── chat/               # AI chat interface
│   │   ├── dashboard/          # Admin dashboard
│   │   ├── profile/            # Profile management
│   │   ├── projects/           # Project management
│   │   ├── skills/             # Skills management
│   │   ├── experience/         # Experience management
│   │   ├── blog/               # Blog management
│   │   └── ...                 # Other admin pages
│   ├── api/                    # API routes
│   │   ├── admin/              # Admin API routes
│   │   │   └── chat/           # AI chat API
│   │   ├── auth/               # Authentication
│   │   ├── portfolio/          # Public portfolio data
│   │   └── contact/            # Contact form
│   ├── about/                  # Public about page
│   ├── projects/               # Public projects page
│   ├── skills/                 # Public skills page
│   ├── experience/             # Public experience page
│   ├── contact/                # Public contact page
│   └── layout.tsx              # Root layout
├── components/                  # Reusable components
│   ├── Hero.tsx                # Hero section
│   ├── About.tsx               # About section
│   ├── Projects.tsx            # Projects showcase
│   ├── Skills.tsx              # Skills display
│   ├── Experience.tsx          # Experience timeline
│   ├── ChatUI.tsx              # AI chat interface
│   ├── FloatingAIButton.tsx    # Floating AI button
│   └── ...                     # Other components
├── lib/                        # Utilities and configs
│   ├── firebase.ts             # Firebase client config
│   ├── firebase-admin.ts       # Firebase admin config
│   └── ...                     # Other utilities
├── types/                      # TypeScript definitions
├── public/                     # Static assets
│   ├── apclover.jpg            # AI mascot image
│   └── ...                     # Other static files
└── package.json                # Dependencies
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |
| `npm run analyze` | Bundle analysis |

## 🚀 Key Features Implementation

### AI Assistant Integration
- Google Gemini AI integration with conversational context
- Personalized responses based on portfolio data from Firestore
- Floating AI button with mascot image and curved text design
- Modern chat interface with Markdown rendering

### Firebase Integration
- Firestore for data storage (profile, projects, skills, etc.)
- Firebase Storage for image uploads
- Real-time data synchronization
- Server-side Firebase Admin SDK for secure operations

### Authentication System
- Custom JWT-based authentication
- Secure admin panel access
- Password reset functionality
- Protected API routes

### Modern UI/UX
- Custom Tailwind theme with brand colors
- Responsive design for all screen sizes
- Smooth animations and transitions
- Rich text editing capabilities

##  License

This project is protected under a proprietary license. All rights are reserved by the author. Unauthorized use, modification, distribution, or commercialization is strictly prohibited. See the [LICENSE](LICENSE) file for details.

## 💬 Support

For questions or issues:
- 🐛 **Bug Reports**: [Open an issue](https://github.com/KyawMyo78/portfolio-template/issues)
- 💡 **Feature Requests**: [Request a feature](https://github.com/KyawMyo78/portfolio-template/issues)
- 📧 **Email**: [kyawmk787@gmail.com](mailto:kyawmk787@gmail.com)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Firebase](https://firebase.google.com/) - Backend as a Service
- [Google Gemini AI](https://ai.google.dev/) - AI integration
- [Vercel](https://vercel.com/) - Deployment platform
- [Lucide](https://lucide.dev/) - Beautiful icons
- [Framer Motion](https://www.framer.com/motion/) - Animation library

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/KyawMyo78">Kyaw Myo</a></p>
  <p>© 2025 Portfolio. All rights reserved.</p>
</div>
