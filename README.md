# Clean Survey App

A modern, clean survey application built with React, Tailwind CSS, shadcn/ui, and Firebase integration.

## Features

- ✨ Clean, modern UI with shadcn/ui components
- 🎨 Beautiful gradient backgrounds and smooth animations
- 📊 Progress tracking with visual progress bar
- 📝 Multiple question types (rating scales and text input)
- 🖼️ Image upload and gallery from Firebase Storage
- 💾 Automatic data saving to Firebase Firestore
- 📱 Responsive design for all devices

## Tech Stack

- **React 19** - Latest React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **Firebase** - Backend services (Firestore & Storage)
- **Lucide React** - Beautiful icons

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database and Storage
3. Copy your Firebase configuration
4. Create a `.env` file in the root directory:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 3. Firebase Security Rules

Update your Firestore security rules to allow read/write access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /survey-responses/{document} {
      allow read, write: if true;
    }
  }
}
```

Update your Storage security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /survey-images/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### 4. Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

## Project Structure

```
src/
├── components/
│   └── ui/           # shadcn/ui components
│       ├── button.jsx
│       ├── card.jsx
│       └── input.jsx
├── lib/
│   ├── firebase.js   # Firebase configuration
│   └── utils.js      # Utility functions
├── App.js            # Main application component
├── index.js          # Entry point
└── index.css         # Global styles with Tailwind
```

## Features Overview

### Survey Flow

1. **Welcome Screen** - Collect participant information
2. **Question Navigation** - Progress through questions with visual progress bar
3. **Multiple Question Types** - Rating scales and text input
4. **Image Gallery** - View uploaded images from Firebase Storage
5. **Image Upload** - Upload new images to Firebase Storage
6. **Data Submission** - Save responses to Firestore

### UI Components

- **Cards** - Clean, modern card layouts
- **Buttons** - Multiple variants (default, outline, etc.)
- **Inputs** - Styled form inputs
- **Progress Bar** - Visual progress indicator
- **Loading States** - Smooth loading overlays

## Customization

### Adding Questions

Modify the `questions` array in `App.js`:

```javascript
const questions = [
  {
    id: 1,
    text: "Your question here?",
    type: "rating", // or "text"
    options: ["Option 1", "Option 2", "Option 3"], // for rating type
  },
];
```

### Styling

The app uses Tailwind CSS with shadcn/ui design tokens. Colors and styling can be customized in:

- `tailwind.config.js` - Theme configuration
- `src/index.css` - CSS variables and global styles

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Deploy: `firebase deploy`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own surveys!
