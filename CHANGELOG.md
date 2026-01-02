# 1.0.0 (2026-01-02)


### Bug Fixes

* **ci:** use master branch instead of main for workflows ([ba0edf5](https://github.com/didevlab/keeping-an-eye-on-the-chat/commit/ba0edf579772fd43daf3cdc6702d54ef979b1960))
* remove invalid Windows characters from filenames ([3dd7b5a](https://github.com/didevlab/keeping-an-eye-on-the-chat/commit/3dd7b5a3e5286dc3c26209734384b57102b1fa78))

# 📜 Changelog

All notable changes to **Keeping an Eye on the Chat** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- 🧙 Configuration wizard with intuitive UI
- 🌍 Internationalization support (English and Portuguese)
- 🎯 Quick setup presets (Default, Fast-Paced, Cozy)
- 💾 Persistent configuration storage (JSON)
- 🧪 Test connection button for Twitch URL validation
- 📋 Configuration merge with source tracking (defaults → saved → env → CLI)

### Changed
- 📝 Improved documentation with professional styling

---

## [0.1.0] - 2024-01-01

### Added
- 👁️ Initial MVP release
- 🎭 Animated avatar with GSAP (lip-sync, blinking, expressions)
- 💬 Speech bubble with smooth animations
- 🪟 Transparent click-through overlay window
- 📺 Twitch chat DOM observation via BrowserView
- 📚 Message queue with configurable timing
- ⚙️ Environment variable configuration
- 🔧 Configurable overlay position (4 corners)
- 🚫 Message filtering (commands, users)
- ✂️ Message truncation with ellipsis
- 🔍 Diagnostic logging mode
- 📦 Windows portable build support

### Technical
- TypeScript with strict mode
- Electron 28.x
- GSAP 3.x for animations
- CommonJS modules for Electron compatibility

---

## Legend

| Emoji | Category |
|-------|----------|
| ✨ | New feature |
| 🐛 | Bug fix |
| 📝 | Documentation |
| 🎨 | UI/Style |
| ⚡ | Performance |
| 🔧 | Configuration |
| 🏗️ | Architecture |
| 🔒 | Security |
| ⬆️ | Dependencies |
| 🗑️ | Deprecation |
| 💥 | Breaking change |

---

[Unreleased]: https://github.com/didevlab/keeping-an-eye-on-the-chat/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/didevlab/keeping-an-eye-on-the-chat/releases/tag/v0.1.0
