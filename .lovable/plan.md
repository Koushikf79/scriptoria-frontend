

# 🎬 Scriptoria — AI-Powered Film Pre-Production Intelligence System

## Overview
A premium cinematic dashboard that analyzes screenplays using AI to deliver scene intelligence, emotion arc analysis, budget simulation, and multi-angle storyboard visualization. Powered by Lovable AI (via edge functions) with a "Bloomberg Terminal for Cinema" aesthetic.

---

## 🎨 Design & Theme
- **Dark cinematic theme** with gold (#D4AF37) accents throughout
- **Glassmorphism cards** with subtle backdrop blur and soft shadows
- **Professional typography** using clean, modern fonts
- **Smooth transitions and animations** on all interactions
- **Loading states** with cinematic-style spinners and progress indicators
- Responsive design for desktop and tablet

---

## 📐 Architecture

### Backend (Lovable Cloud + Edge Functions)
- **script-analyzer** edge function: Sends screenplay to Lovable AI with structured tool calling to extract scene data (scene number, location, time of day, characters, action/emotional/production intensity scores)
- **emotion-analyzer** edge function: Analyzes each scene's dialogue/action for emotion classification and scoring using AI
- **storyboard-generator** edge function: Converts scene descriptions into detailed cinematic visual prompts (camera angle, lens, lighting, mood, composition) — returns text-based storyboard descriptions since image generation isn't available through the gateway

### Frontend (React + TypeScript)
- Modular component architecture with dedicated panels for each feature

---

## 🖥️ Pages & Features

### 1. Dashboard Overview (Landing Page)
- Hero section with app branding and tagline
- Screenplay text input area (paste or type)
- "Analyze" button to trigger full pipeline
- After analysis: Key metrics summary cards (total scenes, characters, avg intensity, estimated budget range)
- Quick navigation to detailed panels

### 2. Script Analysis Panel
- Scene breakdown table with sortable columns
- Each row shows: scene number, location, time of day, characters, action intensity bar, emotional intensity bar, production complexity bar
- Color-coded intensity indicators (green → yellow → red)
- Click a scene to see full details in an expandable panel
- Filter/search by location, character, or time of day

### 3. Emotion Graph Panel
- Emotion arc chart (using Recharts) plotting emotional intensity across scenes
- Smooth animated curve with gradient fill
- Hover tooltips showing scene details
- Toggle between emotion types if multiple dimensions are available
- Overall emotional profile summary

### 4. Budget Simulation Panel
- Three-tier budget cards: Low, Mid, High
- Configurable market selector (Telugu/Tollywood, Bollywood, Hollywood, Korean, General)
- Budget breakdown by category: cast, locations, VFX, crew, post-production
- Factors considered: night scenes count, action intensity, production complexity, number of locations
- Comparison bar charts between tiers
- Key cost driver highlights

### 5. Director Mode (Visual Explorer)
- Select any scene from the analysis
- Click "Explore Visually" to generate AI-crafted cinematic prompts
- Displays 6 variation cards in a grid:
  - Wide shot, Close-up, Low angle, Top angle, Day lighting, Night lighting
- Each card shows: detailed text prompt with camera angle, lens suggestion, lighting style, mood, composition, and environment details
- Cards styled as storyboard frames with cinematic borders

---

## 🔄 User Flow
1. User lands on Dashboard → pastes screenplay text
2. Clicks "Analyze" → loading animation plays
3. AI processes script → results populate across all panels
4. User explores Scene Analysis table, Emotion Graph, and Budget cards
5. User selects a scene → clicks "Explore Visually"
6. Director Mode generates 6 cinematic prompt variations displayed as storyboard frames

---

## ⚡ Technical Considerations
- Token-limited AI calls to handle large scripts (chunked processing)
- Graceful error handling with user-friendly messages
- Rate limit handling (429/402) with toast notifications
- Local state management for analysis results
- Smooth chart animations via Recharts
- All AI calls through Lovable Cloud edge functions

