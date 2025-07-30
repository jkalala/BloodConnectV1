# BloodConnect

BloodConnect is a modern, multilingual blood donation platform built with Next.js, designed to connect blood donors with recipients in real-time. The application supports offline functionality, push notifications, and a rewards system to encourage regular donations.

## 🌟 Features

- **Real-time Blood Donation Matching**: Connect donors with recipients based on location and blood type
- **Offline Maps**: Access maps and critical information even without an internet connection
- **Multilingual Support**: Available in English, Portuguese, French, and Swahili
- **Push Notifications**: Stay updated with urgent blood requests and donation reminders
- **Rewards System**: Earn points and rewards for regular donations
- **Donation Scheduling**: Schedule and manage blood donation appointments
- **Analytics Dashboard**: Track donation trends and impact
- **Mobile-First Design**: Optimized for both mobile and desktop experiences

## 🚀 Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Maps**: Leaflet.js
- **Internationalization**: next-international
- **State Management**: React Context
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- Supabase account
- Twilio account (for SMS notifications)

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jkalala/BloodConnectV1.git
   cd BloodConnectV1
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   ```

4. Initialize the database:
   ```bash
   pnpm run db:init
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

## 🏗️ Project Structure

```
BloodConnectV1/
├── app/                    # Next.js app directory
│   ├── [locale]/          # Internationalized routes
│   ├── admin/             # Admin dashboard
│   └── components/        # Shared components
├── lib/                   # Utility functions and services
├── public/               # Static assets
├── scripts/              # Database scripts
└── types/                # TypeScript type definitions
```

## 🧪 Testing

Run the test suite:
```bash
pnpm test
```

## 🚢 Deployment

The application is configured for deployment on Vercel. The GitHub Actions workflow will automatically deploy to Vercel when changes are pushed to the main branch.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Joaquim Kalala** - *Initial work* - [jkalala](https://github.com/jkalala)

## 🙏 Acknowledgments

- Thanks to all blood donors who inspire this project
- The Next.js team for their amazing framework
- The open-source community for their invaluable tools and libraries 