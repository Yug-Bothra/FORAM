# FORAM - College Student Social Platform

![FORAM Logo](https://img.shields.io/badge/FORAM-Social%20Platform-blue?style=for-the-badge)
[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-foram.vercel.app-success?style=for-the-badge)](https://foram.vercel.app/)
[![Deployment](https://img.shields.io/badge/Deployed_on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

**FORAM** is a comprehensive social networking platform designed specifically for college students to connect, collaborate, and communicate with their peers. Part of the larger MALOR project ecosystem, FORAM enables seamless interaction through multiple communication channels while fostering academic and social communities.

🚀 **[Visit Live Application](https://foram.vercel.app/)**

DEMO LOGIN
### 🎓 **Student Panel**
* **Username / Roll No:** `22100BTAIMLM11277`

email: yugbothra@gmail.com
  

## 🎯 Overview

FORAM serves as the central hub for college students to:
- Connect with fellow students through various communication channels
- Share multimedia content including images, videos, documents, and more
- Participate in organized communities managed by clubs and official class groups
- Engage in real-time messaging across different group types

## ✨ Features

### 🔐 Authentication System
- Secure user registration and login
- Profile completion and verification
- Role-based access control

### 💬 Multi-Channel Communication
- **One-on-One**: Private messaging between individual students
- **Group Chats**: Small group discussions for project teams and study groups
- **Community Forums**: Large-scale discussions for clubs and official class groups

### 📱 Rich Media Sharing
- Support for all media file types
- Image and video sharing with preview
- Document sharing for academic collaboration
- File upload with cloud storage integration

### 👥 Community Management
- **Admin-Controlled Communities**: Official class groups and club communities where only administrators can post and moderate content
- **Open Communities**: Student-led groups with collaborative posting
- Follow system for staying connected with peers

### 🎨 User Experience
- Modern, responsive design
- Intuitive navigation
- Real-time notifications
- Cross-platform compatibility

## 🛠️ Tech Stack

### Frontend
- **React.js** - Modern UI framework
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool and development server

### Backend Services
- **Supabase** - Backend as a service for database and real-time features
- **Clerk** - Authentication and user management
- **Cloudinary** - Media storage and optimization

### Development Tools
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing
- **Vercel** - Deployment platform

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Supabase account
- Clerk account
- Cloudinary account

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd FORAM
```

> **🌐 Quick Start**: You can also visit the live application at [foram.vercel.app](https://foram.vercel.app/) without any setup!

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory with the following variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

4. **Start the development server**
```bash
npm run dev
```

5. **Build for production**
```bash
npm run build
```

## 📁 Project Structure

```
FORAM/
├── public/                          # Static assets and favicon
├── src/
│   ├── components/                  # Reusable React components
│   │   ├── messages/               # Message-related components
│   │   │   ├── MessageActions.jsx  # Message interaction controls
│   │   │   └── MessageComponents.jsx # Core message UI components
│   │   ├── ClerkLogin.jsx          # Authentication component
│   │   ├── Comments.jsx            # Comment system
│   │   ├── CompleteProfile.jsx     # Profile completion flow
│   │   ├── EnrollmentAuth.jsx      # Student enrollment verification
│   │   ├── Follow.jsx              # User follow functionality
│   │   ├── Like.jsx                # Post like system
│   │   ├── PostsGrid.jsx           # Post display grid
│   │   ├── Profile.jsx             # User profile component
│   │   ├── ProfileHeader.jsx       # Profile header section
│   │   ├── Settings.jsx            # User settings panel
│   │   └── Share.jsx               # Content sharing functionality
│   ├── pages/                      # Main page components
│   │   ├── messages/               # Messaging page variants
│   │   │   ├── Community.jsx       # Community chat interface
│   │   │   ├── Group.jsx          # Group chat interface
│   │   │   └── OneVOne.jsx        # Direct messaging interface
│   │   ├── Dashboard.jsx           # Main dashboard page
│   │   ├── EditProfile.jsx         # Profile editing page
│   │   ├── Explore.jsx             # Content discovery page
│   │   ├── HomePage.jsx            # Landing/home page
│   │   ├── Messages.jsx            # Messages overview page
│   │   ├── Post.jsx                # Individual post view
│   │   ├── ProfilePage.jsx         # User profile page
│   │   ├── Sidebar.jsx             # Navigation sidebar
│   │   └── UserProfile.jsx         # Public user profile
│   ├── hooks/                      # Custom React hooks
│   │   └── useChat.js              # Chat functionality hook
│   ├── utils/                      # Utility functions
│   │   ├── cloudinary.js           # Cloudinary integration
│   │   └── cropImage.js            # Image processing utilities
│   ├── assets/                     # Images and static resources
│   ├── App.jsx                     # Main application component
│   ├── App.css                     # Global application styles
│   ├── index.css                   # Base CSS and Tailwind imports
│   ├── main.jsx                    # Application entry point
│   └── supabaseClient.js           # Supabase configuration
├── .env                            # Environment variables (not in repo)
├── .gitignore                      # Git ignore rules
├── eslint.config.js                # ESLint configuration
├── index.html                      # Main HTML template
├── package.json                    # Project dependencies and scripts
├── package-lock.json               # Locked dependency versions
├── postcss.config.js               # PostCSS configuration
├── README.md                       # Project documentation
├── tailwind.config.js              # Tailwind CSS configuration
├── vercel.json                     # Vercel deployment config
└── vite.config.js                  # Vite build configuration
```

## 🌟 Key Components

- **Authentication**: Clerk-powered secure login and registration
- **Real-time Messaging**: Supabase real-time subscriptions for instant communication
- **Media Management**: Cloudinary integration for optimized file handling
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Community Management**: Role-based access control for different user types

## 🔒 Security Features

- Secure authentication with Clerk
- Row-level security with Supabase
- File upload validation and sanitization
- User permission management
- Data encryption in transit and at rest

## 📱 Platform Support

- **Web Application**: Full-featured desktop and mobile web experience
- **Responsive Design**: Optimized for all screen sizes
- **Cross-browser Compatibility**: Works on all modern browsers

## 🎓 Academic Integration

FORAM is specifically designed for the academic environment:
- **Class Groups**: Official channels for course-related discussions
- **Study Groups**: Collaborative spaces for academic projects
- **Club Communities**: Organized spaces for extracurricular activities
- **Resource Sharing**: Easy sharing of study materials and documents

## 📄 License

This project is part of a university major project. All rights reserved.

## 🤝 Contributing

This project is currently part of an academic major project. For collaboration inquiries, please reach out through the appropriate academic channels.

## 📞 Support

For technical issues or feature requests related to this academic project, please contact the development team through your institution's official channels.

---



## 📸 Application Screenshots

| ![](https://github.com/user-attachments/assets/7e8859e9-0528-4d51-b259-d4c90aec5e3f) | ![](https://github.com/user-attachments/assets/14c4a441-1285-493d-b1b8-e9cd1a1f1c31) | ![](https://github.com/user-attachments/assets/d233429c-187b-420f-8d8b-7db596fb5f03) |
| :----------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------: |
| ![](https://github.com/user-attachments/assets/fd71f3a9-f142-4851-b66c-a556eccd5b28) | ![](https://github.com/user-attachments/assets/f8c8b356-132a-451f-96d2-fb09c48f5fd5) | ![](https://github.com/user-attachments/assets/2f7c44d7-11fd-4208-81cc-22d53cef58e1) |
| ![](https://github.com/user-attachments/assets/bc84e939-c99d-408d-a4bd-8b4556adb306) | ![](https://github.com/user-attachments/assets/6ffcd6c7-6c1f-4251-89a9-e2c763b671ef) | ![](https://github.com/user-attachments/assets/4d4b6d45-abd5-458b-8bf9-3633a09ed9f6) |
| ![](https://github.com/user-attachments/assets/27830949-782c-4026-b45a-d21f4d968452) | ![](https://github.com/user-attachments/assets/3fa96c06-e4f6-489c-bb19-3bc3b18c4fd8) | ![](https://github.com/user-attachments/assets/6c4c701e-d5b3-425c-a3b9-a7bd69f44424) |

---


<div align="center">
  <h2>🌟 Experience FORAM Live</h2>
  <p><a href="https://foram.vercel.app/" target="_blank"><strong>🚀 Visit foram.vercel.app</strong></a></p>
  <br>
  <h3>💜 Made with Love by Yug Bothera 💜</h3>
  <p><em>University Major Project</em></p>
</div>
