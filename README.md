# YT-DLP Downloader

A cross-platform video downloader application built with Electron and React, supporting YouTube and other platforms. The application comes bundled with yt-dlp and ffmpeg for seamless video downloading experience.

## Features

- Download videos from YouTube (more platforms coming soon)
- Cross-platform support (Windows, macOS, Linux)
- Built-in yt-dlp and ffmpeg binaries
- User-friendly interface
- Portable application

## Development

### Prerequisites

- Node.js 16.x or later
- pnpm 8.x or later (recommended over npm)
- Git

### Setup

1. Clone the repository:

```bash
git clone https://github.com/doufa/video-downloader.git
cd video-downloader
```

2. Install pnpm if you haven't already:

```bash
npm install -g pnpm
```

3. Install dependencies:

```bash
pnpm install
```

4. **Important**: Download required binaries (yt-dlp and ffmpeg):

```bash
# If you need to use a proxy:
pnpm download-binaries

# Without proxy:
pnpm download-binaries:no-proxy
```

> ⚠️ **Note**: You must run the download-binaries command before starting the app or building. This step downloads the required yt-dlp and ffmpeg executables for your platform.

5. Start the development server:

```bash
pnpm start
```

### Building

To create a distribution package:

1. Ensure you've downloaded the binaries first (step 4 above)
2. Run the build command:

```bash
pnpm make
```

The packaged applications will be available in the `out` directory.

### Why pnpm?

We recommend using pnpm for this project because:

- Faster installation times
- More efficient disk space usage
- Strict dependency management
- Better security with built-in checks
- Compatible with all npm commands

## Project Structure

```
yt-dlp-downloader/
  ├── src/
  │   ├── main/           # Electron main process code
  │   │   ├── handlers/   # IPC handlers
  │   │   ├── services/   # Business logic services
  │   │   ├── utils/      # Utility functions
  │   │   └── main.ts     # Main entry point
  │   │
  │   ├── renderer/       # React application code
  │   │   ├── components/ # Reusable React components
  │   │   ├── pages/      # Page components
  │   │   ├── hooks/      # Custom React hooks
  │   │   ├── styles/     # CSS/SCSS files
  │   │   ├── utils/      # Frontend utilities
  │   │   ├── types/      # TypeScript type definitions
  │   │   └── App.tsx     # Root React component
  │   │
  │   └── types/              # TypeScript types
  │       ├── electron.d.ts/  # electron types
  │       ├── webpack.d.ts/   # webpack types
  │
  ├── lib/               # Platform-specific binaries
  │   ├── win32/         # Windows binaries
  │   │   ├── ffmpeg.exe
  │   │   └── yt-dlp.exe
  │   ├── darwin/        # macOS binaries
  │   │   ├── ffmpeg
  │   │   └── yt-dlp
  │   └── linux/         # Linux binaries
  │       ├── ffmpeg
  │       └── yt-dlp
  │
  ├── scripts/           # Build and utility scripts
  │   ├── download-binaries.ts
  │   └── build-helpers.ts
  │
  ├── public/            # Static assets
  │   ├── icons/        # Application icons
  │   └── locales/      # i18n translation files
  │
  ├── .webpack/         # Webpack build output
  ├── out/             # Electron-forge output
  └── dist/            # Production build output
```

## Technologies

- Electron
- React
- TypeScript
- yt-dlp
- ffmpeg
- electron-forge

## Troubleshooting

If you encounter any issues:

1. Make sure you've run the `download-binaries` command
2. Check that the `lib` directory contains the correct binaries for your platform
3. For development, verify that the path to ffmpeg and yt-dlp is correct in your environment

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

This application bundles the following third-party software:

#### yt-dlp

- License: [Unlicense License](https://github.com/yt-dlp/yt-dlp/blob/master/LICENSE)
- Copyright: The yt-dlp Contributors
- Source: <https://github.com/yt-dlp/yt-dlp>

#### FFmpeg

- License: [GNU Lesser General Public License (LGPL) version 2.1](https://www.ffmpeg.org/legal.html)
- Copyright: The FFmpeg developers
- Source: <https://ffmpeg.org/>

These components are included as binary distributions and are subject to their respective licenses. By using this application, you agree to comply with all third-party licenses.

### Disclaimer

This software is not affiliated with or endorsed by YouTube or any other video platforms. Users are responsible for complying with applicable laws and terms of service when downloading content.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

# TODOs

## 1. Configuration Page
- Create configuration page with:
  - Download save path selector (with directory picker)
  - Proxy address input field
  - Default quality settings
  - Save/Reset buttons
- Persist settings between app launches
- Add validation for proxy address format
- Add path existence validation
- Add configuration migration system for future updates

## 2. ~~Download Quality Selection~~ ✅
- ~~Add quality selector dropdown in download page~~
- ~~Fetch available qualities when URL is entered~~
- ~~Show resolution, format, and estimated file size~~
- ~~Remember last selected quality~~
- ~~Add option to always use highest/lowest quality~~
- ~~Handle live streams differently~~
- ~~Support different quality options for different platforms~~

## ~~3. Download Progress~~ ✅
- ~~Show real-time download progress:~~
  - ~~Percentage complete~~
  - ~~Download speed~~
  - ~~Estimated time remaining~~
  - ~~File size (downloaded/total)~~
- ~~Add progress bar visualization~~
- ~~Show current download status~~
- ~~Add cancel download option~~
- ~~Handle download errors gracefully~~
- ~~Show download history~~
- ~~Support multiple concurrent downloads~~

### Priority Order
1. ~~Download Progress~~ ✅
2. ~~Quality Selection~~ ✅
3. Configuration Page
